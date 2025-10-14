import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Stack,
  Tabs,
  Text,
  useMantineTheme,
} from '@mantine/core'
import {
  IconArrowUp,
  IconCreditCard,
  IconEdit,
  IconPremiumRights,
  IconX,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'
import {
  canUpgrade,
  getNextPlan,
  getSubscriptionStatusLabel,
  getTranslatedPlanLabel,
  shouldShowUpgrade,
} from '~/app/common/helpers/payment'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import { CancellationModal, PaymentMethodEditModal, UpgradePaymentModal } from '~/app/components'
import { useStripeHealth } from '~/app/lib/hooks/useStripeHealth'
import { CURRENCY_SYMBOLS } from '~/app/modules/stripe/plans'
import CurrencySettings from './CurrencySettings'
import classes from './Settings.module.css'

interface SettingsProps {
  currencies: ICurrency[]
  billing: {
    subscriptionId?: string
    planStatus: string
    currentPlan: string
    interval: string
    currentPeriodStart: number
    currentPeriodEnd: number
    trialStart: number
    trialEnd: number
    cancelAtPeriodEnd: boolean
    amount: number
    currency: string
    paymentMethod?: {
      last4: string
      brand: string
      expMonth: number
      expYear: number
    } | null
    // Cancellation tracking fields
    cancelledAt?: string | null
    cancelledBy?: string | null
    cancellationReason?: string | null
    scheduledCancelAt?: string | null
  }
  permissions: string[]
  config: {
    stripePublicKey: string
  }
}

export default function Settings({
  currencies = [],
  billing,
  config, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SettingsProps) {
  const { t } = useTranslation(['common', 'payment'])
  const theme = useMantineTheme()
  const revalidator = useRevalidator()
  const { checkStripeHealth, isChecking } = useStripeHealth()

  // Translation wrapper to match expected signature
  const translate = (key: string, fallback?: string) => t(key, fallback || '')

  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)

  // Real-time subscription updates via SSE
  const eventSourceRef = useRef<EventSource | null>(null)
  const pendingUpgradeRef = useRef<boolean>(false)
  const [realTimeBilling, setRealTimeBilling] = useState(billing)

  const currencySymbol = CURRENCY_SYMBOLS[realTimeBilling?.currency?.toUpperCase()]

  useEffect(() => {
    // Prevent duplicate connections
    if (eventSourceRef.current) {
      return
    }

    // Connect to subscription SSE stream
    const eventSource = new EventSource('/api/subscription-stream')
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', () => {
      // Connected to subscription stream
    })

    eventSource.addEventListener('subscription', (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'subscription') {
          // Update billing data with new subscription status
          setRealTimeBilling((prev) => ({
            ...prev,
            planStatus: data.status,
            currentPlan: data.planId,
            trialEnd: data.trialEnd,
          }))

          // If we're waiting for upgrade completion and this is the CONFIRMED update
          if (
            pendingUpgradeRef.current &&
            data.confirmed === true &&
            data.status === 'active' &&
            data.trialEnd === 0
          ) {
            setShowUpgradeModal(false)
            pendingUpgradeRef.current = false
          }

          // Revalidate to fetch fresh data from server (including payment method updates)
          revalidator.revalidate()
        }
      } catch (error) {
        console.error('[Settings] Error parsing subscription update:', error)
      }
    })

    eventSource.onerror = () => {
      // Connection error, will reconnect automatically
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only create connection once on mount

  // Update real-time billing when prop changes (from revalidation)
  useEffect(() => {
    setRealTimeBilling(billing)
  }, [billing])

  // Handle upgrade button click - check Stripe health before opening modal
  const handleUpgrade = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowUpgradeModal(true)
    }
    // If unhealthy, the hook will show an error notification
  }

  // Handle modal close - prevent closing during pending upgrade
  const handleModalClose = () => {
    if (pendingUpgradeRef.current) {
      return
    }
    setShowUpgradeModal(false)
  }

  // Handle payment method edit - check Stripe health first
  const handleEditPaymentMethod = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowPaymentEditModal(true)
    }
  }

  // Handle upgrade success - set flag and wait for SSE event to close modal
  const handleUpgradeSuccess = () => {
    // Set flag to indicate we're waiting for the upgrade to complete
    pendingUpgradeRef.current = true

    // The modal will stay open until the SSE event arrives with confirmed: true
    // Then the subscription event handler will close the modal automatically
  }

  // Handle cancellation success
  const handleCancellationSuccess = () => {
    setShowCancellationModal(false)
    setShowPaymentEditModal(false)
    revalidator.revalidate()
  }

  const settings = [
    {
      id: 'billing',
      icon: () => <IconCreditCard color={theme.colors.blue[6]} size={17} />,
      label: t('payment:subscriptions', 'Subscriptions'),
      description: t(
        'payment:manageSubscriptions',
        'Manage your subscription and billing settings'
      ),
      content: () => (
        <Grid align="center" className={classes.row} p={10}>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('payment:yourCurrentPlan', 'Your current plan')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="sm">
              {getTranslatedPlanLabel(realTimeBilling?.currentPlan, t)} {t('payment:plan', 'plan')}
            </Text>
            <Text fz="xs" opacity={0.6}>
              {realTimeBilling?.amount ? (
                <>
                  {currencySymbol}
                  {realTimeBilling?.amount / 100} / {realTimeBilling?.interval}
                </>
              ) : (
                t('payment:noActiveBilling', 'No active billing')
              )}
            </Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('payment:status', 'Status')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Badge size="xs" variant="light" color={realTimeBilling?.planStatus ? 'green' : 'gray'}>
              {realTimeBilling?.planStatus
                ? getSubscriptionStatusLabel(realTimeBilling.planStatus, translate)
                : t('payment:noActiveSubscription', 'No Active Subscription')}
            </Badge>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('payment:renews', 'Renews')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="xs">
              {realTimeBilling?.trialEnd && realTimeBilling?.planStatus === 'trialing' ? (
                <>
                  {t('payment:trialEndsOn', 'Trial ends on')}{' '}
                  {dayjs(realTimeBilling.trialEnd * 1000).format('MMM DD, YYYY')}
                </>
              ) : realTimeBilling?.currentPeriodEnd ? (
                <>
                  {t('payment:nextInvoiceDue', 'Next invoice due on')}{' '}
                  {dayjs(realTimeBilling.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
                </>
              ) : (
                t('payment:noRenewalDate', 'No renewal date available')
              )}
            </Text>
          </Grid.Col>
          {realTimeBilling?.paymentMethod && (
            <>
              <Grid.Col span={12}>
                <Divider />
              </Grid.Col>
              <Grid.Col span={2}>
                <Text fz="xs" opacity={0.6}>
                  {t('paymentCard', 'Payment Card')}
                </Text>
              </Grid.Col>
              <Grid.Col span={10}>
                <Stack gap={0}>
                  <Group align="center" gap="md">
                    <Text fz="sm" fw={500}>
                      {realTimeBilling.paymentMethod.brand?.toUpperCase()} ending in{' '}
                      {realTimeBilling.paymentMethod.last4}
                    </Text>
                    <ActionIcon
                      size="md"
                      variant="light"
                      color="blue"
                      onClick={handleEditPaymentMethod}
                      loading={isChecking}
                      title={t('payment:editPaymentMethod', 'Edit Payment Method')}
                    >
                      <IconEdit size={12} />
                    </ActionIcon>
                  </Group>
                  <Text fz="xs" opacity={0.6}>
                    {t('payment:expires', 'Expires')}{' '}
                    {String(realTimeBilling.paymentMethod.expMonth).padStart(2, '0')}/
                    {realTimeBilling.paymentMethod.expYear}
                  </Text>
                </Stack>
              </Grid.Col>
            </>
          )}
          {shouldShowUpgrade(realTimeBilling?.planStatus) &&
            canUpgrade(realTimeBilling?.currentPlan || '', realTimeBilling?.planStatus) && (
              <>
                <Grid.Col span={12}>
                  <Divider />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Text fz="xs" opacity={0.6}>
                    {t('payment:upgrade', 'Upgrade')}
                  </Text>
                </Grid.Col>
                <Grid.Col span={10}>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconArrowUp size={14} />}
                    onClick={handleUpgrade}
                    loading={isChecking}
                  >
                    {(() => {
                      if (
                        realTimeBilling?.planStatus === 'trialing' ||
                        realTimeBilling?.planStatus === 'incomplete'
                      ) {
                        return `${t('payment:subscribe')} ${getTranslatedPlanLabel(realTimeBilling?.currentPlan, t)}`
                      } else {
                        const nextPlan = getNextPlan(
                          realTimeBilling?.currentPlan || '',
                          realTimeBilling?.planStatus
                        )
                        return nextPlan
                          ? `${t('payment:upgrade')} ${getTranslatedPlanLabel(nextPlan, t)}`
                          : t('payment:viewPlans', 'View Plans')
                      }
                    })()}
                  </Button>
                </Grid.Col>
              </>
            )}
          {/* Cancellation Section - show for active subscriptions */}
          {realTimeBilling?.subscriptionId && realTimeBilling?.planStatus === 'active' && (
            <>
              <Grid.Col span={12}>
                <Divider />
              </Grid.Col>
              <Grid.Col span={2}>
                <Text fz="xs" opacity={0.6}>
                  {realTimeBilling?.cancelAtPeriodEnd
                    ? t('subscriptionEnding', 'Subscription Ending')
                    : t('cancelSubscription', 'Cancel Subscription')}
                </Text>
              </Grid.Col>
              <Grid.Col span={10}>
                {realTimeBilling?.cancelAtPeriodEnd ? (
                  <div>
                    <Text fz="sm" c="orange" mb={4}>
                      {t(
                        'subscriptionScheduledForCancellation',
                        'Subscription scheduled for cancellation'
                      )}
                    </Text>
                    <Text fz="xs" opacity={0.6}>
                      {t('accessUntil', 'You will have access until')}{' '}
                      {dayjs(realTimeBilling.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
                    </Text>
                  </div>
                ) : (
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<IconX size={14} />}
                    onClick={() => setShowCancellationModal(true)}
                  >
                    {t('payment:cancelSubscription', 'Cancel Subscription')}
                  </Button>
                )}
              </Grid.Col>
            </>
          )}
        </Grid>
      ),
    },
    {
      id: 'currency',
      icon: () => <IconPremiumRights color={theme.colors.teal[6]} size={17} />,
      label: t('payment:currency', 'Currencies'),
      description: t('payment:manageCurrencies', 'Manage your currencies'),
      content: () => <CurrencySettings currencies={currencies} />,
    },
  ]

  return (
    <>
      <Text className={classes.title}>{t('common:title', 'Settings')}</Text>
      <Tabs defaultValue="billing" variant="outline" radius="md">
        <Tabs.List>
          {settings.map(({ id, label, icon: Icon }) => (
            <Tabs.Tab value={id} key={id} leftSection={<Icon />}>
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {settings.map(({ id, content: Content }) => (
          <Tabs.Panel value={id} key={id} pt="md">
            <Content />
          </Tabs.Panel>
        ))}
      </Tabs>

      {/* Upgrade Modal */}
      <UpgradePaymentModal
        opened={showUpgradeModal}
        onClose={handleModalClose}
        onSuccess={handleUpgradeSuccess}
        userPlanStatus={realTimeBilling?.planStatus || ''}
        planId={
          realTimeBilling?.planStatus === 'trialing' || realTimeBilling?.planStatus === 'incomplete'
            ? realTimeBilling?.currentPlan || 'standard'
            : getNextPlan(realTimeBilling?.currentPlan || '', realTimeBilling?.planStatus || '') ||
              'standard'
        }
        interval={realTimeBilling?.interval || 'month'}
        currency={(realTimeBilling?.currency || 'USD').toUpperCase()}
        config={config}
        billing={billing}
      />

      {/* Cancellation Modal */}
      {realTimeBilling?.subscriptionId && (
        <CancellationModal
          isOpen={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          onSuccess={handleCancellationSuccess}
          subscription={{
            id: realTimeBilling.subscriptionId,
            planId: realTimeBilling.currentPlan,
            status: realTimeBilling.planStatus,
            interval: realTimeBilling.interval,
            currentPeriodEnd: realTimeBilling.currentPeriodEnd,
            cancelAtPeriodEnd: realTimeBilling.cancelAtPeriodEnd,
          }}
        />
      )}

      {/* Payment Method Edit Modal */}
      {realTimeBilling?.subscriptionId && config && (
        <PaymentMethodEditModal
          isOpen={showPaymentEditModal}
          onClose={() => setShowPaymentEditModal(false)}
          onSuccess={handleCancellationSuccess}
          subscription={{
            id: realTimeBilling.subscriptionId,
            planId: realTimeBilling.currentPlan,
            interval: realTimeBilling.interval,
            amount: realTimeBilling.amount,
            currency: realTimeBilling.currency,
          }}
          config={config}
        />
      )}
    </>
  )
}
