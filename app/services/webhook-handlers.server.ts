import type Stripe from 'stripe'
import { prisma } from '~/app/db.server'
import { getPaymentMethodDetails } from '~/app/modules/stripe/queries.server'
import { stripe } from '~/app/modules/stripe/stripe.server'
import {
  formatCurrency,
  formatDate,
  getUserLocale,
  sendPaymentFailedEmail,
  sendPaymentMethodUpdateEmail,
  sendPaymentSuccessEmail,
} from '~/app/services/email.server'

interface PaymentMethodDetails {
  paymentMethodId: string
  last4: string
  brand: string
  expMonth: number
  expYear: number
}

/**
 * Handles canceled subscription reactivation by creating a new subscription
 */
export async function handleCanceledSubscriptionReactivation(
  setupIntent: Stripe.SetupIntent,
  metadata: Record<string, string | undefined>
): Promise<void> {
  const paymentMethodId = setupIntent.payment_method as string
  const customerId = setupIntent.customer as string
  
  console.log(`🔄 [WEBHOOK-HANDLER] Creating new subscription for canceled reactivation`)
  console.log(`🔄 [WEBHOOK-HANDLER] SetupIntent: ${setupIntent.id}`)
  console.log(`🔄 [WEBHOOK-HANDLER] Customer: ${customerId}`)
  console.log(`🔄 [WEBHOOK-HANDLER] Price: ${metadata.priceId}`)
  console.log(`🔄 [WEBHOOK-HANDLER] Payment method: ${paymentMethodId}`)
  console.log(`🔄 [WEBHOOK-HANDLER] Old subscription: ${metadata.oldSubscriptionId}`)
  console.log(`🔄 [WEBHOOK-HANDLER] Plan: ${metadata.planId}, Interval: ${metadata.interval}`)
  
  try {
    // Create new subscription with the payment method
    const newSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: metadata.priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    })
    
    console.log(`✅ [WEBHOOK-HANDLER] New subscription created: ${newSubscription.id}`)
    console.log(`✅ [WEBHOOK-HANDLER] Status: ${newSubscription.status}`)
    console.log(`✅ [WEBHOOK-HANDLER] Current period: ${(newSubscription as any).current_period_start} - ${(newSubscription as any).current_period_end}`)
    
    // Update database with new subscription
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    })
    
    if (!user) {
      console.error('User not found for customer:', customerId)
      return
    }
    
    // Get plan mapping
    const dbPrice = await prisma.price.findUnique({
      where: { id: metadata.priceId },
      include: { plan: true },
    })
    
    if (!dbPrice) {
      console.error('Price not found:', metadata.priceId)
      return
    }
    
    // Extract subscription periods
    const subscriptionData = newSubscription as any
    const currentPeriodStart = subscriptionData.current_period_start || Math.floor(Date.now() / 1000)
    const currentPeriodEnd = subscriptionData.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
    
    const priceId = metadata.priceId || ''
    
    // Update database
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        id: newSubscription.id,
        planId: dbPrice.planId,
        priceId,
        interval: metadata.interval || 'month',
        status: newSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        trialStart: 0,
        trialEnd: 0,
        cancelAtPeriodEnd: false,
      },
      create: {
        id: newSubscription.id,
        userId: user.id,
        planId: dbPrice.planId,
        priceId,
        interval: metadata.interval || 'month',
        status: newSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        trialStart: 0,
        trialEnd: 0,
      },
    })
    
    console.log(`✅ [WEBHOOK-HANDLER] Database updated successfully`)
    console.log(`✅ [WEBHOOK-HANDLER] User ${user.id} now has subscription ${newSubscription.id}`)
    console.log(`✅ [WEBHOOK-HANDLER] Plan: ${dbPrice.planId}, Status: ${newSubscription.status}`)
    console.log(`🎉 [WEBHOOK-HANDLER] Canceled subscription reactivation complete!`)
    
  } catch (error) {
    console.error(`❌ [WEBHOOK-HANDLER] Failed to create subscription:`, error)
    throw error
  }
}

/**
 * Handles standalone PaymentIntent success for subscriptions
 */
