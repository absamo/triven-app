import {
  Badge,
  Button,
  Divider,
  Grid,
  Modal,
  Stack,
  Tabs,
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowUp, IconCreditCard, IconPremiumRights } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  canUpgrade,
  getNextPlan,
  getTranslatedPlanLabel,
  shouldShowUpgrade,
} from '~/app/common/helpers/payment'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import StripePayment from '~/app/components/StripePayment'
import { CURRENCY_SYMBOLS, getPlanPrice, INTERVALS } from '~/app/modules/stripe/plans'
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
  config,
}: SettingsProps) {
  const { t } = useTranslation(['common', 'payment'])
  const { colorScheme } = useMantineColorScheme()
  const theme = useMantineTheme()
  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]

  // Modal and payment state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [targetPlan, setTargetPlan] = useState<string | null>(null)
  // No local payment intent data; StripePayment handles deferred creation

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
    setShowPayment(true)
    setShowUpgradeModal(true)
  }

  // Payment form is shown immediately in the modal

  // No useEffect – intent will be created by StripePayment on Pay

  // Payment handlers
  const handlePaymentSuccess = async () => {
    // Give enough time for webhook processing to activate the subscription
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Reload the page to update user data and hide modal
    window.location.reload()
  }

  const handlePaymentError = (error: string) => {
    notifications.show({
      title: t('paymentFailed', 'Payment Failed'),
      message: error,
      color: 'red',
    })
    setShowPayment(false)
    setShowUpgradeModal(false)
  }

  // Handle modal close - reset all states without creating subscription
  const handleModalClose = () => {
    setShowUpgradeModal(false)
    setShowPayment(false)
    setTargetPlan(null)
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
  const displayAmount = (() => {
    try {
      return getPlanPrice(displayTargetPlan as any, displayInterval as any, displayCurrency as any)
    } catch {
      return 0
    }
  })()

  const settings = [
    {
      id: 'billing',
      icon: () => <IconCreditCard color={theme.colors.violet[6]} size={17} />,
      label: t('subscriptions', 'Subscriptions'),
      description: t('manageSubscriptions', 'Manage your subscription and billing settings'),
      content: () => (
        <Grid align="center" className={classes.row} p={10}>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('yourCurrentPlan', 'Your current plan')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="sm">
              {getTranslatedPlanLabel(billing?.currentPlan, t)} {t('plan', 'plan')}
            </Text>
            <Text fz="xs" opacity={0.6}>
              {billing?.amount ? (
                <>
                  {currencySymbol}
                  {Number(billing.amount / 100).toFixed(2)}{' '}
                  {t('billedEveryMonth', 'billed every month')}
                </>
              ) : (
                t('noActiveBilling', 'No active billing')
              )}
            </Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('status', 'Status')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Badge size="xs" variant="light" color={billing?.planStatus ? 'green' : 'gray'}>
              {billing?.planStatus || t('noActiveSubscription', 'No Active Subscription')}
            </Badge>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('renews', 'Renews')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="xs">
              {billing?.trialEnd && billing?.planStatus === 'trialing' ? (
                <>
                  {t('trialEndsOn', 'Trial ends on')}{' '}
                  {dayjs(billing.trialEnd * 1000).format('MMM DD, YYYY')}
                </>
              ) : billing?.currentPeriodEnd ? (
                <>
                  {t('nextInvoiceDue', 'Next invoice due on')}{' '}
                  {dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
                </>
              ) : (
                t('noRenewalDate', 'No renewal date available')
              )}
            </Text>
          </Grid.Col>
          {shouldShowUpgrade(billing?.planStatus) &&
            canUpgrade(billing?.currentPlan || '', billing?.planStatus) && (
              <>
                <Grid.Col span={12}>
                  <Divider />
                </Grid.Col>
                <Grid.Col span={2}>
                  <Text fz="xs" opacity={0.6}>
                    {t('upgrade', 'Upgrade')}
                  </Text>
                </Grid.Col>
                <Grid.Col span={10}>
                  <Button
                    size="xs"
                    variant="light"
                    color="violet"
                    leftSection={<IconArrowUp size={14} />}
                    loading={isLoadingPayment}
                    onClick={handleUpgrade}
                  >
                    {(() => {
                      if (
                        billing?.planStatus === 'trialing' ||
                        billing?.planStatus === 'incomplete'
                      ) {
                        return `${t('subscribe')} ${getTranslatedPlanLabel(billing?.currentPlan, t)}`
                      } else {
                        const nextPlan = getNextPlan(
                          billing?.currentPlan || '',
                          billing?.planStatus
                        )
                        return nextPlan
                          ? `${t('upgrade')} ${getTranslatedPlanLabel(nextPlan, t)}`
                          : t('viewPlans', 'View Plans')
                      }
                    })()}
                  </Button>
                </Grid.Col>
              </>
            )}
        </Grid>
      ),
    },
    {
      id: 'currency',
      icon: () => <IconPremiumRights color={theme.colors.violet[6]} size={17} />,
      label: t('currency', 'Currencies'),
      description: t('manageCurrencies', 'Manage your currencies'),
      content: () => <CurrencySettings currencies={currencies} />,
    },
  ]

  return (
    <>
      <Text className={classes.title}>{t('title', 'Settings')}</Text>
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
        size="lg"
        title={t('upgrade', 'Upgrade')}
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
        <Stack gap="lg">
          <Stack
            gap="sm"
            p="md"
            style={{
              backgroundColor:
                colorScheme === 'dark'
                  ? 'var(--mantine-color-dark-6)'
                  : 'var(--mantine-color-gray-1)',
              borderRadius: '8px',
            }}
          >
            <Text c="dimmed" size="sm">
              {billing?.planStatus === 'trialing'
                ? t('trialEndsBilling', 'Your trial will end and billing will start immediately.')
                : billing?.planStatus === 'incomplete'
                  ? t(
                      'completeSubscription',
                      'Complete your subscription to continue using all features.'
                    )
                  : t(
                      'proratedDifference',
                      "You'll be charged the prorated difference for the remainder of your billing cycle."
                    )}
            </Text>
          </Stack>

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
    </>
  )
}
