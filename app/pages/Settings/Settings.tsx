import {
  Badge,
  Button,
  Center,
  Divider,
  Grid,
  Loader,
  Modal,
  Stack,
  Tabs,
  Text,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
  IconArrowUp,
  IconCreditCard,
  IconPremiumRights,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useFetcher } from "react-router"
import { canUpgrade, getNextPlan, shouldShowUpgrade } from "~/app/common/helpers/payment"
import { type ICurrency } from "~/app/common/validations/currencySchema"
import StripePayment from "~/app/components/StripePayment"
import { CURRENCIES, CURRENCY_SYMBOLS, INTERVALS } from "~/app/modules/stripe/plans"
import CurrencySettings from "./CurrencySettings"
import classes from "./Settings.module.css"

interface PaymentData {
  clientSecret: string
  amount: number
  currency: string
  planName: string
}

interface SettingsProps {
  currencies: ICurrency[]
  billing: {
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
  const { t } = useTranslation(['settings', 'common', 'payment']);
  const { colorScheme } = useMantineColorScheme()
  const theme = useMantineTheme()
  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]
  const paymentFetcher = useFetcher<PaymentData>()

  // Modal and payment state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  // Handle upgrade button click - just show modal without triggering payment setup
  const handleUpgrade = () => {
    const nextPlan = getNextPlan(billing?.currentPlan || '', billing?.planStatus)
    if (!nextPlan) return

    setShowUpgradeModal(true)
  }

  // Handle fetcher state changes
  const handleFetcherStateChange = () => {
    if (paymentFetcher.state === 'idle' && paymentFetcher.data) {
      if ('error' in paymentFetcher.data) {
        // Handle error
        const error = (paymentFetcher.data as any).error
        let errorMessage: string = t('payment:unableToSetupPayment')

        if (typeof error === 'string') {
          if (error.includes('Authentication required')) {
            errorMessage = t('payment:authenticationRequired')
          } else if (error.includes('Invalid plan configuration')) {
            errorMessage = t('payment:invalidPaymentConfig')
          } else if (error.includes('User not found')) {
            errorMessage = t('payment:userSessionExpired')
          }
        }

        notifications.show({
          title: t('payment:setupFailed'),
          message: errorMessage,
          color: 'red',
        })
        setShowUpgradeModal(false)
        setShowPayment(false)
      }
    }
  }

  // Call handler when fetcher state changes
  if (paymentFetcher.state === 'idle' && paymentFetcher.data && showPayment && showUpgradeModal) {
    handleFetcherStateChange()
  }

  // Payment handlers
  const handlePaymentSuccess = async () => {
    // Give enough time for webhook processing to activate the subscription
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Reload the page to update user data and hide modal
    window.location.reload()
  }

