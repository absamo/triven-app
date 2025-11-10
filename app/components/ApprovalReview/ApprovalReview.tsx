// T034: Approval review component
import { useState, useEffect } from 'react'
import {
  Stack,
  Group,
  Button,
  Textarea,
  Select,
  Alert,
  Badge,
  Text,
  Paper,
  Title,
  Divider,
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconClock, IconUser } from '@tabler/icons-react'
import { useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ApprovalRequest } from '@prisma/client'

interface ApprovalReviewProps {
  approval: ApprovalRequest & {
    requestedByUser?: { name?: string | null; email: string }
    assignedToUser?: { name?: string | null; email: string }
    assignedToRole?: { name: string }
  }
  onSuccess?: () => void
  onCancel?: () => void
}

const priorityColors = {
  Low: 'gray',
  Medium: 'blue',
  High: 'orange',
  Critical: 'red',
  Urgent: 'red',
}

const statusColors = {
  pending: 'yellow',
  in_review: 'blue',
  approved: 'green',
  rejected: 'red',
  escalated: 'orange',
  expired: 'gray',
  cancelled: 'gray',
  more_info_required: 'cyan',
}

export default function ApprovalReview({
  approval,
  onSuccess,
  onCancel,
}: ApprovalReviewProps) {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  
  const [decision, setDecision] = useState<string>('')
  const [decisionReason, setDecisionReason] = useState('')
  const [notes, setNotes] = useState('')

  // Handle successful submission
  useEffect(() => {
    if (fetcher.data?.success && onSuccess) {
      onSuccess()
    }
  }, [fetcher.data, onSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!decision) {
      return
    }

    const payload = {
      decision,
      decisionReason: decisionReason || undefined,
      notes: notes || undefined,
    }

    fetcher.submit(payload, {
      method: 'post',
      action: `/api/approvals/${approval.id}/review`,
      encType: 'application/json',
    })
  }

  const isSubmitting = fetcher.state === 'submitting'
  const hasError = fetcher.data?.error
  const requiresReason = decision !== '' && decision !== 'approved'

  // Check if approval can be reviewed
  const canReview = ['pending', 'in_review', 'more_info_required'].includes(approval.status)

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={3}>{approval.title}</Title>
            <Group gap="xs">
              <Badge color={priorityColors[approval.priority as keyof typeof priorityColors]}>
                {approval.priority}
              </Badge>
              <Badge color={statusColors[approval.status as keyof typeof statusColors]}>
                {t(`approvals.status.${approval.status}`)}
              </Badge>
            </Group>
          </Group>

          {approval.description && (
            <Text size="sm" c="dimmed">
              {approval.description}
            </Text>
          )}

          <Divider my="xs" />

          <Group gap="xl">
            <Group gap="xs">
              <IconUser size={16} />
              <Text size="sm">
                <strong>{t('approvals.requestedBy')}:</strong>{' '}
                {approval.requestedByUser?.name || approval.requestedByUser?.email}
              </Text>
            </Group>

            <Group gap="xs">
              <IconClock size={16} />
              <Text size="sm">
                <strong>{t('approvals.requestedAt')}:</strong>{' '}
                {new Date(approval.requestedAt).toLocaleString()}
              </Text>
            </Group>
          </Group>

          {(approval.assignedToUser || approval.assignedToRole) && (
            <Text size="sm">
              <strong>{t('approvals.assignedTo')}:</strong>{' '}
              {approval.assignedToUser
                ? approval.assignedToUser.name || approval.assignedToUser.email
                : approval.assignedToRole?.name}
            </Text>
          )}

          {approval.expiresAt && (
            <Alert color="yellow" icon={<IconClock size={16} />}>
              <Text size="sm">
                <strong>{t('approvals.expiresAt')}:</strong>{' '}
                {new Date(approval.expiresAt).toLocaleString()}
              </Text>
            </Alert>
          )}
        </Stack>
      </Paper>

      {!canReview && (
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          {t('approvals.cannotReview', { status: approval.status })}
        </Alert>
      )}

      {canReview && (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Title order={4}>{t('approvals.reviewDecision')}</Title>

            {hasError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
                {fetcher.data.error}
                {fetcher.data.details && (
                  <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {JSON.stringify(fetcher.data.details, null, 2)}
                  </pre>
                )}
              </Alert>
            )}

            {fetcher.data?.success && (
              <Alert icon={<IconCheck size={16} />} color="green" title={t('common.success')}>
                {t('approvals.reviewSubmitted')}
              </Alert>
            )}

            <Select
              label={t('approvals.decision')}
              placeholder={t('approvals.selectDecision')}
              required
              data={[
                { value: 'approved', label: t('approvals.decision.approved') },
                { value: 'rejected', label: t('approvals.decision.rejected') },
                { value: 'more_info_required', label: t('approvals.decision.moreInfoRequired') },
                { value: 'escalated', label: t('approvals.decision.escalated') },
                { value: 'delegated', label: t('approvals.decision.delegated') },
                {
                  value: 'conditional_approval',
                  label: t('approvals.decision.conditionalApproval'),
                },
              ]}
              value={decision}
              onChange={(value) => setDecision(value || '')}
              disabled={isSubmitting}
            />

            <Textarea
              label={t('approvals.decisionReason')}
              placeholder={t('approvals.decisionReasonPlaceholder')}
              required={requiresReason}
              rows={3}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              disabled={isSubmitting}
              description={
                requiresReason ? t('approvals.decisionReasonRequired') : undefined
              }
            />

            <Textarea
              label={t('approvals.additionalNotes')}
              placeholder={t('approvals.additionalNotesPlaceholder')}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />

            <Group justify="flex-end" mt="md">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!decision || (requiresReason && !decisionReason)}
              >
                {t('approvals.submitReview')}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Stack>
  )
}
