import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  Radio,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconArrowRight,
  IconBrandMastercard,
  IconBrandVisa,
  IconCreditCard,
  IconLock,
  IconPlus,
  IconShieldCheck,
} from '@tabler/icons-react'
import { useCallback, useRef, useState } from 'react'
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

interface UpgradePaymentProps {
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

export default function UpgradePayment({
  onSuccess,
  userPlanStatus,
  planId = PLANS.STANDARD,
  interval = INTERVALS.MONTHLY,
  currency = CURRENCIES.USD,
  config,
  billing,
}: UpgradePaymentProps) {
  const { t } = useTranslation(['payment'])

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [stripeSubmit, setStripeSubmit] = useState<(() => Promise<void>) | null>(null)
  const [isStripeReady, setIsStripeReady] = useState(false)
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'existing' | 'new'>(
    billing?.paymentMethod ? 'existing' : 'new'
  )

  // Fetcher for config only (if not provided as prop)
  const configFetcher = useFetcher<ConfigData>()

  // Fetch config if not provided
  if (!config && configFetcher.state === 'idle' && !configFetcher.data) {
    configFetcher.load('/api/config')
  }

  // Handle payment success
  const handlePaymentSuccess = async () => {
    console.log('💳 Payment succeeded, waiting for confirmed subscription update...')

    // Call onSuccess callback
    if (onSuccess) {
      onSuccess()
    }
  }

  // Handle Stripe form submission
  const handleStripeSubmitReady = useCallback(
    (submitFunction: () => Promise<void>, isReady: boolean) => {
      setStripeSubmit(() => submitFunction)
      setIsStripeReady(isReady)
    },
    []
  )

  // Handle payment processing
  const handlePayClick = async () => {
    // If using existing payment method, process upgrade directly
    if (billing?.paymentMethod && paymentMethodChoice === 'existing') {
      setIsProcessingPayment(true)
      try {
        // Call the upgrade API directly with existing payment method
        const response = await fetch('/api/subscription-upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId,
            interval,
            currency,
            useExistingPaymentMethod: true,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to upgrade subscription')
        }

        await handlePaymentSuccess()
      } catch (error) {
        console.error('Upgrade error:', error)
        setIsProcessingPayment(false)
        notifications.show({
          title: t('error', 'Error'),
          message: error instanceof Error ? error.message : 'Failed to upgrade subscription',
          color: 'red',
        })
      }
      return
    }

    // For new payment methods, use Stripe
    if (!stripeSubmit) {
      notifications.show({
        title: t('error', 'Error'),
        message: t('paymentNotReady', 'Payment form is not ready. Please try again.'),
        color: 'red',
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      await stripeSubmit()
    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessingPayment(false)
    }
  }

  // Get effective config from props or fetcher
  const effectiveConfig = config || configFetcher.data

  // Calculate pricing
  const targetPrice = getTargetPlanPrice(planId, interval, currency)
  const currentPrice = billing
    ? getCurrentPlanPrice(billing.currentPlan, billing.interval, billing.currency, billing.amount)
    : 0

  const proratedAmount =
    billing?.planStatus === 'active' || billing?.planStatus === 'trialing'
      ? calculateProratedAmount(billing, planId, interval, currency)
      : targetPrice

  const yearlySavings = getYearlySavings(planId, currency)

  return (
    <Stack gap="md">
      {/* Plan Comparison - if billing info is provided */}
      {billing && (
        <>
          {/* Plan Comparison - Compact Layout */}
          <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-default)">
            {/* Single Row Comparison */}
            <Group justify="space-between" align="center" wrap="nowrap">
              {/* Current Plan */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed" mb={2}>
                  {t('payment:currentPlan', 'Current')}
                </Text>
                <Group gap="xs" align="center">
                  <Text size="sm" fw={500} truncate>
                    {getTranslatedPlanLabel(billing.currentPlan, t)}
                  </Text>
                  {billing.planStatus === 'trialing' && (
                    <Badge size="xs" variant="light" color="orange">
                      {t('payment:trial', 'Trial')}
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  {billing.planStatus === 'trialing'
                    ? t('payment:free', 'Free')
                    : formatCurrency(
                        getCurrentPlanPrice(
                          billing.currentPlan,
                          billing.interval,
                          billing.currency,
                          billing.amount
                        ),
                        currency.toUpperCase()
                      )}{' '}
                  /{' '}
                  {billing.planStatus === 'trialing'
                    ? t('payment:trial', 'trial')
                    : billing.interval === 'month'
                      ? t('payment:month', 'month')
                      : t('payment:year', 'year')}
                </Text>
              </div>

              {/* Arrow */}
              <ThemeIcon size="md" radius="xl" variant="light" color="blue">
                <IconArrowRight size={16} />
              </ThemeIcon>

              {/* New Plan */}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <Text size="xs" c="dimmed" mb={2}>
                  {t('payment:upgradingTo', 'Upgrading to')}
                </Text>
                <Text size="sm" fw={600} truncate c="blue">
                  {getTranslatedPlanLabel(planId, t)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatCurrency(targetPrice, currency.toUpperCase())} /{' '}
                  {interval === 'month' ? t('payment:month', 'month') : t('payment:year', 'year')}
                </Text>
              </div>
            </Group>
          </Paper>

          {/* Prorated Upgrade */}
          {(billing.planStatus === 'active' || billing.planStatus === 'trialing') && (
            <Card padding="md" radius="md" withBorder bg="var(--mantine-color-default-hover)">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    {billing.planStatus === 'trialing'
                      ? t('payment:startSubscription', 'Start Subscription')
                      : t('payment:proratedUpgrade', 'Prorated Upgrade')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {billing.planStatus === 'trialing'
                      ? t(
                          'payment:proratedUpgradeTrialDescription',
                          'Pay difference for remaining period'
                        )
                      : t(
                          'payment:proratedUpgradeDescription',
                          'Pay difference for remaining billing period'
                        )}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">
                    {t('payment:dueToday', 'Due today')}
                  </Text>
                  <Text size="lg" fw={600} c="blue">
                    {formatCurrency(proratedAmount, currency.toUpperCase())}
                  </Text>
                </div>
              </Group>
            </Card>
          )}
        </>
      )}

      {/* Payment Form */}
      {effectiveConfig?.stripePublicKey ? (
        <Stack gap="lg">
          {/* Payment Method Selection */}
          {billing?.paymentMethod && (
            <Card padding="lg" radius="md" withBorder>
              <Text size="lg" fw={600} mb="md">
                {t('payment:paymentMethod', 'Payment Method')}
              </Text>

              <Radio.Group
                value={paymentMethodChoice}
                onChange={(value: string) => setPaymentMethodChoice(value as 'existing' | 'new')}
              >
                <Stack gap="md">
                  {/* Existing Payment Method Option */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Radio value="existing" />
                    <Group gap="sm" align="center" style={{ flex: 1 }}>
                      <ThemeIcon size="md" radius="md" variant="light" color="gray">
                        {billing.paymentMethod.brand === 'visa' && <IconBrandVisa size={16} />}
                        {billing.paymentMethod.brand === 'mastercard' && (
                          <IconBrandMastercard size={16} />
                        )}
                        {!['visa', 'mastercard'].includes(billing.paymentMethod.brand) && (
                          <IconCreditCard size={16} />
                        )}
                      </ThemeIcon>
                      <div>
                        <Text size="sm" fw={500}>
                          {billing.paymentMethod.brand?.charAt(0).toUpperCase() +
                            billing.paymentMethod.brand?.slice(1)}{' '}
                          •••• {billing.paymentMethod.last4}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('payment:expires', 'Expires')}{' '}
                          {String(billing.paymentMethod.expMonth).padStart(2, '0')}/
                          {billing.paymentMethod.expYear}
                        </Text>
                      </div>
                    </Group>
                  </div>

                  {/* New Payment Method Option */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Radio value="new" />
                    <Text size="sm" fw={500} style={{ flex: 1 }}>
                      {t('payment:useNewCard', 'Use a different payment method')}
                    </Text>
                  </div>

                  {/* Stripe Payment Component - show inline when new payment method is selected */}
                  {paymentMethodChoice === 'new' && (
                    <Stack gap="md" mt="xs" pl="xl">
                      <Text size="sm" fw={500} c="dimmed">
                        {t('payment:paymentDetails', 'Payment Details')}
                      </Text>
                      <StripePayment
                        publishableKey={effectiveConfig.stripePublicKey}
                        amount={proratedAmount * 100}
                        currency={currency}
                        planName={getTranslatedPlanLabel(planId, t)}
                        planId={planId}
                        interval={interval}
                        isTrialConversion={billing?.planStatus === 'trialing'}
                        onSubmitReady={handleStripeSubmitReady}
                        onSuccess={handlePaymentSuccess}
                        onError={(error) => {
                          console.error('Payment error:', error)
                          setIsProcessingPayment(false)
                          notifications.show({
                            title: t('error', 'Error'),
                            message: error,
                            color: 'red',
                          })
                        }}
                      />
                    </Stack>
                  )}
                </Stack>
              </Radio.Group>
            </Card>
          )}

          {/* Stripe Payment Component - only show if no existing payment method */}
          {!billing?.paymentMethod && (
            <Card padding="lg" radius="md" withBorder>
              <StripePayment
                publishableKey={effectiveConfig.stripePublicKey}
                amount={proratedAmount * 100}
                currency={currency}
                planName={getTranslatedPlanLabel(planId, t)}
                planId={planId}
                interval={interval}
                isTrialConversion={billing?.planStatus === 'trialing'}
                onSubmitReady={handleStripeSubmitReady}
                onSuccess={handlePaymentSuccess}
                onError={(error) => {
                  console.error('Payment error:', error)
                  setIsProcessingPayment(false)
                  notifications.show({
                    title: t('error', 'Error'),
                    message: error,
                    color: 'red',
                  })
                }}
              />
            </Card>
          )}

          {/* Pay Button */}
          <Button
            size="lg"
            fullWidth
            disabled={
              isProcessingPayment ||
              (paymentMethodChoice === 'new' && !isStripeReady) ||
              (!billing?.paymentMethod && !isStripeReady)
            }
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
      ) : (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">{t('loadingPaymentForm', 'Loading payment form...')}</Text>
          </Stack>
        </Center>
      )}
    </Stack>
  )
}
