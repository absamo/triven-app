import { ERRORS } from '~/app/common/errors'
import type { IProfile } from '~/app/common/validations/profileSchema'
import { prisma } from '~/app/db.server'
import { type Interval, PRICING_PLANS } from '~/app/modules/stripe/plans'
import { stripe } from '~/app/modules/stripe/stripe.server'

/**
 * Creates a Stripe customer for a user.
 */
export async function createCustomer({
  profile,
  email,
  userId,
}: {
  userId: string
  profile: IProfile
  email: string
}) {
  if (!userId) throw new Error(ERRORS.AUTH_USER_NOT_EXIST)

  // if (customerId) throw new Error(ERRORS.STRIPE_CUSTOMER_ALREADY_EXISTS)

  const name = `${profile?.firstName} ${profile?.lastName}`
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  })

  if (!customer) throw new Error(ERRORS.STRIPE_CUSTOMER_NOT_CREATED)

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customer.id,
    },
  })
  return {
    customerId: customer.id,
    email: customer.email,
    userId: customer.metadata.userId,
  }
}

/**
 * Creates a Stripe plans
 */
export async function createPlans() {
  const plansInit = Object.values(PRICING_PLANS).map(async ({ id, name, description, prices }) => {
    // Format prices to match Stripe's API.
    const pricesByInterval = Object.entries(prices).flatMap(([interval, price]) => {
      return Object.entries(price).map(([currency, amount]) => ({
        interval,
        currency,
        amount,
      }))
    })

    // Create Stripe product.
    await stripe.products.create({
      id,
      name,
      description: description || undefined,
    })

    // Create Stripe price for the current product.
    const stripePrices = await Promise.all(
      pricesByInterval.map((price) => {
        return stripe.prices.create({
          product: id,
          currency: price.currency,
          unit_amount: price.amount,
          tax_behavior: 'inclusive',
          recurring: {
            interval: price.interval as Interval,
          },
        })
      })
    )

    // Store product into database.
    await prisma.plan.create({
      data: {
        id,
        name,
        description,
        prices: {
          create: stripePrices.map((price) => ({
            id: price.id,
            amount: price.unit_amount ?? 0,
            currency: price.currency,
            interval: price.recurring?.interval ?? 'month',
          })),
        },
      },
    })
  })

  await Promise.all(plansInit)

  console.info(`📦 Stripe Products has been successfully created.`)
}

/**
 * Creates a Stripe subscription for a user.
 */
export async function createFreeTrialSubscription({
  userId,
  userPlan,
  planInterval,
  currency,
}: {
  userId: string
  userPlan: string
  planInterval: string
  currency: string
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.stripeCustomerId) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })
  if (subscription) return false

  // const currency = getLocaleCurrency(request)
  const plan = await prisma.plan.findUnique({
    where: { id: userPlan },
    include: { prices: true },
  })
  const currentPrice = plan?.prices.find(
    (price) => price.interval === planInterval && price.currency === currency
  )
  if (!currentPrice) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

  const stripeSubscription = await stripe.subscriptions.create({
    customer: String(user.stripeCustomerId),
    items: [{ price: currentPrice.id, quantity: planInterval === 'year' ? 12 : 1 }],
    trial_period_days: 14,
  })

  if (!stripeSubscription) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

  await prisma.subscription.create({
    data: {
      id: stripeSubscription.id,
      userId: user.id,
      planId: String(stripeSubscription.items.data[0].plan.product),
      priceId: String(stripeSubscription.items.data[0].price.id),
      interval: String(stripeSubscription.items.data[0].plan.interval),
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start,
      currentPeriodEnd: stripeSubscription.current_period_end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialStart: stripeSubscription.trial_start!,
      trialEnd: stripeSubscription.trial_end!,
    },
  })

  return stripeSubscription
}

/**
 * Creates a Stripe checkout session for activating or upgrading a paid plan.
 * This is used when converting from trial to paid or upgrading between plans.
 */
