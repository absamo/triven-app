import { PAYMENT_METHODS, PAYMENT_STATUSES } from '~/app/common/constants'
import { PLANS, type Plan, type Interval, type Currency, getPlanPrice, CURRENCY_SYMBOLS } from '~/app/modules/stripe/plans'

export function getPaymentMethodLabel(
  paymentMethod: string,
  t?: (key: string, fallback?: string) => string
) {
  switch (paymentMethod) {
    case PAYMENT_METHODS.BANKTRANSFER:
      return { label: t ? t('paymentsReceived:bankTransfer', 'Bank Transfer') : 'Bank Transfer' }

    case PAYMENT_METHODS.CASH:
      return { label: t ? t('paymentsReceived:cash', 'Cash') : 'Cash' }

    case PAYMENT_METHODS.CREDITCARD:
      return { label: t ? t('paymentsReceived:creditCard', 'Credit Card') : 'Credit Card' }

    case PAYMENT_METHODS.DEBITCARD:
      return { label: t ? t('paymentsReceived:debitCard', 'Debit Card') : 'Debit Card' }

    case PAYMENT_METHODS.CHEQUE:
      return { label: t ? t('paymentsReceived:cheque', 'Cheque') : 'Cheque' }

    default:
      return {}
  }
}

export function getPaymentMadeStatus(amountReceived: number, amountDue: number) {
  if (amountReceived === amountDue) {
    return PAYMENT_STATUSES.PAID
  }

  if (amountReceived < amountDue) {
    return PAYMENT_STATUSES.PARTIALLYPAID
  }

  if (amountReceived > amountDue) {
    return PAYMENT_STATUSES.OVERPAID
  }

  return PAYMENT_STATUSES.UNPAID
}

export function getPaymentStatusLabel(
  status: string | undefined,
  t?: (key: string, fallback?: string) => string
) {
  switch (status) {
    case PAYMENT_STATUSES.UNPAID:
      return { label: t ? t('paymentsReceived:unpaid', 'Unpaid') : 'Unpaid', color: 'blue' }
    case PAYMENT_STATUSES.PAID:
      return { label: t ? t('paymentsReceived:paid', 'Paid') : 'Paid', color: 'green' }
    case PAYMENT_STATUSES.PARTIALLYPAID:
      return {
        label: t ? t('paymentsReceived:partiallyPaid', 'Partially Paid') : 'Partially Paid',
        color: 'orange',
      }
    case PAYMENT_STATUSES.OVERDUE:
      return { label: t ? t('paymentsReceived:overdue', 'Overdue') : 'Overdue', color: 'red' }
    case PAYMENT_STATUSES.CANCELLED:
      return { label: t ? t('paymentsReceived:cancelled', 'Cancelled') : 'Cancelled', color: 'red' }
    case PAYMENT_STATUSES.OVERPAID:
      return { label: t ? t('paymentsReceived:overpaid', 'Overpaid') : 'Overpaid', color: 'purple' }

    default:
      return { label: t ? t('common:unknown', 'Unknown') : 'Unknown', color: 'gray' }
  }
}

// Subscription helper functions
export function getNextPlan(currentPlan: string, planStatus?: string): Plan | null {
  // If user is on trial or has incomplete subscription, they should upgrade to the same plan but paid
  if (planStatus === 'trialing' || planStatus === 'incomplete') {
    return currentPlan.toLowerCase() as Plan
  }

  // For active paid plans, upgrade to the next tier
  switch (currentPlan.toLowerCase()) {
    case PLANS.STANDARD:
      return PLANS.PROFESSIONAL
    case PLANS.PROFESSIONAL:
      return PLANS.PREMIUM
    case PLANS.PREMIUM:
    default:
      return null // Premium users can't upgrade further
  }
}

export function canUpgrade(currentPlan: string, planStatus?: string): boolean {
  const plan = currentPlan.toLowerCase()

  // Trial users can always upgrade to paid version
  if (planStatus === 'trialing') {
    return true
  }

  // Incomplete users need to complete their subscription
  if (planStatus === 'incomplete') {
    return true
  }

  // Paid users can upgrade to next tier
  return plan === PLANS.STANDARD || plan === PLANS.PROFESSIONAL
}

