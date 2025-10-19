import {
  ActionIcon,
  Badge,
  Card,
  Divider,
  Group,
  Menu,
  Paper,
  Progress,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core'
import {
  IconArrowUp,
  IconCreditCard,
  IconCrown,
  IconDots,
  IconDownload,
  IconEdit,
  IconInfoCircle,
  IconPremiumRights,
  IconX,
  IconBrandMastercard,
  IconBrandVisa,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator, useNavigate } from 'react-router'
import {
  canUpgrade,
  getNextPlan,
  getSubscriptionStatusLabel,
  getTranslatedPlanLabel,
  shouldShowUpgrade,
} from '~/app/common/helpers/payment'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import { CancellationModal, PaymentMethodEditModal, UpgradePaymentModal } from '~/app/components'
import { CURRENCY_SYMBOLS } from '~/app/modules/stripe/plans'
import PageTitle from '~/app/partials/Title/Title'
import CurrencySettings from './CurrencySettings'

// Helper function to get card brand icon
const getCardIcon = (brand: string | undefined, size: number = 16) => {
  if (!brand) return <IconCreditCard size={size} />

  const brandLower = brand.toLowerCase()

  if (brandLower === 'mastercard') {
    return <IconBrandMastercard size={size} />
  }
  if (brandLower === 'visa') {
    return <IconBrandVisa size={size} />
  }

  // Default to generic card icon for all other brands (including Amex)
  return <IconCreditCard size={size} />
}

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
  invoices?: Array<{
    id: string
    number: string | null
    status: string
    amount_paid: number
    amount_due: number
    currency: string
    created: number
    hosted_invoice_url: string | null
    invoice_pdf: string | null
  }>
  permissions: string[]
  config: {
    stripePublicKey: string
  }
}

