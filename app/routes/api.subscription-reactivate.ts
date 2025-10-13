import { data } from 'react-router'
import { z } from 'zod'
import { ERRORS } from '~/app/common/errors'
import { prisma } from '~/app/db.server'
import { getPaymentMethodDetails } from '~/app/modules/stripe/queries.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const reactivateSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required').optional(), // Optional - can reactivate same plan
  interval: z.enum(['month', 'year']).optional(), // Optional - can keep same interval
  currency: z.enum(['usd', 'eur']).optional(), // Optional - can keep same currency
})

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    // Authenticate user
    const user = await requireBetterAuthUser(request)

    const formData = await request.json()
    const { planId, interval, currency } = reactivateSchema.parse(formData)

    // Get user's current subscription
    const currentSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { price: true },
    })

    if (!currentSubscription) {
      return data({ error: 'No subscription found' }, { status: 404 })
    }

    // Get the current Stripe subscription to check its actual status
    const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.id)

    console.log(`🔍 Current subscription status: ${stripeSubscription.status}`)
    console.log(`🔍 Cancel at period end: ${stripeSubscription.cancel_at_period_end}`)

    let reactivatedSubscription

    // Determine reactivation strategy based on current status
    if (stripeSubscription.status === 'active' && stripeSubscription.cancel_at_period_end) {
      // Case 1: Subscription is active but scheduled to cancel at period end
      // Simply remove the cancellation schedule - this is true reactivation
      console.log(`🔄 Removing cancellation schedule from subscription ${currentSubscription.id}`)

      const updateData: any = {
        cancel_at_period_end: false,
      }

      // If changing plan, update the subscription items
      if (planId) {
        const priceId = await getPriceId(
          planId,
          interval || currentSubscription.interval,
          currency || currentSubscription.price?.currency || 'usd'
        )
        updateData.items = [
          {
            id: stripeSubscription.items.data[0].id,
            price: priceId,
          },
        ]
      }

      reactivatedSubscription = await stripe.subscriptions.update(
        currentSubscription.id,
        updateData
      )

      console.log(`✅ Subscription ${currentSubscription.id} reactivated (removed cancellation)`)
    } else if (stripeSubscription.status === 'canceled') {
      // Case 2: Subscription is fully cancelled
      // Stripe best practice: Create new subscription but inherit payment method
      console.log(
        `🔄 Creating new subscription to replace cancelled subscription ${currentSubscription.id}`
      )

      const priceId = await getPriceId(
        planId || currentSubscription.planId,
        interval || currentSubscription.interval,
        currency || currentSubscription.price?.currency || 'usd'
      )

      reactivatedSubscription = await stripe.subscriptions.create({
        customer: stripeSubscription.customer as string,
        items: [{ price: priceId }],
        // Inherit payment method if available
        ...(currentSubscription.paymentMethodId && {
          default_payment_method: currentSubscription.paymentMethodId,
        }),
        metadata: {
          reactivated_from: currentSubscription.id,
          user_id: user.id,
          reactivated_at: Math.floor(Date.now() / 1000).toString(),
        },
      })

      console.log(
        `✅ Created new subscription ${reactivatedSubscription.id} to replace cancelled one`
      )
    } else {
      // Case 3: Subscription has other status (past_due, unpaid, etc.)
      // Try to reactivate by updating status and payment method
      console.log(
        `🔄 Attempting to reactivate subscription with status: ${stripeSubscription.status}`
      )

      const updateData: any = {
        cancel_at_period_end: false,
      }

      if (planId) {
        const priceId = await getPriceId(
          planId,
          interval || currentSubscription.interval,
          currency || currentSubscription.price?.currency || 'usd'
        )
        updateData.items = [
          {
            id: stripeSubscription.items.data[0].id,
            price: priceId,
          },
        ]
      }

      reactivatedSubscription = await stripe.subscriptions.update(
        currentSubscription.id,
        updateData
      )

      console.log(
        `✅ Subscription ${currentSubscription.id} reactivated from ${stripeSubscription.status} status`
      )
    }

    // Get updated payment method details
    const paymentMethodDetails = await getPaymentMethodDetails(reactivatedSubscription.id)

    // Update database with reactivated subscription details
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        // Update to new subscription ID if we created a new one
        id: reactivatedSubscription.id,
        planId: planId || currentSubscription.planId,
        priceId: planId
          ? await getPriceId(
              planId,
              interval || currentSubscription.interval,
              currency || currentSubscription.price?.currency || 'usd'
            )
          : currentSubscription.priceId,
        interval: interval || currentSubscription.interval,
        status: reactivatedSubscription.status,
        currentPeriodStart: reactivatedSubscription.current_period_start,
        currentPeriodEnd: reactivatedSubscription.current_period_end,
        cancelAtPeriodEnd: false, // Subscription is now active
        trialStart: reactivatedSubscription.trial_start || 0,
        trialEnd: reactivatedSubscription.trial_end || 0,
        paymentMethodId: paymentMethodDetails?.paymentMethodId,
        last4: paymentMethodDetails?.last4,
        brand: paymentMethodDetails?.brand,
        expMonth: paymentMethodDetails?.expMonth,
        expYear: paymentMethodDetails?.expYear,
        // Clear cancellation tracking fields
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        scheduledCancelAt: null,
      },
    })

    // Handle payment if required
    if (reactivatedSubscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(
        reactivatedSubscription.latest_invoice as string,
        {
          expand: ['payment_intent'],
        }
      )

      const paymentIntent = invoice.payment_intent as any
      if (paymentIntent?.status === 'requires_payment_method') {
        return data({
          requiresPayment: true,
          clientSecret: paymentIntent.client_secret,
          subscriptionId: reactivatedSubscription.id,
        })
      }
    }

    return data({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        planId: updatedSubscription.planId,
        interval: updatedSubscription.interval,
        cancelAtPeriodEnd: false,
      },
      message: 'Your subscription has been reactivated successfully!',
    })
  } catch (error) {
    console.error('Subscription reactivation error:', error)

    if (error instanceof z.ZodError) {
      return data({ error: 'Invalid request data' }, { status: 400 })
    }

    return data({ error: ERRORS.STRIPE_SOMETHING_WENT_WRONG }, { status: 500 })
  }
}

// Helper function to get price ID
async function getPriceId(planId: string, interval: string, currency: string): Promise<string> {
  const price = await prisma.price.findFirst({
    where: {
      planId,
      interval,
      currency,
    },
  })

  if (!price) {
    throw new Error(
      `Price not found for plan ${planId}, interval ${interval}, currency ${currency}`
    )
  }

  return price.id
}
