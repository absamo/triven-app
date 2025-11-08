import type Stripe from 'stripe'
import { prisma } from '~/app/db.server'
import type { CURRENCIES, INTERVALS, PLANS } from '~/app/modules/stripe/plans'
import { PRICING_PLANS } from '~/app/modules/stripe/plans'
import { getPaymentMethodDetails } from '~/app/modules/stripe/queries.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import {
  formatCurrency,
  formatDate,
  getUserLocale,
  sendSubscriptionConfirmationEmail,
  sendTrialWelcomeEmail,
} from '~/app/services/email.server'

type Plan = (typeof PLANS)[keyof typeof PLANS]
type Interval = (typeof INTERVALS)[keyof typeof INTERVALS]
type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES]

export interface SubscriptionContext {
  userId: string
  userEmail: string
  stripeCustomerId: string
  planId: Plan
  interval: Interval
  currency: Currency
  priceId: string
  amount: number
  useExistingPaymentMethod?: boolean
}

export interface SubscriptionResult {
  subscriptionId: string | null
  clientSecret: string | null
  amount: number
  currency: string
  planName: string
  isUpgrade: boolean
  isTrialConversion: boolean
  paymentRequired: boolean
  deferredMode?: boolean
  isPausedReactivation?: boolean
  useSetupMode?: boolean
}

/**
 * Validates and retrieves or creates a Stripe customer
 */
export async function ensureStripeCustomer(
  userId: string,
  email: string,
  existingCustomerId: string | null
): Promise<string> {
  let customerId = existingCustomerId

  // Validate existing customer
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
      console.log(`✅ Using existing Stripe customer: ${customerId}`)
      return customerId
    } catch {
      console.log(`⚠️ Stored customer ${customerId} not found, creating new one`)
      customerId = null
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })
  
  console.log(`✅ Created new Stripe customer: ${customer.id}`)
  
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

/**
 * Validates existing subscription and determines if it should be treated as null
 * Note: We don't manually cancel subscriptions - Stripe handles trial expiration automatically
 */
export async function validateExistingSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    
  // Treat as null if subscription is in terminal or unusable state
  const shouldTreatAsNull =
    stripeSubscription.status === 'canceled' ||
    stripeSubscription.status === 'incomplete_expired' ||
    stripeSubscription.status === 'paused' ||
    stripeSubscription.cancel_at_period_end

  if (shouldTreatAsNull) {
    console.log(
      `⚠️ Subscription ${subscriptionId} status: ${stripeSubscription.status}, ` +
      `cancel_at_period_end: ${stripeSubscription.cancel_at_period_end} - treating as null`
    )
    return false
  }    return true
  } catch (error) {
    console.error(`⚠️ Could not retrieve subscription from Stripe:`, error)
    return false
  }
}

/**
 * Cleans up orphaned subscriptions before creating a new one
 * Note: incomplete_expired (expired trials) are left alone - Stripe already handled them
 */
export async function cleanupOrphanedSubscriptions(customerId: string): Promise<void> {
  console.log(`🔍 Checking for orphaned subscriptions for customer ${customerId}`)
  
  const allSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })

  // Only cancel subscriptions that are actually active or processing
  // Don't touch incomplete_expired (expired trials) - Stripe already handled those
  const subscriptionsToCancel = allSubscriptions.data.filter(
    (sub) =>
      sub.status === 'active' ||
      sub.status === 'trialing' ||
      sub.status === 'past_due' ||
      sub.status === 'incomplete'
  )

  if (subscriptionsToCancel.length === 0) return

  console.log(`⚠️ Cleaning up ${subscriptionsToCancel.length} subscription(s)`)
  
  await Promise.all(
    subscriptionsToCancel.map(async (sub) => {
      await stripe.subscriptions.cancel(sub.id)
      console.log(`✅ Canceled subscription ${sub.id} (${sub.status})`)
    })
  )
}

/**
 * Handles trial subscription conversion with SetupIntent
 */
