import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Radio,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconBuilding,
  IconCheck,
  IconCrown,
  IconInfinity,
  IconPackage,
  IconStar,
  IconUsers,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { useStripeHealth } from '~/app/lib/hooks/useStripeHealth'
import { CURRENCIES, INTERVALS, PLANS, PRICING_PLANS } from '~/app/modules/stripe/plans'
import classes from './ReactivateSubscriptionModal.module.css'

export interface ReactivateSubscriptionModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
  cancelledPlan: string
}

interface PaymentData {
  clientSecret?: string
  amount: number
  currency: string
  planName: string
  subscriptionId: string
}

export default function ReactivateSubscriptionModal({
  opened,
  onClose,
  onSuccess,
  cancelledPlan,
}: ReactivateSubscriptionModalProps) {
  const { t } = useTranslation(['payment', 'common'])
  const { colorScheme } = useMantineColorScheme()
  const [selectedPlan, setSelectedPlan] = useState<string>(cancelledPlan || PLANS.STANDARD)
  const [selectedInterval, setSelectedInterval] = useState<string>(INTERVALS.MONTHLY)
  const [isProcessing, setIsProcessing] = useState(false)
  const { checkStripeHealth, isChecking: isCheckingStripeHealth } = useStripeHealth()

  const paymentFetcher = useFetcher<PaymentData>()

  // Handle plan selection and reactivation
  const handleReactivate = async () => {
    // Check Stripe health before proceeding
    const isHealthy = await checkStripeHealth()
    if (!isHealthy) {
      return
    }

    setIsProcessing(true)

    paymentFetcher.submit(
      {
        planId: selectedPlan,
        interval: selectedInterval,
        currency: CURRENCIES.USD,
      },
      {
        method: 'POST',
        action: '/api/subscription-create',
        encType: 'application/json',
      }
    )
  }

  // Handle reactivation response
  useEffect(() => {
    if (paymentFetcher.state === 'idle' && paymentFetcher.data) {
      setIsProcessing(false)

      if ('error' in paymentFetcher.data) {
        notifications.show({
          title: t('payment:reactivationFailed', 'Reactivation Failed'),
          message: t(
            'payment:unableToReactivate',
            'Unable to reactivate subscription. Please try again.'
          ),
          color: 'red',
        })
      } else {
        // Success - let parent component handle notification
        onSuccess()
        onClose()
      }
    }
  }, [paymentFetcher.state, paymentFetcher.data, onSuccess, onClose, t])

  const isLoading = isProcessing || paymentFetcher.state !== 'idle'

  const getPlannameAndPrice = (planId: string, interval: string) => {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS]
    if (!plan) return { name: 'Unknown Plan', price: 0 }

    const currency = CURRENCIES.USD
    const intervalKey = interval as keyof typeof plan.prices
    const price = plan.prices[intervalKey]?.[currency] || 0

    return { name: plan.name, price: price / 100 } // Convert cents to dollars
  }

  const renderPlanCard = (planId: string) => {
    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS]
    const { name, price } = getPlannameAndPrice(planId, selectedInterval)
    const isSelected = selectedPlan === planId
    const isCancelledPlan = planId === cancelledPlan

    const getPlanIcon = () => {
      switch (planId) {
        case PLANS.PROFESSIONAL:
          return <IconStar size={16} />
        case PLANS.PREMIUM:
          return <IconCrown size={16} />
        default:
          return <IconPackage size={16} />
      }
    }

    const getPlanColor = () => {
      switch (planId) {
        case PLANS.PROFESSIONAL:
          return 'blue'
        case PLANS.PREMIUM:
          return 'violet'
        default:
          return 'teal'
      }
    }

    const formatOrdersCount = (orders: number) => {
      return orders === -1 ? 'Unlimited' : `${orders.toLocaleString()}`
    }

    return (
      <Card
        key={planId}
        className={`${classes.planCard} ${isSelected ? classes.selected : ''} ${
          isCancelledPlan ? classes.previousPlan : ''
        }`}
        onClick={() => setSelectedPlan(planId)}
        withBorder
        padding="md"
        radius="md"
        data-plan-card
        data-selected={isSelected}
        style={{
          cursor: 'pointer',
          position: 'relative',
          height: '100%',
          borderColor: 'var(--mantine-color-gray-3)',
        }}
      >
        <Stack gap="sm" h="100%">
          {/* Header */}
          <Box style={{ minHeight: '140px' }}>
            <Group justify="space-between" align="flex-start" mb="xs">
              <Group gap="sm" align="center">
                <ThemeIcon
                  size="md"
                  color={getPlanColor()}
                  variant={isSelected ? 'filled' : 'light'}
                  radius="md"
                >
                  {getPlanIcon()}
                </ThemeIcon>
                <Box>
                  <Group gap="xs" align="center">
                    <Text fw={700} size="md" c={isSelected ? getPlanColor() : undefined}>
                      {name}
                    </Text>
                    {isCancelledPlan && (
                      <Badge size="sm" color="orange" variant="dot">
                        {t('payment:previousPlan', 'Previous')}
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed" mt={2}>
                    {plan.description}
                  </Text>
                </Box>
              </Group>
            </Group>

            {/* Pricing */}
            <Box mb="sm">
              <Group gap="sm" align="center" mb="xs">
                <Radio
                  checked={isSelected}
                  onChange={() => setSelectedPlan(planId)}
                  color={getPlanColor()}
                  size="sm"
                  mb={1}
                />
                <Group gap="xs">
                  <Text size="xl" fw={900} c={getPlanColor()}>
                    ${price}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500}>
                    /{selectedInterval === INTERVALS.YEARLY ? 'year' : 'month'}
                  </Text>
                </Group>
              </Group>
              <Box style={{ minHeight: '16px' }}>
                {selectedInterval === INTERVALS.YEARLY && (
                  <Text size="xs" c="green" fw={500}>
                    Save ${(price / 0.8 - price).toFixed(0)} per year
                  </Text>
                )}
              </Box>
            </Box>
          </Box>

          {/* Features */}
          <Box>
            {/* Custom divider to properly match card background */}
            <Box mb="sm" style={{ position: 'relative', textAlign: 'center' }}>
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor:
                    colorScheme === 'dark'
                      ? 'var(--mantine-color-dark-4)'
                      : 'var(--mantine-color-gray-4)',
                }}
              />
              <Text
                size="xs"
                fw={500}
                c="dimmed"
                className={isSelected ? classes.dividerLabelSelected : classes.dividerLabel}
              >
                Key Features
              </Text>
            </Box>
            <Stack gap="xs">
              {/* Orders */}
              <Group gap="xs" align="center">
                <ThemeIcon size="sm" color="green" variant="light" radius="sm">
                  {plan.inclusions.orders === -1 ? (
                    <IconInfinity size={12} />
                  ) : (
                    <IconPackage size={12} />
                  )}
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  {formatOrdersCount(plan.inclusions.orders)} orders/month
                </Text>
              </Group>

              {/* Users */}
              <Group gap="xs" align="center">
                <ThemeIcon size="sm" color="blue" variant="light" radius="sm">
                  <IconUsers size={12} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  Up to {plan.inclusions.users} users
                </Text>
              </Group>

              {/* Branches */}
              <Group gap="xs" align="center">
                <ThemeIcon size="sm" color="orange" variant="light" radius="sm">
                  <IconBuilding size={12} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  {plan.inclusions.branches} branch{plan.inclusions.branches !== 1 ? 'es' : ''}
                </Text>
              </Group>

              {/* Warehouses */}
              <Group gap="xs" align="center">
                <ThemeIcon size="sm" color="violet" variant="light" radius="sm">
                  <IconBuilding size={12} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  {plan.inclusions.warehouses} warehouse
                  {plan.inclusions.warehouses !== 1 ? 's' : ''}
                </Text>
              </Group>

              {/* Premium Features */}
              {planId === PLANS.PREMIUM && (
                <>
                  <Group gap="xs" align="center">
                    <ThemeIcon size="sm" color="grape" variant="light" radius="sm">
                      <IconStar size={12} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      AI-powered insights
                    </Text>
                  </Group>
                  <Group gap="xs" align="center">
                    <ThemeIcon size="sm" color="indigo" variant="light" radius="sm">
                      <IconCheck size={12} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      Advanced analytics
                    </Text>
                  </Group>
                </>
              )}

              {/* Professional Features */}
              {planId === PLANS.PROFESSIONAL && (
                <Group gap="xs" align="center">
                  <ThemeIcon size="sm" color="cyan" variant="light" radius="sm">
                    <IconCheck size={12} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>
                    Advanced reporting
                  </Text>
                </Group>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Selection Indicator */}
        {isSelected && (
          <Box
            style={{
              position: 'absolute',
              top: -1,
              left: -1,
              right: -1,
              height: 4,
              backgroundColor: `var(--mantine-color-${getPlanColor()}-6)`,
              borderRadius: '8px 8px 0 0',
            }}
          />
        )}
      </Card>
    )
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" align="center">
          <ThemeIcon size="md" color="blue" variant="light">
            <IconCrown size={16} />
          </ThemeIcon>
          <Title order={3}>{t('payment:reactivateSubscription', 'Reactivate Subscription')}</Title>
        </Group>
      }
      size={1200}
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="md">
        {/* Description */}
        <Stack gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            {t(
              'payment:reactivateSubscriptionDescription',
              'Choose your plan to reactivate your subscription. You can select your previous plan or upgrade to a different one.'
            )}
          </Text>
        </Stack>

        {/* Billing Interval Selection */}
        <Box mb="md">
          <Text fw={600} size="sm" mb="sm" c={colorScheme === 'dark' ? 'gray.2' : 'gray.8'}>
            {t('payment:billingInterval', 'Billing Interval')}
          </Text>

          <SegmentedControl
            value={selectedInterval}
            onChange={setSelectedInterval}
            fullWidth
            size="md"
            data={[
              {
                label: (
                  <Stack gap={4} align="center" py="xs">
                    <Text fw={600} size="sm">
                      {t('payment:monthly', 'Monthly')}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Pay monthly, cancel anytime
                    </Text>
                  </Stack>
                ),
                value: INTERVALS.MONTHLY,
              },
              {
                label: (
                  <Stack gap={4} align="center" py="xs" style={{ position: 'relative' }}>
                    <Group gap="xs" align="center">
                      <Text fw={600} size="sm">
                        {t('payment:yearly', 'Yearly')}
                      </Text>
                      <Badge size="xs" color="green" variant="light">
                        {t('payment:save20Percent', 'Save 20%')}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Best value - 2 months free
                    </Text>
                  </Stack>
                ),
                value: INTERVALS.YEARLY,
              },
            ]}
          />
        </Box>

        {/* Plan Selection */}
        <Stack gap="sm">
          <Group gap="xs" align="center">
            <ThemeIcon size="sm" color="violet" variant="light">
              <IconCrown size={14} />
            </ThemeIcon>
            <Text fw={600} size="sm">
              {t('payment:selectPlan', 'Select Plan')}
            </Text>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 1, md: 3 }} spacing="lg">
            {Object.keys(PRICING_PLANS).map(renderPlanCard)}
          </SimpleGrid>
        </Stack>

        {/* Action Buttons */}
        <Group justify="space-between" gap="md" mt="xl">
          <Button variant="subtle" onClick={onClose} disabled={isLoading} size="md" c="dimmed">
            {t('common:cancel', 'Cancel')}
          </Button>

          <Button
            onClick={handleReactivate}
            loading={isLoading || isCheckingStripeHealth}
            size="md"
            radius="md"
            gradient={{ from: 'blue', to: 'indigo' }}
            variant="gradient"
            style={{ minWidth: '200px' }}
          >
            {isLoading || isCheckingStripeHealth ? (
              <Group gap="sm">
                <Loader size="sm" color="white" />
                <Text>{t('payment:reactivating', 'Reactivating...')}</Text>
              </Group>
            ) : (
              <Text fw={600}>{t('payment:reactivateSubscription', 'Reactivate Subscription')}</Text>
            )}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
