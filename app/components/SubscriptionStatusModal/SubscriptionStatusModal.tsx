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
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useRevalidator } from 'react-router'
import { STRIPE_SUBSCRIPTION_STATUSES, SUBSCRIPTION_MODAL_MODES } from '~/app/common/constants'
import { CURRENCIES, INTERVALS, PLANS } from '~/app/modules/stripe/plans'
import PaymentMethodEditModal from '../PaymentMethodEditModal'
import ReactivateSubscriptionModal from '../ReactivateSubscriptionModal'
import StripePayment from '../StripePayment'
import classes from './SubscriptionStatusModal.module.css'

interface SubscriptionStatusModalProps {
  opened: boolean
  currentPlan: string
  mode?:
    | SUBSCRIPTION_MODAL_MODES.PAID
    | SUBSCRIPTION_MODAL_MODES.UNPAID
    | SUBSCRIPTION_MODAL_MODES.PAST_DUE
    | SUBSCRIPTION_MODAL_MODES.CANCELED
    | SUBSCRIPTION_MODAL_MODES.INCOMPLETE
    | SUBSCRIPTION_MODAL_MODES.INCOMPLETE_EXPIRED
    | SUBSCRIPTION_MODAL_MODES.PAUSED
    | SUBSCRIPTION_MODAL_MODES.NO_SUBSCRIPTION
    | SUBSCRIPTION_MODAL_MODES.TRIAL_EXPIRED
  subscription?: {
    id: string
    planId: string
    interval: string
    amount: number
    currency: string
  }
  onPaymentStart?: () => void
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

export default function SubscriptionStatusModal({
  opened,
  currentPlan,
  mode,
  subscription,
  onPaymentStart,
}: SubscriptionStatusModalProps) {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation(['payment', 'common'])
  const revalidator = useRevalidator()
  const configFetcher = useFetcher<ConfigData>()
  const paymentFetcher = useFetcher<PaymentData>()
  const [showPayment, setShowPayment] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showReactivateModal, setShowReactivateModal] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [isButtonLoading, setIsButtonLoading] = useState(false)
  const [stripeSubmit, setStripeSubmit] = useState<(() => Promise<void>) | null>(null)
  const [isStripeReady, setIsStripeReady] = useState(false)

  // Helper function to get modal content based on mode
  const getModalContent = () => {
    switch (mode) {
      case STRIPE_SUBSCRIPTION_STATUSES.CANCELED:
        return {
          title: t('payment:subscriptionCancelled', 'Subscription Cancelled'),
          message: t('payment:cannotAccessTriven'),
          description: t(
            'payment:subscriptionCancelledMessage',
            'Your subscription has been cancelled. Please reactivate your subscription to continue using Triven.'
          ),
          buttonText: t('payment:reactivateSubscription', 'Reactivate Subscription'),
          icon: <IconLock size={40} />,
          gradient: { from: 'red', to: 'orange' },
        }
      case STRIPE_SUBSCRIPTION_STATUSES.PAST_DUE:
        return {
          title: t('payment:paymentFailed', 'Payment Failed'),
          message: t('payment:cannotAccessTriven'),
          description: t(
            'payment:pastDueMessage',
            'Your payment has failed. This could be due to insufficient funds, an expired card, or other payment issues. Please update your payment method to restore access.'
          ),
          buttonText: t('payment:updatePaymentMethod', 'Update Payment Method'),
          icon: <IconLock size={40} />,
          gradient: { from: 'red', to: 'orange' },
        }
      case STRIPE_SUBSCRIPTION_STATUSES.UNPAID:
        return {
          title: t('payment:paymentDeclined', 'Payment Declined'),
          message: t('payment:cannotAccessTriven'),
          description: t(
            'payment:unpaidMessage',
            'Multiple payment attempts have failed. Your card may have insufficient funds, be expired, or been declined. Please update your payment method immediately to restore access.'
          ),
          buttonText: t('payment:updatePaymentMethod', 'Update Payment Method'),
          icon: <IconLock size={40} />,
          gradient: { from: 'red', to: 'pink' },
        }
      case STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE:
        return {
          title: t('payment:subscriptionIncomplete', 'Subscription Incomplete'),
          message: t(
            'payment:completePaymentRequired',
            'Payment required to activate your subscription'
          ),
          description: t(
            'payment:incompleteSubscriptionMessage',
            'Your subscription is pending payment completion. Complete your payment to continue using all features.'
          ),
          buttonText: t('payment:completePayment', 'Complete Payment'),
          icon: <IconLock size={40} />,
          gradient: { from: 'blue', to: 'cyan' },
        }
      case STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE_EXPIRED:
        return {
          title: t('payment:subscriptionExpired', 'Subscription Expired'),
          message: t('payment:cannotAccessTriven'),
          description: t(
            'payment:incompleteExpiredMessage',
            'Your subscription setup has expired. Please start a new subscription to continue using Triven.'
          ),
          buttonText: t('payment:startNewSubscription', 'Start New Subscription'),
          icon: <IconLock size={40} />,
          gradient: { from: 'gray', to: 'red' },
        }
      case STRIPE_SUBSCRIPTION_STATUSES.PAUSED:
        return {
          title: t('payment:subscriptionPaused', 'Subscription Paused'),
          message: t('payment:cannotAccessTriven'),
          description: t(
            'payment:pausedMessage',
            'Your subscription is currently paused. Please resume your subscription to continue using Triven.'
          ),
          buttonText: t('payment:resumeSubscription', 'Resume Subscription'),
          icon: <IconLock size={40} />,
          gradient: { from: 'blue', to: 'gray' },
        }
      case SUBSCRIPTION_MODAL_MODES.NO_SUBSCRIPTION:
        return {
          title: t('payment:noActiveSubscription', 'No Active Subscription'),
          message: t('payment:cannotAccessTriven'),
          description: t(
            'payment:noSubscriptionMessage',
            'You need an active subscription to access Triven. Please choose a plan to continue.'
          ),
          buttonText: t('payment:choosePlan', 'Choose Plan'),
          icon: <IconLock size={40} />,
          gradient: { from: 'red', to: 'orange' },
        }
      default: // trial-expired (covers trialing status with expired trial)
        return {
          title: t('payment:trialPeriodExpired'),
          message: t('payment:cannotAccessTriven'),
          description: t('payment:trialEndedMessage'),
          buttonText: t('payment:upgradeTo', { planName: currentPlan }),
          icon: <IconLock size={40} />,
          gradient: { from: 'red', to: 'orange' },
        }
    }
  }