export async function handleTrialConversion(
  ctx: SubscriptionContext,
  existingSubscriptionId: string
): Promise<SubscriptionResult> {
  console.log(`🎯 Trial conversion for subscription ${existingSubscriptionId}`)

  const setupIntent = await stripe.setupIntents.create({
    customer: ctx.stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    usage: 'off_session',
    metadata: {
      subscriptionId: existingSubscriptionId,
      userId: ctx.userId,
      type: 'trial_subscription',
      planId: ctx.planId,
      interval: ctx.interval,
      priceId: ctx.priceId,
    },
  })

  console.log(`✅ Created SetupIntent ${setupIntent.id} for trial conversion`)

  return {
    subscriptionId: existingSubscriptionId,
    clientSecret: setupIntent.client_secret,
    amount: ctx.amount,
    currency: ctx.currency.toUpperCase(),
    planName: PRICING_PLANS[ctx.planId].name,
    isUpgrade: false,
    isTrialConversion: true,
    paymentRequired: true,
  }
}

/**
 * Handles upgrade with existing payment method
 */
export async function handleUpgradeWithExistingPayment(
  ctx: SubscriptionContext,
  subscription: Stripe.Subscription
): Promise<Stripe.Subscription> {
  console.log(`💳 Upgrading with existing payment method`)

  const subscriptionItemId = subscription.items.data[0].id
  
  return await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscriptionItemId, price: ctx.priceId }],
    proration_behavior: 'always_invoice',
    payment_behavior: 'allow_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId: ctx.userId,
      planId: ctx.planId,
      interval: ctx.interval,
      type: 'subscription_upgrade',
    },
  })
}

/**
 * Handles upgrade with new payment method
 */
export async function handleUpgradeWithNewPayment(
  ctx: SubscriptionContext,
  subscription: Stripe.Subscription
): Promise<Stripe.Subscription> {
  console.log(`💳 Upgrading with new payment method`)

  const subscriptionItemId = subscription.items.data[0].id
  
  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscriptionItemId, price: ctx.priceId }],
    proration_behavior: 'create_prorations',
    billing_cycle_anchor: 'unchanged',
    metadata: {
      userId: ctx.userId,
      planId: ctx.planId,
      interval: ctx.interval,
      type: 'subscription_upgrade_new_payment_method',
    },
  })

  const latestInvoice = await stripe.invoices.retrieve(
    updatedSubscription.latest_invoice as string
  )

  console.log(`📄 Invoice: ${latestInvoice.id}, amount: ${latestInvoice.amount_due}`)

  if (latestInvoice.amount_due > 0) {
    await cancelAutomaticPaymentAttempt(latestInvoice)
    const paymentIntent = await createUpgradePaymentIntent(ctx, latestInvoice, updatedSubscription.id)
    await attachUpgradePaymentMetadata(updatedSubscription.id, paymentIntent.id, latestInvoice.id || '')
  }

  return await stripe.subscriptions.retrieve(updatedSubscription.id, {
    expand: ['latest_invoice.payment_intent'],
  })
}

async function cancelAutomaticPaymentAttempt(invoice: Stripe.Invoice): Promise<void> {
  const invoiceData = invoice as any
  if (invoice.status === 'open' && invoiceData.payment_intent) {
    try {
      await stripe.paymentIntents.cancel(invoiceData.payment_intent as string)
      console.log(`❌ Canceled automatic payment attempt`)
    } catch (e) {
      console.log(`⚠️ Could not cancel payment intent: ${e}`)
    }
  }
}

async function createUpgradePaymentIntent(
  ctx: SubscriptionContext,
  invoice: Stripe.Invoice,
  subscriptionId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: invoice.amount_due,
    currency: invoice.currency,
    customer: ctx.stripeCustomerId,
    description: `Upgrade to ${ctx.planId} plan`,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata: {
      userId: ctx.userId,
      subscriptionId,
      invoiceId: invoice.id || '',
      type: 'subscription_upgrade',
    },
  })
}

async function attachUpgradePaymentMetadata(
  subscriptionId: string,
  paymentIntentId: string,
  invoiceId: string
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...subscription.metadata,
      upgrade_payment_intent: paymentIntentId,
      upgrade_invoice: invoiceId,
    },
  })
}

/**
 * Handles active subscription upgrade
 */