export default function Settings({
  currencies = [],
  billing,
  invoices = [],
  config, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SettingsProps) {
  const { t } = useTranslation(['common', 'payment'])
  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()
  const revalidator = useRevalidator()
  const navigate = useNavigate()

  // Translation wrapper to match expected signature
  const translate = (key: string, fallback?: string) => t(key, fallback || '')

  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false)

  // Use billing prop directly - no need for local state since Layout handles SSE updates
  const pendingUpgradeRef = useRef<boolean>(false)

  const currencySymbol = CURRENCY_SYMBOLS[billing?.currency?.toUpperCase()]

  // Handle upgrade button click - redirect to billing page with upgrade action
  const handleUpgrade = () => {
    let targetPlan = 'professional' // default
    
    if (billing?.planStatus === 'trialing' || billing?.planStatus === 'incomplete') {
      // For trial/incomplete, upgrade to their current plan
      targetPlan = billing?.currentPlan || 'professional'
    } else {
      // For active subscriptions, get the next plan
      const nextPlan = getNextPlan(billing?.currentPlan || '', billing?.planStatus || '')
      targetPlan = nextPlan || 'professional'
    }
    
    navigate(`/billing?action=upgrade&plan=${targetPlan}`)
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowUpgradeModal(false)
    // Reset pending flag when manually closing
    pendingUpgradeRef.current = false
  }

  // Handle payment method edit
  const handleEditPaymentMethod = () => {
    setShowPaymentEditModal(true)
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
      label: t('payment:subscription', 'Subscription'),
      description: t(
        'payment:manageSubscriptions',
        'Manage your subscription and billing settings'
      ),
      content: () => (
        <Stack gap="lg">
          {/* Current Plan Card */}
          <Card padding="xl" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                  <IconCrown size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={600}>
                    {t('payment:manageSubscription', 'Manage your subscription')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('payment:yourCurrentPlan', 'View and manage your subscription details')}
                  </Text>
                </div>
              </Group>
              <Menu shadow="md" width={260} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" size="lg">
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {shouldShowUpgrade(billing?.planStatus) &&
                    canUpgrade(billing?.currentPlan || '', billing?.planStatus) && (
                      <Menu.Item
                        leftSection={<IconArrowUp size={16} />}
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
                      </Menu.Item>
                    )}
                  {billing?.subscriptionId &&
                    billing?.planStatus === 'active' &&
                    !billing?.cancelAtPeriodEnd && (
                      <Menu.Item
                        color="red"
                        leftSection={<IconX size={16} />}
                        onClick={() => setShowCancellationModal(true)}
                      >
                        {t('payment:cancelSubscription', 'Cancel Subscription')}
                      </Menu.Item>
                    )}
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Stack gap="md">
              {/* Plan */}
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed" fw={500}>
                  {t('payment:plan', 'Plan')}
                </Text>
                <Text size="sm" fw={600}>
                  {getTranslatedPlanLabel(billing?.currentPlan, t)}
                </Text>
              </Group>

              <Divider />

              {/* Status */}
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed" fw={500}>
                  {t('payment:status', 'Status')}
                </Text>
                <Badge
                  size="sm"
                  color={billing?.planStatus === 'active' ? 'teal' : 'red'}
                  variant="outline"
                >
                  {billing?.planStatus
                    ? getSubscriptionStatusLabel(billing.planStatus, translate)
                    : t('payment:noActiveSubscription', 'No Active Subscription')}
                </Badge>
              </Group>

              <Divider />

              {/* Price */}
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed" fw={500}>
                  {t('payment:price', 'Price')}
                </Text>
                <Group gap={6} align="baseline">
                  <Text size="sm" fw={600}>
                    {billing?.amount
                      ? `${currencySymbol}${billing?.amount / 100}`
                      : t('payment:free', 'Free')}
                  </Text>
                  {billing?.interval && (
                    <Text size="xs" c="dimmed" fw={400}>
                      / {billing?.interval}
                    </Text>
                  )}
                </Group>
              </Group>

              <Divider />

              {/* Next Billing / Trial Ends */}
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed" fw={500}>
                  {billing?.trialEnd && billing?.planStatus === 'trialing'
                    ? t('payment:trialEnds', 'Trial Ends')
                    : t('payment:nextBilling', 'Next Billing')}
                </Text>
                <Text size="sm" fw={600}>
                  {billing?.trialEnd && billing?.planStatus === 'trialing'
                    ? dayjs(billing.trialEnd * 1000).format('MMM DD, YYYY')
                    : billing?.currentPeriodEnd
                      ? dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')
                      : t('payment:noRenewalDate', 'N/A')}
                </Text>
              </Group>

              <Divider />

              {/* Member Since */}
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed" fw={500}>
                  {t('payment:memberSince', 'Member Since')}
                </Text>
                <Text size="sm" fw={600}>
                  {billing?.currentPeriodStart
                    ? dayjs(billing.currentPeriodStart * 1000).format('MMM YYYY')
                    : t('payment:recently', 'Recently')}
                </Text>
              </Group>
            </Stack>

            {billing?.trialEnd > 0 && billing?.planStatus === 'trialing' && (
              <>
                <Divider my="md" />
                <Paper
                  p="md"
                  radius="md"
                  style={{
                    background:
                      colorScheme === 'dark'
                        ? 'rgba(255, 193, 7, 0.1)'
                        : 'rgba(255, 243, 205, 0.5)',
                    border: `1px solid ${theme.colors.yellow[3]}`,
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <IconInfoCircle size={18} color={theme.colors.yellow[7]} />
                    <Text size="sm" fw={600} c="yellow.7">
                      {t('payment:trialRemaining', 'Trial Period Active')}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {t('payment:trialEndsMessage', 'Your trial period will end on')}{' '}
                    {dayjs(billing.trialEnd * 1000).format('MMM DD, YYYY')}.{' '}
                    {t(
                      'payment:upgradeToKeepAccess',
                      'Upgrade now to keep access to all features.'
                    )}
                  </Text>
                  <Progress
                    value={Math.max(
                      0,
                      Math.min(
                        100,
                        ((Date.now() / 1000 - billing.trialStart) /
                          (billing.trialEnd - billing.trialStart)) *
                          100
                      )
                    )}
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
            <Card padding="lg" radius="md" withBorder>
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
                <Menu shadow="md" width={260} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="lg">
                      <IconDots size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit size={16} />}
                      onClick={handleEditPaymentMethod}
                    >
                      {t('payment:editPaymentMethod', 'Edit Payment Method')}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Paper p="md" radius="md" withBorder>
                <Group justify="space-between">
                  <Group>
                    <ThemeIcon size="md" radius="md" variant="light" color="gray">
                      {getCardIcon(billing.paymentMethod.brand, 16)}
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={600}>
                        {billing.paymentMethod.brand
                          ? billing.paymentMethod.brand.charAt(0).toUpperCase() +
                            billing.paymentMethod.brand.slice(1).toLowerCase()
                          : ''}
                      </Text>
                      <Text size="xs" c="dimmed">
                        •••• •••• •••• {billing.paymentMethod.last4}
                      </Text>
                    </div>
                  </Group>
                  <Badge variant="outline" color="gray">
                    {String(billing.paymentMethod.expMonth).padStart(2, '0')}/
                    {billing.paymentMethod.expYear}
                  </Badge>
                </Group>
              </Paper>
            </Card>
          )}

          {/* Invoice History */}
          {invoices && invoices.length > 0 && (
            <Card padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group>
                  <ThemeIcon size="lg" radius="md" variant="light" color="indigo">
                    <IconCreditCard size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>
                      {t('payment:invoiceHistory', 'Invoice History')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('payment:viewPastInvoices', 'View and download past invoices')}
                    </Text>
                  </div>
                </Group>
              </Group>
              
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('payment:invoice', 'Invoice')}</Table.Th>
                    <Table.Th>{t('payment:date', 'Date')}</Table.Th>
                    <Table.Th>{t('payment:amount', 'Amount')}</Table.Th>
                    <Table.Th>{t('payment:status', 'Status')}</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {invoices.map((invoice) => (
                    <Table.Tr key={invoice.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {invoice.number || invoice.id.slice(-8)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {dayjs.unix(invoice.created).format('MMM D, YYYY')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} align="baseline">
                          <Text size="sm" fw={500}>
                            ${((invoice.amount_paid || invoice.amount_due) / 100).toFixed(2)}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {invoice.currency.toUpperCase()}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={invoice.status === 'paid' ? 'teal' : 'red'}
                          variant="outline"
                          tt="uppercase"
                        >
                          {invoice.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {(invoice.hosted_invoice_url || invoice.invoice_pdf) && (
                          <ActionIcon
                            component="a"
                            href={invoice.invoice_pdf || invoice.hosted_invoice_url || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            variant="subtle"
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {/* Cancelled Subscription Notice */}
          {billing?.subscriptionId &&
            billing?.planStatus === 'active' &&
            billing?.cancelAtPeriodEnd && (
              <Card
                padding="lg"
                radius="md"
                withBorder
                style={{
                  borderColor: theme.colors.orange[4],
                  background:
                    colorScheme === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 243, 224, 0.5)',
                }}
              >
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                    <IconInfoCircle size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600} c="orange.7" mb={4}>
                      {t('payment:subscriptionEnding', 'Subscription Ending')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('payment:accessUntil', 'You will have access until')}{' '}
                      {dayjs(billing.currentPeriodEnd * 1000).format('MMM DD, YYYY')}
                    </Text>
                  </div>
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
      <Stack>
        <PageTitle
          description={t('common:manageSettings', 'Manage your account settings and preferences')}
        >
          {t('common:title', 'Settings')}
        </PageTitle>

        <Tabs defaultValue="billing" variant="outline" radius="md" color="cyan.5">
          <Tabs.List mb="lg">
            {settings.map(({ id, label }) => (
              <Tabs.Tab value={id} key={id}>
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
