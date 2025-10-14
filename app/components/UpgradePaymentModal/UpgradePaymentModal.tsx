import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Radio,
  Stack,
  Text,
  ThemeIcon,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconArrowRight,
  IconCreditCard,
  IconLock,
  IconPlus,
  IconShieldCheck,
} from '@tabler/icons-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { STRIPE_SUBSCRIPTION_STATUSES } from '~/app/common/constants'
import {
  calculateProratedAmount,
  formatCurrency,
  getCurrentPlanPrice,
  getTargetPlanPrice,
  getTranslatedPlanLabel,
  getYearlySavings,
} from '~/app/common/helpers/payment'
import { CURRENCIES, INTERVALS, PLANS } from '~/app/modules/stripe/plans'
import StripePayment from '../StripePayment'

interface UpgradePaymentModalProps {
  opened: boolean
  onClose: () => void
  onSuccess?: () => void
  userPlanStatus: string
  planId?: string
  interval?: string
  currency?: string
  config?: {
    stripePublicKey: string
  }
  // Billing information for plan comparison
  billing?: {
    currentPlan?: string
    planStatus?: string
    interval?: string
    currency?: string
    amount?: number
    paymentMethod?: {
      last4: string
      brand: string
      expMonth: number
      expYear: number
    } | null
  }
}

interface ConfigData {
  stripePublicKey: string
}