export async function handlePaymentIntentSuccess(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const piData = paymentIntent as unknown as { invoice?: string | null }
  const { metadata } = paymentIntent

  // Only process standalone PaymentIntents (not invoice-attached)
  if (
    !metadata?.subscriptionId ||
    metadata?.type !== 'subscription_payment' ||
    !paymentIntent.payment_method ||
    piData.invoice
  ) {
    return
  }

  const paymentMethodId = paymentIntent.payment_method as string
  const customerId = paymentIntent.customer as string

  // Ensure payment method is attached
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })
  } catch (attachError: unknown) {
    const errorMessage = attachError instanceof Error ? attachError.message : String(attachError)
    if (!errorMessage.includes('already attached')) {
      console.error(`❌ Failed to attach payment method: ${errorMessage}`)
    }
  }

  // Update subscription with payment method
  await stripe.subscriptions.update(metadata.subscriptionId, {
    default_payment_method: paymentMethodId,
  })

  console.log(`✅ Updated subscription ${metadata.subscriptionId} with payment method`)
}

/**
 * Handles payment method update via SetupIntent
 */
export async function handlePaymentMethodUpdate(
  setupIntent: Stripe.SetupIntent,
  subscriptionId: string
): Promise<void> {
  const paymentMethodId = setupIntent.payment_method as string

  // Update subscription's default payment method
  await stripe.subscriptions.update(subscriptionId, {
    default_payment_method: paymentMethodId,
  })

  // Get payment method details
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  const paymentMethodDetails = extractPaymentMethodDetails(paymentMethod)

  if (!paymentMethodDetails) return

  // Update database
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: paymentMethodDetails,
  })

  // Send email notification
  await sendPaymentMethodUpdateEmailNotification(subscriptionId, paymentMethodDetails)
  console.log(`✅ Updated payment method for subscription ${subscriptionId}`)
}

/**
 * Handles trial subscription setup
 */
export async function handleTrialSubscriptionSetup(
  setupIntent: Stripe.SetupIntent,
  subscriptionId: string,
  metadata: Record<string, string | undefined>
): Promise<void> {
  const paymentMethodId = setupIntent.payment_method as string
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Set payment method if not already set
  if (subscription.default_payment_method !== paymentMethodId) {
    await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    })
  }

  console.log(`✅ Payment method attached to subscription ${subscriptionId}`)
  console.log(`   Subscription status: ${subscription.status}`)
  console.log(`   Metadata type: ${metadata.type}`)

  // Handle trial conversion - check metadata type first, regardless of current status
  if (metadata.type === 'trial_subscription') {
    console.log(`🎯 Processing trial conversion for subscription ${subscriptionId}`)
    await convertTrialSubscription(subscriptionId, metadata)
    console.log(`✅ Trial conversion completed`)
    return
  }

  // Handle paused subscription reactivation
  if (metadata.type === 'paused_subscription_reactivation') {
    console.log(`🔄 Resuming paused subscription ${subscriptionId} after payment method setup`)
    
    try {
      // Resume the paused subscription - this creates an invoice
      const resumedSubscription = await stripe.subscriptions.resume(subscriptionId, {
        billing_cycle_anchor: 'now',
        proration_behavior: 'create_prorations',
      })
      
      console.log(`✅ Subscription resumed, status: ${resumedSubscription.status}`)
      
      // If subscription is still paused, we need to pay the generated invoice
      if (resumedSubscription.status === 'paused') {
        const latestInvoice = resumedSubscription.latest_invoice
        
        if (latestInvoice && typeof latestInvoice === 'string') {
          console.log(`💳 Paying resumption invoice ${latestInvoice}`)
          
          // Retrieve the invoice
          const invoice = await stripe.invoices.retrieve(latestInvoice, {
            expand: ['payment_intent'],
          })
          
          const invoiceData = invoice as any
          console.log(`📋 Invoice status: ${invoice.status}, has PaymentIntent: ${!!invoiceData.payment_intent}`)
          
          if (invoice.status === 'draft') {
            console.log(`📝 Finalizing draft invoice ${latestInvoice}`)
            // Finalize the draft invoice to create PaymentIntent
            await stripe.invoices.finalizeInvoice(latestInvoice, {
              auto_advance: false,
            })
            
            // Pay the invoice with the payment method
            console.log(`💳 Paying finalized invoice with payment method ${paymentMethodId}`)
            await stripe.invoices.pay(latestInvoice, {
              payment_method: paymentMethodId,
            })
            
            console.log(`✅ Resumption invoice paid, subscription should activate`)
          } else if (invoice.status === 'open') {
            // Invoice is open - pay it directly
            console.log(`💳 Paying open invoice with payment method ${paymentMethodId}`)
            await stripe.invoices.pay(latestInvoice, {
              payment_method: paymentMethodId,
            })
            
            console.log(`✅ Resumption invoice paid, subscription should activate`)
          } else {
            console.log(`ℹ️ Invoice status: ${invoice.status} - skipping payment`)
          }
        }
      } else {
        console.log(`✅ Subscription ${subscriptionId} is now ${resumedSubscription.status}`)
      }
    } catch (error) {
      console.error(`❌ Failed to resume paused subscription ${subscriptionId}:`, error)
      throw error
    }
    
    return
  }

  console.log(`✅ Setup completed for subscription ${subscriptionId}`)
}

