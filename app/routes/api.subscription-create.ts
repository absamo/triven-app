import type { ActionFunctionArgs } from 'react-router'
import type Stripe from 'stripe'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { CURRENCIES, INTERVALS, PLANS } from '~/app/modules/stripe/plans'
import { stripe } from '~/app/modules/stripe/stripe.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import {
  confirmTrialConversionPayment,
  createDeferredResponse,
  createPaidSubscription,
  createTrialSetupIntent,
  ensureStripeCustomer,
  extractClientSecret,
  handleActiveSubscriptionUpgrade,
  handleSubscriptionReactivation,
  handleTrialConversion,
  sendSubscriptionEmails,
  storeSubscriptionInDatabase,
  validateExistingSubscription,
  type SubscriptionContext,
} from '~/app/services/subscription-operations.server'

const subscriptionSchema = z.object({
  planId: z.enum([PLANS.STANDARD, PLANS.PROFESSIONAL, PLANS.PREMIUM]),
  interval: z.enum([INTERVALS.MONTHLY, INTERVALS.YEARLY]),
  currency: z.enum([CURRENCIES.USD, CURRENCIES.EUR]),
  confirmPayment: z.boolean().optional(),
  subscriptionId: z.string().optional(),
  useExistingPaymentMethod: z.boolean().optional(),
})

/**
 * Subscription management endpoint - handles creation, upgrades, and trial conversions
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request)
    const body = await request.json()
    const { planId, interval, currency, confirmPayment, subscriptionId, useExistingPaymentMethod } =
      subscriptionSchema.parse(body)

    // Handle trial conversion confirmation
    if (confirmPayment && subscriptionId) {
      const result = await confirmTrialConversionPayment(
        user.id,
        subscriptionId,
        planId,
        interval,
        currency
      )
      return Response.json(result)
    }

    // Get price and user details
    const dbPrice = await prisma.price.findFirst({
      where: {
        planId,
        interval,
        currency: currency.toUpperCase(),
      },
      include: { plan: true },
    })

    if (!dbPrice) {
      console.error(`❌ No price found for: ${planId}, ${interval}, ${currency}`)
      return Response.json(
        { error: `No price configuration found for ${planId} plan` },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    })

    if (!dbUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure Stripe customer exists
    const stripeCustomerId = await ensureStripeCustomer(
      user.id,
      dbUser.email,
      dbUser.stripeCustomerId
    )

    // Build subscription context
    const ctx: SubscriptionContext = {
      userId: user.id,
      userEmail: dbUser.email,
      stripeCustomerId,
      planId,
      interval,
      currency,
      priceId: dbPrice.id,
      amount: dbPrice.amount,
      useExistingPaymentMethod,
    }

    // Check existing subscription
    let existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    // Validate and potentially nullify existing subscription
    // Exception: Keep paused subscriptions so they can be reactivated
    if (existingSubscription && existingSubscription.status !== 'paused') {
      const isValid = await validateExistingSubscription(existingSubscription.id)
      if (!isValid) {
        existingSubscription = null
      }
    }

    // Route to appropriate handler based on subscription state
    let subscription: Stripe.Subscription | undefined
    let isUpgrade = false
    let isTrialConversion = false

    // Handle trial subscription conversion
    if (existingSubscription?.status === 'trialing') {
      const result = await handleTrialConversion(ctx, existingSubscription.id)
      return Response.json(result)
    }

    // Handle active subscription upgrade
    if (existingSubscription?.status === 'active') {
      const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.id)
      isUpgrade = true
      subscription = await handleActiveSubscriptionUpgrade(ctx, stripeSubscription)
    }

    // Handle reactivation of paused/canceled/incomplete subscriptions
    if (existingSubscription && !isUpgrade && existingSubscription.status !== 'trialing') {
      const result = await handleSubscriptionReactivation(ctx, existingSubscription.id)
      
      // Check if result is a SubscriptionResult (for paused subscriptions)
      if ('deferredMode' in result || 'isPausedReactivation' in result) {
        return Response.json(result)
      }
      
      // Otherwise it's a Stripe.Subscription
      subscription = result as Stripe.Subscription
    }

    // Handle new subscription creation
    if (!existingSubscription) {
      // Return deferred response if not a payment submission
      if (useExistingPaymentMethod !== false) {
        return Response.json(createDeferredResponse(ctx))
      }

      // Create paid subscription when user submits payment
      subscription = await createPaidSubscription(ctx)
    }

    if (!subscription) {
      throw new Error('Failed to create or retrieve subscription')
    }

    // Extract client secret
    let clientSecret = extractClientSecret(subscription, isTrialConversion, isUpgrade)

    // Create SetupIntent for trial subscriptions if needed
    if (isTrialConversion && !clientSecret) {
      clientSecret = await createTrialSetupIntent(ctx, subscription.id)
    }

    // Store subscription in database
    // Skip storing incomplete subscriptions on initial creation - let webhook handle it
    console.log(`📊 [SUBSCRIPTION-CREATE] Subscription status after creation: ${subscription.status}`)
    console.log(`📊 [SUBSCRIPTION-CREATE] Subscription ID: ${subscription.id}`)
    console.log(`📊 [SUBSCRIPTION-CREATE] Has client secret: ${!!clientSecret}`)
    
    if (subscription.status !== 'incomplete') {
      console.log(`✅ [SUBSCRIPTION-CREATE] Storing subscription in database (status: ${subscription.status})`)
      await storeSubscriptionInDatabase(ctx, subscription)
    } else {
      console.log(`⏸️ [SUBSCRIPTION-CREATE] Skipping database storage for incomplete subscription ${subscription.id}`)
      console.log(`⏸️ [SUBSCRIPTION-CREATE] Will be stored by webhook after payment succeeds`)
    }

    // Send confirmation emails
    await sendSubscriptionEmails(ctx, subscription, isUpgrade)

    // Return response
    return Response.json({
      subscriptionId: subscription.id,
      clientSecret,
      amount: isUpgrade && !clientSecret ? 0 : ctx.amount,
      currency: ctx.currency.toUpperCase(),
      planName: dbPrice.plan.name,
      isUpgrade,
      isTrialConversion,
      paymentRequired: !!clientSecret,
    })
  } catch (error) {
    console.error('❌ Subscription error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
