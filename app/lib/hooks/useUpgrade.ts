import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CURRENCIES,
  INTERVALS,
  PLANS,
  type Currency,
  type Interval,
  type Plan,
} from '~/app/modules/stripe/plans'

export interface UseUpgradeOptions {
  onSuccess?: (checkoutUrl: string) => void
  onError?: (error: string) => void
  defaultInterval?: Interval
  defaultCurrency?: Currency
}

export function useUpgrade(options: UseUpgradeOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const {
    onSuccess,
    onError,
    defaultInterval = INTERVALS.MONTHLY,
    defaultCurrency = CURRENCIES.USD,
  } = options

  const createUpgradeCheckout = async (
    planId: Plan,
    interval: Interval = defaultInterval,
    currency: Currency = defaultCurrency
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          interval,
          currency,
          trialDays: 0, // No trial for upgrades
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create upgrade checkout')
      }

      // Redirect to Stripe checkout
      const checkoutUrl = data.checkoutUrl
      if (onSuccess) {
        onSuccess(checkoutUrl)
      } else {
        window.location.href = checkoutUrl
      }

      return checkoutUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      if (onError) {
        onError(errorMessage)
      } else {
        console.error('Upgrade error:', errorMessage)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToPricing = () => {
    navigate('/pricing')
  }

  const getNextPlan = (currentPlan: string, planStatus?: string): Plan | null => {
    // If user is on trial, they should upgrade to the same plan but paid
    if (planStatus === 'trialing') {
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

  const canUpgrade = (currentPlan: string, planStatus?: string): boolean => {
    const plan = currentPlan.toLowerCase()

    // Trial users can always upgrade to paid version
    if (planStatus === 'trialing') {
      return true
    }

    // Paid users can upgrade to next tier
    return plan === PLANS.STANDARD || plan === PLANS.PROFESSIONAL
  }

  const shouldShowUpgrade = (planStatus: string): boolean => {
    // Show upgrade for trialing users or users on lower plans
    return planStatus === 'trialing' || planStatus === 'active'
  }

  return {
    createUpgradeCheckout,
    navigateToPricing,
    getNextPlan,
    canUpgrade,
    shouldShowUpgrade,
    isLoading,
  }
}
