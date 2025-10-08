import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle,
  IconCalendarTime,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconEye,
  IconFileText,
  IconFilter,
  IconMessageCircle,
  IconShoppingCart,
  IconTrendingUp,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useLoaderData, useRevalidator } from 'react-router'
import {
  ApprovalActionModal,
  CardsGridSkeleton,
  FiltersSkeleton,
  TableSkeleton,
} from '~/app/components'
import ClientOnly from '~/app/components/ClientOnly'
import { formatLocalizedDate } from '~/app/lib/dayjs'

interface ApprovalComment {
  id: string
  comment: string
  author: { profile: { firstName: string; lastName: string } }
  createdAt: string
  isInternal: boolean
}

interface CurrentUser {
  id: string
  email: string
  role?: { id: string; name: string } | null
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
  assignedToRole?: { id: string; name: string }
  data: Record<string, any>
  comments?: ApprovalComment[]
  workflowInstance?: {
    currentStepNumber: number | null
    status?: string
    workflowTemplate: {
      steps: Array<{
        stepNumber: number
        name: string
        stepType: string
      }>
    }
  } | null
  stepExecution?: {
    workflowStep: {
      stepNumber: number
      name: string
    }
  } | null
}

export default function ApprovalsPage() {
  const { colorScheme } = useMantineColorScheme()
  const { t, i18n } = useTranslation(['approvals', 'common'])
  const { approvalRequests, currentUser } = useLoaderData<{
    approvalRequests: ApprovalRequest[]
    currentUser: CurrentUser
  }>()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  // Modal state
  const [modalOpened, setModalOpened] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [actionType, setActionType] = useState<
    'review' | 'add_review' | 'reject' | 'reopen' | null
  >(null)

  // API interaction
  const fetcher = useFetcher()
  const revalidator = useRevalidator()
  const loading = fetcher.state === 'submitting'

  const filteredRequests = (approvalRequests || []).filter((request: ApprovalRequest) => {
    if (statusFilter && request.status !== statusFilter) return false
    if (entityTypeFilter && request.entityType !== entityTypeFilter) return false
    if (priorityFilter && request.priority !== priorityFilter) return false
    return true
  })

  // Permission checks
  const canUserActOnRequest = (request: ApprovalRequest) => {
    // User can act if they are assigned to the request directly
    if (request.assignedToUser?.email === currentUser?.email) return true

    // User can act if they have the assigned role
    if (!request.assignedToUser && request.assignedToRole && currentUser?.role) {
      if (request.assignedToRole.id === currentUser.role.id) return true
    }

    // Admins can always act (if they have admin role)
    if (currentUser?.role?.name === 'Admin') return true

    // Managers can act on requests from their team members
    if (currentUser?.role?.name?.includes('Manager')) return true

    return false
  }

  // Direct approval handler (bypasses modal)
  const handleDirectApproval = async (request: ApprovalRequest) => {
    if (!canUserActOnRequest(request)) {
      notifications.show({
        title: t('common:permissionDenied', 'Permission Denied'),
        message: t(
          'approvals:messages.noPermission',
          'You do not have permission to act on this approval request.'
        ),
        color: 'red',
      })
      return
    }

    await handleApprovalAction({
      action: 'approve',
      requestId: request.id,
      status: 'approved',
      // No reason required for approvals
    })
  }

  // Modal handlers (excludes approve action which is now handled directly)
  const openModal = (
    request: ApprovalRequest,
    action: 'review' | 'add_review' | 'reject' | 'reopen'
  ) => {
    if (!canUserActOnRequest(request) && action !== 'reopen') {
      notifications.show({
        title: t('common:permissionDenied', 'Permission Denied'),
        message: t(
          'approvals:messages.noPermission',
          'You do not have permission to act on this approval request.'
        ),
        color: 'red',
      })
      return
    }

    setSelectedRequest(request)
    setActionType(action)
    setModalOpened(true)
  }

  const closeModal = () => {
    setModalOpened(false)
    setSelectedRequest(null)
    setActionType(null)
  }

  // Handle approval actions
  const handleApprovalAction = async (data: {
    action: string
    requestId: string
    status?: string
    decisionReason?: string
    notes?: string
    comment?: string
    isInternal?: boolean
  }) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/approvals',
      })

      // Show success notification
      const actionVerb =
        data.action === 'add_comment'
          ? t('approvals:messages.commentedOn', 'commented on')
          : data.status === 'approved'
            ? t('approvals:messages.approved', 'approved')
            : data.status === 'rejected'
              ? t('approvals:messages.rejected', 'rejected')
              : data.status === 'reopen'
                ? t('approvals:messages.reopened', 'reopened')
                : t('approvals:messages.processed', 'processed')

      notifications.show({
        title: t('common:success', 'Success'),
        message: t('approvals:messages.requestActionSuccess', 'Request {{action}} successfully!', {
          action: actionVerb,
        }),
        color: 'green',
        autoClose: 3000, // Auto-close after 3 seconds
      })

      // Revalidate data to refresh the list with longer delay for workflow progression
      setTimeout(() => {
        revalidator.revalidate()
      }, 1000) // Increased to 1 second to allow workflow progression to complete
    } catch (error) {
      notifications.show({
        title: t('common:error', 'Error'),
        message: t(
          'approvals:messages.actionFailed',
          'Failed to process the approval action. Please try again.'
        ),
        color: 'red',
      })
    }
  }

  // Handle fetcher errors
  if (fetcher.data && fetcher.data.error) {
    notifications.show({
      title: t('common:error', 'Error'),
      message:
        fetcher.data.error ||
        t('approvals:messages.genericError', 'An error occurred while processing your request.'),
      color: 'red',
    })
  }

  // Enhanced dark mode aware gradient helpers using CSS custom properties
  const getFilterGradient = () => {
    // Use consistent gradient that works with Mantine's theme system
    return colorScheme === 'dark'
      ? 'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-6) 50%, var(--mantine-color-dark-5) 100%)'
      : 'linear-gradient(135deg, var(--mantine-color-gray-0) 0%, var(--mantine-color-gray-1) 50%, var(--mantine-color-gray-2) 100%)'
  }

  // Enhanced text color helpers for dark mode using consistent Mantine color tokens
  const getCardTextColor = () => {
    return colorScheme === 'dark' ? 'gray.0' : 'dark.8'
  }

  const getTitleColor = () => {
    return colorScheme === 'dark' ? 'gray.1' : 'gray.7'
  }

  // Helper functions for approval request display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'orange'
      case 'in_review':
        return 'blue'
      case 'approved':
        return 'green'
      case 'rejected':
        return 'red'
      case 'escalated':
        return 'purple'
      case 'expired':
        return 'gray'
      default:
        return 'gray'
    }
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

  const formatCurrency = (amount: number) => {
    // Use consistent formatting to prevent hydration mismatches
    return new Intl.NumberFormat(i18n.language, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatEntityType = (entityType: string) => {
    return t(`approvals:entityTypes.${entityType}`, entityType)
  }

  // Helper function to get workflow step progress
  const getWorkflowStepProgress = (request: ApprovalRequest) => {
    // Must have a workflow template with steps
    if (!request.workflowInstance?.workflowTemplate?.steps) {
      return null
    }

    const totalSteps = request.workflowInstance.workflowTemplate.steps.length

    // Prefer explicit stepExecution if available, otherwise fall back to workflowInstance.currentStepNumber
    // If the workflow is completed, `currentStepNumber` may be null; in that case we still want
    // to return progress (100%) so the caller can decide whether to hide the indicator.
    const hasStepExecution =
      request.stepExecution?.workflowStep?.stepNumber !== undefined &&
      request.stepExecution?.workflowStep?.stepNumber !== null
    let currentStep = hasStepExecution
      ? request.stepExecution!.workflowStep.stepNumber
      : request.workflowInstance.currentStepNumber

    // If workflow is completed but currentStep is null, set currentStep to totalSteps so progress shows 100%
    if (
      request.workflowInstance?.status === 'completed' &&
      (currentStep === null || currentStep === undefined)
    ) {
      currentStep = totalSteps
    }

    // If we still don't know the current step, bail out
    if (currentStep === null || currentStep === undefined) return null

    // For progress calculation:
    // - If workflow is completed, show 100%
    // - If on step N, it means steps 1 to N-1 are completed, and step N is in progress
    // - Progress = (completed steps / total steps) * 100
    const workflowStatus = request.workflowInstance.status
    let completedSteps = 0
    let progressDescription = ''

    if (workflowStatus === 'completed') {
      completedSteps = totalSteps
      progressDescription = t('approvals:workflowCompleted', 'Completed')
    } else if (workflowStatus === 'cancelled') {
      completedSteps = Math.max(0, currentStep - 1) // Steps before the current one were completed
      progressDescription = t('approvals:workflowCancelled', 'Cancelled')
    } else {
      // In progress: previous steps are completed, current step is active
      completedSteps = Math.max(0, currentStep - 1)
      // Use stepExecution name if available, otherwise a generic label
      progressDescription = request.stepExecution?.workflowStep?.name || `Step ${currentStep}`
    }

    return {
      currentStep,
      totalSteps,
      completedSteps,
      progressDescription,
      workflowStatus,
    }
  }

  // Step indicator component
  const StepIndicator = ({ request }: { request: ApprovalRequest }) => {
    const stepProgress = getWorkflowStepProgress(request)

    if (!stepProgress) return null

    const totalStepsSafe = Math.max(1, stepProgress.totalSteps)
    // Calculate progress based on completed steps
    const progressPercentage = (stepProgress.completedSteps / totalStepsSafe) * 100
    const isCompleted = stepProgress.workflowStatus === 'completed'
    const isCancelled = stepProgress.workflowStatus === 'cancelled'

    // Hide only when workflow is completed
    if (isCompleted) return null

    return (
      <Group gap="sm" align="center">
        <Badge
          variant="light"
          color={isCancelled ? 'red' : 'blue'}
          size="sm"
          leftSection={<IconClock size={12} />}
        >
          {isCancelled
            ? t('approvals:cancelled', 'Cancelled')
            : t('approvals:stepProgress', 'Step {{current}} of {{total}}', {
                current: stepProgress.currentStep,
                total: stepProgress.totalSteps,
              })}
        </Badge>
        {stepProgress.progressDescription && (
          <Text size="xs" c="dimmed" style={{ maxWidth: '120px' }}>
            {stepProgress.progressDescription}
          </Text>
        )}
      </Group>
    )
  }

  return (
    <ClientOnly
      fallback={
        <Container size="xl" py="md" w={'100%'}>
          <CardsGridSkeleton count={4} />
          <FiltersSkeleton columns={4} />
          <TableSkeleton rows={6} />
        </Container>
      }
    >
      <Container size="xl" py="md" w={'100%'}>
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={2} c={getTitleColor()}>
              {t('approvals:title', 'Approvals')}
            </Title>
            <Text c="dimmed" size="sm">
              {t('approvals:description', 'Review and manage approval requests')}
            </Text>
          </div>
        </Group>

        {/* Summary Cards */}
        <Grid gutter="lg" mb="xl">
          {/* 1. Pending */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              withBorder
              padding="lg"
              radius="md"
              style={{
                backgroundColor: colorScheme === 'dark' ? '#25262b' : '#f8f9fa',
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="gray.6" fw={700} tt="uppercase" mb="xs">
                    {t('approvals:statuses.pending')}
                  </Text>
                  <Text size="xl" fw={700} c={getCardTextColor()} mb="xs">
                    {filteredRequests.filter((r: ApprovalRequest) => r.status === 'pending').length}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('approvals:summary.pendingRequests', 'Pending requests')}
                  </Text>
                </div>
                <ThemeIcon size={48} radius="md" variant="light" color="gray">
                  <IconClock size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          {/* 2. In Review */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              withBorder
              padding="lg"
              radius="md"
              style={{
                backgroundColor: colorScheme === 'dark' ? '#1a2332' : '#e7f5ff',
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="blue.6" fw={700} tt="uppercase" mb="xs">
                    {t('approvals:statuses.in_review')}
                  </Text>
                  <Text size="xl" fw={700} c={getCardTextColor()} mb="xs">
                    {
                      filteredRequests.filter((r: ApprovalRequest) => r.status === 'in_review')
                        .length
                    }
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('approvals:summary.inReviewRequests', 'In review requests')}
                  </Text>
                </div>
                <ThemeIcon size={48} radius="md" variant="light" color="blue">
                  <IconEye size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          {/* 3. Approved */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              withBorder
              padding="lg"
              radius="md"
              style={{
                backgroundColor: colorScheme === 'dark' ? '#1a4a1a' : '#e6fffa',
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="green.6" fw={700} tt="uppercase" mb="xs">
                    {t('approvals:statuses.approved')}
                  </Text>
                  <Text size="xl" fw={700} c={getCardTextColor()} mb="xs">
                    {
                      filteredRequests.filter((r: ApprovalRequest) => r.status === 'approved')
                        .length
                    }
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('approvals:summary.approvedRequests', 'Approved requests')}
                  </Text>
                </div>
                <ThemeIcon size={48} radius="md" variant="light" color="green">
                  <IconCircleCheck size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>

          {/* 4. Rejected */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              withBorder
              padding="lg"
              radius="md"
              style={{
                backgroundColor: colorScheme === 'dark' ? '#4a1a1a' : '#fff5f5',
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <Text size="xs" c="red.6" fw={700} tt="uppercase" mb="xs">
                    {t('approvals:statuses.rejected')}
                  </Text>
                  <Text size="xl" fw={700} c={getCardTextColor()} mb="xs">
                    {
                      filteredRequests.filter((r: ApprovalRequest) => r.status === 'rejected')
                        .length
                    }
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('approvals:summary.rejectedRequests', 'Rejected requests')}
                  </Text>
                </div>
                <ThemeIcon size={48} radius="md" variant="light" color="red">
                  <IconCircleX size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Filters */}
        <Paper p="xl" withBorder mb="xl" radius="md" style={{ background: getFilterGradient() }}>
          <Group justify="space-between" mb="md">
            <Group>
              <ThemeIcon variant="light" color={colorScheme === 'dark' ? 'blue' : 'gray'} size="lg">
                <IconFilter size={18} />
              </ThemeIcon>
              <Title order={4} c={getTitleColor()}>
                {t('approvals:filters.title', 'Filter Requests')}
              </Title>
            </Group>
            <Button
              variant="subtle"
              size="xs"
              color={colorScheme === 'dark' ? 'blue' : 'gray'}
              onClick={() => {
                setStatusFilter(null)
                setEntityTypeFilter(null)
                setPriorityFilter(null)
              }}
            >
              {t('approvals:filters.clearFilters')}
            </Button>
          </Group>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                placeholder={t('approvals:filters.filterByStatus')}
                data={[
                  { value: 'pending', label: t('approvals:statuses.pending') },
                  { value: 'in_review', label: t('approvals:statuses.in_review') },
                  { value: 'approved', label: t('approvals:statuses.approved') },
                  { value: 'rejected', label: t('approvals:statuses.rejected') },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                clearable
                leftSection={<IconClock size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                placeholder={t('approvals:filters.filterByType')}
                data={[
                  { value: 'purchase_order', label: t('approvals:entityTypes.purchase_order') },
                  { value: 'stock_adjustment', label: t('approvals:entityTypes.stock_adjustment') },
                  { value: 'customer', label: t('approvals:entityTypes.customer') },
                  { value: 'transfer_order', label: t('approvals:entityTypes.transfer_order') },
                ]}
                value={entityTypeFilter}
                onChange={setEntityTypeFilter}
                clearable
                leftSection={<IconFileText size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                placeholder={t('approvals:filters.filterByPriority')}
                data={[
                  { value: 'Critical', label: t('approvals:priorities.critical') },
                  { value: 'High', label: t('approvals:priorities.high') },
                  { value: 'Medium', label: t('approvals:priorities.medium') },
                  { value: 'Low', label: t('approvals:priorities.low') },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                clearable
                leftSection={<IconAlertTriangle size={16} />}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Approval Requests List */}
        {filteredRequests.length > 0 ? (
          <Stack gap="md">
            {filteredRequests.map((request: ApprovalRequest) => (
              <Card
                key={request.id}
                shadow="sm"
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  background: getFilterGradient(),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                {/* Header with title and priority */}
                <Group justify="space-between" mb="md">
                  <div style={{ flex: 1 }}>
                    <Group gap="sm" align="center" mb="xs">
                      <ThemeIcon
                        size="lg"
                        radius="md"
                        variant="light"
                        color={
                          request.entityType === 'purchase_order'
                            ? 'blue'
                            : request.entityType === 'customer'
                              ? 'green'
                              : request.entityType === 'stock_adjustment'
                                ? 'orange'
                                : 'gray'
                        }
                      >
                        {request.entityType === 'purchase_order' ? (
                          <IconShoppingCart size={20} />
                        ) : request.entityType === 'customer' ? (
                          <IconUser size={20} />
                        ) : request.entityType === 'stock_adjustment' ? (
                          <IconTrendingUp size={20} />
                        ) : (
                          <IconFileText size={20} />
                        )}
                      </ThemeIcon>
                      <div>
                        <Text size="lg" fw={600} c={getCardTextColor()}>
                          {request.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatEntityType(request.entityType)}
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Badge variant="light" color={getStatusColor(request.status)} size="sm">
                        {t(
                          `approvals:statuses.${request.status}`,
                          request.status.charAt(0).toUpperCase() + request.status.slice(1)
                        )}
                      </Badge>
                      {(() => {
                        const wp = getWorkflowStepProgress(request)
                        // Only show step indicator when there's a workflow and it's not completed
                        if (wp && wp.workflowStatus !== 'completed') {
                          return <StepIndicator request={request} />
                        }
                        return null
                      })()}
                    </Group>
                  </div>
                  <Group gap="xs">
                    <Badge
                      color={getPriorityColor(request.priority)}
                      variant="gradient"
                      gradient={
                        request.priority === 'Critical' ? { from: 'red', to: 'pink' } : undefined
                      }
                      size="lg"
                    >
                      {t(
                        `approvals:priorities.${request.priority.toLowerCase()}`,
                        request.priority
                      )}
                    </Badge>
                  </Group>
                </Group>

                {/* Request description */}
                <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                  {request.description}
                </Text>

                {/* Metadata Grid */}
                <Grid gutter="md" mb="md">
                  <Grid.Col span={3}>
                    <Group gap="xs" align="center">
                      <ThemeIcon size="sm" variant="light" color="orange">
                        <IconCalendarTime size={12} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed" fw={500}>
                          {t('approvals:request.requestedDate', 'Requested date')}
                        </Text>
                        <Text size="sm" fw={500} c={getCardTextColor()}>
                          {formatLocalizedDate(request.requestedAt, i18n.language, 'L')}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Group gap="xs" align="center">
                      <ThemeIcon size="sm" variant="light" color="blue">
                        <IconUser size={12} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed" fw={500}>
                          {t('approvals:request.requestedBy')}
                        </Text>
                        <Text size="sm" fw={500} c={getCardTextColor()}>
                          {request.requestedByUser?.profile?.firstName ||
                            request.requestedByUser.email}{' '}
                          {request.requestedByUser?.profile?.lastName || ''}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Group gap="xs" align="center">
                      <ThemeIcon size="sm" variant="light" color="green">
                        <IconUsers size={12} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed" fw={500}>
                          {t('approvals:request.assignedTo')}
                        </Text>
                        <Text size="sm" fw={500} c={getCardTextColor()}>
                          {request.assignedToUser || request.assignedToRole
                            ? request.assignedToUser
                              ? `${request.assignedToUser?.profile?.firstName || request.assignedToUser.email} ${request.assignedToUser?.profile?.lastName || ''}`
                              : request.assignedToRole?.name
                            : t('approvals:request.unassigned')}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Group gap="xs" align="center">
                      <ThemeIcon size="sm" variant="light" color="red">
                        <IconClock size={12} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" c="dimmed" fw={500}>
                          {t('approvals:request.expiresOn', 'Expires on')}
                        </Text>
                        <Text size="sm" fw={500} c={getCardTextColor()}>
                          {formatLocalizedDate(request.expiresAt, i18n.language, 'L')}
                        </Text>
                      </div>
                    </Group>
                  </Grid.Col>
                </Grid>

                {/* Entity Details */}
                <Paper
                  p="md"
                  withBorder
                  radius="md"
                  style={{
                    backgroundColor:
                      colorScheme === 'dark'
                        ? 'var(--mantine-color-dark-6)'
                        : 'var(--mantine-color-gray-0)',
                  }}
                  mb="md"
                >
                  <Group justify="space-between" align="center">
                    <div>
                      <Text size="sm" fw={500} c={getCardTextColor()} mb="xs">
                        {t('approvals:entityDetails', '{{entityType}} Details', {
                          entityType: formatEntityType(request.entityType),
                        })}
                      </Text>
                      <Group gap="lg">
                        {request.data.amount && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.amount')}
                            </Text>
                            <Text size="sm" fw={600} c="blue.6">
                              €{formatCurrency(request.data.amount)}
                            </Text>
                          </div>
                        )}
                        {request.data.items && Array.isArray(request.data.items) && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.items')}
                            </Text>
                            <Text size="sm" fw={500} c={getCardTextColor()}>
                              {t('approvals:itemsCount', '{{count}} products', {
                                count: request.data.items.length,
                              })}
                            </Text>
                          </div>
                        )}
                        {request.data.products && Array.isArray(request.data.products) && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.products')}
                            </Text>
                            <Text size="sm" fw={500} c={getCardTextColor()}>
                              {t('approvals:productsCount', '{{count}} items', {
                                count: request.data.products.length,
                              })}
                            </Text>
                          </div>
                        )}
                        {request.data.supplier && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.supplier')}
                            </Text>
                            <Text size="sm" fw={500} c={getCardTextColor()}>
                              {request.data.supplier}
                            </Text>
                          </div>
                        )}
                        {request.data.companyName && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.company')}
                            </Text>
                            <Text size="sm" fw={500} c={getCardTextColor()}>
                              {request.data.companyName}
                            </Text>
                          </div>
                        )}
                        {request.data.fromSite && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.from')}
                            </Text>
                            <Text size="sm" fw={500} c={getCardTextColor()}>
                              {request.data.fromSite}
                            </Text>
                          </div>
                        )}
                        {request.data.toSite && (
                          <div>
                            <Text size="xs" c="dimmed" fw={500}>
                              {t('approvals:modal.to')}
                            </Text>
                            <Text size="sm" fw={500} c={getCardTextColor()}>
                              {request.data.toSite}
                            </Text>
                          </div>
                        )}
                      </Group>
                    </div>
                  </Group>
                </Paper>

                {/* Comments Preview */}
                <Group gap="xs" mb="md">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={() => openModal(request, 'review')}
                  >
                    <IconMessageCircle size={12} />
                  </ActionIcon>
                  <Text size="sm" c="dimmed">
                    {request.comments?.length || 0}{' '}
                    {(request.comments?.length || 0) === 1
                      ? t('approvals:request.comments')
                      : t('approvals:request.commentsPlural')}
                  </Text>
                  {request.comments &&
                    request.comments.some((c: ApprovalComment) => !c.isInternal) && (
                      <Badge size="xs" color="gray">
                        {t('approvals:commentVisibility.public', 'Public')}
                      </Badge>
                    )}
                  {request.comments &&
                    request.comments.some((c: ApprovalComment) => c.isInternal) && (
                      <Badge size="xs" color="gray">
                        {t('approvals:commentVisibility.internal', 'Internal')}
                      </Badge>
                    )}
                </Group>

                {/* Action Buttons */}
                <Group justify="flex-end" gap="sm">
                  {/* Status-specific action buttons */}
                  {(request.status === 'pending' || request.status === 'in_review') && (
                    <>
                      {request.status === 'pending' && (
                        <Button
                          variant="light"
                          size="sm"
                          color="orange"
                          leftSection={<IconEye size={16} />}
                          onClick={() => openModal(request, 'add_review')}
                          disabled={loading || !canUserActOnRequest(request)}
                        >
                          {t('approvals:actions.review', 'Review')}
                        </Button>
                      )}
                      <Button
                        color="green"
                        size="sm"
                        leftSection={<IconCircleCheck size={16} />}
                        onClick={() => handleDirectApproval(request)}
                        disabled={loading || !canUserActOnRequest(request)}
                      >
                        {t('approvals:actions.approve')}
                      </Button>
                      <Button
                        color="red"
                        variant="outline"
                        size="sm"
                        leftSection={<IconCircleX size={16} />}
                        onClick={() => openModal(request, 'reject')}
                        disabled={loading || !canUserActOnRequest(request)}
                      >
                        {t('approvals:actions.reject')}
                      </Button>
                    </>
                  )}
                </Group>

                {/* Reversal Actions for Final States */}
                {(request.status === 'approved' || request.status === 'rejected') &&
                  canUserActOnRequest(request) && (
                    <Group justify="flex-end" gap="sm">
                      <Button
                        variant="light"
                        size="sm"
                        color="orange"
                        leftSection={<IconAlertTriangle size={16} />}
                        onClick={() => openModal(request, 'reopen')}
                        disabled={loading}
                      >
                        {t('approvals:actions.reopenRequest', 'Reopen Request')}
                      </Button>
                    </Group>
                  )}
              </Card>
            ))}
          </Stack>
        ) : (
          /* Empty State Message */
          <Paper p="xl" withBorder radius="md" style={{ background: getFilterGradient() }}>
            <Group justify="center" align="center" style={{ minHeight: 200 }}>
              <div style={{ textAlign: 'center' }}>
                <ThemeIcon
                  size={60}
                  radius="md"
                  variant="light"
                  color={colorScheme === 'dark' ? 'blue' : 'gray'}
                  mx="auto"
                  mb="md"
                >
                  <IconFileText size={30} />
                </ThemeIcon>
                <Title order={4} c={getTitleColor()} mb="xs">
                  {t('approvals:messages.noRequests')}
                </Title>
                <Text c="dimmed" size="sm">
                  {(approvalRequests || []).length === 0
                    ? t(
                        'approvals:messages.noRequestsDescription',
                        'There are no approval requests to display at this time.'
                      )
                    : t(
                        'approvals:messages.noMatchingRequests',
                        'No requests match the current filters. Try adjusting your search criteria.'
                      )}
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        {/* Approval Action Modal */}
        <ApprovalActionModal
          opened={modalOpened}
          onClose={closeModal}
          request={selectedRequest}
          actionType={actionType}
          onSubmit={handleApprovalAction}
          loading={loading}
        />
      </Container>
    </ClientOnly>
  )
}