export async function createSubscriptionCheckout({
  userId,
  planId,
  planInterval,
  currency,
}: {
  userId: string
  planId: string
  planInterval: string
  currency: string
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user || !user.stripeCustomerId) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: true },
  })
  const currentPrice = plan?.prices.find(
    (price) => price.interval === planInterval && price.currency === currency
  )
  if (!currentPrice) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

  const checkout = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    line_items: [{ price: currentPrice.id, quantity: 1 }],
    mode: 'subscription',
    payment_method_types: ['card'],
    // If upgrading from trial, subscription will be updated via webhook
    success_url: `${process.env.BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/settings`,
  })

  if (!checkout) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)
  return checkout.url
}

/**
 * Lists all invoices for a subscription.
 */

export async function getAllInvoices(subscriptionId: string) {
  const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
  })
  return invoices.data
}

/**
 * Retrieves an upcoming invoice for a subscription.
 */
/**
 * Retrieves an upcoming invoice for a subscription.
 */
export async function getUpcomingInvoice(_subscriptionId: string) {
  try {
    const upcomingInvoice = await stripe.invoices.list({
      subscription: _subscriptionId,
      limit: 1,
    })
    return upcomingInvoice.data[0] || null
  } catch (error) {
    console.error('Error retrieving upcoming invoice:', error)
    return null
  }
}

/**
 * Extracts payment method details from a Stripe subscription
 */
export async function getPaymentMethodDetails(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (!subscription.default_payment_method) {
      return null
    }

    const paymentMethodId =
      typeof subscription.default_payment_method === 'string'
        ? subscription.default_payment_method
        : subscription.default_payment_method.id

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    if (paymentMethod.type === 'card' && paymentMethod.card) {
      return {
        paymentMethodId: paymentMethod.id,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      }
    }

    return null
  } catch (error) {
    console.error('Error retrieving payment method details:', error)
    return null
  }
}

/**
 * Cancels a Stripe subscription for a user.
 */
export async function cancelSubscription({
  userId,
  subscriptionId,
  cancelAtPeriodEnd = true,
  reason,
}: {
  userId: string
  subscriptionId: string
  cancelAtPeriodEnd?: boolean
  reason?: string
}) {
  // Verify that the subscription belongs to the user
  const dbSubscription = await prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
      userId: userId,
    },
  })

  if (!dbSubscription) {
    throw new Error('Subscription not found or access denied')
  }

  let stripeSubscription
  if (cancelAtPeriodEnd) {
    // Cancel at period end - user keeps access until current period expires
    stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: reason || 'user_requested',
        cancelled_by: userId,
        cancelled_at: Math.floor(Date.now() / 1000).toString(),
      },
    })
  } else {
    // Cancel immediately - user loses access now
    stripeSubscription = await stripe.subscriptions.cancel(subscriptionId, {
      prorate: true,
      invoice_now: true,
    })
  }

  // Update database with cancellation status
  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      // Track cancellation details
      cancelledAt: cancelAtPeriodEnd ? null : new Date(),
      cancelledBy: userId,
      cancellationReason: reason || null,
      scheduledCancelAt: cancelAtPeriodEnd
        ? new Date(dbSubscription.currentPeriodEnd * 1000)
        : null,
    },
  })

  return {
    subscription: updatedSubscription,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    message: cancelAtPeriodEnd
      ? 'Subscription will be cancelled at the end of current billing period'
      : 'Subscription has been cancelled immediately',
  }
}

// /**
//  * Creates a Stripe customer portal for a user.
//  */
// export async function createCustomerPortal({ userId }: { userId: string }) {
//   const user = await prisma.user.findUnique({ where: { id: userId } })
//   if (!user || !user.customerId)
//     throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

//   const customerPortal = await stripe.billingPortal.sessions.create({
//     customer: user.customerId,
//     return_url: `${HOST_URL}/dashboard/settings/billing`,
//   })
//   if (!customerPortal) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)
//   return customerPortal.url
// }
