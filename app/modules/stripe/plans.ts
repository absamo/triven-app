import { countriesCodes } from "~/app/common/helpers/isoCountryCurrency"

/**
 * Enumerates subscription plan names.
 * These are used as unique identifiers in both the database and Stripe dashboard.
 */
export const PLANS = {
  PROFESSIONAL: "professional",
  BUSINESS: "business",
  ENTERPRISE: "enterprise",
} as const

export type Plan = (typeof PLANS)[keyof typeof PLANS]

/**
 * Enumerates billing intervals for subscription plans.
 */
export const INTERVALS = {
  MONTHLY: "month",
  YEARLY: "year",
} as const

export type Interval = (typeof INTERVALS)[keyof typeof INTERVALS]

/**
 * Enumerates supported currencies for billing.
 */
export const us = countriesCodes.find((c) => c.isoCode === "US")!
export const eu = countriesCodes.find((c) => c.isoCode === "EU")!

export const CURRENCIES = {
  DEFAULT: us.currencyCode,
  USD: us.currencyCode,
  EUR: eu.currencyCode,
} as const

export const CURRENCY_SYMBOLS = {
  [us.currencyCode]: us.symbol,
  [eu.currencyCode]: eu.symbol,
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
  [PLANS.PROFESSIONAL]: {
    id: PLANS.PROFESSIONAL,
    name: "Professional",
    description: "Perfect for growing businesses ready to scale operations.",
    prices: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 7900,
        [CURRENCIES.EUR]: 7900,
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 5900,
        [CURRENCIES.EUR]: 5900,
      },
    },
    inclusions: {
      orders: 2000,
      users: 10,
      branches: 3,
      warehouses: 5,
    },
  },
  [PLANS.BUSINESS]: {
    id: PLANS.BUSINESS,
    name: "Business",
    description: "Comprehensive solution for established businesses.",
    prices: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 14900,
        [CURRENCIES.EUR]: 14900,
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 11900,
        [CURRENCIES.EUR]: 11900,
      },
    },
    inclusions: {
      orders: 10000,
      users: 25,
      branches: 10,
      warehouses: 15,
    },
  },
  [PLANS.ENTERPRISE]: {
    id: PLANS.ENTERPRISE,
    name: "Enterprise",
    description: "Enterprise-grade solution for large organizations.",
    prices: {
      [INTERVALS.MONTHLY]: {
        [CURRENCIES.USD]: 29900,
        [CURRENCIES.EUR]: 29900,
      },
      [INTERVALS.YEARLY]: {
        [CURRENCIES.USD]: 24900,
        [CURRENCIES.EUR]: 24900,
      },
    },
    inclusions: {
      orders: 100000,
      users: 100,
      branches: 50,
      warehouses: 100,
    },
  },
} satisfies PricingPlan

/**
 * A type helper defining prices for each billing interval and currency.
 */
type PriceInterval<
  I extends Interval = Interval,
  C extends Currency = Currency
> = {
    [interval in I]: {
      [currency in C]: number
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
    prices: PriceInterval
    inclusions: {
      orders: number
      users: number
      branches: number
      warehouses: number
    }
  }
}
