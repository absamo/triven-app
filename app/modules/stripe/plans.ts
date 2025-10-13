import { countriesCodes } from '~/app/common/helpers/isoCountryCurrency'

/**
 * Enumerates subscription plan names.
 * These are used as unique identifiers in both the database and Stripe dashboard.
 */
export const PLANS = {
  STANDARD: 'standard',
  PROFESSIONAL: 'professional',
  PREMIUM: 'premium',
} as const

export type Plan = (typeof PLANS)[keyof typeof PLANS]

/**
 * Enumerates billing intervals for subscription plans.
 */
export const INTERVALS = {
  MONTHLY: 'month',
  YEARLY: 'year',
} as const

export type Interval = (typeof INTERVALS)[keyof typeof INTERVALS]

/**
 * Enumerates supported currencies for billing.
 */
export const us = countriesCodes.find((c) => c.isoCode === 'US')
export const eu = countriesCodes.find((c) => c.isoCode === 'EU')

export const CURRENCIES = {
  DEFAULT: us?.currencyCode || 'USD',
  USD: us?.currencyCode || 'USD',
  EUR: eu?.currencyCode || 'EUR',
} as const

export const CURRENCY_SYMBOLS = {
  [us?.currencyCode || 'USD']: us?.symbol || '$',
  [eu?.currencyCode || 'EUR']: eu?.symbol || '€',
} as const

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES]

/**
 * Defines the structure for each subscription plan.
 *
 * Note:
 * - Running the Prisma seed will create these plans in your Stripe Dashboard and populate the database.
 * - Each plan includes pricing details for each interval and currency.
 * - Plan IDs correspond to the Stripe plan IDs for easy identification.
 * - 'name' and 'description' fields are used in Stripe Checkout and client UI.
 */

export const PRICING_PLANS = {
  [PLANS.STANDARD]: {
    id: PLANS.STANDARD,
    name: 'Standard',
    description: 'Perfect for small businesses getting started with inventory management.',
    stripeProductId: 'prod_T54FpdY2BPkF8h',
    prices: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 2900,
        [CURRENCIES.EUR]: 2900,
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 22800, // $228/year ($19/month)
        [CURRENCIES.EUR]: 22800, // €228/year (€19/month)
      },
    },
    stripePriceIds: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 'price_1S8u7jIfit45a9dxGN2AadNv',
        [CURRENCIES.EUR]: 'price_1S8u7rIfit45a9dxeh0AFHGe',
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 'price_1S8u7nIfit45a9dxTKw5hLjn',
        [CURRENCIES.EUR]: 'price_1S8u7vIfit45a9dxb2MYFPLw',
      },
    },
    inclusions: {
      orders: 500,
      users: 3,
      branches: 1,
      warehouses: 2,
    },
  },
  [PLANS.PROFESSIONAL]: {
    id: PLANS.PROFESSIONAL,
    name: 'Professional',
    description: 'For growing businesses that need advanced inventory features.',
    stripeProductId: 'prod_T54FFnxbrnWa1Q',
    prices: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 3900,
        [CURRENCIES.EUR]: 3900,
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 34800, // $348/year ($29/month)
        [CURRENCIES.EUR]: 34800, // €348/year (€29/month)
      },
    },
    stripePriceIds: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 'price_1S8u7zIfit45a9dxzb2PUwm1',
        [CURRENCIES.EUR]: 'price_1S8u89Ifit45a9dxMqvCCRdk',
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 'price_1S8u83Ifit45a9dxG99ki6ZJ',
        [CURRENCIES.EUR]: 'price_1S8u8DIfit45a9dxPQhjIGVu',
      },
    },
    inclusions: {
      orders: 1000,
      users: 10,
      branches: 2,
      warehouses: 4,
    },
  },
  [PLANS.PREMIUM]: {
    id: PLANS.PREMIUM,
    name: 'Premium',
    description: 'For organizations with advanced requirements and AI-powered insights.',
    stripeProductId: 'prod_T54GJeSj6rW8ye',
    prices: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 9900,
        [CURRENCIES.EUR]: 9900,
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 94800, // $948/year ($79/month)
        [CURRENCIES.EUR]: 94800, // €948/year (€79/month)
      },
    },
    stripePriceIds: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 'price_1S8u8HIfit45a9dxUKCTyoIm',
        [CURRENCIES.EUR]: 'price_1S8u8OIfit45a9dxZxOnKYG8',
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 'price_1S8u8KIfit45a9dxcWR8RAwB',
        [CURRENCIES.EUR]: 'price_1S8u8SIfit45a9dx7GL3OoAt',
      },
    },
    inclusions: {
      orders: -1, // Unlimited
      users: 20,
      branches: 4,
      warehouses: 8,
    },
  },
} satisfies PricingPlan

/**
 * Utility function to get the Stripe price ID for a given plan, interval, and currency.
 */
export function getStripePriceId(planId: Plan, interval: Interval, currency: Currency): string {
  return PRICING_PLANS[planId].stripePriceIds[interval][currency]
}

/**
 * Utility function to get the Stripe product ID for a given plan.
 */
export function getStripeProductId(planId: Plan): string {
  return PRICING_PLANS[planId].stripeProductId
}

/**
 * Utility function to get plan price in cents for a given interval and currency.
 */
export function getPlanPrice(planId: Plan, interval: Interval, currency: Currency): number {
  return PRICING_PLANS[planId].prices[interval][currency]
}

/**
 * A type helper defining prices for each billing interval and currency.
 */
type PriceInterval<I extends Interval = Interval, C extends Currency = Currency> = {
  [interval in I]: {
    [currency in C]: number
  }
}

/**
 * A type helper defining Stripe price IDs for each billing interval and currency.
 */
type StripePriceIds<I extends Interval = Interval, C extends Currency = Currency> = {
  [interval in I]: {
    [currency in C]: string
  }
}

/**
 * A type helper defining the structure for subscription pricing plans.
 */
type PricingPlan<T extends Plan = Plan> = {
  [key in T]: {
    id: string
    name: string
    description: string
    stripeProductId: string
    prices: PriceInterval
    stripePriceIds: StripePriceIds
    inclusions: {
      orders: number
      users: number
      branches: number
      warehouses: number
    }
  }
}
