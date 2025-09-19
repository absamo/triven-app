import { useState } from "react"
import { CURRENCIES, INTERVALS, type Currency, type Interval, type Plan } from "~/app/modules/stripe/plans"

export interface UseSubscriptionOptions {
    onSuccess?: (checkoutUrl: string) => void
    onError?: (error: string) => void
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createCheckout = async (
        planId: Plan,
        interval: Interval = INTERVALS.MONTHLY,
        currency: Currency = CURRENCIES.USD
    ) => {
        setIsLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("planId", planId)
            formData.append("interval", interval)
            formData.append("currency", currency)

            const response = await fetch("/api/checkout", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create checkout session")
            }

            if (data.checkoutUrl) {
                options.onSuccess?.(data.checkoutUrl)
                // Redirect to Stripe checkout
                window.location.href = data.checkoutUrl
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
            setError(errorMessage)
            options.onError?.(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return {
        createCheckout,
        isLoading,
        error,
        clearError: () => setError(null),
    }
}

// Helper functions for pricing display
export function formatPrice(priceInCents: number, currency: Currency = CURRENCIES.USD): string {
    const price = priceInCents / 100
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    })
    return formatter.format(price)
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
    const monthlyTotal = monthlyPrice * 12
    const yearlyTotal = yearlyPrice * 12
    const savings = monthlyTotal - yearlyTotal
    return Math.round((savings / monthlyTotal) * 100)
}