  const modalContent = getModalContent()

  // Fetch config on mount using fetcher
  useEffect(() => {
    if (configFetcher.state === 'idle' && !configFetcher.data) {
      configFetcher.load('/api/config')
    }
  }, [configFetcher])

  // Handle subscription creation using fetcher
  const handleUpgrade = async () => {
    setIsButtonLoading(true)

    // For trial expired, redirect to billing page with stripe payment
    if (mode === SUBSCRIPTION_MODAL_MODES.TRIAL_EXPIRED && subscription) {
      window.location.href = `/billing?plan=${subscription.planId}`
      return
    }

    // For no subscription, redirect to billing page with the selected plan
    if (mode === SUBSCRIPTION_MODAL_MODES.NO_SUBSCRIPTION) {
      window.location.href = `/billing?plan=${currentPlan.toLowerCase()}`
      return
    }

    // For cancelled or incomplete subscriptions, redirect to billing page to complete payment
    if (
      (mode === STRIPE_SUBSCRIPTION_STATUSES.CANCELED ||
        mode === STRIPE_SUBSCRIPTION_STATUSES.INCOMPLETE) &&
      subscription
    ) {
      // Redirect to billing page with the subscription plan
      const action = mode === STRIPE_SUBSCRIPTION_STATUSES.CANCELED ? 'reactivate' : 'complete'
      window.location.href = `/billing?action=${action}&plan=${subscription.planId}`
      return
    }

    // For past_due or unpaid subscriptions, show payment method update modal immediately
    if (
      (mode === STRIPE_SUBSCRIPTION_STATUSES.PAST_DUE ||
        mode === STRIPE_SUBSCRIPTION_STATUSES.UNPAID) &&
      subscription
    ) {
      setShowPaymentMethodModal(true)
      setIsButtonLoading(false)
      return
    }

    // Fetch config first
    if (!configFetcher.data) {
      configFetcher.load('/api/config')
    }

    // For other statuses, use the default upgrade flow
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

  // Handle reactivation success
  const handleReactivationSuccess = () => {
    setShowReactivateModal(false)

    // Force page reload to ensure cancelAtPeriodEnd is updated
    // The webhook needs time to process and update the database
    window.location.reload()
  }

  // Handle payment method update success
  const handlePaymentMethodUpdateSuccess = () => {
    console.log('💳 Payment method updated successfully, reloading page...')
    setShowPaymentMethodModal(false)

    // Force page reload to ensure subscription status updates
    window.location.reload()
  }

  // Handle Stripe form submission readiness
  const handleStripeSubmitReady = useCallback(
    (submitFunction: () => Promise<void>, isReady: boolean) => {
      setStripeSubmit(() => submitFunction)
      setIsStripeReady(isReady)
    },
    []
  )

  // Handle Pay button click
  const handlePayClick = async () => {
    if (!stripeSubmit) {
      notifications.show({
        title: t('payment:error', 'Error'),
        message: t('payment:paymentNotReady', 'Payment form is not ready. Please try again.'),
        color: 'red',
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      await stripeSubmit()
    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessingPayment(false)
    }
  }

  // Handle fetcher state changes
  useEffect(() => {
    if (paymentFetcher.state === 'idle' && paymentFetcher.data) {
      setIsButtonLoading(false) // Reset button loading when fetcher completes

      if ('error' in paymentFetcher.data) {
        // Handle error
        const error = (paymentFetcher.data as { error: unknown }).error
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
  }, [paymentFetcher.state, paymentFetcher.data, t])

  // Determine loading state
  const isLoadingPayment = paymentFetcher.state !== 'idle' || configFetcher.state !== 'idle'

  const handlePaymentSuccess = async () => {
    setIsProcessingPayment(true)

    // Don't reload - keep modal open with loading state
    // The Layout component will close the modal when SSE confirms subscription is active
    // Just revalidate to get latest data
    revalidator.revalidate()
  }

  const handlePaymentError = (error: string) => {
    setIsProcessingPayment(false)
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
    <>
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
            // Initial status screen
            <>
              {/* Icon */}
              <Center mb="xl">
                <div className={classes.iconContainer}>
                  <ThemeIcon
                    size={50}
                    radius="xl"
                    variant="gradient"
                    gradient={modalContent.gradient}
                    className={classes.lockIcon}
                  >
                    {modalContent.icon}
                  </ThemeIcon>
                </div>
              </Center>

              {/* Title */}
              <Title order={2} ta="center" mb="md" className={classes.title}>
                {modalContent.title}
              </Title>

              {/* Main Message */}
              <Text ta="center" size="lg" mb="xl" className={classes.message}>
                {modalContent.message}
              </Text>

              {/* Description */}
              <Text ta="center" c="dimmed" mb="xl" size="sm">
                {modalContent.description}
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
                  loading={isButtonLoading || isLoadingPayment}
                  disabled={isButtonLoading || isLoadingPayment}
                >
                  {isButtonLoading || isLoadingPayment
                    ? t('payment:setupPayment')
                    : modalContent.buttonText}
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
                <>
                  <Title order={2} mb="lg">
                    {t('payment:completePayment', 'Complete Payment')}
                  </Title>
                  <StripePayment
                    clientSecret={paymentFetcher.data.clientSecret}
                    amount={paymentFetcher.data.amount}
                    currency={paymentFetcher.data.currency}
                    planName={paymentFetcher.data.planName}
                    publishableKey={configFetcher.data.stripePublicKey}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isProcessing={isProcessingPayment}
                    onSubmitReady={handleStripeSubmitReady}
                    // Trial conversion parameters
                    subscriptionId={subscription?.id}
                    isTrialConversion={mode === SUBSCRIPTION_MODAL_MODES.TRIAL_EXPIRED}
                    planId={currentPlan.toLowerCase()}
                    interval={INTERVALS.MONTHLY}
                  />
                  <Stack gap="md" mt="xl">
                    <Button
                      size="lg"
                      fullWidth
                      onClick={handlePayClick}
                      gradient={{ from: 'teal', to: 'blue' }}
                      variant="gradient"
                      leftSection={<IconLock size={20} />}
                      loading={isProcessingPayment}
                      disabled={isProcessingPayment || !isStripeReady}
                    >
                      {isProcessingPayment ? t('payment:processing') : t('payment:pay', 'Pay')}
                    </Button>
                    <Text ta="center" size="xs" c="dimmed">
                      {t('payment:securePayment', 'Your payment is secure and encrypted')}
                    </Text>
                  </Stack>
                </>
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

      {/* Reactivate Subscription Modal for cancelled subscriptions */}
      {showReactivateModal && (
        <ReactivateSubscriptionModal
          opened={showReactivateModal}
          onClose={() => setShowReactivateModal(false)}
          onSuccess={handleReactivationSuccess}
          cancelledPlan={currentPlan}
        />
      )}

      {/* Payment Method Edit Modal for past_due/unpaid subscriptions */}
      {showPaymentMethodModal && subscription && configFetcher.data && (
        <PaymentMethodEditModal
          isOpen={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          onSuccess={handlePaymentMethodUpdateSuccess}
          subscription={subscription}
          config={configFetcher.data}
        />
      )}
    </>
  )
}