export async function handleActiveSubscriptionUpgrade(
  ctx: SubscriptionContext,
  existingSubscription: Stripe.Subscription
): Promise<Stripe.Subscription> {
  console.log(`🔄 Upgrading active subscription ${existingSubscription.id}`)

  const hasPaymentMethod = !!existingSubscription.default_payment_method
  
  if (!hasPaymentMethod) {
    throw new Error('No payment method found. Please add a payment method first.')
  }

  return ctx.useExistingPaymentMethod
    ? await handleUpgradeWithExistingPayment(ctx, existingSubscription)
    : await handleUpgradeWithNewPayment(ctx, existingSubscription)
}

/**
 * Handles reactivation of canceled/incomplete subscriptions
 * Note: For incomplete_expired (expired trials), we create a new subscription without cleanup
 */
export async function handleSubscriptionReactivation(
  ctx: SubscriptionContext,
  existingSubscriptionId: string
): Promise<Stripe.Subscription | SubscriptionResult> {
  console.log(`🔄 Reactivating subscription ${existingSubscriptionId}`)

  const stripeSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId)
  const isCanceledOrExpired =
    stripeSubscription.status === 'canceled' ||
    stripeSubscription.status === 'incomplete_expired'

  // Handle paused subscriptions - use SetupIntent to collect payment method
  if (stripeSubscription.status === 'paused') {
    console.log(`⏸️ Paused subscription detected - collecting payment method`)
    
    // Check if this is the initial request (deferred mode) or payment submission
    if (ctx.useExistingPaymentMethod !== false) {
      console.log(`💳 Returning deferred mode for paused subscription`)
      return {
        subscriptionId: existingSubscriptionId,
        clientSecret: null,
        amount: ctx.amount,
        currency: ctx.currency.toUpperCase(),
        planName: PRICING_PLANS[ctx.planId].name,
        isUpgrade: false,
        isTrialConversion: false,
        paymentRequired: true,
        deferredMode: true,
        isPausedReactivation: true,
      } as SubscriptionResult
    }
    
    // Payment submission - create SetupIntent to collect payment method
    console.log(`💳 Creating SetupIntent for paused subscription`)
    const setupIntent = await stripe.setupIntents.create({
      customer: ctx.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      usage: 'off_session',
      metadata: {
        subscriptionId: existingSubscriptionId,
        userId: ctx.userId,
        type: 'paused_subscription_reactivation',
        planId: ctx.planId,
        interval: ctx.interval,
        priceId: ctx.priceId,
      },
    })
    
    console.log(`✅ Created SetupIntent ${setupIntent.id} for paused subscription reactivation`)
    
    return {
      subscriptionId: existingSubscriptionId,
      clientSecret: setupIntent.client_secret,
      amount: ctx.amount,
      currency: ctx.currency.toUpperCase(),
      planName: PRICING_PLANS[ctx.planId].name,
      isUpgrade: false,
      isTrialConversion: false,
      isPausedReactivation: true,
      paymentRequired: true,
    } as SubscriptionResult
  }

  // Handle canceled subscriptions - create new subscription
  if (stripeSubscription.status === 'canceled') {
    console.log(`🚫 [CANCELED-REACTIVATION] Canceled subscription detected`)
    console.log(`🚫 [CANCELED-REACTIVATION] Subscription ID: ${existingSubscriptionId}`)
    console.log(`🚫 [CANCELED-REACTIVATION] Customer: ${ctx.stripeCustomerId}`)
    console.log(`🚫 [CANCELED-REACTIVATION] Plan: ${ctx.planId}, Price: ${ctx.priceId}`)
    console.log(`🚫 [CANCELED-REACTIVATION] useExistingPaymentMethod: ${ctx.useExistingPaymentMethod}`)
    
    // If using existing payment method, create subscription directly
    if (ctx.useExistingPaymentMethod === true) {
      console.log(`💳 [CANCELED-REACTIVATION] Attempting to use existing payment method`)
      
      // Get customer and check for payment methods
      const customer = await stripe.customers.retrieve(ctx.stripeCustomerId, {
        expand: ['invoice_settings.default_payment_method'],
      })
      
      // Check multiple locations for payment method
      let paymentMethodId = (customer as any).invoice_settings?.default_payment_method
      
      // If no invoice default, check customer default_source
      if (!paymentMethodId) {
        paymentMethodId = (customer as any).default_source
      }
      
      // If still no payment method, list payment methods attached to customer
      if (!paymentMethodId) {
        console.log(`💳 [CANCELED-REACTIVATION] No default payment method, checking attached payment methods`)
        const paymentMethods = await stripe.paymentMethods.list({
          customer: ctx.stripeCustomerId,
          type: 'card',
          limit: 1,
        })
        
        if (paymentMethods.data.length > 0) {
          paymentMethodId = paymentMethods.data[0].id
          console.log(`💳 [CANCELED-REACTIVATION] Found attached payment method: ${paymentMethodId}`)
        }
      }
      
      if (!paymentMethodId) {
        console.log(`⚠️ [CANCELED-REACTIVATION] No payment method found`)
        console.log(`⚠️ [CANCELED-REACTIVATION] User must enter new payment method`)
        // No payment method saved - signal frontend to switch to new payment method
        throw new Error('NO_PAYMENT_METHOD')
      }
      
      console.log(`💳 [CANCELED-REACTIVATION] Using payment method: ${paymentMethodId}`)
      console.log(`💳 [CANCELED-REACTIVATION] Creating new subscription with existing payment method`)
      
      // Create new subscription with existing payment method
      const newSubscription = await stripe.subscriptions.create({
        customer: ctx.stripeCustomerId,
        items: [{ price: ctx.priceId }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
      })
      
      console.log(`✅ [CANCELED-REACTIVATION] New subscription created: ${newSubscription.id}`)
      console.log(`✅ [CANCELED-REACTIVATION] Status: ${newSubscription.status}`)
      
      return newSubscription
    }
    
    // Check if this is the initial request (deferred mode) or payment submission with new card
    if (ctx.useExistingPaymentMethod !== false) {
      console.log(`💳 [CANCELED-REACTIVATION] Returning deferred mode (initial page load)`)
      console.log(`💳 [CANCELED-REACTIVATION] Client will show payment form in setup mode`)
      return {
        subscriptionId: null,
        clientSecret: null,
        amount: ctx.amount,
        currency: ctx.currency.toUpperCase(),
        planName: PRICING_PLANS[ctx.planId].name,
        isUpgrade: false,
        isTrialConversion: false,
        paymentRequired: true,
        deferredMode: true,
        useSetupMode: true,
      } as SubscriptionResult
    }
    
    // Payment submission with new card - create SetupIntent to collect payment method
    console.log(`💳 [CANCELED-REACTIVATION] User submitted new payment - creating SetupIntent`)
    console.log(`💳 [CANCELED-REACTIVATION] Customer: ${ctx.stripeCustomerId}`)
    const setupIntent = await stripe.setupIntents.create({
      customer: ctx.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      usage: 'off_session',
      metadata: {
        userId: ctx.userId,
        type: 'canceled_subscription_reactivation',
        oldSubscriptionId: existingSubscriptionId,
        planId: ctx.planId,
        interval: ctx.interval,
        priceId: ctx.priceId,
      },
    })
    
    console.log(`✅ [CANCELED-REACTIVATION] SetupIntent created: ${setupIntent.id}`)
    console.log(`✅ [CANCELED-REACTIVATION] Client secret: ${setupIntent.client_secret?.slice(0, 20)}...`)
    console.log(`✅ [CANCELED-REACTIVATION] Metadata:`, JSON.stringify(setupIntent.metadata, null, 2))
    console.log(`✅ [CANCELED-REACTIVATION] Waiting for webhook setup_intent.succeeded...`)
    
    return {
      subscriptionId: null,
      clientSecret: setupIntent.client_secret,
      amount: ctx.amount,
      currency: ctx.currency.toUpperCase(),
      planName: PRICING_PLANS[ctx.planId].name,
      isUpgrade: false,
      isTrialConversion: false,
      paymentRequired: true,
    } as SubscriptionResult
  }

  if (isCanceledOrExpired) {
    // For incomplete_expired (expired trials), don't cleanup - Stripe already handled it
    // Just create a new subscription
    const skipCleanup = stripeSubscription.status === 'incomplete_expired'
    if (!skipCleanup) {
      await cleanupOrphanedSubscriptions(ctx.stripeCustomerId)
      console.log(`✅ Cleaned up orphaned subscriptions for canceled subscription`)
    } else {
      console.log(`✅ Expired trial detected - creating new subscription without cleanup`)
    }
    return await createPaidSubscription(ctx, skipCleanup)
  }

  const subscriptionItems = stripeSubscription.items.data
  const firstItemId = subscriptionItems[0]?.id

  return await stripe.subscriptions.update(existingSubscriptionId, {
    items: [{ id: firstItemId, price: ctx.priceId }],
    payment_behavior: 'allow_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId: ctx.userId,
      planId: ctx.planId,
      interval: ctx.interval,
      type: 'subscription_reactivation',
    },
  })
}

