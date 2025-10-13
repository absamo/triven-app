import { Badge, Center, Group, Modal, Stack, Text, useMantineColorScheme } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowRight } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useRevalidator } from 'react-router'
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
  const revalidator = useRevalidator()

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

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

    console.log('💳 Payment succeeded, refreshing data...')

    // Close modal first
    onClose()

    // Call parent success callback if provided
    if (onSuccess) {
      onSuccess()
    } else {
      // Default behavior: comprehensive refresh
      console.log('🔄 Triggering comprehensive data refresh...')

      // Revalidate current route data
      revalidator.revalidate()

      // Force immediate page reload to ensure all layout and route data is fresh
      // This is necessary for subscription status changes that affect the entire app
      setTimeout(() => {
        console.log('🔄 Force reloading page to ensure fresh subscription state')
        window.location.reload()
      }, 500) // Reduced timeout for faster refresh
    }

    setIsProcessingPayment(false)
  }

  // Handle payment error
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

  // Reset state when modal closes
  const handleClose = () => {
    // If payment was processing when closed, it likely means subscription is now active
    // Trigger refresh to update the UI state
    if (isProcessingPayment) {
      console.log('🔄 Modal closed after payment processing, triggering immediate refresh...')

      if (onSuccess) {
        onSuccess()
      } else {
        // Force immediate refresh when payment was in progress
        console.log('🔄 Payment was processing, force reloading for fresh subscription state')
        window.location.reload()
      }
    }

    setIsProcessingPayment(false)
    onClose()
  }

  const isTrialConversion = userPlanStatus === STRIPE_SUBSCRIPTION_STATUSES.TRIALING
  const availableConfig = config || configFetcher.data
  const hasConfig = Boolean(availableConfig)

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

        {hasConfig && availableConfig ? (
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
          />
        ) : (
          <Center p="xl">
            <Text c="dimmed">{t('loadingPayment', 'Loading payment form...')}</Text>
          </Center>
        )}
      </Stack>
    </Modal>
  )
}
