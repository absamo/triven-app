import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const cancellationSchema = z.object({
  subscriptionId: z.string(),
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(),
})

/**
 * Cancels a Stripe subscription
 * By default, cancels at the end of the current billing period
 * Can be set to cancel immediately if cancelAtPeriodEnd is false
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request)
    const body = await request.json()
    const { subscriptionId, cancelAtPeriodEnd, reason } = cancellationSchema.parse(body)

    // Verify that the subscription belongs to the authenticated user
    const dbSubscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        userId: user.id,
      },
    })

    if (!dbSubscription) {
      return Response.json({ error: 'Subscription not found or access denied' }, { status: 404 })
    }

    // Annual subscriptions can only be cancelled at period end
    if (dbSubscription.interval === 'year' && !cancelAtPeriodEnd) {
      return Response.json(
        { error: 'Annual subscriptions can only be cancelled at the end of the billing period' },
        { status: 400 }
      )
    }

    // Cancel the subscription in Stripe
    let stripeSubscription: Awaited<
      ReturnType<typeof stripe.subscriptions.update | typeof stripe.subscriptions.cancel>
    >
    if (cancelAtPeriodEnd) {
      // Cancel at period end - user keeps access until current period expires
      stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason || 'user_requested',
          cancelled_by: user.id,
          cancelled_at: Math.floor(Date.now() / 1000).toString(),
          user_id: user.id,
        },
      })
      console.log(`✅ Subscription ${subscriptionId} scheduled to cancel at period end`)
    } else {
      // Cancel immediately - user loses access now
      stripeSubscription = await stripe.subscriptions.cancel(subscriptionId, {
        prorate: true,
        invoice_now: true,
      })
      console.log(`✅ Subscription ${subscriptionId} cancelled immediately`)
    }

    // Update database with cancellation status
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        // Track cancellation details
        cancelledAt: cancelAtPeriodEnd ? null : new Date(), // Only set if immediate cancellation
        cancelledBy: user.id,
        cancellationReason: reason || null,
        scheduledCancelAt: cancelAtPeriodEnd
          ? new Date(dbSubscription.currentPeriodEnd * 1000)
          : null,
        // Note: If cancelled immediately, Stripe sets status to 'canceled'
        // If cancel_at_period_end is true, status remains 'active' until period ends
      },
    })

    console.log(`✅ Database updated for subscription ${subscriptionId}`)

    return Response.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
      },
      message: cancelAtPeriodEnd
        ? 'Your subscription will be cancelled at the end of your current billing period'
        : 'Your subscription has been cancelled immediately',
    })
  } catch (error) {
    console.error('❌ Subscription cancellation error:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
