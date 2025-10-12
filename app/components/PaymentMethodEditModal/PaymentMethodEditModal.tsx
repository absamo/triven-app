import { Group, Modal, Stack, Text, useMantineColorScheme } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCreditCard } from '@tabler/icons-react'
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

  const handlePaymentSuccess = () => {
    console.log('🎉 PaymentMethodEditModal: Payment method update succeeded, calling onSuccess')
    onSuccess()
    onClose()
  }

  const handlePaymentError = (error: string) => {
    notifications.show({
      title: t('payment:paymentFailed', 'Error'),
      message: error,
      color: 'red',
    })
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      centered
      size="lg"
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
        />
      </Stack>
    </Modal>
  )
}