/**
 * Handles invoice payment success
 */
export async function handleInvoicePaymentSuccess(
  invoice: Stripe.Invoice,
  subscriptionId: string
): Promise<void> {
  const customerId = invoice.customer as string
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Get plan mapping
  const priceData = stripeSubscription.items.data[0]
  const dbPrice = await prisma.price.findUnique({
    where: { id: String(priceData.price.id) },
    include: { plan: true },
  })

  const dbPlanId = dbPrice?.planId || 'standard'

  // Extract subscription periods
  const subscriptionData = stripeSubscription as any
  const currentPeriodStart = subscriptionData.current_period_start || Math.floor(Date.now() / 1000)
  const currentPeriodEnd =
    subscriptionData.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
  const trialStart = subscriptionData.trial_start || 0

  // Get payment method details
  const paymentMethodDetails = await getPaymentMethodDetails(stripeSubscription.id)

  // Determine if trial should end
  const isActualPayment = invoice.amount_paid > 0 && !invoice.starting_balance
  const shouldEndTrial = isActualPayment && stripeSubscription.status === 'active'

  console.log(`💰 [WEBHOOK-INVOICE-PAID] Invoice payment success for subscription ${subscriptionId}`)
  console.log(`💰 [WEBHOOK-INVOICE-PAID] Subscription status from Stripe: ${stripeSubscription.status}`)
  console.log(`💰 [WEBHOOK-INVOICE-PAID] Amount paid: ${invoice.amount_paid}`)
  console.log(`💰 [WEBHOOK-INVOICE-PAID] Is actual payment: ${isActualPayment}`)
  console.log(`💰 [WEBHOOK-INVOICE-PAID] Should end trial: ${shouldEndTrial}`)

  // Update database
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      id: stripeSubscription.id,
      planId: dbPlanId,
      priceId: String(priceData.price.id),
      interval: String(priceData.price.recurring?.interval || 'month'),
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
      trialStart,
      trialEnd: shouldEndTrial ? 0 : subscriptionData.trial_end || 0,
      paymentMethodId: paymentMethodDetails?.paymentMethodId,
      last4: paymentMethodDetails?.last4,
      brand: paymentMethodDetails?.brand,
      expMonth: paymentMethodDetails?.expMonth,
      expYear: paymentMethodDetails?.expYear,
    },
    create: {
      id: stripeSubscription.id,
      userId: user.id,
      planId: dbPlanId,
      priceId: String(priceData.price.id),
      interval: String(priceData.price.recurring?.interval || 'month'),
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
      trialStart,
      trialEnd: shouldEndTrial ? 0 : subscriptionData.trial_end || 0,
      paymentMethodId: paymentMethodDetails?.paymentMethodId,
      last4: paymentMethodDetails?.last4,
      brand: paymentMethodDetails?.brand,
      expMonth: paymentMethodDetails?.expMonth,
      expYear: paymentMethodDetails?.expYear,
    },
  })

  console.log(`✅ [WEBHOOK-INVOICE-PAID] Database updated with status: ${stripeSubscription.status}`)

  // Send payment success email
  if (isActualPayment && invoice.amount_paid > 0) {
    await sendPaymentSuccessEmailNotification(user, dbPlanId, invoice)
  }

  console.log(`✅ [WEBHOOK-INVOICE-PAID] Invoice payment processed for subscription ${subscriptionId}`)

  // Broadcast to SSE clients when invoice is paid and subscription is active
  if (stripeSubscription.status === 'active') {
    const { broadcastSubscriptionUpdate } = await import('../routes/api.subscription-stream')
    broadcastSubscriptionUpdate({
      userId: user.id,
      status: stripeSubscription.status,
      planId: dbPlanId,
      trialEnd: shouldEndTrial ? 0 : subscriptionData.trial_end || 0,
      confirmed: true,
    })
    console.log(`📡 [WEBHOOK-INVOICE-PAID] Broadcasted confirmed active subscription to SSE clients`)
  }
}

