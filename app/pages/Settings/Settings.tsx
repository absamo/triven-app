import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconArrowRight,
  IconArrowUp,
  IconCreditCard,
  IconEdit,
  IconPremiumRights,
  IconX,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'
import {
  calculateProratedAmount,
  canUpgrade,
  formatCurrency,
  getCurrentPlanPrice,
  getNextPlan,
  getSubscriptionStatusLabel,
  getTargetPlanPrice,
  getTranslatedPlanLabel,
  getYearlySavings,
  shouldShowUpgrade,
} from '~/app/common/helpers/payment'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import { CancellationModal, PaymentMethodEditModal } from '~/app/components'
import StripePayment from '~/app/components/StripePayment'
import { CURRENCY_SYMBOLS, INTERVALS, PRICING_PLANS } from '~/app/modules/stripe/plans'
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
  permissions = [],
  config, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SettingsProps) {
  const { t } = useTranslation(['common', 'payment'])
  const { colorScheme } = useMantineColorScheme()
  const theme = useMantineTheme()
  const revalidator = useRevalidator()
  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]

  // Modal and payment state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)
  const [targetPlan, setTargetPlan] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Handle upgrade button click - open modal and wait for manual payment setup
  const handleUpgrade = () => {
    let nextPlanId: string | null = null

    if (billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete') {
      nextPlanId = billing?.currentPlan || 'standard'
    } else {
      const upcomingPlan = getNextPlan(billing?.currentPlan || '', billing?.planStatus)
      if (!upcomingPlan) return
      nextPlanId = upcomingPlan
    }

    if (!nextPlanId) {
      return
    }

    setTargetPlan(nextPlanId)
    setShowUpgradeModal(true)
  }

  // Payment form is shown immediately in the modal

  // No useEffect – intent will be created by StripePayment on Pay

  // Payment handlers
  const handlePaymentSuccess = async () => {
    setIsProcessingPayment(true)

    console.log('💳 Payment succeeded, refreshing settings page...')

    // Close modal first
    setShowUpgradeModal(false)
    setIsProcessingPayment(false)

    // Revalidate loader data to refresh the page with updated subscription
    revalidator.revalidate()
  }

  const handlePaymentError = (error: string) => {
    setIsProcessingPayment(false)
    notifications.show({
      title: t('paymentFailed', 'Payment Failed'),
      message: error,
      color: 'red',
    })
    setShowUpgradeModal(false)
  }

  // Handle modal close - reset all states without creating subscription
  const handleModalClose = () => {
    setShowUpgradeModal(false)
    setTargetPlan(null)
    setIsProcessingPayment(false)
  }

  // Handle cancellation success
  const handleCancellationSuccess = () => {
    // Revalidate loader data to refresh the page with updated subscription
    revalidator.revalidate()
  }

  // Determine loading state
  const isLoadingPayment = false
  const isTrialOrIncomplete =
    billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete'
  const resolvedTargetPlan = isTrialOrIncomplete
    ? targetPlan || billing?.currentPlan
    : targetPlan || getNextPlan(billing?.currentPlan || '', billing?.planStatus) || ''
  const displayTargetPlan = resolvedTargetPlan
  const displayInterval = billing?.interval || INTERVALS.MONTHLY
  const displayCurrency = (billing?.currency || 'USD').toUpperCase()
  const displayAmount = getTargetPlanPrice(displayTargetPlan, displayInterval, displayCurrency)

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
              {getTranslatedPlanLabel(billing?.currentPlan, t)} {t('payment:plan', 'plan')}
            </Text>
            <Text fz="xs" opacity={0.6}>
              {billing?.amount ? (
                <>
                  {currencySymbol}
                  {Number(billing.amount / 100).toFixed(2)}{' '}
                  {t('payment:billedEveryMonth', 'billed every month')}
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
            <Badge size="xs" variant="light" color={billing?.planStatus ? 'green' : 'gray'}>
              {billing?.planStatus
                ? getSubscriptionStatusLabel(billing.planStatus, t)
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
              {billing?.trialEnd && billing?.planStatus === 'trialing' ? (
                <>
                  {t('payment:trialEndsOn', 'Trial ends on')}{' '}
                  {dayjs(billing.trialEnd * 1000).format('MMM DD, YYYY')}
                </>
              ) : billing?.currentPeriodEnd ? (
                <>
                  {t('payment:nextInvoiceDue', 'Next invoice due on')}{' '}
                  {dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
                </>
              ) : (
                t('payment:noRenewalDate', 'No renewal date available')
              )}
            </Text>
          </Grid.Col>
          {billing?.paymentMethod && (
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
                <Group justify="space-between" align="center">
                  <div>
                    <Text fz="sm">
                      {billing.paymentMethod.brand?.toUpperCase()} ending in{' '}
                      {billing.paymentMethod.last4}
                    </Text>
                    <Text fz="xs" opacity={0.6}>
                      {t('payment:expires', 'Expires')}{' '}
                      {String(billing.paymentMethod.expMonth).padStart(2, '0')}/
                      {billing.paymentMethod.expYear}
                    </Text>
                  </div>
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="blue"
                    onClick={() => setShowPaymentEditModal(true)}
                    title={t('payment:editPaymentMethod', 'Edit Payment Method')}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Group>
              </Grid.Col>
            </>
          )}
          {shouldShowUpgrade(billing?.planStatus) &&
            canUpgrade(billing?.currentPlan || '', billing?.planStatus) && (
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
                    loading={isLoadingPayment}
                    onClick={handleUpgrade}
                  >
                    {(() => {
                      if (
                        billing?.planStatus === 'trialing' ||
                        billing?.planStatus === 'incomplete'
                      ) {
                        return `${t('payment:subscribe')} ${getTranslatedPlanLabel(billing?.currentPlan, t)}`
                      } else {
                        const nextPlan = getNextPlan(
                          billing?.currentPlan || '',
                          billing?.planStatus
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
          {billing?.subscriptionId && billing?.planStatus === 'active' && (
            <>
              <Grid.Col span={12}>
                <Divider />
              </Grid.Col>
              <Grid.Col span={2}>
                <Text fz="xs" opacity={0.6}>
                  {billing?.cancelAtPeriodEnd
                    ? t('subscriptionEnding', 'Subscription Ending')
                    : t('cancelSubscription', 'Cancel Subscription')}
                </Text>
              </Grid.Col>
              <Grid.Col span={10}>
                {billing?.cancelAtPeriodEnd ? (
                  <div>
                    <Text fz="sm" c="orange" mb={4}>
                      {t(
                        'subscriptionScheduledForCancellation',
                        'Subscription scheduled for cancellation'
                      )}
                    </Text>
                    <Text fz="xs" opacity={0.6}>
                      {t('accessUntil', 'You will have access until')}{' '}
                      {dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
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
      <Modal
        opened={showUpgradeModal}
        onClose={handleModalClose}
        centered
        size="xl"
        title={t('payment:payment', 'Payment')}
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
            maxHeight: '90vh',
          },
          body: {
            padding: 0,
          },
        }}
      >
        <Stack gap="md" p="md">
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
                    {getTranslatedPlanLabel(billing?.currentPlan, t)}
                  </Text>
                  {billing?.planStatus === 'trialing' && (
                    <Badge size="xs" variant="light" color="orange">
                      Trial
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  {billing?.planStatus === 'trialing'
                    ? 'Free'
                    : formatCurrency(
                        getCurrentPlanPrice(
                          billing?.currentPlan,
                          billing?.interval,
                          billing?.currency,
                          billing?.amount
                        ),
                        displayCurrency
                      ) + `/${billing?.interval}`}
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
                  {getTranslatedPlanLabel(displayTargetPlan, t)}
                </Text>
                <Group gap="xs" justify="flex-end">
                  <Text size="xs" fw={500}>
                    {formatCurrency(
                      getTargetPlanPrice(
                        displayTargetPlan,
                        displayInterval,
                        displayCurrency,
                        displayAmount
                      ),
                      displayCurrency
                    )}
                    <Text span size="xs" c="dimmed">
                      /{displayInterval}
                    </Text>
                  </Text>
                  {displayInterval === 'year' && (
                    <Badge size="xs" variant="light" color="green">
                      Save{' '}
                      {formatCurrency(
                        getYearlySavings(displayTargetPlan, displayCurrency),
                        displayCurrency
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
                  {billing?.planStatus === 'trialing'
                    ? 'Trial Conversion'
                    : billing?.planStatus === 'incomplete'
                      ? 'Complete Setup'
                      : 'Prorated Upgrade'}
                </Text>
                <Text size="xs" c="dimmed">
                  {billing?.planStatus === 'trialing'
                    ? 'Billing starts immediately'
                    : billing?.planStatus === 'incomplete'
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
                    billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete'
                      ? displayAmount
                      : calculateProratedAmount(
                          billing,
                          displayTargetPlan,
                          displayInterval,
                          displayCurrency
                        ),
                    displayCurrency
                  )}
                </Text>
              </div>
            </Group>
          </div>

          {/* Payment Section */}

          {config ? (
            <StripePayment
              amount={displayAmount}
              currency={displayCurrency}
              planName={displayTargetPlan}
              publishableKey={config.stripePublicKey}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              planId={displayTargetPlan}
              interval={displayInterval}
              createPaymentPath={'/api/subscription-create'}
              subscriptionId={billing?.subscriptionId}
              isTrialConversion={billing?.planStatus === 'trialing'}
              isProcessing={isProcessingPayment}
            />
          ) : (
            <Text c="red" size="sm" ta="center">
              {t(
                'missingPaymentConfiguration',
                'Unable to load payment form. Please contact support.'
              )}
            </Text>
          )}
        </Stack>
      </Modal>

      {/* Cancellation Modal */}
      {billing?.subscriptionId && (
        <CancellationModal
          isOpen={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          onSuccess={handleCancellationSuccess}
          subscription={{
            id: billing.subscriptionId,
            planId: billing.currentPlan,
            status: billing.planStatus,
            currentPeriodEnd: billing.currentPeriodEnd,
            cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
          }}
        />
      )}

      {/* Payment Method Edit Modal */}
      {billing?.subscriptionId && config && (
        <PaymentMethodEditModal
          isOpen={showPaymentEditModal}
          onClose={() => setShowPaymentEditModal(false)}
          onSuccess={handleCancellationSuccess}
          subscription={{
            id: billing.subscriptionId,
            planId: billing.currentPlan,
            interval: billing.interval,
            amount: billing.amount,
            currency: billing.currency,
          }}
          config={config}
        />
      )}
    </>
  )
}
