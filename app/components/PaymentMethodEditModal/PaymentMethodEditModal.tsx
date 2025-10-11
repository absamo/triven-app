import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCreditCard } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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

  const handlePaymentMethodUpdate = async (paymentMethodId: string) => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/payment-method-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          paymentMethodId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment method')
      }

      notifications.show({
        title: t('paymentMethodUpdated', 'Payment Method Updated'),
        message: data.message || 'Your payment method has been updated successfully',
        color: 'green',
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Payment method update error:', error)
      notifications.show({
        title: t('payment:paymentFailed', 'Error'),
        message: error instanceof Error ? error.message : 'Failed to update payment method',
        color: 'red',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
    }
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
            backgroundColor: colorScheme === 'dark'
              ? 'var(--mantine-color-dark-6)'
              : 'var(--mantine-color-blue-0)',
            borderRadius: '8px',
            padding: 'var(--mantine-spacing-md)',
            border: `1px solid ${
              colorScheme === 'dark'
                ? 'var(--mantine-color-dark-4)'
                : 'var(--mantine-color-blue-2)'
            }`,
          }}
        >
          <Text size="sm" fw={500} mb="xs">
            {t('updatePaymentMethodInfo', 'Update Payment Method')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('updatePaymentMethodDescription', 'Add a new payment method for your subscription. Your current payment method will be replaced.')}
          </Text>
        </div>

        {/* Payment Form Placeholder */}
        <div
          style={{
            backgroundColor: colorScheme === 'dark'
              ? 'var(--mantine-color-dark-8)'
              : 'var(--mantine-color-gray-0)',
            borderRadius: '8px',
            padding: 'var(--mantine-spacing-xl)',
            textAlign: 'center',
            border: `1px dashed ${
              colorScheme === 'dark'
                ? 'var(--mantine-color-dark-4)'
                : 'var(--mantine-color-gray-4)'
            }`,
          }}
        >
          <Text size="sm" c="dimmed" mb="md">
            Stripe Elements payment form will be integrated here
          </Text>
          <Text size="xs" c="dimmed">
            This will allow users to securely update their payment method
          </Text>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          marginTop: '16px', 
          paddingTop: '16px', 
          borderTop: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}` 
        }}>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              color="blue"
              loading={isProcessing}
              disabled={true} // Disabled until Stripe integration is complete
            >
              {t('updatePaymentMethod', 'Update Payment Method')}
            </Button>
          </Group>
        </div>
      </Stack>
    </Modal>
  )
}