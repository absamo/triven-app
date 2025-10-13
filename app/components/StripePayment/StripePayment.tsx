import {
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { IconCreditCard, IconLock, IconShieldCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTranslatedPlanLabel } from '~/app/common/helpers/payment'
import classes from './StripePayment.module.css'

// We'll pass the publishable key as a prop instead of accessing env directly
const getStripePromise = (publishableKey: string) => loadStripe(publishableKey)

interface StripePaymentProps {
  // When present, render in attached-intent mode
  clientSecret?: string
  // Always required for display and for deferred mode
  amount: number
  currency: string
  planName: string
  publishableKey: string
  onSuccess: () => void
  onError: (error: string) => void
  // Deferred-mode fields (optional). If clientSecret is not provided, we will create it on submit.
  planId?: string
  interval?: string // 'month' | 'year'
  createPaymentPath?: string // endpoint to post to; defaults to '/api/subscription-create'
  subscriptionId?: string // For confirming trial conversion after payment
  isTrialConversion?: boolean // Flag to indicate trial conversion
  isProcessing?: boolean // External loading state to keep button loading
}

function PaymentForm({
  amount,
  currency,
  planName,
  onSuccess,
  onError,
  clientSecret,
  planId,
  interval,
  createPaymentPath,
  subscriptionId,
  isTrialConversion,
  isProcessing,
}: {
  amount: number
  currency: string
  planName: string
  onSuccess: () => void
  onError: (error: string) => void
  clientSecret?: string
  planId?: string
  interval?: string
  createPaymentPath?: string
  subscriptionId?: string
  isTrialConversion?: boolean
  isProcessing?: boolean
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { t } = useTranslation(['payment', 'common'])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    // First, validate the PaymentElement fields. Required for deferred flows
    const { error: submitError } = await elements.submit()
    if (submitError) {
      console.error('Payment form validation error:', submitError)
      const message = submitError.message || t('payment:paymentError')
      onError(message)
      setIsLoading(false)
      return
    }

    let secret = clientSecret

    // Deferred mode: create PaymentIntent only when user clicks Pay
    if (!secret) {
      try {
        console.log('🔄 Creating payment intent/setup intent...')
        const endpoint = createPaymentPath || '/api/subscription-create'
        // Prefer JSON to match API signature used elsewhere in the app
        const payload = {
          planId,
          interval,
          currency,
          subscriptionId, // Include subscriptionId for payment method updates
        }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to create subscription' }))
          console.error('❌ Failed to create subscription:', data)
          throw new Error(data?.error || 'Failed to create subscription')
        }

        const data = await res.json()
        console.log('📦 Received response from server:', data)

        // Check if payment is required (backend handles automatic upgrades)
        if (data.paymentRequired === false) {
          console.log('✅ Subscription processed automatically, no payment required')
          setIsLoading(false)
          onSuccess()
          return
        }

        if (!data?.clientSecret) {
          throw new Error('No client secret received from server')
        }
        secret = data.clientSecret as string
        console.log('🔑 Got client secret:', secret.split('_secret_')[0])
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('payment:paymentError')
        onError(message)
        setIsLoading(false)
        return
      }
    }

    // Check if this is a SetupIntent or PaymentIntent
    const isSetupIntent = secret.startsWith('seti_')

    let error: { message?: string } | undefined

    if (isSetupIntent) {
      // Use confirmSetup for SetupIntents (trial subscriptions)
      console.log('💳 Confirming SetupIntent for trial subscription')
      const result = await stripe.confirmSetup({
        elements,
        clientSecret: secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      })
      error = result.error

      if (result.error) {
        console.error('❌ SetupIntent confirmation error:', result.error)
      } else {
        console.log('✅ SetupIntent confirmed successfully')
      }
    } else {
      // Use confirmPayment for PaymentIntents
      console.log('💰 Confirming PaymentIntent')
      const result = await stripe.confirmPayment({
        elements,
        clientSecret: secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required',
      })
      error = result.error

      if (result.error) {
        console.error('❌ PaymentIntent confirmation error:', result.error)
      } else {
        console.log('✅ PaymentIntent confirmed successfully')
      }
    }

    setIsLoading(false)

    if (error) {
      console.error('Payment error:', error)
      onError(error.message || t('payment:paymentError'))
    } else {
      // If this is a trial conversion, confirm payment and end trial
      if (isTrialConversion && subscriptionId) {
        console.log('🎯 Confirming trial conversion for subscription:', subscriptionId)
        try {
          const endpoint = createPaymentPath || '/api/subscription-create'
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              confirmPayment: true,
              subscriptionId,
              planId,
              interval,
              currency,
            }),
          })

          // Check if request failed (e.g., server error, network error)
          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: 'Unknown error' }))
            console.error('❌ Failed to confirm subscription:', data)

            // Show error notification for API failures
            onError(
              data.error ||
                t('payment:apiError') ||
                'Failed to confirm subscription. Please ensure the webhook listener is running.'
            )
            setIsLoading(false)
            return
          }

          const data = await res.json()
          console.log('✅ Subscription confirmed:', data)
        } catch (err) {
          console.error('❌ Error confirming subscription:', err)
          // Network or parsing error - show to user
          onError(
            t('payment:networkError') ||
              'Network error while confirming subscription. Please check your connection and try again.'
          )
          setIsLoading(false)
          return
        }
      }

      // If this is a payment method update with SetupIntent, confirm it
      if (isSetupIntent && createPaymentPath === '/api/payment-method-update' && subscriptionId) {
        console.log(
          '💳 Confirming SetupIntent for payment method update:',
          secret?.split('_secret_')[0]
        )
        try {
          const setupIntentId = secret?.split('_secret_')[0] // Extract SetupIntent ID from client secret
          const res = await fetch(createPaymentPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              confirmSetupIntent: true,
              setupIntentId,
              subscriptionId,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            console.error('❌ Failed to confirm payment method update:', data)
            onError(data.error || 'Failed to update payment method')
            return
          } else {
            console.log('✅ Payment method update confirmed successfully:', data)
          }
        } catch (err) {
          console.error('❌ Error confirming payment method update:', err)
          onError('Failed to update payment method')
          return
        }
      }

      console.log('🎯 StripePayment: About to call onSuccess()')
      // Keep loading until parent onSuccess completes
      onSuccess()
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  return (
    <form onSubmit={handleSubmit} className={classes.paymentForm}>
      <Stack gap="md">
        {/* Payment Element with Button */}
        <Paper p="md" radius="md" className={classes.paymentElement}>
          <Stack gap="md">
            <PaymentElement
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'google_pay', 'apple_pay'],
                terms: {
                  card: 'never',
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto',
                  link: 'never', // This properly disables Link promotional text
                },
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={!stripe || isLoading || isProcessing}
              loading={isLoading || isProcessing}
              gradient={{ from: 'teal', to: 'blue' }}
              variant="gradient"
              className={classes.payButton}
              leftSection={
                isLoading || isProcessing ? <Loader size="sm" /> : <IconLock size={20} />
              }
            >
              {isLoading || isProcessing ? t('payment:processing') : t('payment:pay', 'Pay')}
            </Button>
          </Stack>
        </Paper>

        {/* Security Notice */}
        <Group justify="center" gap="xs" className={classes.securityNotice}>
          <ThemeIcon size="sm" color="gray" variant="light">
            <IconShieldCheck size={14} />
          </ThemeIcon>
          <Text size="xs" c="dimmed">
            {t('payment:securePayment')}
          </Text>
        </Group>

        {/* Additional Info */}
        <Text ta="center" size="xs" c="dimmed">
          {t('payment:cancelAnytime')}
        </Text>
      </Stack>
    </form>
  )
}

