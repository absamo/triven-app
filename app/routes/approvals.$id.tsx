/**
 * T071: Approval detail page with full approval information, review form, comment history, email log history
 * T080: Approval request history/audit trail showing status changes, reassignments, reviews
 */
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  Timeline,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconMail,
  IconUserCheck,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useFetcher, useLoaderData } from 'react-router'
import { ErrorBoundary as ErrorBoundaryComponent } from '~/app/components/ErrorBoundary'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'

export { ErrorBoundaryComponent as ErrorBoundary }

interface ReassignmentData {
  reassignment: {
    timestamp: string
    reason: string
    originalAssignee: string
    newAssignee: string
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getBetterAuthUser(request)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const approvalId = params.id
  if (!approvalId) {
    throw new Response('Approval ID required', { status: 400 })
  }

  // Get approval with all relationships
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      requestedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
      },
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToRole: {
        select: {
          id: true,
          name: true,
        },
      },
      workflowInstance: {
        include: {
          workflowTemplate: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      emailLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!approval) {
    throw new Response('Approval not found', { status: 404 })
  }

  // Get user's role to check if admin
  const userWithRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: {
        select: {
          name: true,
          permissions: true,
        },
      },
    },
  })

  const isAdmin =
    userWithRole?.role?.name === 'Admin' ||
    userWithRole?.role?.permissions.includes('admin_orphaned_approvals')

  // Verify user has access to this approval (requester, assignee, role member, or admin)
  const hasAccess =
    isAdmin ||
    approval.requestedBy === user.id ||
    approval.assignedTo === user.id ||
    (approval.assignedRole &&
      (await prisma.user.count({
        where: {
          id: user.id,
          roleId: approval.assignedRole,
        },
      })) > 0)

  if (!hasAccess) {
    throw new Response('Access denied', { status: 403 })
  }

  // T047: Mark related notification as read when approval is viewed
  await prisma.notification.updateMany({
    where: {
      approvalRequestId: approvalId,
      recipientId: user.id,
      read: false,
    },
    data: {
      read: true,
    },
  })

  return { approval, currentUserId: user.id }
}