/**
 * Creates a new paid subscription (after expired trial)
 * @param skipCleanup - Skip cleanup for expired trials that Stripe already handled
 */
export async function createPaidSubscription(
  ctx: SubscriptionContext,
  skipCleanup = false
): Promise<Stripe.Subscription> {
  console.log(`💰 Creating paid subscription (no trial) for user ${ctx.userId}`)

  if (!skipCleanup) {
    await cleanupOrphanedSubscriptions(ctx.stripeCustomerId)
  }

  const subscription = await stripe.subscriptions.create({
    customer: ctx.stripeCustomerId,
    items: [{ price: ctx.priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      payment_method_types: ['card'],
    },
    collection_method: 'charge_automatically',
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId: ctx.userId,
      planId: ctx.planId,
      interval: ctx.interval,
      type: 'paid_subscription_after_trial',
    },
  })

  // If no payment_intent was created (because no default payment method),
  // finalize the invoice to create the payment intent
  const invoice = subscription.latest_invoice
  console.log(`🔍 Checking invoice for payment_intent creation`)
  console.log(`🔍 Has invoice: ${!!invoice}`)
  console.log(`🔍 Invoice type: ${typeof invoice}`)
  
  if (invoice && typeof invoice === 'object') {
    const invoiceData = invoice as any
    console.log(`🔍 Invoice status: ${invoiceData.status}`)
    console.log(`🔍 Has payment_intent: ${!!invoiceData.payment_intent}`)
    console.log(`🔍 Amount due: ${invoiceData.amount_due}`)
    
    // If no payment intent exists and there's an amount due
    if (!invoiceData.payment_intent && invoiceData.amount_due > 0) {
      if (invoiceData.status === 'draft') {
        console.log(`💳 Finalizing draft invoice ${invoiceData.id} to create PaymentIntent`)
        
        // Finalize the invoice - this will create the payment_intent
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceData.id, {
          auto_advance: false, // Don't auto-charge, wait for user to submit payment
        })
        
        console.log(`✅ Invoice finalized with PaymentIntent: ${(finalizedInvoice as any).payment_intent}`)
        
        // Re-fetch subscription with the payment_intent
        return await stripe.subscriptions.retrieve(subscription.id, {
          expand: ['latest_invoice.payment_intent'],
        })
      } else if (invoiceData.status === 'open') {
        // Invoice is already finalized (open) but has no payment_intent
        // This happens with payment_behavior: 'default_incomplete' and no default payment method
        console.log(`💳 Open invoice without PaymentIntent detected`)
        console.log(`💡 This is expected for reactivation without saved payment method`)
        console.log(`⏭️ Frontend will collect payment and complete subscription`)
        // Don't do anything - return the subscription as-is
        // The subscription will remain 'incomplete' until payment is collected via frontend
      }
    } else {
      console.log(`⏭️ Skipping PaymentIntent creation - already exists or amount is 0`)
    }
  } else {
    console.log(`⏭️ No invoice object to finalize`)
  }

  return subscription
}

