import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from '~/app/modules/stripe/plans'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

const paymentIntentSchema = z.object({
  planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
  interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
  currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
})

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request)
    const body = await request.json()
    const { planId, interval, currency } = paymentIntentSchema.parse(body)

    // Get plan details
    const plan = PRICING_PLANS[planId]
    const amount = plan.prices[interval][currency]
    const priceId = plan.stripePriceIds[interval][currency]

    if (!amount || !priceId) {
      return Response.json({ error: 'Invalid plan configuration' }, { status: 400 })
    }

    // Get user with Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    })

    if (!dbUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let stripeCustomerId = dbUser.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: {
          userId: dbUser.id,
        },
      })
      stripeCustomerId = customer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId },
      })
    }

    // Create subscription with proper payment setup
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        planId,
        interval,
        type: 'subscription_upgrade',
      },
    })

    const invoice = subscription.latest_invoice as any
    const paymentIntent = invoice?.payment_intent

    // Ensure we have a payment intent
    if (!paymentIntent) {
      console.error('No payment intent found for subscription:', subscription.id)
      // Cancel the incomplete subscription
      await stripe.subscriptions.cancel(subscription.id)
      return Response.json(
        { error: 'Failed to create payment intent for subscription' },
        { status: 500 }
      )
    }

    if (!paymentIntent || !paymentIntent.client_secret) {
      console.error('Payment intent not found or missing client_secret:', {
        invoice,
        paymentIntent,
      })
      return Response.json(
        { error: 'Failed to create payment intent - missing client secret' },
        { status: 500 }
      )
    }

    return Response.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      planName: plan.name,
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return Response.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}
