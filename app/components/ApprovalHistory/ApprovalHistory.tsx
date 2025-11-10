import { Avatar, Badge, Group, Stack, Text, Timeline } from '@mantine/core'
import {
  IconCheck,
  IconClock,
  IconMessage,
  IconTransferOut,
  IconUser,
  IconX,
} from '@tabler/icons-react'
import type { ApprovalCommentData } from '~/app/types/workflow-approvals'

interface ApprovalData {
  id: string
  status: string
  requestedAt: string
  reviewedAt?: string | null
  completedAt?: string | null
  decision?: string | null
  decisionReason?: string | null
  requestedByUser: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  assignedToUser?: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  assignedToRole?: {
    id: string
    name: string
  } | null
}

interface ApprovalHistoryProps {
  approval: ApprovalData
  comments: ApprovalCommentData[]
}

interface TimelineEvent {
  timestamp: string
  type: 'created' | 'comment' | 'reassignment' | 'reviewed' | 'completed'
  title: string
  description?: string
  user?: {
    name: string | null
    email: string
    image: string | null
  }
  icon: React.ReactNode
  color: string
}

export function ApprovalHistory({ approval, comments }: ApprovalHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Build timeline events from approval and comments
  const events: TimelineEvent[] = []

  // 1. Approval created
  events.push({
    timestamp: approval.requestedAt,
    type: 'created',
    title: 'Approval Request Created',
    description: `Requested by ${approval.requestedByUser.name || approval.requestedByUser.email}`,
    user: approval.requestedByUser,
    icon: <IconUser size={16} />,
    color: 'blue',
  })

  // 2. Comments and reassignments
  comments.forEach((comment) => {
    const isReassignment = comment.comment.toLowerCase().includes('reassigned approval')

    events.push({
      timestamp: comment.createdAt,
      type: isReassignment ? 'reassignment' : 'comment',
      title: isReassignment ? 'Approval Reassigned' : 'Comment Added',
      description: comment.comment,
      user: comment.author,
      icon: isReassignment ? <IconTransferOut size={16} /> : <IconMessage size={16} />,
      color: isReassignment ? 'orange' : 'gray',
    })
  })

  // 3. Approval reviewed
  if (approval.reviewedAt) {
    const statusIcon =
      approval.decision === 'approved' ? <IconCheck size={16} /> : <IconX size={16} />
    const statusColor = approval.decision === 'approved' ? 'green' : 'red'

    events.push({
      timestamp: approval.reviewedAt,
      type: 'reviewed',
      title: `Approval ${approval.decision === 'approved' ? 'Approved' : 'Rejected'}`,
      description: approval.decisionReason || undefined,
      user: approval.assignedToUser || undefined,
      icon: statusIcon,
      color: statusColor,
    })
  }

  // 4. Approval completed
  if (approval.completedAt && approval.completedAt !== approval.reviewedAt) {
    events.push({
      timestamp: approval.completedAt,
      type: 'completed',
      title: 'Approval Process Completed',
      icon: <IconClock size={16} />,
      color: 'teal',
    })
  }

  // Sort events by timestamp (oldest first)
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <Stack gap="md">
      <Text size="sm" fw={600}>
        Approval History
      </Text>

      <Timeline active={events.length} bulletSize={32} lineWidth={2}>
        {events.map((event, index) => (
          <Timeline.Item
            key={`${event.type}-${index}`}
            bullet={event.icon}
            title={
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  {event.title}
                </Text>
                {event.type === 'reassignment' && (
                  <Badge size="xs" variant="light" color="orange">
                    Internal
                  </Badge>
                )}
              </Group>
            }
            color={event.color}
          >
            {event.user && (
              <Group gap="xs" mb={4}>
                <Avatar
                  src={event.user.image}
                  alt={event.user.name || event.user.email}
                  size="xs"
                  radius="xl"
                >
                  {(event.user.name || event.user.email).charAt(0).toUpperCase()}
                </Avatar>
                <Text size="xs" c="dimmed">
                  {event.user.name || event.user.email}
                </Text>
              </Group>
            )}

            {event.description && (
              <Text size="sm" c="dimmed" mb={4} style={{ whiteSpace: 'pre-wrap' }}>
                {event.description}
              </Text>
            )}

            <Text size="xs" c="dimmed">
              {formatDate(event.timestamp)}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  )
}
