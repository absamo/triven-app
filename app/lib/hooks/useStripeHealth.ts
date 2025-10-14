import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface StripeHealthStatus {
  isHealthy: boolean
  isChecking: boolean
  error?: string
}

/**
 * Hook to check Stripe API availability before opening payment modals
 * Returns a function that checks health and shows error notification if unavailable
 */
export function useStripeHealth() {
  const { t } = useTranslation(['payment'])
  const [status, setStatus] = useState<StripeHealthStatus>({
    isHealthy: true,
    isChecking: false,
  })

  const checkStripeHealth = async (): Promise<boolean> => {
    console.log('💳 [useStripeHealth] Starting health check...')
    setStatus({ isHealthy: true, isChecking: true })

    try {
      console.log('💳 [useStripeHealth] Fetching /api/stripe-health...')
      const response = await fetch('/api/stripe-health')
      const data = await response.json()
      console.log('💳 [useStripeHealth] Response:', { status: response.status, data })

      if (response.ok && data.status === 'healthy') {
        console.log('✅ [useStripeHealth] Stripe is healthy')
        setStatus({ isHealthy: true, isChecking: false })
        return true
      }

      // Stripe API is unavailable
      console.log('❌ [useStripeHealth] Stripe is unavailable')
      const errorMessage = t('stripeUnavailable')

      notifications.show({
        title: t('paymentError'),
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      })

      setStatus({
        isHealthy: false,
        isChecking: false,
        error: data.error || 'Stripe API unavailable',
      })

      return false
    } catch (error) {
      // Network error or other issue
      console.log('❌ [useStripeHealth] Error:', error)
      const errorMessage = t('connectionError')

      notifications.show({
        title: t('paymentError'),
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      })

      setStatus({
        isHealthy: false,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      })

      return false
    }
  }

  return {
    checkStripeHealth,
    isHealthy: status.isHealthy,
    isChecking: status.isChecking,
    error: status.error,
  }
}