/**
 * Handles invoice payment failure
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  subscriptionId: string
): Promise<void> {
  const customerId = invoice.customer as string
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Update subscription status
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: stripeSubscription.status,
    },
  })

  // Send failure email
  await sendPaymentFailureEmailNotification(user, subscriptionId, invoice)
  console.log(`✅ Invoice payment failure processed for subscription ${subscriptionId}`)
}

/**
 * Handles invoice payment action required
 */
export async function handleInvoicePaymentActionRequired(
  invoice: Stripe.Invoice,
  subscriptionId: string
): Promise<void> {
  const customerId = invoice.customer as string
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Update subscription status
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: stripeSubscription.status,
    },
  })

  console.log(`✅ Invoice payment action required for subscription ${subscriptionId}`)
}

/**
 * Handles subscription update events
 */
export async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  // Fetch latest subscription state
  const latestSubscription = await stripe.subscriptions.retrieve(subscription.id)

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Get plan mapping
  const updatePriceData = latestSubscription.items.data[0]
  const updateDbPrice = await prisma.price.findUnique({
    where: { id: String(updatePriceData.price.id) },
    include: { plan: true },
  })

  const updateDbPlanId = updateDbPrice?.planId || 'standard'

  // Extract subscription data
  const subscriptionData = latestSubscription as any
  const updateCurrentPeriodStart =
    subscriptionData.current_period_start || Math.floor(Date.now() / 1000)
  const updateCurrentPeriodEnd =
    subscriptionData.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)

  // Get payment method details
  const updatePaymentMethodDetails = await getPaymentMethodDetails(latestSubscription.id)

  // Check for reactivation
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })
  const wasCanceled = existingSubscription?.status === 'canceled'
  const isNowActive = latestSubscription.status === 'active'
  const isReactivation = isNowActive && !subscriptionData.cancel_at_period_end && wasCanceled

  console.log(`📋 [WEBHOOK-SUB-UPDATE] Subscription update for user ${user.id}`)
  console.log(`📋 [WEBHOOK-SUB-UPDATE] Subscription ID: ${latestSubscription.id}`)
  console.log(`📋 [WEBHOOK-SUB-UPDATE] Previous DB status: ${existingSubscription?.status || 'none'}`)
  console.log(`📋 [WEBHOOK-SUB-UPDATE] New Stripe status: ${latestSubscription.status}`)
  console.log(`📋 [WEBHOOK-SUB-UPDATE] Cancel at period end: ${subscriptionData.cancel_at_period_end}`)
  console.log(`📋 [WEBHOOK-SUB-UPDATE] Has payment method: ${!!latestSubscription.default_payment_method}`)
  if (isReactivation) {
    console.log(`📋 [WEBHOOK-SUB-UPDATE] ✅ Reactivation detected - clearing cancellation fields`)
  }

  // Update database
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      id: latestSubscription.id,
      planId: updateDbPlanId,
      priceId: String(updatePriceData.price.id),
      interval: String(updatePriceData.price.recurring?.interval || 'month'),
      status: latestSubscription.status,
      currentPeriodStart: updateCurrentPeriodStart,
      currentPeriodEnd: updateCurrentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
      trialStart: subscriptionData.trial_start || 0,
      trialEnd: latestSubscription.status === 'active' ? 0 : subscriptionData.trial_end || 0,
      paymentMethodId: updatePaymentMethodDetails?.paymentMethodId,
      last4: updatePaymentMethodDetails?.last4,
      brand: updatePaymentMethodDetails?.brand,
      expMonth: updatePaymentMethodDetails?.expMonth,
      expYear: updatePaymentMethodDetails?.expYear,
      ...(isReactivation && {
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        scheduledCancelAt: null,
      }),
    },
    create: {
      id: latestSubscription.id,
      userId: user.id,
      planId: updateDbPlanId,
      priceId: String(updatePriceData.price.id),
      interval: String(updatePriceData.price.recurring?.interval || 'month'),
      status: latestSubscription.status,
      currentPeriodStart: updateCurrentPeriodStart,
      currentPeriodEnd: updateCurrentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
      trialStart: subscriptionData.trial_start || 0,
      trialEnd: latestSubscription.status === 'active' ? 0 : subscriptionData.trial_end || 0,
      paymentMethodId: updatePaymentMethodDetails?.paymentMethodId,
      last4: updatePaymentMethodDetails?.last4,
      brand: updatePaymentMethodDetails?.brand,
      expMonth: updatePaymentMethodDetails?.expMonth,
      expYear: updatePaymentMethodDetails?.expYear,
    },
  })

  console.log(`✅ [WEBHOOK-SUB-UPDATE] Database updated with status: ${latestSubscription.status}`)

  // Cleanup duplicate subscriptions
  await cleanupDuplicateSubscriptions(customerId, latestSubscription)

  console.log(`✅ [WEBHOOK-SUB-UPDATE] Subscription update processed for user ${user.id}`)
}

