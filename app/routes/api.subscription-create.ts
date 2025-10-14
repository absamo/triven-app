import type { ActionFunctionArgs } from 'react-router'
import type Stripe from 'stripe'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from '~/app/modules/stripe/plans'
import { getPaymentMethodDetails } from '~/app/modules/stripe/queries.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const subscriptionSchema = z.object({
  planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
  interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
  currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
  confirmPayment: z.boolean().optional(), // Flag to confirm payment and end trial
  subscriptionId: z.string().optional(), // Subscription ID for confirmation
  useExistingPaymentMethod: z.boolean().optional(), // Flag to use existing payment method for upgrade
})

/**
 * Creates a proper Stripe subscription with payment intent
 * OR confirms payment and activates a trialing subscription
 * This replaces the old payment-intent endpoint for subscription creation
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request)
    const body = await request.json()
    const { planId, interval, currency, confirmPayment, subscriptionId, useExistingPaymentMethod } =
      subscriptionSchema.parse(body)

    // For trial conversions, payment is handled directly by the subscription's invoice PaymentIntent
    // No separate confirmation endpoint needed - Stripe webhooks will handle status updates

    // Get plan details from database (uses actual Stripe price IDs created during seed)
    const dbPrice = await prisma.price.findFirst({
      where: {
        planId,
        interval,
        currency: currency.toUpperCase(), // Database stores currency in uppercase
      },
      include: {
        plan: true,
      },
    })

    if (!dbPrice) {
      console.error(
        `❌ No price found for plan: ${planId}, interval: ${interval}, currency: ${currency}`
      )
      // List available prices for debugging
      const availablePrices = await prisma.price.findMany({
        where: { planId },
        select: { interval: true, currency: true, id: true },
      })
      console.error(`Available prices for ${planId}:`, availablePrices)
      return Response.json(
        { error: `No price configuration found for ${planId} plan` },
        { status: 400 }
      )
    }

    const amount = dbPrice.amount
    const priceId = dbPrice.id // This is the actual Stripe price ID
    const plan = PRICING_PLANS[planId] // For display name and description

    // Get user with Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    })

    if (!dbUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer with validation
    let stripeCustomerId = dbUser.stripeCustomerId

    // Validate that the customer exists in Stripe if we have a stored ID
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId)
        console.log(`✅ Using existing Stripe customer: ${stripeCustomerId}`)
      } catch {
        console.log(`⚠️ Stored customer ${stripeCustomerId} not found in Stripe, creating new one`)
        stripeCustomerId = null // Force creation of new customer
      }
    }

    // Create new customer if needed
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: {
          userId: dbUser.id,
        },
      })
      stripeCustomerId = customer.id
      console.log(`✅ Created new Stripe customer: ${stripeCustomerId}`)

      // Update user with new Stripe customer ID
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId },
      })
    }

    // Check if user has existing subscription for upgrade vs new subscription
    let existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    // If subscription is set to cancel at period end, treat it as if it doesn't exist
    // so we create a fresh subscription instead of trying to upgrade
    if (existingSubscription) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.id)
        if (stripeSubscription.cancel_at_period_end) {
          console.log(
            `⚠️ Subscription ${existingSubscription.id} is set to cancel at period end. Canceling it immediately and will create new subscription.`
          )
          // Cancel it immediately since user wants to subscribe again
          await stripe.subscriptions.cancel(existingSubscription.id)
          console.log(`✅ Canceled subscription ${existingSubscription.id}`)
          // Treat as if no subscription exists
          existingSubscription = null
        }
      } catch (error) {
        console.error(`⚠️ Could not retrieve subscription from Stripe:`, error)
        // If subscription doesn't exist in Stripe, treat as no subscription
        existingSubscription = null
      }
    }

    let subscription: Stripe.Subscription
    let isUpgrade = false
    let isTrialConversion = false

    if (confirmPayment) {
      if (!subscriptionId) {
        return Response.json(
          { error: 'Subscription ID is required for confirmation' },
          {
            status: 400,
          }
        )
      }

      console.log(`🔁 Received trial conversion confirmation for ${subscriptionId}`)

      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['latest_invoice'],
        })

        const priceData = stripeSubscription.items.data[0]
        const resolvedPriceId = priceData?.price?.id ? String(priceData.price.id) : priceId
        const resolvedInterval = priceData?.price?.recurring?.interval || interval

        const resolvedDbPrice =
          resolvedPriceId && resolvedPriceId !== dbPrice.id
            ? await prisma.price.findUnique({
                where: { id: resolvedPriceId },
                include: { plan: true },
              })
            : dbPrice

        const confirmationPeriods = stripeSubscription as unknown as {
          current_period_start?: number
          current_period_end?: number
          trial_start?: number
          trial_end?: number
          cancel_at_period_end?: boolean
        }

        const confirmationCurrentPeriodStart =
          confirmationPeriods.current_period_start || Math.floor(Date.now() / 1000)
        const confirmationCurrentPeriodEnd =
          confirmationPeriods.current_period_end ||
          Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        const confirmationTrialStart = confirmationPeriods.trial_start || 0
        const confirmationTrialEnd = confirmationPeriods.trial_end || 0

        let confirmationStatus = stripeSubscription.status
        if (
          stripeSubscription.status === 'active' ||
          stripeSubscription.status === 'incomplete_expired'
        ) {
          confirmationStatus = 'active'
        } else if (stripeSubscription.status === 'trialing') {
          confirmationStatus = 'trialing'
        } else {
          confirmationStatus = 'incomplete'
        }

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            id: stripeSubscription.id,
            planId: resolvedDbPrice?.planId || planId,
            priceId: resolvedPriceId,
            interval: String(resolvedInterval),
            status: confirmationStatus,
            currentPeriodStart: confirmationCurrentPeriodStart,
            currentPeriodEnd: confirmationCurrentPeriodEnd,
            cancelAtPeriodEnd: confirmationPeriods.cancel_at_period_end || false,
            trialStart: confirmationTrialStart,
            trialEnd: confirmationStatus === 'active' ? 0 : confirmationTrialEnd,
          },
          create: {
            id: stripeSubscription.id,
            userId: user.id,
            planId: resolvedDbPrice?.planId || planId,
            priceId: resolvedPriceId,
            interval: String(resolvedInterval),
            status: confirmationStatus,
            currentPeriodStart: confirmationCurrentPeriodStart,
            currentPeriodEnd: confirmationCurrentPeriodEnd,
            cancelAtPeriodEnd: confirmationPeriods.cancel_at_period_end || false,
            trialStart: confirmationTrialStart,
            trialEnd: confirmationStatus === 'active' ? 0 : confirmationTrialEnd,
          },
        })

        console.log(`✅ Confirmed subscription ${subscriptionId} after payment completion`)

        return Response.json({
          subscriptionId: stripeSubscription.id,
          clientSecret: null,
          amount,
          currency: (resolvedDbPrice?.currency || dbPrice.currency).toUpperCase(),
          planName: plan.name,
          isUpgrade: false,
          isTrialConversion: false,
        })
      } catch (confirmationError) {
        console.error('❌ Trial conversion confirmation failed:', confirmationError)
        return Response.json({ error: 'Failed to confirm subscription' }, { status: 500 })
      }
    }

    if (existingSubscription) {
      // Check if this is a trial subscription that needs payment method
      if (existingSubscription.status === 'trialing') {
        isTrialConversion = true
        console.log(`🎯 Converting trial subscription ${existingSubscription.id} to paid`)

        try {
          // Retrieve existing Stripe subscription
          const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.id, {
            expand: ['pending_setup_intent'],
          })

          console.log(
            `✅ Found Stripe subscription ${stripeSubscription.id} with status: ${stripeSubscription.status}`
          )

          // Update subscription price if needed, but let trial end naturally
          // Stripe will automatically charge when trial ends if payment method is attached
          const subscriptionItemId = stripeSubscription.items.data[0].id
          subscription = await stripe.subscriptions.update(existingSubscription.id, {
            items: [
              {
                id: subscriptionItemId,
                price: priceId,
              },
            ],
            payment_settings: {
              save_default_payment_method: 'on_subscription',
            },
            proration_behavior: 'none',
            expand: ['pending_setup_intent'],
            metadata: {
              userId: user.id,
              planId,
              interval,
            },
          })

          console.log(`✅ Updated subscription price for trial ${subscription.id}`)
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'resource_missing'
          ) {
            // Database has wrong subscription ID - search for actual trial subscription in Stripe
            console.log(
              `⚠️ Subscription ${existingSubscription.id} not found in Stripe, searching for customer's trial subscriptions`
            )

            // List all subscriptions for this customer to find any trialing subscription
            const customerSubscriptions = await stripe.subscriptions.list({
              customer: stripeCustomerId,
              status: 'trialing',
              limit: 1,
            })

            if (customerSubscriptions.data.length > 0) {
              // Found a trial subscription - update it and sync database
              const trialSub = customerSubscriptions.data[0]
              const subscriptionItemId = trialSub.items.data[0].id

              console.log(`✅ Found actual trial subscription in Stripe: ${trialSub.id}`)

              subscription = await stripe.subscriptions.update(trialSub.id, {
                items: [
                  {
                    id: subscriptionItemId,
                    price: priceId,
                  },
                ],
                payment_settings: {
                  save_default_payment_method: 'on_subscription',
                },
                proration_behavior: 'none',
                expand: ['pending_setup_intent'],
                metadata: {
                  userId: user.id,
                  planId,
                  interval,
                },
              })

              console.log(`✅ Updated actual trial subscription ${trialSub.id}`)
            } else {
              // No trial subscription found in Stripe at all - create new one
              console.log(`⚠️ No trial subscription found in Stripe, creating new subscription`)

              subscription = await stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                  save_default_payment_method: 'on_subscription',
                },
                collection_method: 'charge_automatically',
                expand: ['pending_setup_intent'],
                metadata: {
                  userId: user.id,
                  planId,
                  interval,
                },
              })
            }
          } else {
            throw error
          }
        }
      } else if (existingSubscription.status === 'active') {
        // This is a regular upgrade - modify existing subscription with prorating
        isUpgrade = true
        console.log(`🔄 Upgrading existing subscription ${existingSubscription.id}`)

        // Get existing Stripe subscription with payment method
        const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.id)
        const subscriptionItemId = stripeSubscription.items.data[0].id
        const defaultPaymentMethod = stripeSubscription.default_payment_method

        // If using existing payment method and payment method is available
        if (useExistingPaymentMethod && defaultPaymentMethod) {
          console.log(`💳 Using existing payment method for upgrade`)

          // Update subscription with prorating - Stripe will automatically create and pay the invoice
          subscription = await stripe.subscriptions.update(existingSubscription.id, {
            items: [
              {
                id: subscriptionItemId,
                price: priceId,
              },
            ],
            proration_behavior: 'always_invoice', // Enable prorating AND create invoice immediately
            payment_behavior: 'allow_incomplete', // Allow payment to proceed even if it fails initially
            payment_settings: {
              save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
              userId: user.id,
              planId,
              interval,
              type: 'subscription_upgrade',
            },
          })

          console.log(`✅ Subscription updated with existing payment method`)
        } else if (!defaultPaymentMethod) {
          throw new Error(
            'No payment method found on subscription. Please add a payment method first.'
          )
        } else {
          // User wants to use a NEW payment method for the upgrade
          // We need to create a separate invoice and PaymentIntent for the proration
          console.log(`💳 Upgrading with new payment method - creating invoice for proration`)

          // First update subscription to new plan (without charging yet)
          subscription = await stripe.subscriptions.update(existingSubscription.id, {
            items: [
              {
                id: subscriptionItemId,
                price: priceId,
              },
            ],
            proration_behavior: 'create_prorations', // Create proration items
            billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
            metadata: {
              userId: user.id,
              planId,
              interval,
              type: 'subscription_upgrade_new_payment_method',
            },
          })

          console.log(`✅ Subscription updated to new plan`)

          // Get the latest invoice which has the proration
          const latestInvoice = await stripe.invoices.retrieve(
            subscription.latest_invoice as string
          )

          console.log(`📄 Latest invoice: ${latestInvoice.id}, amount: ${latestInvoice.amount_due}`)

          // If there's an amount due, we need to create a PaymentIntent for it
          if (latestInvoice.amount_due > 0) {
            // Void the automatic payment attempt
            if (latestInvoice.status === 'open' && latestInvoice.payment_intent) {
              try {
                await stripe.paymentIntents.cancel(latestInvoice.payment_intent as string)
                console.log(`❌ Canceled automatic payment attempt`)
              } catch (e) {
                console.log(`⚠️ Could not cancel payment intent: ${e}`)
              }
            }

            // Create a new PaymentIntent for the user to pay with their new card
            const upgradePaymentIntent = await stripe.paymentIntents.create({
              amount: latestInvoice.amount_due,
              currency: latestInvoice.currency,
              customer: stripeCustomerId,
              description: `Upgrade to ${planId} plan`,
              automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
              },
              metadata: {
                userId: user.id,
                subscriptionId: subscription.id,
                invoiceId: latestInvoice.id,
                type: 'subscription_upgrade',
              },
            })

            console.log(`✅ Created PaymentIntent ${upgradePaymentIntent.id} for upgrade`)

            // Store the PaymentIntent in subscription metadata so we can finalize later
            await stripe.subscriptions.update(subscription.id, {
              metadata: {
                ...subscription.metadata,
                upgrade_payment_intent: upgradePaymentIntent.id,
                upgrade_invoice: latestInvoice.id,
              },
            })

            // Expand the subscription to include this new payment intent
            subscription = await stripe.subscriptions.retrieve(subscription.id, {
              expand: ['latest_invoice.payment_intent'],
            })

            // Override the latest_invoice to include our custom PaymentIntent
            // @ts-expect-error - Overriding Stripe object for custom payment flow
            subscription.latest_invoice = latestInvoice
            // @ts-expect-error - Attaching our PaymentIntent to the invoice
            latestInvoice.payment_intent = upgradePaymentIntent
          }

          console.log(`✅ Upgrade prepared with new payment method`)
        }
      } else {
        // Subscription exists but in incomplete/canceled state, reactivate it
        console.log(
          `🔄 Reactivating subscription ${existingSubscription.id} (was ${existingSubscription.status})`
        )

        // Check if customer has any attached payment methods
        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'card',
        })

        if (paymentMethods.data.length === 0) {
          console.log(`💳 No payment methods found for customer, creating SetupIntent first`)

          // Create SetupIntent to collect payment method
          const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
            usage: 'off_session',
            metadata: {
              userId: user.id,
              subscriptionId: existingSubscription.id,
              type: 'subscription_reactivation_setup',
              planId,
              interval,
            },
          })

          return Response.json({
            setupRequired: true,
            clientSecret: setupIntent.client_secret,
            subscriptionId: existingSubscription.id,
            message: 'Payment method setup required for reactivation',
          })
        }

        // Set the first available payment method as default for the customer
        const defaultPaymentMethod = paymentMethods.data[0]
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: defaultPaymentMethod.id,
          },
        })

        console.log(`✅ Set default payment method ${defaultPaymentMethod.id} for customer`)

        try {
          // Try to reactivate the existing subscription

          // First check if the subscription exists in Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.id)

          if (stripeSubscription.status === 'canceled') {
            // User can choose any plan after cancellation
            const previousPlanId = existingSubscription.planId
            const isChangingPlan = previousPlanId !== planId

            console.log(
              `🔄 Subscription ${existingSubscription.id} is canceled. Creating new subscription for ${planId} plan${
                isChangingPlan ? ` (was ${previousPlanId})` : ''
              }.`
            )

            // IMPORTANT: Cancel any other active subscriptions before creating new one
            // This prevents multiple active subscriptions
            console.log(
              `🔍 Checking for other active subscriptions for customer ${stripeCustomerId}`
            )
            const allSubscriptions = await stripe.subscriptions.list({
              customer: stripeCustomerId,
              status: 'all',
              limit: 100,
            })

            const activeSubscriptions = allSubscriptions.data.filter(
              (sub) => sub.status === 'active' || sub.status === 'trialing'
            )

            if (activeSubscriptions.length > 0) {
              console.log(
                `⚠️ Found ${activeSubscriptions.length} active/trialing subscription(s). Canceling them before creating new one.`
              )
              for (const activeSub of activeSubscriptions) {
                await stripe.subscriptions.cancel(activeSub.id)
                console.log(`✅ Canceled subscription ${activeSub.id}`)
              }
            }

            // Follow Stripe's recommendation: create a new subscription for cancelled ones
            // User can select any plan they want
            subscription = await stripe.subscriptions.create({
              customer: stripeCustomerId,
              items: [{ price: priceId }],
              default_payment_method: defaultPaymentMethod.id,
              payment_behavior: 'allow_incomplete',
              payment_settings: {
                save_default_payment_method: 'on_subscription',
              },
              collection_method: 'charge_automatically',
              expand: ['latest_invoice.payment_intent'],
              metadata: {
                userId: user.id,
                planId,
                interval,
                previous_plan: previousPlanId,
                plan_changed: isChangingPlan.toString(),
              },
            })

            console.log(`✅ Created new subscription ${subscription.id} for ${planId} plan`)
          } else {
            // Subscription exists but in incomplete state, update it
            const subscriptionItems = stripeSubscription.items.data
            const firstItemId = subscriptionItems[0]?.id

            subscription = await stripe.subscriptions.update(existingSubscription.id, {
              items: [
                {
                  id: firstItemId,
                  price: priceId,
                },
              ],
              default_payment_method: defaultPaymentMethod.id,
              payment_behavior: 'allow_incomplete',
              payment_settings: {
                save_default_payment_method: 'on_subscription',
              },
              expand: ['latest_invoice.payment_intent'],
              metadata: {
                userId: user.id,
                planId,
                interval,
                type: 'subscription_reactivation',
              },
            })

            console.log(`✅ Updated existing subscription ${existingSubscription.id}`)
          }
        } catch (error) {
          console.error(`❌ Failed to reactivate subscription ${existingSubscription.id}:`, error)
          throw error
        }
      }
    } else {
      // Create new subscription with proper Stripe defaults
      console.log(`🆕 Creating new subscription for user ${user.id}`)

      // IMPORTANT: Before creating a new subscription, check if customer has any active subscriptions
      // This prevents duplicate subscriptions if database is out of sync
      console.log(`🔍 Checking for existing active subscriptions for customer ${stripeCustomerId}`)
      const existingStripeSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 100,
      })

      const activeStripeSubscriptions = existingStripeSubscriptions.data.filter(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      )

      if (activeStripeSubscriptions.length > 0) {
        console.log(
          `⚠️ Found ${activeStripeSubscriptions.length} active/trialing subscription(s) in Stripe. Canceling them before creating new one.`
        )
        for (const activeSub of activeStripeSubscriptions) {
          await stripe.subscriptions.cancel(activeSub.id)
          console.log(`✅ Canceled subscription ${activeSub.id}`)
        }
      }

      // For new subscriptions, check if customer has payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
      })

      let defaultPaymentMethod = null
      if (paymentMethods.data.length > 0) {
        defaultPaymentMethod = paymentMethods.data[0].id
        // Set as customer's default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: defaultPaymentMethod,
          },
        })
        console.log(`✅ Using existing payment method ${defaultPaymentMethod} for new subscription`)
      }

      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        ...(defaultPaymentMethod && { default_payment_method: defaultPaymentMethod }),
        payment_behavior: 'allow_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        collection_method: 'charge_automatically',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id,
          planId,
          interval,
        },
      })
    }

    const invoice = subscription.latest_invoice
    const paymentIntent =
      invoice && typeof invoice === 'object' && 'payment_intent' in invoice
        ? invoice.payment_intent
        : null

    let clientSecret =
      paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent
        ? (paymentIntent.client_secret as string | null)
        : null

    // Type guard for invoice data
    const invoiceData =
      invoice && typeof invoice === 'object'
        ? (invoice as {
            id?: string
            status?: string
            amount_due?: number
            currency?: string
          })
        : null

    // Type guard for payment intent data
    const piData =
      paymentIntent && typeof paymentIntent === 'object'
        ? (paymentIntent as {
            id?: string
          })
        : null

    console.log('🔍 Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      invoice: invoiceData
        ? {
            id: invoiceData.id,
            status: invoiceData.status,
            amount_due: invoiceData.amount_due,
            payment_intent: piData ? piData.id : 'NO_PAYMENT_INTENT',
          }
        : 'NO_INVOICE',
    })

    // For trial conversions, always create a fresh SetupIntent (Stripe's recommended approach)
    // This avoids configuration conflicts with old pending_setup_intents
    // SetupIntent collects payment method without charging, then Stripe auto-charges when trial ends
    if (isTrialConversion && !clientSecret) {
      console.log(`💳 Creating fresh SetupIntent for trial conversion`)

      const newSetupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        automatic_payment_methods: { enabled: true },
        usage: 'off_session',
        metadata: {
          subscriptionId: subscription.id,
          userId: user.id,
          type: 'trial_subscription',
          planId,
          interval,
        },
      })

      clientSecret = newSetupIntent.client_secret
      console.log(
        `✅ Created SetupIntent ${newSetupIntent.id} for trial subscription ${subscription.id}`
      )
    }

    // For upgrades with existing payment method, let Stripe handle everything automatically
    // The subscription update with always_invoice will create the invoice and attempt payment
    if (isUpgrade) {
      // Stripe already created the invoice and attempted payment via always_invoice
      // Just use the PaymentIntent from the invoice if it exists
      if (invoiceData?.amount_due && invoiceData.amount_due > 0) {
        if (
          paymentIntent &&
          typeof paymentIntent === 'object' &&
          'client_secret' in paymentIntent
        ) {
          clientSecret = paymentIntent.client_secret as string | null
          console.log(`✅ Using Stripe's automatic proration invoice PaymentIntent`)
        } else {
          console.log(
            `ℹ️ Invoice created but no PaymentIntent (payment likely succeeded automatically)`
          )
        }
      } else {
        console.log(`ℹ️ No invoice amount due (upgrade might be free or already paid)`)
      }
    }

    // For new subscriptions, use the PaymentIntent that Stripe already created with the invoice
    // Don't create a separate PaymentIntent
    if (
      !clientSecret &&
      !isTrialConversion &&
      !isUpgrade &&
      paymentIntent &&
      typeof paymentIntent === 'object' &&
      'client_secret' in paymentIntent
    ) {
      clientSecret = paymentIntent.client_secret as string | null
      console.log(`✅ Using PaymentIntent from subscription invoice`)
    }

    console.log(
      `✅ Created subscription ${subscription.id} with PaymentIntent using price ${dbPrice.id}`
    )

    // Extract subscription period information with proper defaults and type safety
    const subPeriods = subscription as unknown as {
      current_period_start?: number
      current_period_end?: number
      trial_start?: number
      trial_end?: number
    }
    const currentPeriodStart = subPeriods.current_period_start || Math.floor(Date.now() / 1000)
    const currentPeriodEnd =
      subPeriods.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
    const trialStart = subPeriods.trial_start || 0
    // Keep trial_end from Stripe - will end when payment succeeds
    const trialEnd = subPeriods.trial_end || 0

    console.log('🔍 Subscription periods:', {
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      note: isTrialConversion
        ? 'Trial active - will end when payment succeeds'
        : trialEnd > 0
          ? 'Trial scheduled to end'
          : 'Regular paid subscription',
    })

    // Determine the subscription status based on Stripe status
    // For trial conversions with payment_behavior: 'default_incomplete',
    // subscription stays 'trialing' until payment succeeds
    let dbStatus = subscription.status
    if (subscription.status === 'active' || subscription.status === 'incomplete_expired') {
      dbStatus = 'active'
    } else if (subscription.status === 'trialing') {
      dbStatus = 'trialing'
    } else {
      dbStatus = 'incomplete'
    }

    console.log(
      `💾 Storing subscription with status: ${dbStatus} (Stripe status: ${subscription.status})`
    )

    // Get payment method details if subscription is active or has payment method
    let paymentMethodDetails = null
    if (subscription.default_payment_method || dbStatus === 'active') {
      paymentMethodDetails = await getPaymentMethodDetails(subscription.id)
      console.log('💳 Payment method details:', paymentMethodDetails)
    }

    // Store the subscription in database with proper status
    console.log('🔄 Starting database upsert...')
    try {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          id: subscription.id,
          planId,
          priceId: dbPrice.id,
          interval,
          status: dbStatus,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          trialStart,
          trialEnd,
          paymentMethodId: paymentMethodDetails?.paymentMethodId,
          last4: paymentMethodDetails?.last4,
          brand: paymentMethodDetails?.brand,
          expMonth: paymentMethodDetails?.expMonth,
          expYear: paymentMethodDetails?.expYear,
        },
        create: {
          id: subscription.id,
          userId: user.id,
          planId,
          priceId: dbPrice.id,
          interval,
          status: dbStatus,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          trialStart,
          trialEnd,
          paymentMethodId: paymentMethodDetails?.paymentMethodId,
          last4: paymentMethodDetails?.last4,
          brand: paymentMethodDetails?.brand,
          expMonth: paymentMethodDetails?.expMonth,
          expYear: paymentMethodDetails?.expYear,
        },
      })
      console.log('✅ Database upsert completed successfully')
    } catch (dbError) {
      console.error('❌ Database upsert failed:', dbError)
      throw dbError
    }

    console.log('📤 Preparing response...')
    const response = {
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
      amount: isUpgrade && !clientSecret ? 0 : amount, // For automatic upgrades, amount might be 0
      currency: dbPrice.currency.toUpperCase(),
      planName: plan.name,
      isUpgrade,
      isTrialConversion,
      paymentRequired: !!clientSecret, // Clear indication if payment is needed
    }
    console.log('✅ Returning response:', response)

    return Response.json(response)
  } catch (error) {
    console.error('❌ Subscription creation error:', error)
    return Response.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
