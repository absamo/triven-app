import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const subscriptionStatusSchema = z.object({
  subscriptionId: z.string(),
})

/**
 * Checks and updates subscription status if payment has succeeded
 * This is a fallback for cases where webhooks might not have processed
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request)
    const body = await request.json()
    const { subscriptionId } = subscriptionStatusSchema.parse(body)

    console.log(`🔍 Checking subscription status for ${subscriptionId}`)

    // Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    })

    // Get current subscription from database
    const dbSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!dbSubscription) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 })
    }

    console.log(`📊 Stripe subscription status: ${stripeSubscription.status}`)
    console.log(`📊 Database subscription status: ${dbSubscription.status}`)

    // Check if subscription should be active but isn't in database
    const shouldActivate =
      (stripeSubscription.status === 'active' && dbSubscription.status === 'incomplete') ||
      (stripeSubscription.status === 'incomplete' && dbSubscription.status === 'incomplete')

    if (shouldActivate) {
      // Check if there's a succeeded PaymentIntent
      const invoice = stripeSubscription.latest_invoice as any
      const paymentIntent = invoice?.payment_intent

      let hasSucceededPayment = false

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        hasSucceededPayment = true
        console.log(`✅ Found succeeded PaymentIntent: ${paymentIntent.id}`)
      } else {
        // Check for manually created PaymentIntents
        const paymentIntents = await stripe.paymentIntents.list({
          customer: stripeSubscription.customer as string,
          limit: 10,
        })

        const relatedPayment = paymentIntents.data.find(
          (pi) => pi.metadata?.subscriptionId === subscriptionId && pi.status === 'succeeded'
        )

        if (relatedPayment) {
          hasSucceededPayment = true
          console.log(`✅ Found related succeeded PaymentIntent: ${relatedPayment.id}`)
        }
      }

      if (hasSucceededPayment || stripeSubscription.status === 'active') {
        console.log(`🔄 Activating subscription ${subscriptionId} in database`)

        // Get plan details
        const priceData = stripeSubscription.items.data[0]
        const dbPrice = await prisma.price.findUnique({
          where: { id: String(priceData.price.id) },
          include: { plan: true },
        })

        const dbPlanId = dbPrice?.planId || 'standard'

        // Extract period information
        const subscriptionData = stripeSubscription as any
        const currentPeriodStart =
          subscriptionData.current_period_start || Math.floor(Date.now() / 1000)
        const currentPeriodEnd =
          subscriptionData.current_period_end ||
          Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        const trialStart = subscriptionData.trial_start || 0

        // Update subscription to active
        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
            trialEnd: 0, // Clear trial for paid subscription
          },
        })

        console.log(`✅ Subscription ${subscriptionId} activated manually`)

        return Response.json({
          status: 'activated',
          message: 'Subscription has been activated',
          subscriptionStatus: 'active',
        })
      }
    }

    return Response.json({
      status: 'no_change',
      message: 'Subscription status is current',
      subscriptionStatus: dbSubscription.status,
      stripeStatus: stripeSubscription.status,
    })
  } catch (error) {
    console.error('❌ Subscription status check error:', error)
    return Response.json({ error: 'Failed to check subscription status' }, { status: 500 })
  }
}
