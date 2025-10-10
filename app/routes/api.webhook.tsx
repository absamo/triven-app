import type { ActionFunctionArgs } from 'react-router'
import type Stripe from 'stripe'
import { z } from 'zod'
// import {
//   sendSubscriptionSuccessEmail,
//   sendSubscriptionErrorEmail,
// } from '#app/modules/email/templates/subscription-email'
import { ERRORS } from '~/app/common/errors'
import { prisma } from '~/app/db.server'
import { stripe } from '~/app/modules/stripe/stripe.server'

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
        console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id} (${paymentIntent.amount})`)

        // Handle standalone PaymentIntents for subscriptions (non-trial)
        const { metadata } = paymentIntent
        const piData = paymentIntent as unknown as { invoice?: string | null }

        // Handle subscription payments - but only for standalone PaymentIntents, not invoice-attached ones
        if (
          metadata?.subscriptionId &&
          metadata?.type === 'subscription_payment' &&
          paymentIntent.payment_method &&
          !piData.invoice // Only process standalone PaymentIntents
        ) {
          console.log(`🔗 Processing standalone subscription payment for ${metadata.subscriptionId}`)

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
              const errorMessage = attachError instanceof Error ? attachError.message : String(attachError)
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
          console.log(`✅ Invoice payment succeeded for subscription ${metadata.subscriptionId}, Stripe handled automatically`)
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
          (metadata?.type === 'trial_subscription' || metadata?.type === 'subscription_setup') &&
          setupIntent.payment_method
        ) {
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
          trialEnd: 0,
        })

        // Update subscription in database - this subscription now becomes active
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            id: stripeSubscription.id,
            planId: dbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(priceData.price.id),
            interval: String(priceData.price.recurring?.interval || 'month'),
            status: 'active', // Force active status since payment succeeded
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
            trialStart,
            trialEnd: 0, // Force trialEnd to 0 for paid subscription - user no longer in trial
          },
          create: {
            id: stripeSubscription.id,
            userId: user.id,
            planId: dbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(priceData.price.id),
            interval: String(priceData.price.recurring?.interval || 'month'),
            status: 'active', // Force active status since payment succeeded
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
            trialStart,
            trialEnd: 0, // Force trialEnd to 0 for paid subscription - user no longer in trial
          },
        })

        console.log(`✅ Subscription ${stripeSubscription.id} activated for user ${user.id}`)
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
        const updateStripeProductId = String(updatePriceData.price.product)
        let updateDbPlanId = 'standard' // Default fallback

        // Find the correct database plan ID by looking up the price
        const updateDbPrice = await prisma.price.findUnique({
          where: { id: String(updatePriceData.price.id) },
          include: { plan: true },
        })

        if (updateDbPrice) {
          updateDbPlanId = updateDbPrice.planId
        }

        // Extract period information with proper casting
        const updateSubscriptionData = subscription as any
        const updateCurrentPeriodStart =
          updateSubscriptionData.current_period_start || Math.floor(Date.now() / 1000)
        const updateCurrentPeriodEnd =
          updateSubscriptionData.current_period_end ||
          Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            planId: updateDbPlanId, // Use database plan ID, not Stripe product ID
            priceId: String(updatePriceData.price.id),
            interval: String(updatePriceData.price.recurring?.interval || 'month'),
            status: subscription.status,
            currentPeriodStart: updateCurrentPeriodStart,
            currentPeriodEnd: updateCurrentPeriodEnd,
            cancelAtPeriodEnd: updateSubscriptionData.cancel_at_period_end || false,
            trialStart: updateSubscriptionData.trial_start || 0,
            trialEnd: subscription.status === 'active' ? 0 : updateSubscriptionData.trial_end || 0, // Clear trial for active subscriptions
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
            cancelAtPeriodEnd: updateSubscriptionData.cancel_at_period_end || false,
            trialStart: updateSubscriptionData.trial_start || 0,
            trialEnd: subscription.status === 'active' ? 0 : updateSubscriptionData.trial_end || 0, // Clear trial for active subscriptions
          },
        })

        console.log(`Subscription ${subscription.id} updated for user ${user.id}`)
        return new Response(null, { status: 200 })
      }

      /**
       * Occurs whenever a customer’s subscription ends.
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const { id } = z.object({ id: z.string() }).parse(subscription)

        const dbSubscription = await prisma.subscription.findUnique({
          where: { id },
        })
        if (dbSubscription) await prisma.subscription.delete({ where: { id: dbSubscription.id } })

        return new Response(null)
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

        const { customer: customerId, subscription: subscriptionId } = z
          .object({ customer: z.string(), subscription: z.string() })
          .parse(session)

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
        if (!user) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

        // await sendSubscriptionErrorEmail({ email: user.email, subscriptionId })
        return new Response(null)
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object

        const { id: subscriptionId, customer: customerId } = z
          .object({ id: z.string(), customer: z.string() })
          .parse(subscription)

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
