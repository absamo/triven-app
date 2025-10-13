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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useRevalidator } from 'react-router'
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
  const navigate = useNavigate()
  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]
  const { checkStripeHealth, isChecking } = useStripeHealth()

  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)

  // Handle upgrade button click - check Stripe health before opening modal
  const handleUpgrade = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowUpgradeModal(true)
    }
    // If unhealthy, the hook will show an error notification
  }

  // Handle modal close - reset all states
  const handleModalClose = () => {
    setShowUpgradeModal(false)
  }

  // Handle payment method edit - check Stripe health first
  const handleEditPaymentMethod = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowPaymentEditModal(true)
    }
  }

  // Handle upgrade success - refresh page data
  const handleUpgradeSuccess = () => {
    console.log('🔄 Settings: Subscription upgrade successful - refreshing settings data')

    // Close the modal immediately
    setShowUpgradeModal(false)

    // Revalidate current page data
    revalidator.revalidate()

    // Force navigation refresh to ensure billing data updates
    console.log('🔄 Settings: Navigating to refresh billing information')
    setTimeout(() => {
      navigate('/settings', { replace: true })
    }, 500)
  }

  // Handle cancellation success
  const handleCancellationSuccess = () => {
    console.log('🔄 Settings: Revalidating page data after payment method/subscription change')
    // Try revalidator first
    revalidator.revalidate()

    // Fallback: Force navigation refresh if revalidator doesn't work
    setTimeout(() => {
      navigate('/settings', { replace: true })
    }, 100)
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
                <Stack gap={0}>
                  <Group align="center" gap="md">
                    <Text fz="sm" fw={500}>
                      {billing.paymentMethod.brand?.toUpperCase()} ending in{' '}
                      {billing.paymentMethod.last4}
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
                    {String(billing.paymentMethod.expMonth).padStart(2, '0')}/
                    {billing.paymentMethod.expYear}
                  </Text>
                </Stack>
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
                    onClick={handleUpgrade}
                    loading={isChecking}
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
      <UpgradePaymentModal
        opened={showUpgradeModal}
        onClose={handleModalClose}
        onSuccess={handleUpgradeSuccess}
        userPlanStatus={billing?.planStatus || ''}
        planId={
          billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete'
            ? billing?.currentPlan || 'standard'
            : getNextPlan(billing?.currentPlan || '', billing?.planStatus || '') || 'standard'
        }
        interval={billing?.interval || 'month'}
        currency={(billing?.currency || 'USD').toUpperCase()}
        config={config}
        billing={billing}
      />

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
            interval: billing.interval,
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