export function shouldShowUpgrade(planStatus: string): boolean {
  // Show upgrade for trialing users, incomplete subscriptions, or users on lower plans
  return planStatus === 'trialing' || planStatus === 'incomplete' || planStatus === 'active'
}

export function getPlanLabel(planId: string | null | undefined): string {
  if (!planId) return 'Standard'

  const plan = planId.toLowerCase()
  switch (plan) {
    case PLANS.STANDARD:
      return 'Standard'
    case PLANS.PROFESSIONAL:
      return 'Professional'
    case PLANS.PREMIUM:
      return 'Premium'
    default:
      return 'Standard'
  }
}

export function getTranslatedPlanLabel(
  planId: string | null | undefined,
  t: (key: string, fallback: string) => string
): string {
  if (!planId) return t('standard', 'Standard')

  const plan = planId.toLowerCase()
  switch (plan) {
    case PLANS.STANDARD:
      return t('standard', 'Standard')
    case PLANS.PROFESSIONAL:
      return t('professional', 'Professional')
    case PLANS.PREMIUM:
      return t('premium', 'Premium')
    default:
      return t('standard', 'Standard')
  }
}

// Billing calculation helper functions
export function getCurrentPlanPrice(
  currentPlan?: string,
  interval?: string,
  currency?: string,
  fallbackAmount?: number
): number {
  if (!currentPlan || !interval || !currency) return fallbackAmount || 0
  try {
    return getPlanPrice(
      currentPlan as Plan,
      interval as Interval,
      currency.toUpperCase() as Currency
    )
  } catch {
    return fallbackAmount || 0
  }
}

export function getTargetPlanPrice(
  targetPlan: string,
  interval: string,
  currency: string,
  fallbackAmount?: number
): number {
  try {
    return getPlanPrice(targetPlan as Plan, interval as Interval, currency as Currency)
  } catch {
    return fallbackAmount || 0
  }
}

export function calculateProratedAmount(
  billing: {
    planStatus?: string
    currentPlan?: string
    interval?: string
    currency?: string
    amount?: number
    currentPeriodStart?: number
    currentPeriodEnd?: number
  },
  targetPlan: string,
  targetInterval: string,
  targetCurrency: string
): number {
  if (billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete') {
    return getTargetPlanPrice(targetPlan, targetInterval, targetCurrency)
  }
  
  const currentPrice = getCurrentPlanPrice(
    billing?.currentPlan,
    billing?.interval,
    billing?.currency,
    billing?.amount
  )
  const targetPrice = getTargetPlanPrice(targetPlan, targetInterval, targetCurrency)
  const proratedDiff = targetPrice - currentPrice
  
  // For same-month billing, calculate prorated difference
  // This is a simplified calculation - the actual server-side calculation may differ
  if (billing?.currentPeriodEnd) {
    const now = Date.now()
    const periodEnd = billing.currentPeriodEnd * 1000
    const periodStart = billing?.currentPeriodStart ? billing.currentPeriodStart * 1000 : now
    const totalPeriod = periodEnd - periodStart
    const remainingPeriod = Math.max(0, periodEnd - now)
    const proratedRatio = totalPeriod > 0 ? remainingPeriod / totalPeriod : 0
    
    return Math.round(proratedDiff * proratedRatio)
  }
  
  return proratedDiff
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || '$'
  return `${symbol}${(amount / 100).toFixed(2)}`
}

export function getYearlySavings(planId: string, currency: string): number {
  try {
    const monthlyPrice = getPlanPrice(planId as Plan, 'month' as Interval, currency as Currency)
    const yearlyPrice = getPlanPrice(planId as Plan, 'year' as Interval, currency as Currency)
    const yearlyCostIfMonthly = monthlyPrice * 12
    const savings = yearlyCostIfMonthly - yearlyPrice
    return savings > 0 ? savings : 0
  } catch {
    return 0
  }
}