export default function ApprovalDetailPage() {
  const { approval, currentUserId } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const [decisionReason, setDecisionReason] = useState('')

  const isAssignedUser = approval.assignedTo === currentUserId
  const canReview = isAssignedUser && approval.status === 'pending'
  const isSubmitting = fetcher.state !== 'idle'

  // Check for errors from fetcher
  const hasError = fetcher.data && 'error' in fetcher.data

  const handleReview = (decision: 'approved' | 'rejected' | 'more_info_required') => {
    fetcher.submit(
      { decision, decisionReason },
      {
        method: 'POST',
        action: `/api/approvals/${approval.id}/review`,
        encType: 'application/json',
      }
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'Urgent':
        return 'red'
      case 'High':
        return 'orange'
      case 'Medium':
        return 'blue'
      case 'Low':
        return 'gray'
      default:
        return 'blue'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow'
      case 'approved':
        return 'green'
      case 'rejected':
        return 'red'
      case 'cancelled':
        return 'gray'
      case 'expired':
        return 'orange'
      default:
        return 'gray'
    }
  }

  return (
    <Stack gap="lg" p="xl">
      {/* Header */}
      <Paper p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Group gap="xs" mb="xs">
              <Title order={2}>{approval.title}</Title>
              <Badge color={getStatusColor(approval.status)}>{approval.status}</Badge>
              <Badge color={getPriorityColor(approval.priority || 'Medium')}>
                {approval.priority}
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Requested by {approval.requestedByUser?.name || approval.requestedByUser?.email} •{' '}
              {new Date(approval.requestedAt).toLocaleString()}
            </Text>
          </div>
        </Group>

        <Divider my="md" />

        <Stack gap="sm">
          <Group>
            <Text fw={500}>Entity Type:</Text>
            <Text>{approval.entityType}</Text>
          </Group>
          <Group>
            <Text fw={500}>Request Type:</Text>
            <Text>{approval.requestType}</Text>
          </Group>
          {approval.description && (
            <div>
              <Text fw={500} mb="xs">
                Description:
              </Text>
              <Text>{approval.description}</Text>
            </div>
          )}
          {approval.assignedToUser && (
            <Group>
              <Text fw={500}>Assigned To:</Text>
              <Text>{approval.assignedToUser.name || approval.assignedToUser.email}</Text>
            </Group>
          )}
          {approval.assignedToRole && (
            <Group>
              <Text fw={500}>Assigned Role:</Text>
              <Text>{approval.assignedToRole.name}</Text>
            </Group>
          )}
          {approval.expiresAt && (
            <Group>
              <Text fw={500}>Expires At:</Text>
              <Text>{new Date(approval.expiresAt).toLocaleString()}</Text>
            </Group>
          )}
          {approval.decision && (
            <>
              <Group>
                <Text fw={500}>Decision:</Text>
                <Badge
                  color={
                    approval.decision === 'approved'
                      ? 'green'
                      : approval.decision === 'rejected'
                        ? 'red'
                        : 'yellow'
                  }
                >
                  {approval.decision}
                </Badge>
              </Group>
              {approval.decisionReason && (
                <div>
                  <Text fw={500} mb="xs">
                    Decision Reason:
                  </Text>
                  <Text>{approval.decisionReason}</Text>
                </div>
              )}
            </>
          )}
        </Stack>
      </Paper>
      {/* Review Actions */}
      {canReview && (
        <Card withBorder>
          <Stack gap="md">
            <Title order={4}>Review Request</Title>

            {/* Error Alert */}
            {hasError && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Error"
                color="red"
                withCloseButton
                onClose={() => fetcher.submit(null, { method: 'get' })}
              >
                {(fetcher.data as { error?: string })?.error ||
                  'Failed to submit review. Please try again.'}
              </Alert>
            )}

            <Textarea
              label="Decision Reason"
              placeholder="Provide a reason for your decision..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.currentTarget.value)}
              minRows={3}
              disabled={isSubmitting}
              required
            />
            <Group>
              <Button
                leftSection={
                  isSubmitting ? <Loader size={16} color="white" /> : <IconCheck size={16} />
                }
                color="green"
                onClick={() => handleReview('approved')}
                loading={isSubmitting}
                disabled={isSubmitting || !decisionReason.trim()}
              >
                Approve
              </Button>
              <Button
                leftSection={
                  isSubmitting ? <Loader size={16} color="white" /> : <IconX size={16} />
                }
                color="red"
                onClick={() => handleReview('rejected')}
                loading={isSubmitting}
                disabled={isSubmitting || !decisionReason.trim()}
              >
                Reject
              </Button>
              <Button
                leftSection={
                  isSubmitting ? (
                    <Loader size={16} color="white" />
                  ) : (
                    <IconAlertTriangle size={16} />
                  )
                }
                color="orange"
                variant="outline"
                onClick={() => handleReview('more_info_required')}
                loading={isSubmitting}
                disabled={isSubmitting || !decisionReason.trim()}
              >
                Request More Info
              </Button>
            </Group>
          </Stack>
        </Card>
      )}{' '}
      {/* T080: History/Audit Trail */}
      <Card withBorder>
        <Title order={4} mb="md">
          Approval History
        </Title>
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {/* Creation */}
          <Timeline.Item bullet={<IconClock size={12} />} title="Created">
            <Text size="sm" c="dimmed">
              {new Date(approval.requestedAt).toLocaleString()}
            </Text>
            <Text size="sm">
              Created by {approval.requestedByUser?.name || approval.requestedByUser?.email}
            </Text>
          </Timeline.Item>

          {/* Email logs (reminders, notifications) */}
          {approval.emailLogs
            .filter((log) => log.deliveryStatus === 'sent')
            .map((log) => (
              <Timeline.Item
                key={log.id}
                bullet={<IconMail size={12} />}
                title={`Email: ${log.emailType.replace(/_/g, ' ')}`}
              >
                <Text size="sm" c="dimmed">
                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                </Text>
                <Text size="sm">Sent to {log.recipientEmail}</Text>
              </Timeline.Item>
            ))}

          {/* Reassignments (from data field) */}
          {approval.data &&
            typeof approval.data === 'object' &&
            'reassignment' in approval.data && (
              <Timeline.Item bullet={<IconArrowRight size={12} />} title="Reassigned">
                <Text size="sm" c="dimmed">
                  {new Date(
                    (approval.data as unknown as ReassignmentData).reassignment.timestamp
                  ).toLocaleString()}
                </Text>
                <Text size="sm">
                  Reason: {(approval.data as unknown as ReassignmentData).reassignment.reason}
                </Text>
              </Timeline.Item>
            )}

          {/* Review/Decision */}
          {approval.reviewedAt && (
            <Timeline.Item
              bullet={<IconUserCheck size={12} />}
              title={
                approval.decision === 'approved'
                  ? 'Approved'
                  : approval.decision === 'rejected'
                    ? 'Rejected'
                    : 'More Information Requested'
              }
              color={
                approval.decision === 'approved'
                  ? 'green'
                  : approval.decision === 'rejected'
                    ? 'red'
                    : 'orange'
              }
            >
              <Text size="sm" c="dimmed">
                {new Date(approval.reviewedAt).toLocaleString()}
              </Text>
              {approval.decisionReason && <Text size="sm">Reason: {approval.decisionReason}</Text>}
            </Timeline.Item>
          )}

          {/* Completion */}
          {approval.completedAt && (
            <Timeline.Item bullet={<IconCheck size={12} />} title="Completed" color="green">
              <Text size="sm" c="dimmed">
                {new Date(approval.completedAt).toLocaleString()}
              </Text>
            </Timeline.Item>
          )}

          {/* Orphaned */}
          {approval.orphaned && approval.orphanedAt && (
            <Timeline.Item bullet={<IconAlertTriangle size={12} />} title="Orphaned" color="red">
              <Text size="sm" c="dimmed">
                {new Date(approval.orphanedAt).toLocaleString()}
              </Text>
              <Text size="sm">No active assignees available</Text>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>
      {/* Comments */}
      {approval.comments.length > 0 && (
        <Card withBorder>
          <Title order={4} mb="md">
            Comments
          </Title>
          <Stack gap="md">
            {approval.comments.map((comment) => (
              <Paper key={comment.id} p="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text fw={500} size="sm">
                    {comment.author.name || comment.author.email}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(comment.createdAt).toLocaleString()}
                  </Text>
                </Group>
                <Text size="sm">{comment.comment}</Text>
              </Paper>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
