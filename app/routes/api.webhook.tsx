import type { ActionFunctionArgs } from 'react-router'
import type Stripe from 'stripe'
import { z } from 'zod'
// import {
//   sendSubscriptionSuccessEmail,
//   sendSubscriptionErrorEmail,
// } from '#app/modules/email/templates/subscription-email'
import { ERRORS } from '~/app/common/errors'
import { prisma } from '~/app/db.server'
import { getPaymentMethodDetails } from '~/app/modules/stripe/queries.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { broadcastSubscriptionUpdate } from './api.subscription-stream'

export const ROUTE_PATH = '/api/webhook' as const

/**
 * Gets and constructs a Stripe event signature.
 *
 * @throws An error if Stripe signature is missing or if event construction fails.
 * @returns The Stripe event object.
 */
async function getStripeEvent(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_ENDPOINT) {
    throw new Error(`Stripe - ${ERRORS.ENVS_NOT_INITIALIZED}`)
  }

  try {
    const signature = request.headers.get('Stripe-Signature')
    if (!signature) throw new Error(ERRORS.STRIPE_MISSING_SIGNATURE)
    const payload = await request.text()
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_ENDPOINT
    )

    return event
  } catch (err: unknown) {
    // Log webhook verification error
    throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const event = await getStripeEvent(request)

  try {
    switch (event.type) {
      /**
       * Occurs when a payment intent has succeeded.
       * For subscriptions, the invoice.payment_succeeded event handles activation.
       */
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const piData = paymentIntent as unknown as { invoice?: string | null }

        console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id} (${paymentIntent.amount})`)
        console.log(
          `💵 Amount paid: ${paymentIntent.amount}, Invoice attached: ${!!piData.invoice}`
        )

        // Handle standalone PaymentIntents for subscriptions (non-trial)
        const { metadata } = paymentIntent

        // Handle subscription payments - but only for standalone PaymentIntents, not invoice-attached ones
        if (
          metadata?.subscriptionId &&
          metadata?.type === 'subscription_payment' &&
          paymentIntent.payment_method &&
          !piData.invoice // Only process standalone PaymentIntents
        ) {
          console.log(
            `🔗 Processing standalone subscription payment for ${metadata.subscriptionId}`
          )

          try {
            const paymentMethodId = paymentIntent.payment_method as string
            const customerId = paymentIntent.customer as string

            // Ensure the payment method is attached to the customer
            try {
              await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
              })
              console.log(`📎 Attached payment method ${paymentMethodId} to customer ${customerId}`)
            } catch (attachError: unknown) {
              const errorMessage =
                attachError instanceof Error ? attachError.message : String(attachError)
              // Payment method might already be attached
              if (!errorMessage.includes('already attached')) {
                console.error(`❌ Failed to attach payment method: ${errorMessage}`)
              }
            }

            // Update subscription with the payment method
            await stripe.subscriptions.update(metadata.subscriptionId, {
              default_payment_method: paymentMethodId,
            })
            console.log(
              `✅ Updated subscription ${metadata.subscriptionId} with payment method ${paymentMethodId}`
            )
          } catch (error) {
            console.error('❌ Failed to process subscription payment:', error)
          }
        } else if (piData.invoice && metadata?.subscriptionId) {
          // Invoice-attached PaymentIntent - Stripe handles everything automatically
          console.log(
            `✅ Invoice payment succeeded for subscription ${metadata.subscriptionId}, Stripe handled automatically`
          )
        }

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a SetupIntent is succeeded.
       * Handle trial subscription payment method setup.
       * According to Stripe docs: SetupIntent automatically sets default_payment_method on subscription
       */
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object
        console.log(`🔧 SetupIntent succeeded: ${setupIntent.id}`)

        const { metadata } = setupIntent
        if (
          metadata?.subscriptionId &&
          (metadata?.type === 'trial_subscription' ||
            metadata?.type === 'subscription_setup' ||
            metadata?.type === 'payment_method_update') &&
          setupIntent.payment_method
        ) {
          // Handle payment method update specifically
          if (metadata.type === 'payment_method_update') {
            console.log(`💳 Processing payment method update for ${metadata.subscriptionId}`)

            try {
              const paymentMethodId = setupIntent.payment_method as string

              // Update the subscription's default payment method
              await stripe.subscriptions.update(metadata.subscriptionId, {
                default_payment_method: paymentMethodId,
              })

              console.log(
                `✅ Updated subscription ${metadata.subscriptionId} with new payment method ${paymentMethodId}`
              )

              // Get the updated payment method details
              const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

              let paymentMethodDetails = null
              if (paymentMethod.type === 'card' && paymentMethod.card) {
                paymentMethodDetails = {
                  paymentMethodId: paymentMethod.id,
                  last4: paymentMethod.card.last4,
                  brand: paymentMethod.card.brand,
                  expMonth: paymentMethod.card.exp_month,
                  expYear: paymentMethod.card.exp_year,
                }
              }

              // Update the database with new payment method details
              await prisma.subscription.update({
                where: { id: metadata.subscriptionId },
                data: {
                  paymentMethodId: paymentMethodDetails?.paymentMethodId,
                  last4: paymentMethodDetails?.last4,
                  brand: paymentMethodDetails?.brand,
                  expMonth: paymentMethodDetails?.expMonth,
                  expYear: paymentMethodDetails?.expYear,
                },
              })

              console.log(`✅ Database updated with new payment method details`)
            } catch (error) {
              console.error('❌ Failed to process payment method update:', error)
            }

            return new Response(null, { status: 200 })
          }

          // Handle subscription setup (existing logic)
          console.log(`🎯 Processing subscription setup for ${metadata.subscriptionId}`)

          try {
            const paymentMethodId = setupIntent.payment_method as string

            // Retrieve current subscription to check status
            const subscription = await stripe.subscriptions.retrieve(metadata.subscriptionId)

            // Set payment method if not already set
            if (subscription.default_payment_method !== paymentMethodId) {
              await stripe.subscriptions.update(metadata.subscriptionId, {
                default_payment_method: paymentMethodId,
              })
              console.log(
                `✅ Set payment method ${paymentMethodId} for subscription ${metadata.subscriptionId}`
              )
            } else {
              console.log(
                `✅ Payment method already set for subscription ${metadata.subscriptionId}`
              )
            }

            // If subscription is trialing and this is a trial_subscription type, end trial immediately
            if (subscription.status === 'trialing' && metadata.type === 'trial_subscription') {
              console.log(
                `🔄 Ending trial immediately for subscription ${metadata.subscriptionId} to activate paid subscription`
              )

              // End trial now by setting trial_end to 'now'
              await stripe.subscriptions.update(metadata.subscriptionId, {
                trial_end: 'now',
              })

              console.log(
                `✅ Trial ended for subscription ${metadata.subscriptionId} - subscription will now be active`
              )

              // Update database subscription status
              const updatedSub = await stripe.subscriptions.retrieve(metadata.subscriptionId)
              const subData = updatedSub as unknown as {
                status: string
                current_period_start: number
                current_period_end: number
              }

              await prisma.subscription.update({
                where: { id: metadata.subscriptionId },
                data: {
                  status: subData.status,
                  trialEnd: 0, // Clear trial end since it's no longer trialing
                  currentPeriodStart: subData.current_period_start,
                  currentPeriodEnd: subData.current_period_end,
                },
              })

              console.log(`✅ Database updated with new status: ${subData.status}`)
            }
          } catch (error) {
            console.error('❌ Failed to process SetupIntent:', error)
          }
        }

        return new Response(null, { status: 200 })
      } /**
       * Occurs when a subscription invoice payment succeeds.
       * This is the proper event to handle subscription activation.
       */
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string
        const customerId = invoice.customer as string

        console.log(`🧾 Invoice payment succeeded: ${invoice.id}`)
        console.log(`   Subscription: ${subscriptionId}`)
        console.log(`   Customer: ${customerId}`)
        console.log(`   Amount paid: ${invoice.amount_paid}`)

        if (!subscriptionId) {
          console.log('Invoice payment succeeded but no subscription ID found')
          return new Response(null, { status: 200 })
        }

        // Get the subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Find the user by Stripe customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return new Response(null, { status: 200 })
        }

        const priceData = stripeSubscription.items.data[0]

        // Map Stripe product ID to database plan ID
        const stripeProductId = String(priceData.price.product)
        let dbPlanId = 'standard' // Default fallback

        // Find the correct database plan ID by looking up the price
        const dbPrice = await prisma.price.findUnique({
          where: { id: String(priceData.price.id) },
          include: { plan: true },
        })

        if (dbPrice) {
          dbPlanId = dbPrice.planId
          console.log(`✅ Found database plan: ${dbPlanId} for Stripe product: ${stripeProductId}`)
        } else {
          console.log(
            `⚠️ Could not find database plan for price ${priceData.price.id}, using fallback: ${dbPlanId}`
          )
        }

        // Extract period information with proper defaults
        const subscriptionData = stripeSubscription as any // Cast to access Stripe properties
        const currentPeriodStart =
          subscriptionData.current_period_start || Math.floor(Date.now() / 1000)
        const currentPeriodEnd =
          subscriptionData.current_period_end ||
          Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        const trialStart = subscriptionData.trial_start || 0

        console.log('🔍 Webhook subscription periods:', {
          currentPeriodStart,
          currentPeriodEnd,
          trialStart,
          trialEnd: subscriptionData.trial_end || 0,
        })

        // Get payment method details if subscription has payment method
        const paymentMethodDetails = await getPaymentMethodDetails(stripeSubscription.id)
        console.log('💳 Payment method details:', paymentMethodDetails)

        // Update subscription in database - preserve trial status if no actual payment yet
        const isActualPayment = invoice.amount_paid > 0 && !invoice.starting_balance
        const shouldEndTrial = isActualPayment && stripeSubscription.status === 'active'

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            id: stripeSubscription.id,
            planId: dbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(priceData.price.id),
            interval: String(priceData.price.recurring?.interval || 'month'),
            status: stripeSubscription.status, // Use actual Stripe status
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
            trialStart,
            trialEnd: shouldEndTrial ? 0 : subscriptionData.trial_end || 0, // Only clear trial after actual payment
            paymentMethodId: paymentMethodDetails?.paymentMethodId,
            last4: paymentMethodDetails?.last4,
            brand: paymentMethodDetails?.brand,
            expMonth: paymentMethodDetails?.expMonth,
            expYear: paymentMethodDetails?.expYear,
          },
          create: {
            id: stripeSubscription.id,
            userId: user.id,
            planId: dbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(priceData.price.id),
            interval: String(priceData.price.recurring?.interval || 'month'),
            status: stripeSubscription.status, // Use actual Stripe status
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
            trialStart,
            trialEnd: shouldEndTrial ? 0 : subscriptionData.trial_end || 0, // Only clear trial after actual payment
            paymentMethodId: paymentMethodDetails?.paymentMethodId,
            last4: paymentMethodDetails?.last4,
            brand: paymentMethodDetails?.brand,
            expMonth: paymentMethodDetails?.expMonth,
            expYear: paymentMethodDetails?.expYear,
          },
        })

        console.log(`✅ Subscription ${stripeSubscription.id} activated for user ${user.id}`)

        // Broadcast subscription update to connected clients for real-time UI updates
        // This is the final, confirmed update after invoice payment succeeds
        broadcastSubscriptionUpdate({
          userId: user.id,
          status: stripeSubscription.status,
          planId: dbPlanId,
          trialEnd: shouldEndTrial ? 0 : subscriptionData.trial_end || 0,
          confirmed: true, // Mark as confirmed after invoice payment
        })

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a payment for an invoice fails.
       * Handle subscription renewal payment failures.
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string
          customer?: string
        }
        const subscriptionId = invoice.subscription
        const customerId = invoice.customer

        console.log(`💸 Invoice payment failed: ${invoice.id}`)
        console.log(`   Subscription: ${subscriptionId}`)
        console.log(`   Customer: ${customerId}`)
        console.log(`   Amount due: ${invoice.amount_due}`)

        if (!subscriptionId) {
          console.log('Invoice payment failed but no subscription ID found')
          return new Response(null, { status: 200 })
        }

        // Find the user by Stripe customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return new Response(null, { status: 200 })
        }

        // Get the subscription details from Stripe to determine the new status
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

        console.log(`📊 Subscription status after payment failure: ${stripeSubscription.status}`)

        // Update subscription status in database to reflect payment failure
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: stripeSubscription.status, // This will be 'incomplete' or 'past_due'
          },
        })

        console.log(
          `🔄 Updated subscription ${subscriptionId} status to ${stripeSubscription.status} for user ${user.id}`
        )

        // Note: Stripe handles customer notifications automatically if enabled in Dashboard
        // You can add additional business logic here like:
        // - Send internal notifications to admin
        // - Update user access levels
        // - Track failed payment analytics

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a payment for an invoice requires additional action.
       * Handle cases where payment needs customer intervention (like 3D Secure).
       */
      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string
          customer?: string
        }
        const subscriptionId = invoice.subscription
        const customerId = invoice.customer

        console.log(`🔐 Invoice payment requires action: ${invoice.id}`)
        console.log(`   Subscription: ${subscriptionId}`)
        console.log(`   Customer: ${customerId}`)

        if (!subscriptionId) {
          console.log('Invoice payment action required but no subscription ID found')
          return new Response(null, { status: 200 })
        }

        // Find the user by Stripe customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return new Response(null, { status: 200 })
        }

        // Get the subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

        console.log(
          `📊 Subscription status after payment action required: ${stripeSubscription.status}`
        )

        // Update subscription status in database
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: stripeSubscription.status, // This will be 'incomplete'
          },
        })

        console.log(
          `🔄 Updated subscription ${subscriptionId} status to ${stripeSubscription.status} for user ${user.id}`
        )

        // Note: Stripe sends emails with payment confirmation links if enabled in Dashboard

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a Checkout Session has been successfully completed.
       */
      // case "checkout.session.completed": {
      //   const session = event.data.object

      //   const { customer: customerId, subscription: subscriptionId } = z
      //     .object({ customer: z.string(), subscription: z.string() })
      //     .parse(session)

      //   const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
      //   if (!user) throw new Error(ERRORS.SOMETHING_WENT_WRONG)

      //   const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      //   await prisma.subscription.update({
      //     where: { userId: user.id },
      //     data: {
      //       id: subscription.id,
      //       userId: user.id,
      //       planId: String(subscription.items.data[0].plan.product),
      //       priceId: String(subscription.items.data[0].price.id),
      //       interval: String(subscription.items.data[0].plan.interval),
      //       status: subscription.status,
      //       currentPeriodStart: subscription.current_period_start,
      //       currentPeriodEnd: subscription.current_period_end,
      //       cancelAtPeriodEnd: subscription.cancel_at_period_end,
      //     },
      //   })

      //   // await sendSubscriptionSuccessEmail({
      //   //   email: user.email,
      //   //   subscriptionId,
      //   // })

      //   // Cancel free subscription. — User upgraded to a paid plan.
      //   // Not required, but it's a good practice to keep just a single active plan.
      //   const subscriptions = (
      //     await stripe.subscriptions.list({ customer: customerId })
      //   ).data.map((sub) => sub.items)

      //   if (subscriptions.length > 1) {
      //     const freeSubscription = subscriptions.find((sub) =>
      //       sub.data.some((item) => item.price.product === PLANS.FREE)
      //     )
      //     if (freeSubscription) {
      //       await stripe.subscriptions.cancel(
      //         freeSubscription?.data[0].subscription
      //       )
      //     }
      //   }

      //   return new Response(null)
      // }

      /**
       * Occurs when a Stripe subscription has been updated.
       * E.g. when a user upgrades or downgrades their plan.
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (!subscription.id) {
          return new Response(null, { status: 200 })
        }

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return new Response(null, { status: 200 })
        }

        // Map Stripe product ID to database plan ID for subscription updates
        const updatePriceData = subscription.items.data[0]
        let updateDbPlanId = 'standard' // Default fallback

        // Find the correct database plan ID by looking up the price
        const updateDbPrice = await prisma.price.findUnique({
          where: { id: String(updatePriceData.price.id) },
          include: { plan: true },
        })

        if (updateDbPrice) {
          updateDbPlanId = updateDbPrice.planId
        }

        // Extract period information
        interface StripeSubscriptionData {
          current_period_start?: number
          current_period_end?: number
          cancel_at_period_end?: boolean
          trial_start?: number
          trial_end?: number
        }
        const subscriptionData = subscription as Stripe.Subscription & StripeSubscriptionData
        const updateCurrentPeriodStart =
          subscriptionData.current_period_start || Math.floor(Date.now() / 1000)
        const updateCurrentPeriodEnd =
          subscriptionData.current_period_end ||
          Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)

        // Get payment method details if subscription has payment method
        const updatePaymentMethodDetails = await getPaymentMethodDetails(subscription.id)
        console.log(
          '💳 Payment method details for updated subscription:',
          updatePaymentMethodDetails
        )

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            id: subscription.id, // Update to new subscription ID if it changed
            planId: updateDbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(updatePriceData.price.id),
            interval: String(updatePriceData.price.recurring?.interval || 'month'),
            status: subscription.status,
            currentPeriodStart: updateCurrentPeriodStart,
            currentPeriodEnd: updateCurrentPeriodEnd,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
            trialStart: subscriptionData.trial_start || 0,
            trialEnd: subscription.status === 'active' ? 0 : subscriptionData.trial_end || 0, // Clear trial for active subscriptions
            paymentMethodId: updatePaymentMethodDetails?.paymentMethodId,
            last4: updatePaymentMethodDetails?.last4,
            brand: updatePaymentMethodDetails?.brand,
            expMonth: updatePaymentMethodDetails?.expMonth,
            expYear: updatePaymentMethodDetails?.expYear,
          },
          create: {
            id: subscription.id,
            userId: user.id,
            planId: updateDbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(updatePriceData.price.id),
            interval: String(updatePriceData.price.recurring?.interval || 'month'),
            status: subscription.status,
            currentPeriodStart: updateCurrentPeriodStart,
            currentPeriodEnd: updateCurrentPeriodEnd,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
            trialStart: subscriptionData.trial_start || 0,
            trialEnd: subscription.status === 'active' ? 0 : subscriptionData.trial_end || 0, // Clear trial for active subscriptions
            paymentMethodId: updatePaymentMethodDetails?.paymentMethodId,
            last4: updatePaymentMethodDetails?.last4,
            brand: updatePaymentMethodDetails?.brand,
            expMonth: updatePaymentMethodDetails?.expMonth,
            expYear: updatePaymentMethodDetails?.expYear,
          },
        })

        console.log(`Subscription ${subscription.id} updated for user ${user.id}`)

        // Note: We don't broadcast here because customer.subscription.updated fires during
        // the upgrade process BEFORE invoice.payment_succeeded. We only want to broadcast
        // the final confirmed update after the invoice payment succeeds to avoid premature
        // UI updates and modal closures. The invoice.payment_succeeded event will handle
        // the final broadcast with confirmed: true.

        // IMPORTANT: Check if there are multiple active subscriptions in Stripe and cancel extras
        const allUserSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 100,
        })

        const activeSubscriptions = allUserSubscriptions.data.filter(
          (sub) =>
            (sub.status === 'active' || sub.status === 'trialing') && sub.id !== subscription.id
        )

        if (activeSubscriptions.length > 0) {
          console.log(
            `⚠️ Found ${activeSubscriptions.length} other active subscription(s) for user. Canceling them.`
          )
          for (const extraSub of activeSubscriptions) {
            await stripe.subscriptions.cancel(extraSub.id)
            console.log(`✅ Canceled extra subscription ${extraSub.id}`)
          }
        }

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs whenever a customer's subscription ends.
       * This happens when a subscription is cancelled.
       * We should update the status to 'canceled', NOT delete the record.
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { id } = z.object({ id: z.string() }).parse(subscription)
        const customerId = subscription.customer as string

        console.log(`🚫 Subscription cancelled: ${id}`)
        console.log(`   Customer: ${customerId}`)
        console.log(`   Status: ${subscription.status}`)

        // Find the user by Stripe customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!user) {
          console.error('User not found for customer:', customerId)
          return new Response(null, { status: 200 })
        }

        const dbSubscription = await prisma.subscription.findUnique({
          where: { id },
        })

        if (dbSubscription) {
          // Update status to canceled instead of deleting the record
          // This preserves subscription history and billing information
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'canceled',
              cancelAtPeriodEnd: false, // Subscription is now fully cancelled
              // Keep all other data intact for historical purposes
            },
          })

          console.log(`✅ Updated subscription ${id} status to 'canceled' for user ${user.id}`)
          console.log(`📊 Subscription record preserved with status: canceled`)
        } else {
          console.log(`⚠️ Subscription ${id} not found in database`)
        }

        return new Response(null, { status: 200 })
      }
    }
  } catch (err: unknown) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { metadata } = paymentIntent

        if (metadata?.type === 'subscription_upgrade' && metadata?.userId) {
          console.error('Failed to process payment intent subscription:', err)
          // Could send error email here if needed
        }
        return new Response(null, { status: 200 })
      }

      case 'checkout.session.completed': {
        const session = event.data.object

        const { customer: customerId } = z.object({ customer: z.string() }).parse(session)

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (!user) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

        // await sendSubscriptionErrorEmail({ email: user.email, subscriptionId })
        return new Response(null)
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object

        const { customer: customerId } = z.object({ customer: z.string() }).parse(subscription)

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (!user) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

        // await sendSubscriptionErrorEmail({ email: user.email, subscriptionId })
        return new Response(null)
      }
    }

    throw err
  }

  return new Response(null)
}