export default function StripePayment({
  clientSecret,
  amount,
  currency,
  planName,
  publishableKey,
  onSuccess,
  onError,
  planId,
  interval,
  createPaymentPath = '/api/subscription-create',
  subscriptionId,
  isTrialConversion,
  isProcessing = false,
}: StripePaymentProps) {
  const { colorScheme } = useMantineColorScheme()
  const stripePromise = getStripePromise(publishableKey)

  const appearance = {
    theme: (colorScheme === 'dark' ? 'night' : 'stripe') as 'night' | 'stripe',
    variables: {
      colorPrimary: '#20C5A2',
      colorBackground: colorScheme === 'dark' ? '#2e2e2e' : '#ffffff',
      colorText: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        backgroundColor: colorScheme === 'dark' ? '#404040' : '#f8f9fa',
        border: `1px solid ${colorScheme === 'dark' ? '#565656' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
      },
      '.Input:focus': {
        border: '2px solid #20C5A2',
        boxShadow: '0 0 0 1px #20C5A2',
      },
      '.Label': {
        color: colorScheme === 'dark' ? '#c1c2c5' : '#495057',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '4px',
      },
    },
  }

  const options = clientSecret
    ? {
        clientSecret,
        appearance,
      }
    : isTrialConversion || amount === 0
      ? {
          // For trial subscriptions or payment method updates: use 'setup' mode WITHOUT amount
          mode: 'setup' as const,
          currency: currency.toLowerCase(),
          appearance,
        }
      : {
          // For regular subscriptions: use 'payment' mode WITH amount
          mode: 'payment' as const,
          currency: currency.toLowerCase(),
          amount: amount,
          appearance,
        }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        amount={amount}
        currency={currency}
        planName={planName}
        onSuccess={onSuccess}
        onError={onError}
        clientSecret={clientSecret}
        planId={planId}
        interval={interval}
        createPaymentPath={createPaymentPath}
        subscriptionId={subscriptionId}
        isTrialConversion={isTrialConversion}
        isProcessing={isProcessing}
      />
    </Elements>
  )
}