export default function UpgradePaymentModal({
  opened,
  onClose,
  onSuccess,
  userPlanStatus,
  planId = PLANS.STANDARD,
  interval = INTERVALS.MONTHLY,
  currency = CURRENCIES.USD,
  config,
  billing,
}: UpgradePaymentModalProps) {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation(['payment'])

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [useExistingCard, setUseExistingCard] = useState<'existing' | 'new'>('existing')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [stripeSubmit, setStripeSubmit] = useState<(() => Promise<void>) | null>(null)
  const [isStripeReady, setIsStripeReady] = useState(false)
  const hasInitializedRef = useRef(false)

  // Fetcher for config only (if not provided as prop)
  const configFetcher = useFetcher<ConfigData>()

  // Fetch config when modal opens (only if not provided as prop)
  useEffect(() => {
    if (opened && !config && configFetcher.state === 'idle' && !configFetcher.data) {
      configFetcher.load('/api/config')
    }
  }, [opened, config, configFetcher])

  // Handle payment success
  const handlePaymentSuccess = async () => {
    setIsProcessingPayment(true)

    console.log('💳 Payment succeeded, waiting for confirmed subscription update...')

    // DON'T close modal immediately - let parent handle it after confirmed SSE event
    // The Layout component will wait for the final confirmed broadcast before closing

    // Call parent success callback if provided
    // This sets pendingUpgradeRef.current = true in Layout
    if (onSuccess) {
      onSuccess()
    }

    // Keep loading state active until modal is closed by parent
    // (parent will close after receiving confirmed SSE broadcast)
  } // Handle payment error
  const handlePaymentError = (error: string) => {
    setIsProcessingPayment(false)
    console.error('Payment error:', error)

    // Show error notification to user
    notifications.show({
      title: t('payment:paymentError'),
      message: error,
      color: 'red',
      autoClose: false, // Keep open so user can read the full message
    })

    // Modal stays open so user can try again
  }

  // Handle pay button click - handles both new card and existing card scenarios
  const handlePayClick = async () => {
    setIsProcessingPayment(true)

    try {
      // Check which payment method the user selected via radio button
      if (useExistingCard === 'existing') {
        // User explicitly selected existing card - use existing payment method
        const response = await fetch('/api/subscription-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            interval,
            currency,
            useExistingPaymentMethod: true,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upgrade subscription')
        }

        // Success - trigger refresh
        await handlePaymentSuccess()
      } else {
        // User selected new card - use the Stripe form submission
        if (stripeSubmit && isStripeReady) {
          await stripeSubmit()
        } else {
          throw new Error('Please enter your payment details')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      handlePaymentError(errorMessage)
    }
  }

  // Reset state when modal closes
  const handleClose = () => {
    // Reset processing state when modal closes
    setIsProcessingPayment(false)
    onClose()
  }

  const isTrialConversion = userPlanStatus === STRIPE_SUBSCRIPTION_STATUSES.TRIALING
  const availableConfig = config || configFetcher.data
  const hasConfig = Boolean(availableConfig)

  // Check if payment method exists and is valid
  const hasPaymentMethod = Boolean(billing?.paymentMethod)
  const isCardExpired =
    hasPaymentMethod && billing?.paymentMethod
      ? (() => {
          const now = new Date()
          const expYear = billing.paymentMethod.expYear
          const expMonth = billing.paymentMethod.expMonth
          const cardExpDate = new Date(expYear, expMonth) // Month is 0-indexed, so this gives us the first day of the month after expiry
          return now >= cardExpDate
        })()
      : false

  // Determine if we should show payment form immediately
  const shouldShowFormImmediately = !hasPaymentMethod || isCardExpired

  // Initialize form visibility based on card status (only once when modal opens)
  useEffect(() => {
    if (opened && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      if (shouldShowFormImmediately) {
        setShowPaymentForm(true)
        setUseExistingCard('new')
      } else {
        setShowPaymentForm(false)
        setUseExistingCard('existing')
      }
    } else if (!opened) {
      // Reset the flag when modal closes
      hasInitializedRef.current = false
    }
  }, [opened, shouldShowFormImmediately])

  // Handle payment method selection change
  const handlePaymentMethodChange = (value: string) => {
    setUseExistingCard(value as 'existing' | 'new')
    setShowPaymentForm(value === 'new')
  }

  // Handle stripe submit function ready callback (memoized to prevent loops)
  const handleStripeSubmitReady = useCallback((submitFn: () => Promise<void>, isReady: boolean) => {
    setStripeSubmit(() => submitFn)
    setIsStripeReady(isReady)
  }, [])

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      size={billing ? 'xl' : 'lg'}
      title={t('payment', 'Payment')}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 8,
      }}
      styles={{
        content: {
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'white',
          border:
            colorScheme === 'dark'
              ? '1px solid var(--mantine-color-dark-5)'
              : '1px solid var(--mantine-color-gray-2)',
          borderRadius: '16px',
          boxShadow:
            colorScheme === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.8)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Stack gap="md">
        {/* Plan Comparison - if billing info is provided */}
        {billing && (
          <>
            {/* Plan Comparison - Compact Layout */}
            <div
              style={{
                backgroundColor:
                  colorScheme === 'dark'
                    ? 'var(--mantine-color-dark-6)'
                    : 'var(--mantine-color-gray-1)',
                borderRadius: '8px',
                padding: 'var(--mantine-spacing-sm)',
              }}
            >
              {/* Single Row Comparison */}
              <Group justify="space-between" align="center" wrap="nowrap">
                {/* Current Plan */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    Current
                  </Text>
                  <Group gap="xs" align="center">
                    <Text size="sm" fw={500} truncate>
                      {getTranslatedPlanLabel(billing.currentPlan, t)}
                    </Text>
                    {billing.planStatus === 'trialing' && (
                      <Badge size="xs" variant="light" color="orange">
                        Trial
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {billing.planStatus === 'trialing'
                      ? 'Free'
                      : formatCurrency(
                          getCurrentPlanPrice(
                            billing.currentPlan,
                            billing.interval,
                            billing.currency,
                            billing.amount
                          ),
                          currency.toUpperCase()
                        ) + `/${billing.interval}`}
                  </Text>
                </div>

                {/* Arrow */}
                <div style={{ padding: '0 var(--mantine-spacing-xs)' }}>
                  <IconArrowRight color="var(--mantine-color-dimmed)" size={25} />
                </div>

                {/* Target Plan */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    Upgrading to
                  </Text>
                  <Text size="sm" fw={600} c="blue" truncate>
                    {getTranslatedPlanLabel(planId, t)}
                  </Text>
                  <Group gap="xs" justify="flex-end">
                    <Text size="xs" fw={500}>
                      {formatCurrency(
                        getTargetPlanPrice(planId, interval, currency.toUpperCase()),
                        currency.toUpperCase()
                      )}
                      <Text span size="xs" c="dimmed">
                        /{interval}
                      </Text>
                    </Text>
                    {interval === 'year' && (
                      <Badge size="xs" variant="light" color="green">
                        Save{' '}
                        {formatCurrency(
                          getYearlySavings(planId, currency.toUpperCase()),
                          currency.toUpperCase()
                        )}
                        /yr
                      </Badge>
                    )}
                  </Group>
                </div>
              </Group>
            </div>

            {/* Billing Summary - Compact */}
            <div
              style={{
                backgroundColor:
                  colorScheme === 'dark'
                    ? 'var(--mantine-color-dark-8)'
                    : 'var(--mantine-color-blue-0)',
                borderRadius: '8px',
                padding: 'var(--mantine-spacing-sm)',
                border: `1px solid ${
                  colorScheme === 'dark'
                    ? 'var(--mantine-color-dark-5)'
                    : 'var(--mantine-color-blue-2)'
                }`,
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={600} size="sm" c="blue">
                    {billing.planStatus === 'trialing'
                      ? 'Trial Conversion'
                      : billing.planStatus === 'incomplete'
                        ? 'Complete Setup'
                        : 'Prorated Upgrade'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {billing.planStatus === 'trialing'
                      ? 'Billing starts immediately'
                      : billing.planStatus === 'incomplete'
                        ? 'Activate all features'
                        : 'Pay difference for remaining period'}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">
                    Due today
                  </Text>
                  <Text size="lg" fw={700} c="blue">
                    {formatCurrency(
                      billing.planStatus === 'trialing' || billing.planStatus === 'incomplete'
                        ? getTargetPlanPrice(planId, interval, currency.toUpperCase())
                        : calculateProratedAmount(
                            billing,
                            planId,
                            interval,
                            currency.toUpperCase()
                          ),
                      currency.toUpperCase()
                    )}
                  </Text>
                </div>
              </Group>
            </div>
          </>
        )}
        {/* Simple description when no billing info */}
        {!billing && (
          <Text size="sm" c="dimmed">
            {isTrialConversion
              ? t(
                  'convertTrialToSubscription',
                  'Convert your trial to a paid subscription to continue using Triven.'
                )
              : t('upgradeToStandard', 'Upgrade to Standard plan to continue using Triven.')}
          </Text>
        )}
        {/* Payment Method Selection - always show if has existing valid card */}
        {hasPaymentMethod && !isCardExpired && billing?.paymentMethod && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('paymentMethod', 'Payment Method')}
            </Text>
            <Radio.Group value={useExistingCard} onChange={handlePaymentMethodChange}>
              <Stack gap="8px">
                {/* Existing Card Option */}
                {(() => {
                  const paymentMethod = billing.paymentMethod
                  return (
                    <Card
                      padding="xs"
                      radius="md"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        borderColor:
                          useExistingCard === 'existing'
                            ? 'var(--mantine-color-blue-6)'
                            : undefined,
                        borderWidth: useExistingCard === 'existing' ? 2 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handlePaymentMethodChange('existing')}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs">
                          <Radio value="existing" styles={{ radio: { cursor: 'pointer' } }} />
                          <IconCreditCard size={18} />
                          <div>
                            <Text size="sm" fw={500}>
                              {paymentMethod.brand.toUpperCase()} •••• {paymentMethod.last4}
                            </Text>
                            <Text size="xs" c="dimmed" mt={-2}>
                              Expires {String(paymentMethod.expMonth).padStart(2, '0')}/
                              {paymentMethod.expYear}
                            </Text>
                          </div>
                        </Group>
                      </Group>
                    </Card>
                  )
                })()}

                {/* New Card Option */}
                <Card
                  padding="xs"
                  radius="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    borderColor:
                      useExistingCard === 'new' ? 'var(--mantine-color-blue-6)' : undefined,
                    borderWidth: useExistingCard === 'new' ? 2 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handlePaymentMethodChange('new')}
                >
                  <Group gap="xs">
                    <Radio value="new" styles={{ radio: { cursor: 'pointer' } }} />
                    <IconPlus size={18} />
                    <Text size="sm" fw={500}>
                      {t('useNewCard', 'Use a different card')}
                    </Text>
                  </Group>

                  {hasConfig && availableConfig && (
                    <div style={{ marginTop: 'var(--mantine-spacing-md)', width: '100%' }}>
                      <StripePayment
                        amount={0} // Will be calculated by StripePayment component
                        currency={currency}
                        planName={planId}
                        publishableKey={availableConfig.stripePublicKey}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        planId={planId}
                        interval={interval}
                        createPaymentPath="/api/subscription-create"
                        isTrialConversion={isTrialConversion}
                        isProcessing={isProcessingPayment}
                        onSubmitReady={handleStripeSubmitReady}
                      />
                    </div>
                  )}
                </Card>
              </Stack>
            </Radio.Group>
          </div>
        )}
        {/* Show Stripe Form directly when no payment method or card expired */}
        {hasConfig && availableConfig && (!hasPaymentMethod || isCardExpired) && (
          <StripePayment
            amount={0} // Will be calculated by StripePayment component
            currency={currency}
            planName={planId}
            publishableKey={availableConfig.stripePublicKey}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            planId={planId}
            interval={interval}
            createPaymentPath="/api/subscription-create"
            isTrialConversion={isTrialConversion}
            isProcessing={isProcessingPayment}
            onSubmitReady={handleStripeSubmitReady}
          />
        )}
        {/* Card Expired Warning */}
        {hasPaymentMethod && isCardExpired && (
          <div
            style={{
              backgroundColor:
                colorScheme === 'dark'
                  ? 'var(--mantine-color-dark-6)'
                  : 'var(--mantine-color-orange-0)',
              border: `1px solid ${
                colorScheme === 'dark'
                  ? 'var(--mantine-color-dark-4)'
                  : 'var(--mantine-color-orange-2)'
              }`,
              borderRadius: '8px',
              padding: 'var(--mantine-spacing-md)',
            }}
          >
            <Group gap="sm">
              <IconCreditCard size={20} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="sm" fw={500} c="orange">
                  {t('cardExpired', 'Card Expired')}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(
                    'cardExpiredMessage',
                    'Your payment card has expired. Please add a new card to continue.'
                  )}
                </Text>
              </div>
            </Group>
          </div>
        )}
        {/* Loading state */}
        {!hasConfig && (
          <Center p="xl">
            <Text c="dimmed">{t('loadingPayment', 'Loading payment form...')}</Text>
          </Center>
        )}
        {/* Pay Button - show when payment form is visible OR when using existing card */}
        {hasConfig && (showPaymentForm || useExistingCard === 'existing') && (
          <Stack gap="xs">
            <Button
              size="lg"
              disabled={!isStripeReady || isProcessingPayment}
              loading={isProcessingPayment}
              gradient={{ from: 'teal', to: 'blue' }}
              variant="gradient"
              leftSection={isProcessingPayment ? <Loader size="sm" /> : <IconLock size={20} />}
              onClick={handlePayClick}
              style={{ width: 'auto', minWidth: '200px', alignSelf: 'center' }}
            >
              {isProcessingPayment ? t('processing', 'Processing...') : t('pay', 'Pay')}
            </Button>

            {/* Security Notice */}
            <Group justify="center" gap="xs">
              <ThemeIcon size="sm" color="gray" variant="light">
                <IconShieldCheck size={14} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">
                {t('securePayment', 'Your payment information is secure and encrypted by Stripe')}
              </Text>
            </Group>

            {/* Additional Info */}
            <Text ta="center" size="xs" c="dimmed">
              {t(
                'cancelAnytime',
                'You can cancel your subscription at any time from your account settings'
              )}
            </Text>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}
