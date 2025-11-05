import type { Currency, Interval, Plan } from '~/app/modules/stripe/plans'

interface PlanSelection {
  planId: Plan
  interval: Interval
  currency: Currency
  trialDays: number
}

export function usePlanFromUrl(): PlanSelection | null {
  const urlParams = new URLSearchParams(window.location.search)

  const planId = urlParams.get('plan') as Plan
  const interval = urlParams.get('interval') as Interval
  const currency = urlParams.get('currency') as Currency
  const trialDays = parseInt(urlParams.get('trial') || '14')

  if (planId && interval && currency) {
    return {
      planId,
      interval,
      currency,
      trialDays,
    }
  }

  return null
}

export async function createSubscriptionAfterSignup(planSelection: PlanSelection): Promise<string> {
  const response = await fetch('/api/subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planSelection),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create subscription')
  }

  return data.checkoutUrl
}

export function usePostSignupSubscription() {
  const planSelection = usePlanFromUrl()

  const handlePostSignupSubscription = async () => {
    if (planSelection) {
      try {
        const checkoutUrl = await createSubscriptionAfterSignup(planSelection)
        // Redirect to Stripe checkout
        window.location.href = checkoutUrl
      } catch (error) {
        console.error('Failed to create subscription:', error)
        // Handle error - maybe show a notification or redirect to pricing page
      }
    }
  }

  return {
    planSelection,
    handlePostSignupSubscription,
  }
}
