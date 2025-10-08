import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
  useMantineColorScheme,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  IconCircleX,
  IconEye,
  IconFileText,
  IconMessageCircle,
  IconRefresh,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface ApprovalComment {
  id: string
  comment: string
  author: { profile: { firstName: string; lastName: string } }
  createdAt: string
  isInternal: boolean
}

interface ApprovalRequest {
  id: string
  title: string
  description: string
  entityType: string
  status: string
  priority: string
  requestedAt: string
  expiresAt: string
  decisionReason?: string
  requestedByUser: {
    email: string
    profile?: { firstName?: string; lastName?: string }
  }
  assignedToUser?: {
    email: string
    profile?: { firstName?: string; lastName?: string }
  }
  assignedToRole?: { name: string }
  data: Record<string, any>
  comments?: ApprovalComment[]
}

interface ApprovalActionModalProps {
  opened: boolean
  onClose: () => void
  request: ApprovalRequest | null
  actionType: 'review' | 'add_review' | 'reject' | 'reopen' | null
  onSubmit: (data: {
    action: string
    requestId: string
    status?: string
    decisionReason?: string
    notes?: string
    comment?: string
    isInternal?: boolean
  }) => Promise<void>
  loading?: boolean
}

export default function ApprovalActionModal({
  opened,
  onClose,
  request,
  actionType,
  onSubmit,
  loading = false,
}: ApprovalActionModalProps) {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation(['approvals', 'common'])

  const form = useForm({
    initialValues: {
      status: '',
      decisionReason: '',
      notes: '',
      comment: '',
      isInternal: false,
    },
    validate: {
      decisionReason: (value) => {
        // Only require reason for rejections and reopenings, not for approvals
        if ((actionType === 'reject' || actionType === 'reopen') && !value?.trim()) {
          return actionType === 'reject'
            ? t('approvals:modal.rejectionReasonRequiredError')
            : t('approvals:modal.reopeningReasonRequiredError')
        }
        return null
      },
      comment: (value) => {
        if (actionType === 'add_review' && !value?.trim()) {
          return t('approvals:modal.commentRequiredError')
        }
        return null
      },
    },
  })

  if (!request) return null

  const handleSubmit = async (values: typeof form.values) => {
    const submitData: any = {
      action: actionType === 'add_review' ? 'add_comment' : 'approve',
      requestId: request.id,
    }

    if (actionType === 'add_review') {
      submitData.comment = values.comment
      submitData.isInternal = values.isInternal
    } else if (actionType === 'reopen') {
      submitData.status = 'reopen'
      submitData.decisionReason = values.decisionReason
      submitData.notes = values.notes
    } else {
      submitData.status = 'rejected' // Only rejection is handled by modal now
      submitData.decisionReason = values.decisionReason
      submitData.notes = values.notes
    }

    await onSubmit(submitData)
    form.reset()
    onClose()
  }

  const getActionTitle = () => {
    switch (actionType) {
      case 'reject':
        return t('approvals:modal.rejectRequest')
      case 'review':
        return t('approvals:modal.comments', 'Comments')
      case 'add_review':
        return t('approvals:modal.reviewRequest', 'Review Request')
      case 'reopen':
        return t('approvals:modal.reopenRequest')
      default:
        return t('approvals:modal.requestAction', 'Request Action')
    }
  }

  const getActionColor = () => {
    switch (actionType) {
      case 'reject':
        return 'red'
      case 'review':
        return 'blue'
      case 'add_review':
        return 'orange'
      case 'reopen':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getActionIcon = () => {
    switch (actionType) {
      case 'reject':
        return <IconCircleX size={20} />
      case 'review':
        return <IconMessageCircle size={20} />
      case 'add_review':
        return <IconEye size={20} />
      case 'reopen':
        return <IconRefresh size={20} />
      default:
        return <IconFileText size={20} />
    }
  }

  const formatEntityType = (entityType: string) => {
    return t(`approvals:entityTypes.${entityType}`, entityType)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'red'
      case 'Urgent':
        return 'red'
      case 'High':
        return 'orange'
      case 'Medium':
        return 'yellow'
      case 'Low':
        return 'blue'
      default:
        return 'gray'
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <ThemeIcon size="lg" radius="md" variant="light" color={getActionColor()}>
            {getActionIcon()}
          </ThemeIcon>
          <div>
            <Text size="lg" fw={600}>
              {getActionTitle()}
            </Text>
            <Text size="sm" c="dimmed">
              {request.title}
            </Text>
          </div>
        </Group>
      }
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
      centered
    >
      {/* Content Area */}
      <div style={{ minHeight: '400px' }}>
        {actionType === 'review' ? (
          // Show comments timeline for review action
          <ScrollArea style={{ height: '400px' }}>
            {request.comments && request.comments.length > 0 ? (
              <Timeline>
                {request.comments.map((comment) => (
                  <Timeline.Item
                    key={comment.id}
                    bullet={
                      <ThemeIcon
                        size="sm"
                        variant="light"
                        color={comment.isInternal ? 'orange' : 'blue'}
                      >
                        <IconMessageCircle size={12} />
                      </ThemeIcon>
                    }
                    title={
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {comment.author.profile.firstName} {comment.author.profile.lastName}
                        </Text>
                        {comment.isInternal && (
                          <Badge size="xs" color="orange">
                            {t('approvals:modal.internal')}
                          </Badge>
                        )}
                      </Group>
                    }
                  >
                    <Text size="sm" c="dimmed" mb="xs">
                      {new Date(comment.createdAt).toLocaleString()}
                    </Text>
                    <Text size="sm">{comment.comment}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                <ThemeIcon size={40} radius="md" variant="light" color="gray" mx="auto" mb="md">
                  <IconMessageCircle size={20} />
                </ThemeIcon>
                <Text c="dimmed" size="sm">
                  {t('approvals:modal.noComments')}
                </Text>
              </Paper>
            )}
          </ScrollArea>
        ) : (
          // Show action form for other actions
          <ScrollArea style={{ height: '400px' }}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Form fields based on action type */}
                {actionType === 'reject' && (
                  <Textarea
                    label={t('approvals:modal.rejectionReasonRequired')}
                    placeholder={t('approvals:modal.rejectionReasonPlaceholder')}
                    minRows={14}
                    autosize
                    {...form.getInputProps('decisionReason')}
                    error={form.errors.decisionReason}
                  />
                )}

                {actionType === 'reopen' && (
                  <>
                    <Textarea
                      label={t('approvals:modal.reasonForReopeningRequired')}
                      placeholder={t('approvals:modal.reopeningReasonPlaceholder')}
                      minRows={14}
                      autosize
                      {...form.getInputProps('decisionReason')}
                      error={form.errors.decisionReason}
                    />
                    <Select
                      label={t('approvals:modal.commentVisibility')}
                      data={[
                        { value: 'false', label: t('approvals:modal.publicComment') },
                        { value: 'true', label: t('approvals:modal.internalComment') },
                      ]}
                      value={form.values.isInternal.toString()}
                      onChange={(value) => form.setFieldValue('isInternal', value === 'true')}
                    />
                  </>
                )}

                {actionType === 'reopen' && (
                  <Textarea
                    label={t('approvals:modal.comment')}
                    placeholder={t('approvals:modal.commentPlaceholder')}
                    minRows={14}
                    autosize
                    {...form.getInputProps('notes')}
                  />
                )}

                {actionType === 'add_review' && (
                  <>
                    <Textarea
                      label={t('approvals:modal.comment', 'Comment')}
                      placeholder={t('approvals:modal.reviewCommentPlaceholder')}
                      minRows={10}
                      autosize
                      {...form.getInputProps('comment')}
                      error={form.errors.comment}
                    />
                    <Select
                      label={t('approvals:modal.commentVisibility')}
                      data={[
                        { value: 'false', label: t('approvals:modal.publicComment') },
                        { value: 'true', label: t('approvals:modal.internalComment') },
                      ]}
                      value={form.values.isInternal.toString()}
                      onChange={(value) => form.setFieldValue('isInternal', value === 'true')}
                    />
                  </>
                )}

                {/* Action buttons */}
                <Group justify="flex-end" gap="sm">
                  <Button variant="outline" onClick={onClose} disabled={loading}>
                    {t('approvals:modal.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    color={getActionColor()}
                    loading={loading}
                    leftSection={getActionIcon()}
                  >
                    {actionType === 'reject' && t('approvals:modal.rejectRequestButton')}
                    {actionType === 'add_review' &&
                      t('approvals:modal.addReviewComment', 'Add Review Comment')}
                    {actionType === 'reopen' && t('approvals:modal.reopenRequestButton')}
                  </Button>
                </Group>
              </Stack>
            </form>
          </ScrollArea>
        )}
      </div>
    </Modal>
  )
}