/**
 * Handles subscription deletion
 */
export async function handleSubscriptionDeletion(
  subscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!user) {
    console.error('User not found for customer:', customerId)
    return
  }

  const dbSubscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!dbSubscription) {
    console.log(`⚠️ No subscription found in database for user ${user.id}`)
    return
  }

  console.log(`🗑️ Canceling subscription for user ${user.id}, subscription ${subscription.id}`)

  // Update status to canceled
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      id: subscription.id,
      status: 'canceled',
      cancelAtPeriodEnd: false,
      cancelledAt: new Date(),
    },
  })

  // Send cancellation email
  try {
    const { handleSubscriptionCancellation } = await import(
      '~/app/services/email-scheduler.server'
    )
    await handleSubscriptionCancellation(
      subscription.id,
      subscription.cancellation_details?.reason || 'Subscription cancelled'
    )
  } catch (emailError) {
    console.error('❌ Failed to send subscription cancellation email:', emailError)
  }

  console.log(`✅ Subscription marked as canceled for user ${user.id}`)
}

// ============================================================================
// Private Helper Functions
// ============================================================================

async function convertTrialSubscription(
  subscriptionId: string,
  metadata: Record<string, string | undefined>
): Promise<void> {
  const newPriceId = metadata.priceId
  const planId = metadata.planId

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const currentItemId = subscription.items.data[0]?.id

  if (newPriceId && currentItemId) {
    // Update subscription: change price and end trial
    console.log(`📝 Updating subscription ${subscriptionId}: price=${newPriceId}, ending trial`)
    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: currentItemId, price: newPriceId }],
      trial_end: 'now',
      proration_behavior: 'none',
    })

    // Get updated details
    const updatedSub = await stripe.subscriptions.retrieve(subscriptionId)
    const subData = updatedSub as any
    const newPrice = await stripe.prices.retrieve(newPriceId)

    // Update database
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: subData.status,
        planId,
        priceId: newPriceId,
        interval: newPrice.recurring?.interval || 'month',
        trialEnd: 0,
        currentPeriodStart: subData.current_period_start,
        currentPeriodEnd: subData.current_period_end,
      },
    })
  } else {
    // Fallback: just end trial
    await stripe.subscriptions.update(subscriptionId, {
      trial_end: 'now',
    })

    const updatedSub = await stripe.subscriptions.retrieve(subscriptionId)
    const subData = updatedSub as any

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: subData.status,
        trialEnd: 0,
        currentPeriodStart: subData.current_period_start,
        currentPeriodEnd: subData.current_period_end,
      },
    })
  }
}

function extractPaymentMethodDetails(
  paymentMethod: Stripe.PaymentMethod
): PaymentMethodDetails | null {
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return null
  }

  return {
    paymentMethodId: paymentMethod.id,
    last4: paymentMethod.card.last4,
    brand: paymentMethod.card.brand,
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year,
  }
}

