import {
  Button,
  Center,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCrown, IconLock } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { CURRENCIES, INTERVALS, PLANS } from '~/app/modules/stripe/plans'
import StripePayment from '../StripePayment'
import classes from './TrialExpirationModal.module.css'

interface TrialExpirationModalProps {
  opened: boolean
  currentPlan: string
  mode?: 'trial-expired' | 'incomplete-subscription'
}

interface PaymentData {
  clientSecret: string
  amount: number
  currency: string
  planName: string
}

interface ConfigData {
  stripePublicKey: string
}

export default function TrialExpirationModal({
  opened,
  currentPlan,
  mode = 'trial-expired',
}: TrialExpirationModalProps) {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation(['payment', 'common'])
  const configFetcher = useFetcher<ConfigData>()
  const paymentFetcher = useFetcher<PaymentData>()
  const [showPayment, setShowPayment] = useState(false)

  // Fetch config on mount using fetcher
  useEffect(() => {
    if (configFetcher.state === 'idle' && !configFetcher.data) {
      configFetcher.load('/api/config')
    }
  }, [configFetcher])

  // Handle subscription creation using fetcher
  const handleUpgrade = () => {
    paymentFetcher.submit(
      {
        planId: PLANS.STANDARD, // Default to Standard plan
        interval: INTERVALS.MONTHLY, // Default to monthly
        currency: CURRENCIES.USD, // Default to USD
      },
      {
        method: 'POST',
        action: '/api/subscription-create', // Use the new subscription endpoint
        encType: 'application/json',
      }
    )
  }

  // Handle fetcher state changes
  useEffect(() => {
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
      } else {
        // Success - show payment form
        setShowPayment(true)
      }
    }
  }, [paymentFetcher.state, paymentFetcher.data])

  // Determine loading state
  const isLoadingPayment = paymentFetcher.state !== 'idle' || configFetcher.state !== 'idle'

  const handlePaymentSuccess = async () => {
    // Give enough time for webhook processing to activate the subscription
    await new Promise((resolve) => setTimeout(resolve, 3000))

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
    // Trigger a page reload to reset the fetcher state if needed
    // Or the user can click the upgrade button again
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {}} // Don't allow closing - user must upgrade
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      size={showPayment ? 'lg' : 'md'}
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
      <div className={classes.modalContent}>
        {!showPayment ? (
          // Initial trial expired screen
          <>
            {/* Icon */}
            <Center mb="xl">
              <div className={classes.iconContainer}>
                <ThemeIcon
                  size={80}
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'red', to: 'orange' }}
                  className={classes.lockIcon}
                >
                  <IconLock size={40} />
                </ThemeIcon>
              </div>
            </Center>

            {/* Title */}
            <Title order={2} ta="center" mb="md" className={classes.title}>
              {mode === 'incomplete-subscription'
                ? t('payment:subscriptionIncomplete', 'Subscription Incomplete')
                : t('payment:trialPeriodExpired')}
            </Title>

            {/* Main Message */}
            <Text ta="center" size="lg" mb="xl" className={classes.message}>
              {mode === 'incomplete-subscription'
                ? t(
                    'payment:completePaymentRequired',
                    'Payment required to activate your subscription'
                  )
                : t('payment:cannotAccessTriven')}
            </Text>

            {/* Description */}
            <Text ta="center" c="dimmed" mb="xl" size="sm">
              {mode === 'incomplete-subscription'
                ? t(
                    'payment:incompleteSubscriptionMessage',
                    'Your subscription is pending payment completion. Complete your payment to continue using all features.'
                  )
                : t('payment:trialEndedMessage')}
            </Text>

            {/* Action Buttons */}
            <Stack gap="md" mt="xl">
              <Button
                size="lg"
                fullWidth
                onClick={handleUpgrade}
                gradient={{ from: 'teal', to: 'blue' }}
                variant="gradient"
                className={classes.upgradeButton}
                leftSection={<IconCrown size={20} />}
                loading={isLoadingPayment}
                disabled={isLoadingPayment}
              >
                {isLoadingPayment
                  ? t('payment:setupPayment')
                  : t('payment:upgradeTo', { planName: currentPlan })}
              </Button>

              <Text ta="center" size="xs" c="dimmed">
                {t('payment:flexiblePricing')}
              </Text>
            </Stack>
          </>
        ) : (
          // Stripe payment form
          <>
            {paymentFetcher.data && configFetcher.data && !('error' in paymentFetcher.data) ? (
              <StripePayment
                clientSecret={paymentFetcher.data.clientSecret}
                amount={paymentFetcher.data.amount}
                currency={paymentFetcher.data.currency}
                planName={paymentFetcher.data.planName}
                publishableKey={configFetcher.data.stripePublicKey}
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
          </>
        )}
      </div>
    </Modal>
  )
}