  const handlePaymentError = (error: string) => {
    notifications.show({
      title: t('payment:paymentFailed'),
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
    // Reset any fetcher data if present to ensure clean state
  }

  // Determine loading state
  const isLoadingPayment = paymentFetcher.state !== 'idle'

  const settings = [
    {
      id: "billing",
      icon: () => <IconCreditCard color={theme.colors.violet[6]} size={17} />,
      label: t('common:subscriptions', 'Subscriptions'),
      description: t('common:manageSubscriptions', 'Manage your subscription and billing settings'),
      content: () => (
        <Grid align="center" className={classes.row} p={10}>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('common:yourCurrentPlan', 'Your current plan')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="sm" tt={"capitalize"}>
              {billing?.currentPlan || 'Standard'} {t('common:plan', 'plan')}
            </Text>
            <Text fz="xs" opacity={0.6}>
              {billing?.amount ? (
                <>
                  {currencySymbol}
                  {Number(billing.amount / 100).toFixed(2)} {t('common:billedEveryMonth', 'billed every month')}
                </>
              ) : (
                t('common:noActiveBilling', 'No active billing')
              )}
            </Text>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('common:status', 'Status')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Badge size="xs" variant="light" color={billing?.planStatus ? "green" : "gray"}>
              {billing?.planStatus || t('common:noActiveSubscription', 'No Active Subscription')}
            </Badge>
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={2}>
            <Text fz="xs" opacity={0.6}>
              {t('common:renews', 'Renews')}
            </Text>
          </Grid.Col>
          <Grid.Col span={10}>
            <Text fz="xs">
              {billing?.trialEnd && billing?.planStatus === 'trialing' ? (
                <>
                  {t('common:trialEndsOn', 'Trial ends on')}{" "}
                  {dayjs(billing.trialEnd * 1000).format("MMM DD, YYYY")}
                </>
              ) : billing?.currentPeriodEnd ? (
                <>
                  {t('common:nextInvoiceDue', 'Next invoice due on')}{" "}
                  {dayjs(billing.currentPeriodEnd * 1000).format("MMM DD, YYYY")}
                </>
              ) : (
                t('common:noRenewalDate', 'No renewal date available')
              )}
            </Text>
          </Grid.Col>
          {shouldShowUpgrade(billing?.planStatus) && canUpgrade(billing?.currentPlan || '', billing?.planStatus) && (
            <>
              <Grid.Col span={12}>
                <Divider />
              </Grid.Col>
              <Grid.Col span={2}>
                <Text fz="xs" opacity={0.6}>
                  {t('common:upgrade', 'Upgrade')}
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
                  {getNextPlan(billing?.currentPlan || '', billing?.planStatus)
                    ? billing?.planStatus === 'trialing'
                      ? `Subscribe to ${getNextPlan(billing?.currentPlan || '', billing?.planStatus)}`
                      : `${t('common:upgradeTo', 'Upgrade to')} ${getNextPlan(billing?.currentPlan || '', billing?.planStatus)}`
                    : t('common:viewPlans', 'View Plans')
                  }
                </Button>
              </Grid.Col>
            </>
          )}
        </Grid>
      ),
    },
    {
      id: "currency",
      icon: () => (
        <IconPremiumRights color={theme.colors.violet[6]} size={17} />
      ),
      label: t('settings:currencies', 'Currencies'),
      description: t('settings:manageCurrencies', 'Manage your currencies'),
      content: () => <CurrencySettings currencies={currencies} />,
    },
  ]

  return (
    <>
      <Text className={classes.title}>{t('settings:title', 'Settings')}</Text>
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
        size={showPayment ? "lg" : "md"}
        title={showPayment ? t('payment:upgradeToTitle', { planName: getNextPlan(billing?.currentPlan || '', billing?.planStatus) }) : t('common:upgrade')}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 8,
        }}
        styles={{
          content: {
            backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'white',
            border: colorScheme === 'dark'
              ? '1px solid var(--mantine-color-dark-5)'
              : '1px solid var(--mantine-color-gray-2)',
            borderRadius: '16px',
            boxShadow: colorScheme === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.8)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {!showPayment ? (
          paymentFetcher.state !== 'idle' ? (
            // Loading payment setup
            <Center p="xl">
              <Stack gap="md" align="center">
                <Loader size="lg" />
                <Text c="dimmed">{t('payment:setupPayment')}</Text>
              </Stack>
            </Center>
          ) : (
            // Confirmation screen - show before payment setup
            <Stack gap="lg" p="md">
              <Stack gap="sm" p="md" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)', borderRadius: '8px' }}>
                <Text size="lg" fw={500} tt="capitalize">
                  {billing?.planStatus === 'trialing'
                    ? t('payment:subscribeTo', { planName: getNextPlan(billing?.currentPlan || '', billing?.planStatus) })
                    : t('payment:upgradeTo', { planName: getNextPlan(billing?.currentPlan || '', billing?.planStatus) })
                  }
                </Text>
                <Text c="dimmed" size="sm">
                  {billing?.planStatus === 'trialing'
                    ? t('payment:trialEndsBilling')
                    : t('payment:proratedDifference')
                  }
                </Text>
              </Stack>

              <Stack gap="sm">
                <Button
                  size="md"
                  color="violet"
                  onClick={() => {
                    setShowPayment(true)

                    const nextPlan = getNextPlan(billing?.currentPlan || '', billing?.planStatus)
                    if (!nextPlan) return

                    const formData = new FormData()
                    formData.append('action', 'upgrade')
                    formData.append('planId', nextPlan)
                    formData.append('interval', INTERVALS.MONTHLY)
                    formData.append('currency', CURRENCIES.USD)

                    paymentFetcher.submit(formData, {
                      method: 'POST',
                    })
                  }}
                >
                  {billing?.planStatus === 'trialing'
                    ? `Subscribe to ${getNextPlan(billing?.currentPlan || '', billing?.planStatus)}`
                    : `${t('common:upgradeTo', 'Upgrade to')} ${getNextPlan(billing?.currentPlan || '', billing?.planStatus)}`
                  }
                </Button>
                <Button
                  size="md"
                  variant="light"
                  color="gray"
                  onClick={handleModalClose}
                >
                  {t('common:cancel', 'Cancel')}
                </Button>
              </Stack>
            </Stack>
          )
        ) : (
          // Stripe payment form with upgrade message
          <Stack gap="lg">
            {/* Upgrade Information */}
            <Stack gap="sm" p="md" style={{ backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)', borderRadius: '8px' }}>
              <Text size="lg" fw={500} tt="capitalize">
                {billing?.planStatus === 'trialing'
                  ? t('payment:subscribeTo', { planName: getNextPlan(billing?.currentPlan || '', billing?.planStatus) })
                  : t('payment:upgradeTo', { planName: getNextPlan(billing?.currentPlan || '', billing?.planStatus) })
                }
              </Text>
              <Text c="dimmed" size="sm">
                {billing?.planStatus === 'trialing'
                  ? t('payment:trialEndsBilling')
                  : t('payment:proratedDifference')
                }
              </Text>
            </Stack>

            {/* Payment Form */}
            {paymentFetcher.data && config && !('error' in paymentFetcher.data) ? (
              <StripePayment
                clientSecret={paymentFetcher.data.clientSecret}
                amount={paymentFetcher.data.amount}
                currency={paymentFetcher.data.currency}
                planName={paymentFetcher.data.planName}
                publishableKey={config.stripePublicKey}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <Center p="xl">
                <Stack gap="md" align="center">
                  <Loader size="lg" />
                  <Text c="dimmed">{t('payment:loadingPaymentForm')}</Text>
                </Stack>
              </Center>
            )}
          </Stack>
        )}
      </Modal>
    </>
  )
}
