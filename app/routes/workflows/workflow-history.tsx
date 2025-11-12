/**
 * T080: Workflow History Page
 * Displays approval request history/audit trail showing status changes, reassignments, and reviews
 */
import {
  ActionIcon,
  Badge,
  Card,
  Center,
  Container,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconEye, IconFilter, IconInbox } from '@tabler/icons-react'
import { useState } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { Link, useLoaderData } from 'react-router'
import { ErrorBoundary as ErrorBoundaryComponent } from '~/app/components/ErrorBoundary'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'

export { ErrorBoundaryComponent as ErrorBoundary }

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getBetterAuthUser(request)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
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

  // Only admins can see all approval history
  const isAdmin =
    userWithRole?.role?.name === 'Admin' ||
    userWithRole?.role?.permissions.includes('admin_orphaned_approvals')

  if (!isAdmin) {
    throw new Response('Forbidden: Only administrators can view workflow history', { status: 403 })
  }

  // Get all approval requests for the user's company with full history
  const approvals = await prisma.approvalRequest.findMany({
    where: {
      companyId: user.companyId,
    },
    include: {
      requestedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedToUser: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedToRole: {
        select: {
          name: true,
        },
      },
      workflowInstance: {
        include: {
          workflowTemplate: {
            select: {
              name: true,
            },
          },
        },
      },
      emailLogs: {
        select: {
          emailType: true,
          deliveryStatus: true,
          sentAt: true,
        },
      },
    },
    orderBy: {
      requestedAt: 'desc',
    },
    take: 100, // Limit to recent 100 for performance
  })

  return { approvals, currentUserId: user.id }
}

export default function WorkflowHistoryPage() {
  const { approvals } = useLoaderData<typeof loader>()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  const filteredApprovals = approvals.filter((approval) => {
    if (statusFilter && approval.status !== statusFilter) return false
    if (priorityFilter && approval.priority !== priorityFilter) return false
    return true
  })

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

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Workflow History</Title>
            <Text c="dimmed">View all approval requests and their complete history</Text>
          </div>
        </Group>

        {/* Filters */}
        <Card withBorder>
          <Group>
            <Select
              placeholder="All Statuses"
              leftSection={<IconFilter size={16} />}
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              style={{ width: 200 }}
            />
            <Select
              placeholder="All Priorities"
              leftSection={<IconFilter size={16} />}
              data={[
                { value: 'Critical', label: 'Critical' },
                { value: 'Urgent', label: 'Urgent' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
              value={priorityFilter}
              onChange={setPriorityFilter}
              clearable
              style={{ width: 200 }}
            />
          </Group>
        </Card>

        {/* History Table */}
        <Paper withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Priority</Table.Th>
                <Table.Th>Requested By</Table.Th>
                <Table.Th>Assigned To</Table.Th>
                <Table.Th>Requested</Table.Th>
                <Table.Th>Completed</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredApprovals.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <IconInbox size={48} stroke={1.5} color="var(--mantine-color-dimmed)" />
                        <div>
                          <Text ta="center" fw={500} mb="xs">
                            No approval history found
                          </Text>
                          <Text ta="center" c="dimmed" size="sm">
                            {statusFilter || priorityFilter
                              ? 'Try adjusting your filters'
                              : 'Approval requests will appear here once created'}
                          </Text>
                        </div>
                      </Stack>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredApprovals.map((approval) => (
                  <Table.Tr key={approval.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {approval.title}
                      </Text>
                      {approval.workflowInstance?.workflowTemplate && (
                        <Text size="xs" c="dimmed">
                          {approval.workflowInstance.workflowTemplate.name}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{approval.entityType}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(approval.status)} size="sm">
                        {approval.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getPriorityColor(approval.priority || 'Medium')} size="sm">
                        {approval.priority}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {approval.requestedByUser?.name ||
                          approval.requestedByUser?.email ||
                          'Unknown'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {approval.assignedToUser && (
                        <Text size="sm">
                          {approval.assignedToUser.name || approval.assignedToUser.email}
                        </Text>
                      )}
                      {approval.assignedToRole && (
                        <Badge variant="light" size="sm">
                          {approval.assignedToRole.name}
                        </Badge>
                      )}
                      {!approval.assignedToUser && !approval.assignedToRole && (
                        <Text size="sm" c="dimmed">
                          Unassigned
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(approval.requestedAt).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      {approval.completedAt ? (
                        <Text size="sm">{new Date(approval.completedAt).toLocaleDateString()}</Text>
                      ) : (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="View Details">
                        <ActionIcon
                          component={Link}
                          to={`/approvals/${approval.id}`}
                          variant="subtle"
                          color="blue"
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Summary Stats */}
        <Group grow>
          <Card withBorder>
            <Text size="sm" c="dimmed" mb="xs">
              Total Requests
            </Text>
            <Text size="xl" fw={700}>
              {approvals.length}
            </Text>
          </Card>
          <Card withBorder>
            <Text size="sm" c="dimmed" mb="xs">
              Pending
            </Text>
            <Text size="xl" fw={700} c="yellow">
              {approvals.filter((a) => a.status === 'pending').length}
            </Text>
          </Card>
          <Card withBorder>
            <Text size="sm" c="dimmed" mb="xs">
              Approved
            </Text>
            <Text size="xl" fw={700} c="green">
              {approvals.filter((a) => a.status === 'approved').length}
            </Text>
          </Card>
          <Card withBorder>
            <Text size="sm" c="dimmed" mb="xs">
              Rejected
            </Text>
            <Text size="xl" fw={700} c="red">
              {approvals.filter((a) => a.status === 'rejected').length}
            </Text>
          </Card>
        </Group>
      </Stack>
    </Container>
  )
}
