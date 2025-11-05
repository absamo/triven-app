import type { ActionFunctionArgs } from 'react-router'
import { data } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { CURRENCIES, INTERVALS, PLANS } from '~/app/modules/stripe/plans'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const upgradeSchema = z.object({
  planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
  interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
  currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
  useExistingPaymentMethod: z.boolean().optional().default(false),
})

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireBetterAuthUser(request)

  if (!user) {
    return data({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = upgradeSchema.parse(body)

    // Get user's current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    })

    if (!subscription) {
      return data({ error: 'No active subscription found' }, { status: 404 })
    }

    // Get the target plan and price
    const targetPlan = await prisma.plan.findUnique({
      where: { id: validatedData.planId },
      include: { prices: true },
    })

    if (!targetPlan) {
      return data({ error: 'Target plan not found' }, { status: 404 })
    }

    const targetPrice = targetPlan.prices.find(
      (price) =>
        price.interval === validatedData.interval && price.currency === validatedData.currency
    )

    if (!targetPrice) {
      return data({ error: 'Price not found for selected plan' }, { status: 404 })
    }

    // If using existing payment method, upgrade the subscription directly
    if (validatedData.useExistingPaymentMethod) {
      // Retrieve the current Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id)

      console.log(`🔍 Current subscription status: ${stripeSubscription.status}`)

      // Check if subscription is in a state that cannot be updated
      // These statuses require creating a new subscription instead of updating
      const cannotUpdate = ['canceled', 'incomplete_expired', 'unpaid'].includes(
        stripeSubscription.status
      )

      if (cannotUpdate) {
        console.log(
          `⚠️ Subscription ${subscription.id} has status ${stripeSubscription.status}. Cannot update - must create new subscription.`
        )

        // For expired/canceled subscriptions, redirect to create new subscription flow
        return data({
          requiresNewSubscription: true,
          message: 'Your subscription has expired. Please complete the payment to upgrade.',
          status: stripeSubscription.status,
        })
      }

      // Update the subscription with the new price
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: targetPrice.id,
          },
        ],
        proration_behavior: 'always_invoice', // Create invoice for prorated amount
      })

      // Update local database
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: validatedData.planId,
          priceId: targetPrice.id,
          interval: validatedData.interval,
          status: updatedSubscription.status,
        },
      })

      return data({
        success: true,
        message: 'Subscription upgraded successfully',
        subscription: updatedSubscription,
      })
    }

    // If not using existing payment method, create a checkout session
    // (This would be handled by the Stripe payment form flow)
    return data({ error: 'Payment method required. Please use the payment form.' }, { status: 400 })
  } catch (error) {
    console.error('Subscription upgrade error:', error)

    if (error instanceof z.ZodError) {
      return data({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }

    return data(
      {
        error: error instanceof Error ? error.message : 'Failed to upgrade subscription',
      },
      { status: 500 }
    )
  }
}
