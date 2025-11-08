import type { ActionFunctionArgs } from 'react-router'
import type Stripe from 'stripe'
import { z } from 'zod'
import { ERRORS } from '~/app/common/errors'
import { prisma } from '~/app/db.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import {
  handleCanceledSubscriptionReactivation,
  handleInvoicePaymentActionRequired,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSuccess,
  handlePaymentIntentSuccess,
  handlePaymentMethodUpdate,
  handleSubscriptionDeletion,
  handleSubscriptionUpdate,
  handleTrialSubscriptionSetup,
} from '~/app/services/webhook-handlers.server'
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
        await handlePaymentIntentSuccess(paymentIntent)
        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a SetupIntent is succeeded.
       * Handle trial subscription payment method setup.
       */
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object
        const { metadata } = setupIntent

        console.log(`🎉 [WEBHOOK] setup_intent.succeeded received`)
        console.log(`🎉 [WEBHOOK] SetupIntent ID: ${setupIntent.id}`)
        console.log(`🎉 [WEBHOOK] Type: ${metadata?.type}`)
        console.log(`🎉 [WEBHOOK] Metadata:`, JSON.stringify(metadata, null, 2))

        // For canceled subscription reactivation, we don't have a subscriptionId (creating new sub)
        if (metadata?.type === 'canceled_subscription_reactivation') {
          console.log(`🔄 [WEBHOOK] Processing canceled subscription reactivation`)
          if (!setupIntent.payment_method || !metadata?.userId || !metadata?.priceId) {
            console.log(`⚠️ [WEBHOOK] Missing required data - skipping`)
            console.log(`⚠️ [WEBHOOK] payment_method: ${!!setupIntent.payment_method}, userId: ${!!metadata?.userId}, priceId: ${!!metadata?.priceId}`)
            return new Response(null, { status: 200 })
          }
          console.log(`✅ [WEBHOOK] Validation passed - calling handler`)
          await handleCanceledSubscriptionReactivation(setupIntent, metadata)
          return new Response(null, { status: 200 })
        }

        if (
          !metadata?.subscriptionId ||
          !setupIntent.payment_method ||
          !(
            metadata?.type === 'trial_subscription' ||
            metadata?.type === 'subscription_setup' ||
            metadata?.type === 'payment_method_update' ||
            metadata?.type === 'paused_subscription_reactivation'
          )
        ) {
          return new Response(null, { status: 200 })
        }

        if (metadata.type === 'payment_method_update') {
          await handlePaymentMethodUpdate(setupIntent, metadata.subscriptionId)
        } else {
          await handleTrialSubscriptionSetup(setupIntent, metadata.subscriptionId, metadata)
        }

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a subscription invoice payment succeeds.
       */
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        if (!subscriptionId) {
          return new Response(null, { status: 200 })
        }

        await handleInvoicePaymentSuccess(invoice, subscriptionId)
        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a payment for an invoice fails.
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string
          customer?: string
        }
        const subscriptionId = invoice.subscription

        if (!subscriptionId) {
          return new Response(null, { status: 200 })
        }

        await handleInvoicePaymentFailed(invoice, subscriptionId)
        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a payment for an invoice requires additional action.
       */
      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string
          customer?: string
        }
        const subscriptionId = invoice.subscription

        if (!subscriptionId) {
          return new Response(null, { status: 200 })
        }

        await handleInvoicePaymentActionRequired(invoice, subscriptionId)
        return new Response(null, { status: 200 })
      }

      /**
       * Occurs when a Stripe subscription has been updated.
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (!subscription.id) {
          return new Response(null, { status: 200 })
        }

        await handleSubscriptionUpdate(subscription, customerId)

        // Broadcast subscription update to connected clients
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          const dbSubscription = await prisma.subscription.findUnique({
            where: { userId: user.id },
          })

          if (dbSubscription) {
            broadcastSubscriptionUpdate({
              userId: user.id,
              status: dbSubscription.status,
              planId: dbSubscription.planId,
              trialEnd: dbSubscription.trialEnd,
              confirmed: dbSubscription.status === 'active' && dbSubscription.trialEnd === 0,
            })
          }
        }

        return new Response(null, { status: 200 })
      }

      /**
       * Occurs whenever a customer's subscription ends.
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { id } = z.object({ id: z.string() }).parse(subscription)
        const customerId = subscription.customer as string

        await handleSubscriptionDeletion(subscription, customerId)

        // Broadcast cancellation to connected clients
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          const dbSubscription = await prisma.subscription.findUnique({
            where: { userId: user.id },
          })

          if (dbSubscription) {
            broadcastSubscriptionUpdate({
              userId: user.id,
              status: 'canceled',
              planId: dbSubscription.planId,
              trialEnd: 0,
              confirmed: true,
            })
          }
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