async function sendPaymentMethodUpdateEmailNotification(
  subscriptionId: string,
  paymentMethodDetails: PaymentMethodDetails
): Promise<void> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    })

    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: user?.id },
      include: { plan: true },
    })

    if (!user || !userSubscription || !user.name || !userSubscription.plan?.name) {
      return
    }

    const locale = await getUserLocale(user.id)
    const subData = subscription as any

    await sendPaymentMethodUpdateEmail({
      to: user.email,
      locale,
      name: user.name,
      planName: userSubscription.plan.name,
      newPaymentMethod:
        paymentMethodDetails.brand.charAt(0).toUpperCase() + paymentMethodDetails.brand.slice(1),
      lastFour: paymentMethodDetails.last4,
      updateDate: formatDate(new Date(), locale),
      nextBillingDate: formatDate(subData.current_period_end, locale),
      amount: formatCurrency(
        subData.items.data[0].price.unit_amount || 0,
        subData.items.data[0].price.currency,
        locale
      ),
      billingUrl: `${process.env.BASE_URL}/billing`,
      supportUrl: `${process.env.BASE_URL}/support`,
    })
  } catch (error) {
    console.error('❌ Failed to send payment method update email:', error)
  }
}

async function sendPaymentSuccessEmailNotification(
  user: { id: string; email: string; name: string | null },
  planId: string,
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    const locale = await getUserLocale(user.id)
    const plan = await prisma.plan.findUnique({ where: { id: planId } })

    if (user.name && plan?.name) {
      await sendPaymentSuccessEmail({
        to: user.email,
        locale,
        name: user.name,
        planName: plan.name,
        amount: formatCurrency(invoice.amount_paid, invoice.currency, locale),
        paymentDate: formatDate(new Date(), locale),
        invoiceNumber: (invoice as any).number || invoice.id,
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        billingUrl: `${process.env.BASE_URL}/billing`,
      })
    }
  } catch (error) {
    console.error('❌ Failed to send payment success email:', error)
  }
}

async function sendPaymentFailureEmailNotification(
  user: { id: string; email: string; name: string | null },
  subscriptionId: string,
  invoice: Stripe.Invoice
): Promise<void> {
  try {
    const locale = await getUserLocale(user.id)
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    })

    if (subscription && user.name && subscription.plan?.name) {
      await sendPaymentFailedEmail({
        to: user.email,
        locale,
        name: user.name,
        planName: subscription.plan.name,
        amount: formatCurrency(invoice.amount_due, invoice.currency, locale),
        failureReason: invoice.last_finalization_error?.message || 'Payment declined',
        nextAttemptDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), locale),
        updatePaymentUrl: `${process.env.BASE_URL}/billing`,
        supportUrl: `${process.env.BASE_URL}/support`,
      })
    }
  } catch (error) {
    console.error('❌ Failed to send payment failed email:', error)
  }
}

async function cleanupDuplicateSubscriptions(
  customerId: string,
  latestSubscription: Stripe.Subscription
): Promise<void> {
  const allUserSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  })

  // Only look at truly active subscriptions
  // Don't touch incomplete_expired (expired trials), paused, or canceled - Stripe already handled those
  const activeSubscriptions = allUserSubscriptions.data.filter(
    (sub) =>
      (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') &&
      sub.id !== latestSubscription.id
  )

  if (activeSubscriptions.length === 0) return

  console.log(`⚠️ Found ${activeSubscriptions.length} other active/trialing subscription(s)`)

  for (const extraSub of activeSubscriptions) {
    // Only cancel if truly duplicate - both subscriptions actively charging or will charge
    const bothActivelyCharging =
      (latestSubscription.status === 'active' || latestSubscription.status === 'past_due') &&
      (extraSub.status === 'active' || extraSub.status === 'past_due')
    
    // Or if there's an older duplicate that was created first
    const isOlderDuplicate =
      extraSub.created < latestSubscription.created &&
      extraSub.status !== 'incomplete_expired'

    if (bothActivelyCharging || isOlderDuplicate) {
      console.log(`🗑️ Canceling duplicate subscription ${extraSub.id} (${extraSub.status})`)
      await stripe.subscriptions.cancel(extraSub.id)
    } else {
      console.log(`✅ Keeping subscription ${extraSub.id} (${extraSub.status}) - not a duplicate`)
    }
  }
}