/**
 * Returns deferred mode response (no subscription created)
 */
export function createDeferredResponse(ctx: SubscriptionContext): SubscriptionResult {
  console.log(`💳 Returning deferred mode (waiting for payment)`)
  
  return {
    subscriptionId: null,
    clientSecret: null,
    amount: ctx.amount,
    currency: ctx.currency.toUpperCase(),
    planName: PRICING_PLANS[ctx.planId].name,
    isUpgrade: false,
    isTrialConversion: false,
    paymentRequired: true,
    deferredMode: true,
  }
}

/**
 * Extracts client secret from subscription
 */
export function extractClientSecret(
  subscription: Stripe.Subscription,
  isTrialConversion: boolean,
  isUpgrade: boolean
): string | null {
  const invoice = subscription.latest_invoice
  const paymentIntent =
    invoice && typeof invoice === 'object' && 'payment_intent' in invoice
      ? invoice.payment_intent
      : null

  console.log(`🔍 [EXTRACT-SECRET] Checking for client secret`)
  console.log(`🔍 [EXTRACT-SECRET] Has latest_invoice: ${!!invoice}`)
  console.log(`🔍 [EXTRACT-SECRET] Has payment_intent: ${!!paymentIntent}`)

  const clientSecret =
    paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent
      ? (paymentIntent.client_secret as string | null)
      : null

  console.log(`🔍 [EXTRACT-SECRET] Client secret found: ${!!clientSecret}`)

  if (clientSecret) {
    const context = isTrialConversion ? 'trial conversion' : isUpgrade ? 'upgrade' : 'new subscription'
    console.log(`✅ [EXTRACT-SECRET] Using PaymentIntent for ${context}`)
  }

  return clientSecret
}

