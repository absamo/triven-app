import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CancellationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subscription: {
    id: string
    planId: string
    status: string
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
  }
}

export default function CancellationModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
}: CancellationModalProps) {
  const { t } = useTranslation(['payment'])
  const { colorScheme } = useMantineColorScheme()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true)
  const [reason, setReason] = useState('')

  const handleCancel = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/subscription-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          cancelAtPeriodEnd,
          reason: reason.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Cancellation error:', error)
      notifications.show({
        title: t('payment:paymentFailed', 'Error'),
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
        color: 'red',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setReason('')
      setCancelAtPeriodEnd(true)
      onClose()
    }
  }

  const periodEndDate = dayjs(subscription.currentPeriodEnd * 1000).format('MMM DD, YYYY')

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      centered
      size="lg"
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="var(--mantine-color-orange-7)" />
          <Text fw={600}>{t('confirmCancellation', 'Confirm Cancellation')}</Text>
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
      <Stack gap="xl">
        {/* Warning Message */}
        <div
          style={{
            backgroundColor:
              colorScheme === 'dark'
                ? 'var(--mantine-color-dark-6)'
                : 'var(--mantine-color-orange-0)',
            border: `1px solid ${
              colorScheme === 'dark'
                ? 'var(--mantine-color-dark-4)'
                : 'var(--mantine-color-orange-2)'
            }`,
            borderRadius: '8px',
            padding: 'var(--mantine-spacing-md)',
          }}
        >
          <Text size="sm" fw={500} mb="xs">
            {t('cancellationWarning', 'Are you sure you want to cancel your subscription?')}
          </Text>
          <Text size="xs" c="dimmed">
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd
              ? 'You currently have an active subscription with access to all features.'
              : subscription.cancelAtPeriodEnd
                ? 'Your subscription is already scheduled for cancellation.'
                : 'This action cannot be undone.'}
          </Text>
        </div>

        {/* Current Status */}
        {subscription.cancelAtPeriodEnd && (
          <div
            style={{
              backgroundColor:
                colorScheme === 'dark'
                  ? 'var(--mantine-color-dark-8)'
                  : 'var(--mantine-color-blue-0)',
              borderRadius: '8px',
              padding: 'var(--mantine-spacing-sm)',
              border: `1px solid ${
                colorScheme === 'dark'
                  ? 'var(--mantine-color-dark-5)'
                  : 'var(--mantine-color-blue-2)'
              }`,
            }}
          >
            <Group justify="space-between" align="center">
              <div>
                <Text size="sm" fw={500}>
                  Subscription already scheduled for cancellation
                </Text>
                <Text size="xs" c="dimmed">
                  {t(
                    'subscriptionScheduledForCancellation',
                    'Your subscription is scheduled for cancellation at the end of your billing period'
                  )}
                </Text>
              </div>
              <Badge variant="light" color="orange" size="sm">
                Ending {periodEndDate}
              </Badge>
            </Group>
          </div>
        )}

        {/* Cancellation Options - only show if not already scheduled for cancellation */}
        {!subscription.cancelAtPeriodEnd && (
          <>
            <Stack gap="lg">
              <Text size="sm" fw={500}>
                Cancellation Options
              </Text>

              <Stack gap="md">
                <Checkbox
                  checked={cancelAtPeriodEnd}
                  onChange={(event) => setCancelAtPeriodEnd(event.currentTarget.checked)}
                  label={
                    <div style={{ paddingLeft: '8px' }}>
                      <Text size="sm" mb={4}>
                        {t('cancelAtPeriodEnd', 'Cancel at period end')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t(
                          'cancelAtPeriodEndDescription',
                          'Your subscription will remain active until {{date}}, then be cancelled',
                          { date: periodEndDate }
                        )}
                      </Text>
                    </div>
                  }
                  styles={{
                    body: { alignItems: 'flex-start' },
                    input: { marginTop: '2px' },
                  }}
                />

                <Checkbox
                  checked={!cancelAtPeriodEnd}
                  onChange={(event) => setCancelAtPeriodEnd(!event.currentTarget.checked)}
                  label={
                    <div style={{ paddingLeft: '8px' }}>
                      <Text size="sm" mb={4}>
                        {t('cancelImmediately', 'Cancel immediately')}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t(
                          'cancelImmediatelyDescription',
                          'Your subscription will be cancelled immediately and you will lose access now'
                        )}
                      </Text>
                    </div>
                  }
                  styles={{
                    body: { alignItems: 'flex-start' },
                    input: { marginTop: '2px' },
                  }}
                />
              </Stack>
            </Stack>

            {/* Reason for cancellation */}
            <div style={{ marginTop: '16px' }}>
              <Textarea
                label={t('cancellationReason', 'Reason for cancellation (optional)')}
                placeholder="Help us improve by sharing why you're cancelling..."
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
          }}
        >
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={handleClose} disabled={isProcessing}>
              {subscription.cancelAtPeriodEnd
                ? 'Close'
                : t('keepSubscription', 'Keep Subscription')}
            </Button>

            {!subscription.cancelAtPeriodEnd && (
              <Button color="red" loading={isProcessing} onClick={handleCancel}>
                {t('proceedWithCancellation', 'Proceed with Cancellation')}
              </Button>
            )}
          </Group>
        </div>
      </Stack>
    </Modal>
  )
}
