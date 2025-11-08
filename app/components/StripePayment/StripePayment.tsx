import { Paper, useMantineColorScheme } from '@mantine/core'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import classes from './StripePayment.module.css'

// Cache for Stripe instances by publishable key
const stripePromiseCache = new Map<string, Promise<Stripe | null>>()

// Get or create a cached Stripe promise
const getStripePromise = (publishableKey: string) => {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey))
  }
  const promise = stripePromiseCache.get(publishableKey)
  if (!promise) {
    throw new Error('Failed to get Stripe promise')
  }
  return promise
}

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
  isPaymentMethodUpdate?: boolean // Flag to indicate payment method update (use setup mode)
  isProcessing?: boolean // External loading state to keep button loading
  onSubmitReady?: (submitFn: () => Promise<void>, isReady: boolean) => void // Callback to expose submit function
  useSetupMode?: boolean // Flag to force setup mode for canceled subscription reactivation
}

function PaymentForm({
  currency,
  onSuccess,
  onError,
  clientSecret,
  planId,
  interval,
  createPaymentPath,
  subscriptionId,
  isTrialConversion,
  isPaymentMethodUpdate,
  onSubmitReady,
  useSetupMode,
}: {
  currency: string
  onSuccess: () => void
  onError: (error: string) => void
  clientSecret?: string
  planId?: string
  interval?: string
  createPaymentPath?: string
  subscriptionId?: string
  isTrialConversion?: boolean
  isPaymentMethodUpdate?: boolean // Used in options for Elements mode
  onSubmitReady?: (submitFn: () => Promise<void>, isReady: boolean) => void
  useSetupMode?: boolean
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { t } = useTranslation(['payment', 'common'])

  // Store static values to prevent handleSubmit recreation
  const staticValues = useMemo(
    () => ({
      planId,
      interval,
      currency,
      subscriptionId,
      createPaymentPath: createPaymentPath || '/api/subscription-create',
      isTrialConversion: !!isTrialConversion,
      isPaymentMethodUpdate: !!isPaymentMethodUpdate,
    }),
    [
      planId,
      interval,
      currency,
      subscriptionId,
      createPaymentPath,
      isTrialConversion,
      isPaymentMethodUpdate,
    ]
  )

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault()

      if (!stripe || !elements) {
        return
      }

      // First, validate the PaymentElement fields. Required for deferred flows
      const { error: submitError } = await elements.submit()
      if (submitError) {
        console.error('Payment form validation error:', submitError)
        const message = submitError.message || t('payment:paymentError')
        onError(message)
        return
      }

      let secret = clientSecret
      let actualSubscriptionId = staticValues.subscriptionId // Track the actual subscription ID

      // Deferred mode: create PaymentIntent only when user clicks Pay
      if (!secret) {
        try {
          console.log('🔄 Creating payment intent/setup intent...')
          const endpoint = staticValues.createPaymentPath
          // Prefer JSON to match API signature used elsewhere in the app
          const payload = {
            planId: staticValues.planId,
            interval: staticValues.interval,
            currency: staticValues.currency,
            subscriptionId: staticValues.subscriptionId, // Include subscriptionId for payment method updates
            useExistingPaymentMethod: false, // Explicitly indicate we're collecting a new payment method
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

          // IMPORTANT: Update subscription ID if backend created a new subscription
          // This happens when a cancelled trial subscription is replaced with a new one
          if (data.subscriptionId) {
            actualSubscriptionId = data.subscriptionId
            console.log('🔄 Updated subscription ID from response:', actualSubscriptionId)
          }

          // Check if payment is required (backend handles automatic upgrades)
          if (data.paymentRequired === false) {
            console.log('✅ Subscription processed automatically, no payment required')
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

      if (error) {
        console.error('Payment error:', error)
        onError(error.message || t('payment:paymentError'))
      } else {
        // If this is a trial conversion, confirm payment and end trial
        if (staticValues.isTrialConversion && actualSubscriptionId) {
          console.log('🎯 Confirming trial conversion for subscription:', actualSubscriptionId)
          try {
            const endpoint = staticValues.createPaymentPath
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                confirmPayment: true,
                subscriptionId: actualSubscriptionId,
                planId: staticValues.planId,
                interval: staticValues.interval,
                currency: staticValues.currency,
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
            return
          }
        }

        // If this is a payment method update with SetupIntent, confirm it
        if (
          isSetupIntent &&
          staticValues.createPaymentPath === '/api/payment-method-update' &&
          staticValues.subscriptionId
        ) {
          console.log(
            '💳 Confirming SetupIntent for payment method update:',
            secret?.split('_secret_')[0]
          )
          try {
            const setupIntentId = secret?.split('_secret_')[0] // Extract SetupIntent ID from client secret
            const res = await fetch(staticValues.createPaymentPath, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                confirmSetupIntent: true,
                setupIntentId,
                subscriptionId: staticValues.subscriptionId,
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
    },
    // Reduced dependencies to prevent excessive re-renders
    [stripe, elements, clientSecret, onSuccess, onError, staticValues, t]
  )

  // Expose submit function to parent via callback
  useEffect(() => {
    if (onSubmitReady) {
      onSubmitReady(handleSubmit, !!(stripe && elements))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, elements])

  return (
    <Paper p={0} radius="md" className={classes.paymentElement} withBorder={false}>
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
    </Paper>
  )
}

export default function StripePayment({
  clientSecret,
  amount,
  currency,
  publishableKey,
  onSuccess,
  onError,
  planId,
  interval,
  createPaymentPath = '/api/subscription-create',
  subscriptionId,
  isTrialConversion,
  isPaymentMethodUpdate,
  onSubmitReady,
  useSetupMode,
}: StripePaymentProps) {
  const { colorScheme } = useMantineColorScheme()
  const { i18n } = useTranslation()

  // Memoize stripePromise to prevent re-creation on every render
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey])

  // Memoize appearance to prevent re-creation
  const appearance = useMemo(
    () => ({
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
    }),
    [colorScheme]
  )

  // Memoize options to prevent re-creation
  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance,
            locale: i18n.language === 'fr' ? ('fr' as const) : ('en' as const),
          }
        : isTrialConversion || isPaymentMethodUpdate || useSetupMode
          ? {
              // For trial subscriptions, payment method updates, or canceled subscription reactivation: use 'setup' mode
              mode: 'setup' as const,
              currency: currency.toLowerCase(),
              appearance,
              locale: i18n.language === 'fr' ? ('fr' as const) : ('en' as const),
            }
          : {
              // For regular subscriptions and upgrades: use 'payment' mode
              // Let the API determine the amount when creating the PaymentIntent
              mode: 'payment' as const,
              currency: currency.toLowerCase(),
              amount: amount || 100, // Minimum amount for payment mode (will be overridden by API)
              appearance,
              locale: i18n.language === 'fr' ? ('fr' as const) : ('en' as const),
            },
    [
      clientSecret,
      isTrialConversion,
      isPaymentMethodUpdate,
      useSetupMode,
      amount,
      currency,
      appearance,
      i18n.language,
    ]
  )

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        clientSecret={clientSecret}
        planId={planId}
        interval={interval}
        createPaymentPath={createPaymentPath}
        subscriptionId={subscriptionId}
        isTrialConversion={isTrialConversion}
        isPaymentMethodUpdate={isPaymentMethodUpdate}
        onSubmitReady={onSubmitReady}
        useSetupMode={useSetupMode}
      />
    </Elements>
  )
}