/**
 * Creates SetupIntent for trial subscriptions without existing client secret
 */
export async function createTrialSetupIntent(
  ctx: SubscriptionContext,
  subscriptionId: string
): Promise<string | null> {
  console.log(`💳 Creating SetupIntent for trial subscription`)

  const setupIntent = await stripe.setupIntents.create({
    customer: ctx.stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    usage: 'off_session',
    metadata: {
      subscriptionId,
      userId: ctx.userId,
      type: 'trial_subscription',
      planId: ctx.planId,
      interval: ctx.interval,
    },
  })

  console.log(`✅ Created SetupIntent ${setupIntent.id}`)
  return setupIntent.client_secret
}

/**
 * Stores subscription in database
 */
export async function storeSubscriptionInDatabase(
  ctx: SubscriptionContext,
  subscription: Stripe.Subscription
): Promise<void> {
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
  const trialEnd = subPeriods.trial_end || 0

  console.log(`💾 [STORE-SUBSCRIPTION] Starting database storage`)
  console.log(`💾 [STORE-SUBSCRIPTION] Stripe subscription status: ${subscription.status}`)
  console.log(`💾 [STORE-SUBSCRIPTION] Subscription ID: ${subscription.id}`)

  let dbStatus = subscription.status
  if (subscription.status === 'active' || subscription.status === 'incomplete_expired') {
    dbStatus = 'active'
  } else if (subscription.status === 'trialing') {
    dbStatus = 'trialing'
  } else {
    dbStatus = 'incomplete'
  }

  console.log(`💾 [STORE-SUBSCRIPTION] Mapped DB status: ${dbStatus}`)

  const paymentMethodDetails =
    subscription.default_payment_method || dbStatus === 'active'
      ? await getPaymentMethodDetails(subscription.id)
      : null

  console.log(`💾 [STORE-SUBSCRIPTION] Has payment method: ${!!paymentMethodDetails}`)

  await prisma.subscription.upsert({
    where: { userId: ctx.userId },
    update: {
      id: subscription.id,
      planId: ctx.planId,
      priceId: ctx.priceId,
      interval: ctx.interval,
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
      userId: ctx.userId,
      planId: ctx.planId,
      priceId: ctx.priceId,
      interval: ctx.interval,
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

  console.log(`✅ [STORE-SUBSCRIPTION] Database upsert completed with status: ${dbStatus}`)
  console.log(`✅ [STORE-SUBSCRIPTION] User ID: ${ctx.userId}, Subscription ID: ${subscription.id}`)
}

/**
 * Sends appropriate subscription emails
 */
export async function sendSubscriptionEmails(
  ctx: SubscriptionContext,
  subscription: Stripe.Subscription,
  isUpgrade: boolean
): Promise<void> {
  try {
    const locale = await getUserLocale(ctx.userId)
    const userName = ctx.userEmail.split('@')[0]
    const status = subscription.status === 'trialing' ? 'trialing' : subscription.status === 'active' ? 'active' : 'incomplete'

    if (status === 'trialing') {
      await sendTrialWelcomeEmail({
        to: ctx.userEmail,
        locale,
        name: userName,
        trialEndDate: formatDate(
          subscription.trial_end || Date.now() / 1000 + 14 * 24 * 60 * 60,
          locale
        ),
        dashboardUrl: `${process.env.BASE_URL}/dashboard`,
      })
      console.log('✅ Trial welcome email sent')
    }

    if (status === 'active' && !isUpgrade) {
      await sendSubscriptionConfirmationEmail({
        to: ctx.userEmail,
        locale,
        name: userName,
        planName: PRICING_PLANS[ctx.planId].name,
        planPrice: formatCurrency(ctx.amount, ctx.currency, locale),
        billingCycle: ctx.interval === 'year' ? (locale === 'fr' ? 'annuel' : 'yearly') : (locale === 'fr' ? 'mensuel' : 'monthly'),
        nextBillingDate: formatDate(
          (subscription as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          locale
        ),
        dashboardUrl: `${process.env.BASE_URL}/dashboard`,
        billingUrl: `${process.env.BASE_URL}/billing`,
      })
      console.log('✅ Subscription confirmation email sent')
    }
  } catch (emailError) {
    console.error('❌ Failed to send subscription email:', emailError)
  }
}

/**
 * Handles payment confirmation for trial conversions
 */
export async function confirmTrialConversionPayment(
  userId: string,
  subscriptionId: string,
  planId: Plan,
  interval: Interval,
  currency: Currency
): Promise<SubscriptionResult> {
  console.log(`🔁 Confirming trial conversion for ${subscriptionId}`)

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice'],
  })

  const priceData = stripeSubscription.items.data[0]
  const resolvedPriceId = priceData?.price?.id ? String(priceData.price.id) : ''
  const resolvedInterval = priceData?.price?.recurring?.interval || interval

  const resolvedDbPrice = await prisma.price.findUnique({
    where: { id: resolvedPriceId },
    include: { plan: true },
  })

  const confirmationPeriods = stripeSubscription as unknown as {
    current_period_start?: number
    current_period_end?: number
    trial_start?: number
    trial_end?: number
    cancel_at_period_end?: boolean
  }

  const currentPeriodStart =
    confirmationPeriods.current_period_start || Math.floor(Date.now() / 1000)
  const currentPeriodEnd =
    confirmationPeriods.current_period_end ||
    Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
  const trialStart = confirmationPeriods.trial_start || 0
  const trialEnd = confirmationPeriods.trial_end || 0

  let confirmationStatus = stripeSubscription.status
  if (stripeSubscription.status === 'active' || stripeSubscription.status === 'incomplete_expired') {
    confirmationStatus = 'active'
  } else if (stripeSubscription.status === 'trialing') {
    confirmationStatus = 'trialing'
  } else {
    confirmationStatus = 'incomplete'
  }

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      id: stripeSubscription.id,
      planId: resolvedDbPrice?.planId || planId,
      priceId: resolvedPriceId,
      interval: String(resolvedInterval),
      status: confirmationStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: confirmationPeriods.cancel_at_period_end || false,
      trialStart,
      trialEnd: confirmationStatus === 'active' ? 0 : trialEnd,
    },
    create: {
      id: stripeSubscription.id,
      userId,
      planId: resolvedDbPrice?.planId || planId,
      priceId: resolvedPriceId,
      interval: String(resolvedInterval),
      status: confirmationStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: confirmationPeriods.cancel_at_period_end || false,
      trialStart,
      trialEnd: confirmationStatus === 'active' ? 0 : trialEnd,
    },
  })

  console.log(`✅ Confirmed subscription ${subscriptionId}`)

  const amount = resolvedDbPrice?.amount || 0
  return {
    subscriptionId: stripeSubscription.id,
    clientSecret: null,
    amount,
    currency: (resolvedDbPrice?.currency || currency).toUpperCase(),
    planName: PRICING_PLANS[planId].name,
    isUpgrade: false,
    isTrialConversion: false,
    paymentRequired: false,
  }
}
