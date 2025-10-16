import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import {
  IconArrowUp,
  IconCalendar,
  IconCheck,
  IconCreditCard,
  IconCrown,
  IconEdit,
  IconInfoCircle,
  IconPremiumRights,
  IconShieldCheck,
  IconStar,
  IconTrendingUp,
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
  const { colorScheme } = useMantineColorScheme()
  const revalidator = useRevalidator()
  const { checkStripeHealth, isChecking } = useStripeHealth()

  // Translation wrapper to match expected signature
  const translate = (key: string, fallback?: string) => t(key, fallback || '')

  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)

  // Use billing prop directly - no need for local state since Layout handles SSE updates
  const pendingUpgradeRef = useRef<boolean>(false)

  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]

  // Handle upgrade button click - check Stripe health before opening modal
  const handleUpgrade = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowUpgradeModal(true)
    }
    // If unhealthy, the hook will show an error notification
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowUpgradeModal(false)
    // Reset pending flag when manually closing
    pendingUpgradeRef.current = false
  }

  // Handle payment method edit - check Stripe health first
  const handleEditPaymentMethod = async () => {
    const isHealthy = await checkStripeHealth()
    if (isHealthy) {
      setShowPaymentEditModal(true)
    }
  }

  // Handle upgrade success - close modal immediately
  const handleUpgradeSuccess = () => {
    // Set flag to indicate payment succeeded
    pendingUpgradeRef.current = true
    
    // Close modal immediately after payment success
    // SSE will update subscription status in the background
    setShowUpgradeModal(false)
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
        <Stack gap="lg">
          {/* Current Plan Card */}
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                  <IconCrown size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {t('payment:currentPlan', 'Current Plan')}
                  </Text>
                  <Title order={3}>
                    {getTranslatedPlanLabel(billing?.currentPlan, t)}
                  </Title>
                </div>
              </Group>
              <Badge
                size="lg"
                variant="gradient"
                gradient={{ from: billing?.planStatus === 'active' ? 'teal' : 'orange', to: billing?.planStatus === 'active' ? 'lime' : 'red' }}
                leftSection={<IconShieldCheck size={14} />}
              >
                {billing?.planStatus
                  ? getSubscriptionStatusLabel(billing.planStatus, translate)
                  : t('payment:noActiveSubscription', 'No Active Subscription')}
              </Badge>
            </Group>

            <Paper p="md" radius="md" withBorder mb="md" style={{ 
              background: colorScheme === 'dark' 
                ? 'linear-gradient(135deg, rgba(16, 152, 173, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)'
            }}>
              <Group justify="space-between" align="center">
                <div>
                  <Text size="sm" c="dimmed" mb={4}>
                    {billing?.trialEnd && billing?.planStatus === 'trialing'
                      ? t('payment:trialPeriod', 'Trial Period')
                      : t('payment:subscriptionPrice', 'Subscription Price')}
                  </Text>
                  <Group gap="xs" align="baseline">
                    <Text size="xl" fw={700}>
                      {billing?.amount ? `${currencySymbol}${billing?.amount / 100}` : t('payment:free', 'Free')}
                    </Text>
                    {billing?.interval && (
                      <Text size="sm" c="dimmed">
                        / {billing?.interval}
                      </Text>
                    )}
                  </Group>
                </div>
                <ThemeIcon size={50} radius="md" variant="light" color="blue">
                  <IconTrendingUp size={28} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Grid gutter="md">
              <Grid.Col span={6}>
                <Paper p="sm" radius="md" style={{ border: `1px solid ${theme.colors.gray[3]}` }}>
                  <Group gap="xs" mb={4}>
                    <IconCalendar size={16} color={theme.colors.gray[6]} />
                    <Text size="xs" c="dimmed" fw={500}>
                      {billing?.trialEnd && billing?.planStatus === 'trialing'
                        ? t('payment:trialEnds', 'Trial Ends')
                        : t('payment:nextBilling', 'Next Billing')}
                    </Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {billing?.trialEnd && billing?.planStatus === 'trialing' ? (
                      dayjs(billing.trialEnd * 1000).format('MMM DD, YYYY')
                    ) : billing?.currentPeriodEnd ? (
                      dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')
                    ) : (
                      t('payment:noRenewalDate', 'N/A')
                    )}
                  </Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="sm" radius="md" style={{ border: `1px solid ${theme.colors.gray[3]}` }}>
                  <Group gap="xs" mb={4}>
                    <IconStar size={16} color={theme.colors.yellow[6]} />
                    <Text size="xs" c="dimmed" fw={500}>
                      {t('payment:memberSince', 'Member Since')}
                    </Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {billing?.currentPeriodStart
                      ? dayjs(billing.currentPeriodStart * 1000).format('MMM YYYY')
                      : t('payment:recently', 'Recently')}
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>

            {billing?.trialEnd && billing?.planStatus === 'trialing' && (
              <>
                <Divider my="md" />
                <Paper p="md" radius="md" style={{ 
                  background: colorScheme === 'dark'
                    ? 'rgba(255, 193, 7, 0.1)'
                    : 'rgba(255, 243, 205, 0.5)',
                  border: `1px solid ${theme.colors.yellow[3]}`
                }}>
                  <Group gap="xs" mb="xs">
                    <IconInfoCircle size={18} color={theme.colors.yellow[7]} />
                    <Text size="sm" fw={600} c="yellow.7">
                      {t('payment:trialRemaining', 'Trial Period Active')}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {t('payment:trialEndsMessage', 'Your trial period will end on')} {dayjs(billing.trialEnd * 1000).format('MMM DD, YYYY')}. 
                    {' '}{t('payment:upgradeToKeepAccess', 'Upgrade now to keep access to all features.')}
                  </Text>
                  <Progress
                    value={Math.max(0, Math.min(100, ((Date.now() / 1000 - billing.trialStart) / (billing.trialEnd - billing.trialStart)) * 100))}
                    color="yellow"
                    size="sm"
                    mt="xs"
                    animated
                  />
                </Paper>
              </>
            )}
          </Card>

          {/* Payment Method Card */}
          {billing?.paymentMethod && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group>
                  <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                    <IconCreditCard size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>
                      {t('payment:paymentMethod', 'Payment Method')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('payment:securelyStored', 'Securely stored with Stripe')}
                    </Text>
                  </div>
                </Group>
                <Tooltip label={t('payment:editPaymentMethod', 'Edit Payment Method')}>
                  <ActionIcon
                    size="lg"
                    variant="light"
                    color="blue"
                    onClick={handleEditPaymentMethod}
                    loading={isChecking}
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Paper p="md" radius="md" withBorder>
                <Group justify="space-between">
                  <Group>
                    <ThemeIcon size="md" radius="md" variant="light" color="gray">
                      <IconCreditCard size={16} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={600}>
                        {billing.paymentMethod.brand?.toUpperCase()}
                      </Text>
                      <Text size="xs" c="dimmed">
                        •••• •••• •••• {billing.paymentMethod.last4}
                      </Text>
                    </div>
                  </Group>
                  <Badge variant="outline" color="gray">
                    {String(billing.paymentMethod.expMonth).padStart(2, '0')}/{billing.paymentMethod.expYear}
                  </Badge>
                </Group>
              </Paper>
            </Card>
          )}

          {/* Upgrade Card */}
          {shouldShowUpgrade(billing?.planStatus) &&
            canUpgrade(billing?.currentPlan || '', billing?.planStatus) && (
              <Card shadow="md" padding="xl" radius="md" withBorder style={{
                background: colorScheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(219, 234, 254, 0.5) 0%, rgba(224, 242, 254, 0.5) 100%)',
                borderColor: theme.colors.blue[4]
              }}>
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
                        <IconCrown size={20} />
                      </ThemeIcon>
                      <div>
                        <Text size="lg" fw={700}>
                          {(() => {
                            if (billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete') {
                              return t('payment:convertTrial', 'Complete Your Subscription')
                            } else {
                              const nextPlan = getNextPlan(billing?.currentPlan || '', billing?.planStatus)
                              return nextPlan
                                ? `${t('payment:upgradeTo', 'Upgrade to')} ${getTranslatedPlanLabel(nextPlan, t)}`
                                : t('payment:exploreUpgrades', 'Explore Upgrades')
                            }
                          })()}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {billing?.planStatus === 'trialing'
                            ? t('payment:unlockAllFeatures', 'Continue with all premium features after your trial')
                            : t('payment:getMoreFeatures', 'Unlock advanced features and higher limits')}
                        </Text>
                      </div>
                    </Group>

                    <Stack gap="xs" mt="md" mb="md">
                      {[
                        t('payment:benefit1', 'Higher usage limits'),
                        t('payment:benefit2', 'Advanced reporting'),
                        t('payment:benefit3', 'Priority support'),
                      ].map((benefit, idx) => (
                        <Group gap="xs" key={idx}>
                          <ThemeIcon size="sm" radius="xl" color="teal" variant="light">
                            <IconCheck size={12} />
                          </ThemeIcon>
                          <Text size="sm">{benefit}</Text>
                        </Group>
                      ))}
                    </Stack>

                    <Button
                      size="md"
                      variant="gradient"
                      gradient={{ from: 'violet', to: 'blue' }}
                      leftSection={<IconArrowUp size={18} />}
                      onClick={handleUpgrade}
                      loading={isChecking}
                      fullWidth
                    >
                      {(() => {
                        if (billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete') {
                          return `${t('payment:subscribe')} ${getTranslatedPlanLabel(billing?.currentPlan, t)}`
                        } else {
                          const nextPlan = getNextPlan(billing?.currentPlan || '', billing?.planStatus)
                          return nextPlan
                            ? `${t('payment:upgrade')} ${getTranslatedPlanLabel(nextPlan, t)}`
                            : t('payment:viewPlans', 'View Plans')
                        }
                      })()}
                    </Button>
                  </div>
                </Group>
              </Card>
            )}

          {/* Cancellation Section */}
          {billing?.subscriptionId && billing?.planStatus === 'active' && (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Text size="sm" fw={600} mb={4}>
                    {billing?.cancelAtPeriodEnd
                      ? t('payment:subscriptionEnding', 'Subscription Ending')
                      : t('payment:manageSubscription', 'Manage Subscription')}
                  </Text>
                  {billing?.cancelAtPeriodEnd ? (
                    <Text size="xs" c="orange">
                      {t('payment:accessUntil', 'You will have access until')} {dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed">
                      {t('payment:cancelAnytime', 'You can cancel your subscription at any time')}
                    </Text>
                  )}
                </div>
                {!billing?.cancelAtPeriodEnd && (
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => setShowCancellationModal(true)}
                  >
                    {t('payment:cancel', 'Cancel')}
                  </Button>
                )}
              </Group>
            </Card>
          )}
        </Stack>
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
      <Stack gap="xl">
        <div>
          <Title order={1} className={classes.title}>
            {t('common:title', 'Settings')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('common:manageSettings', 'Manage your account settings and preferences')}
          </Text>
        </div>

        <Tabs defaultValue="billing" variant="pills" radius="md">
          <Tabs.List mb="xl">
            {settings.map(({ id, label, icon: Icon }) => (
              <Tabs.Tab value={id} key={id} leftSection={<Icon />}>
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {settings.map(({ id, content: Content }) => (
            <Tabs.Panel value={id} key={id}>
              <Content />
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>

      {/* Upgrade Modal */}
      <UpgradePaymentModal
        opened={showUpgradeModal}
        onClose={handleModalClose}
        onSuccess={handleUpgradeSuccess}
        userPlanStatus={billing?.planStatus || ''}
        planId={
          billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete'
            ? billing?.currentPlan || 'standard'
            : getNextPlan(billing?.currentPlan || '', billing?.planStatus || '') ||
              'standard'
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
