import { prisma } from "~/app/db.server"
import { type Interval, PRICING_PLANS } from "~/app/modules/stripe/plans"
import { stripe } from "~/app/modules/stripe/stripe.server"
// import { getLocaleCurrency, HOST_URL } from "#app/utils/misc.server"
import { ERRORS } from "~/app/common/errors"
import { type IProfile } from "~/app/common/validations/profileSchema"

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
  const plansInit = Object.values(PRICING_PLANS).map(
    async ({ id, name, description, prices }) => {
      // Format prices to match Stripe's API.
      const pricesByInterval = Object.entries(prices).flatMap(
        ([interval, price]) => {
          return Object.entries(price).map(([currency, amount]) => ({
            interval,
            currency,
            amount,
          }))
        }
      )

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
            tax_behavior: "inclusive",
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
              interval: price.recurring?.interval ?? "month",
            })),
          },
        },
      })
    }
  )

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
  if (!user || !user.stripeCustomerId)
    throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

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
    items: [
      { price: currentPrice.id, quantity: planInterval === "year" ? 12 : 1 },
    ],
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
 * Creates a Stripe checkout session for a user.
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

  if (!user || !user.stripeCustomerId)
    throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (subscription) throw new Error(ERRORS.STRIPE_SOMETHING_WENT_WRONG)

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
    mode: "subscription",
    payment_method_types: ["card"],
    success_url: `${process.env.BASE_URL}/dashboard`,
    cancel_url: `${process.env.BASE_URL}/signup`,
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
export async function getUpcomingInvoice(subscriptionId: string) {
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    subscription: subscriptionId,
  })
  return upcomingInvoice
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
