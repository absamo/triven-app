import {
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCreditCard, IconLock, IconShieldCheck } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import StripePayment from '~/app/components/StripePayment'

interface PaymentMethodEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subscription: {
    id: string
    planId: string
    interval: string
    amount: number
    currency: string
  }
  config: {
    stripePublicKey: string
  }
}

export default function PaymentMethodEditModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
  config,
}: PaymentMethodEditModalProps) {
  const { t } = useTranslation(['payment'])
  const { colorScheme } = useMantineColorScheme()
  const [isProcessing, setIsProcessing] = useState(false)
  const [stripeSubmit, setStripeSubmit] = useState<(() => Promise<void>) | null>(null)
  const [isStripeReady, setIsStripeReady] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false)
      setStripeSubmit(null)
      setIsStripeReady(false)
    }
  }, [isOpen])

  const handlePaymentSuccess = useCallback(() => {
    console.log('🎉 PaymentMethodEditModal: Payment method update succeeded, calling onSuccess')
    setIsProcessing(false)
    onSuccess()
    onClose()
  }, [onSuccess, onClose])

  const handlePaymentError = useCallback((error: string) => {
    setIsProcessing(false)
    notifications.show({
      title: t('payment:paymentFailed', 'Error'),
      message: error,
      color: 'red',
    })
  }, [t])

  const handleStripeSubmitReady = useCallback((submitFn: () => Promise<void>, isReady: boolean) => {
    setStripeSubmit(() => submitFn)
    setIsStripeReady(isReady)
  }, [])

  const handleUpdateClick = useCallback(async () => {
    if (stripeSubmit && isStripeReady) {
      setIsProcessing(true)
      await stripeSubmit()
    }
  }, [stripeSubmit, isStripeReady])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      centered
      size="xl"
      title={
        <Group gap="xs">
          <IconCreditCard size={20} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>{t('updatePaymentMethod', 'Update Payment Method')}</Text>
        </Group>
      }
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
        {/* Information */}
        <div
          style={{
            backgroundColor:
              colorScheme === 'dark'
                ? 'var(--mantine-color-dark-6)'
                : 'var(--mantine-color-blue-0)',
            borderRadius: '8px',
            padding: 'var(--mantine-spacing-md)',
            border: `1px solid ${
              colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-blue-2)'
            }`,
          }}
        >
          <Text size="sm" fw={500} mb="xs">
            {t('updatePaymentMethodInfo', 'Update Payment Method')}
          </Text>
          <Text size="xs" c="dimmed">
            {t(
              'updatePaymentMethodDescription',
              'Add a new payment method for your subscription. Your current payment method will be replaced.'
            )}
          </Text>
        </div>

        {/* Payment Form */}
        <StripePayment
          amount={0} // $0 for payment method updates
          currency={subscription.currency}
          planName="Payment Method Update"
          publishableKey={config.stripePublicKey}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          createPaymentPath="/api/payment-method-update"
          subscriptionId={subscription.id}
          isPaymentMethodUpdate={true}
          onSubmitReady={handleStripeSubmitReady}
        />

        {/* Update Button */}
        <Stack gap="xs">
          <Button
            size="lg"
            disabled={!isStripeReady || isProcessing}
            loading={isProcessing}
            gradient={{ from: 'teal', to: 'blue' }}
            variant="gradient"
            leftSection={isProcessing ? <Loader size="sm" /> : <IconLock size={20} />}
            onClick={handleUpdateClick}
            style={{ width: 'auto', minWidth: '200px', alignSelf: 'center' }}
          >
            {isProcessing ? t('processing', 'Processing...') : t('updateCard', 'Update Card')}
          </Button>

          {/* Security Notice */}
          <Group justify="center" gap="xs">
            <ThemeIcon size="sm" color="gray" variant="light">
              <IconShieldCheck size={14} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">
              {t('securePayment', 'Secure payment powered by Stripe')}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  )
}
