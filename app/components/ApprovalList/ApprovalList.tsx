// T035: Approval list component with filters

import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Indicator,
  Loader,
  Menu,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import type { ApprovalRequest } from '@prisma/client'
import {
  IconAlertCircle,
  IconCheck,
  IconDots,
  IconEye,
  IconFilter,
  IconPlugConnected,
  IconRefresh,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApprovalSSE } from '~/app/hooks/useApprovalSSE'

interface ApprovalListProps {
  userId?: string
  showFilters?: boolean
  onApprovalClick?: (approval: ApprovalRequest) => void
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

export default function ApprovalList({
  userId,
  showFilters = true,
  onApprovalClick,
}: ApprovalListProps) {
  const navigate = useNavigate()

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  const fetchApprovals = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (userId) params.append('userId', userId)

      params.append('limit', itemsPerPage.toString())
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString())

      const response = await fetch(`/api/approvals?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch approvals')
      }

      const data = await response.json()
      setApprovals(data.approvals || [])
      setTotalCount(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, entityTypeFilter, searchQuery, currentPage, userId])

  // Real-time SSE updates
  const { isConnected } = useApprovalSSE({
    onUpdate: () => {
      console.log('[Approval List] Received real-time approval update')
      // Refresh list when approval status changes
      fetchApprovals()
    },
    autoRevalidate: false,
  })

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const handleViewApproval = (approval: ApprovalRequest) => {
    if (onApprovalClick) {
      onApprovalClick(approval)
    } else {
      navigate(`/approvals/${approval.id}`)
    }
  }

  const handleQuickAction = async (approvalId: string, decision: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })

      if (!response.ok) {
        throw new Error('Failed to update approval')
      }

      // Refresh the list
      fetchApprovals()
    } catch (err) {
      console.error('Quick action failed:', err)
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setPriorityFilter('')
    setEntityTypeFilter('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  if (loading && approvals.length === 0) {
    return (
      <Center p="xl">
        <Loader size="lg" />
      </Center>
    )
  }

  return (
    <Stack gap="md">
      {showFilters && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>
              <Group gap="xs">
                <IconFilter size={20} />
                <span>Filters</span>
              </Group>
            </Title>
            <Group gap="xs">
              <Indicator
                color={isConnected ? 'green' : 'red'}
                size={8}
                position="top-end"
                offset={5}
              >
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconPlugConnected size={16} />}
                  disabled
                  style={{ cursor: 'default' }}
                >
                  {isConnected ? 'Live' : 'Offline'}
                </Button>
              </Indicator>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconRefresh size={16} />}
                onClick={fetchApprovals}
              >
                Refresh
              </Button>
              <Button variant="subtle" size="xs" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Group>
          </Group>

          <Group gap="md">
            <TextInput
              placeholder="Search by title..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />

            <Select
              placeholder="Status"
              clearable
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_review', label: 'In Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'escalated', label: 'Escalated' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'more_info_required', label: 'More Info Required' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              style={{ minWidth: 150 }}
            />

            <Select
              placeholder="Priority"
              clearable
              data={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
                { value: 'Urgent', label: 'Urgent' },
              ]}
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value || '')}
              style={{ minWidth: 130 }}
            />

            <Select
              placeholder="Entity Type"
              clearable
              data={[
                { value: 'purchase_order', label: 'Purchase Order' },
                { value: 'sales_order', label: 'Sales Order' },
                { value: 'stock_adjustment', label: 'Stock Adjustment' },
                { value: 'transfer_order', label: 'Transfer Order' },
                { value: 'invoice', label: 'Invoice' },
                { value: 'bill', label: 'Bill' },
                { value: 'customer', label: 'Customer' },
                { value: 'supplier', label: 'Supplier' },
                { value: 'product', label: 'Product' },
                { value: 'payment_made', label: 'Payment Made' },
                { value: 'payment_received', label: 'Payment Received' },
              ]}
              value={entityTypeFilter}
              onChange={(value) => setEntityTypeFilter(value || '')}
              style={{ minWidth: 180 }}
            />
          </Group>
        </Paper>
      )}

      {error && (
        <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-6)' }}>
          <Group gap="xs">
            <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
            <Text c="red">{error}</Text>
          </Group>
        </Paper>
      )}

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Priority</Table.Th>
              <Table.Th>Entity Type</Table.Th>
              <Table.Th>Requested At</Table.Th>
              <Table.Th>Assigned To</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {approvals.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="xl">
                    No approvals found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              approvals.map((approval) => (
                <Table.Tr key={approval.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {approval.title}
                    </Text>
                    {approval.description && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {approval.description}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={statusColors[approval.status as keyof typeof statusColors]}
                      variant="light"
                      size="sm"
                    >
                      {approval.status.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={priorityColors[approval.priority as keyof typeof priorityColors]}
                      variant="dot"
                      size="sm"
                    >
                      {approval.priority}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{approval.entityType.replace('_', ' ')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(approval.requestedAt).toLocaleDateString()}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(approval.requestedAt).toLocaleTimeString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {approval.assignedTo ? 'User' : 'Role'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleViewApproval(approval)}
                        title="View Details"
                      >
                        <IconEye size={18} />
                      </ActionIcon>

                      {['pending', 'in_review', 'more_info_required'].includes(approval.status) && (
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDots size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconCheck size={16} />}
                              onClick={() => handleQuickAction(approval.id, 'approved')}
                            >
                              Quick Approve
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconX size={16} />}
                              color="red"
                              onClick={() => handleQuickAction(approval.id, 'rejected')}
                            >
                              Quick Reject
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {totalPages > 1 && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} approvals
            </Text>
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={setCurrentPage}
              size="sm"
            />
          </Group>
        )}
      </Paper>
    </Stack>
  )
}
