import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  Progress,
  Select,
  Stack,
  Text,
  TextInput,
  Timeline,
  Title,
} from '@mantine/core'
import {
  IconCheck,
  IconClock,
  IconFilter,
  IconGitBranch,
  IconPlayerPlay,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useLoaderData, useNavigate } from 'react-router'
import { formatLocalizedDate } from '~/app/lib/dayjs'

interface WorkflowStepExecution {
  id: string
  status: string
  assignedTo?: string
  assigneeName?: string
  completedAt?: string
  decision?: string
  notes?: string
  timeoutAt?: string
  workflowStep: {
    name: string
    stepType: string
    stepNumber: number
  }
}

interface WorkflowInstance {
  id: string
  status: string
  entityType: string
  entityId: string
  currentStepNumber?: number
  startedAt: string
  completedAt?: string
  cancelledAt?: string
  data: Record<string, any>
  workflowTemplate: {
    name: string
    description: string
    steps: Array<{
      stepNumber: number
      name: string
      stepType: string
    }>
  }
  stepExecutions: WorkflowStepExecution[]
  triggeredBy: {
    email: string
    profile?: { firstName?: string; lastName?: string }
  }
}

export default function WorkflowInstancesPage() {
  const { t, i18n } = useTranslation(['workflows', 'common'])
  const navigate = useNavigate()
  const { workflowInstances } = useLoaderData<{
    workflowInstances: WorkflowInstance[]
  }>()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null)

  const fetcher = useFetcher()

  const filteredInstances = (workflowInstances || []).filter((instance: WorkflowInstance) => {
    if (
      searchQuery &&
      !instance.workflowTemplate.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !instance.entityId.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    if (statusFilter && instance.status !== statusFilter) return false
    if (entityTypeFilter && instance.entityType !== entityTypeFilter) return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'blue'
      case 'in_progress':
        return 'orange'
      case 'completed':
        return 'green'
      case 'cancelled':
        return 'red'
      case 'failed':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'gray'
      case 'assigned':
        return 'blue'
      case 'in_progress':
        return 'orange'
      case 'completed':
        return 'green'
      case 'skipped':
        return 'yellow'
      case 'failed':
        return 'red'
      case 'timeout':
        return 'red'
      default:
        return 'gray'
    }
  }

  const calculateProgress = (instance: WorkflowInstance) => {
    const totalSteps = instance.workflowTemplate.steps.length
    const completedSteps = instance.stepExecutions.filter(
      (exec) => exec.status === 'completed'
    ).length
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  }

  const formatEntityType = (entityType: string) => {
    return entityType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }

  return (
    <Container size="xl" py="md" w={'100%'}>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>Workflow Instances</Title>
          <Text c="dimmed" size="sm">
            Track and manage running workflows
          </Text>
        </div>
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          onClick={() => navigate('/workflow-templates')}
        >
          Create Workflow
        </Button>
      </Group>

      {/* Filters */}
      <Paper p="xl" withBorder mb="xl" radius="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconFilter size={18} />
            <Title order={4}>Filter Instances</Title>
          </Group>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter(null)
              setEntityTypeFilter(null)
            }}
          >
            Clear Filters
          </Button>
        </Group>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconFilter size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              placeholder="Filter by status"
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'failed', label: 'Failed' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              placeholder="Filter by entity type"
              data={[
                { value: 'purchase_order', label: 'Purchase Order' },
                { value: 'sales_order', label: 'Sales Order' },
                { value: 'stock_adjustment', label: 'Stock Adjustment' },
                { value: 'transfer_order', label: 'Transfer Order' },
                { value: 'invoice', label: 'Invoice' },
                { value: 'bill', label: 'Bill' },
              ]}
              value={entityTypeFilter}
              onChange={setEntityTypeFilter}
              clearable
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Workflow Instances */}
      {filteredInstances.length > 0 ? (
        <Stack gap="md">
          {filteredInstances.map((instance: WorkflowInstance) => (
            <Card
              key={instance.id}
              shadow="sm"
              padding="xl"
              radius="lg"
              withBorder
              onClick={() => navigate(`/workflow-instances/${instance.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Header */}
              <Group justify="space-between" mb="md">
                <div>
                  <Group gap="sm" align="center" mb="xs">
                    <IconGitBranch size={20} />
                    <Text size="lg" fw={600}>
                      {instance.workflowTemplate.name}
                    </Text>
                    <Badge variant="light" color={getStatusColor(instance.status)} size="sm">
                      {instance.status.replace('_', ' ')}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {formatEntityType(instance.entityType)} #{instance.entityId}
                  </Text>
                </div>
                <Group gap="sm">
                  <Badge variant="outline" size="sm">
                    {formatEntityType(instance.entityType)}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    Started {formatLocalizedDate(instance.startedAt, i18n.language, 'L')}
                  </Text>
                </Group>
              </Group>

              {/* Progress */}
              <Group mb="md">
                <Progress
                  value={calculateProgress(instance)}
                  size="sm"
                  style={{ flex: 1 }}
                  color={getStatusColor(instance.status)}
                />
                <Text size="xs" c="dimmed">
                  {instance.stepExecutions.filter((exec) => exec.status === 'completed').length} of{' '}
                  {instance.workflowTemplate.steps.length} steps
                </Text>
              </Group>

              {/* Timeline Preview */}
              <Paper
                p="md"
                withBorder
                radius="md"
                style={{ backgroundColor: 'var(--mantine-color-default)' }}
              >
                <Text size="sm" fw={500} mb="sm">
                  Workflow Progress
                </Text>
                <Timeline
                  active={
                    instance.currentStepNumber
                      ? instance.currentStepNumber - 1
                      : instance.workflowTemplate.steps.length
                  }
                >
                  {instance.workflowTemplate.steps.map((step) => {
                    const execution = instance.stepExecutions.find(
                      (exec) => exec.workflowStep.stepNumber === step.stepNumber
                    )
                    const isActive = instance.currentStepNumber === step.stepNumber
                    const isCompleted = execution && execution.status === 'completed'

                    return (
                      <Timeline.Item
                        key={step.stepNumber}
                        bullet={
                          isCompleted ? (
                            <IconCheck size={12} />
                          ) : isActive ? (
                            <IconClock size={12} />
                          ) : undefined
                        }
                        title={step.name}
                        color={isCompleted ? 'green' : isActive ? 'blue' : 'gray'}
                      >
                        <Group gap="xs" mt="xs">
                          <Badge size="xs" variant="outline">
                            {step.stepType.replace('_', ' ')}
                          </Badge>
                          {execution && (
                            <Badge size="xs" color={getStepStatusColor(execution.status)}>
                              {execution.status.replace('_', ' ')}
                            </Badge>
                          )}
                          {execution?.assigneeName && (
                            <Text size="xs" c="dimmed">
                              Assigned to {execution.assigneeName}
                            </Text>
                          )}
                        </Group>
                      </Timeline.Item>
                    )
                  })}
                </Timeline>
              </Paper>

              {/* Footer */}
              <Group justify="space-between" align="center" mt="md">
                <Text size="sm" c="dimmed">
                  Triggered by{' '}
                  {instance.triggeredBy.profile?.firstName || instance.triggeredBy.email}
                </Text>
                <Group gap="sm">
                  {instance.status === 'in_progress' && (
                    <ActionIcon
                      variant="light"
                      color="orange"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Navigate to approval interface
                        navigate(`/workflow-instances/${instance.id}/step`)
                      }}
                    >
                      <IconClock size={16} />
                    </ActionIcon>
                  )}
                  {instance.completedAt && (
                    <Text size="xs" c="dimmed">
                      Completed {formatLocalizedDate(instance.completedAt, i18n.language, 'L')}
                    </Text>
                  )}
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      ) : (
        /* Empty State */
        <Paper p="xl" withBorder radius="md">
          <Group justify="center" align="center" style={{ minHeight: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <IconGitBranch size={60} color="var(--mantine-color-dimmed)" />
              <Title order={4} c="dimmed" mb="xs" mt="md">
                No Workflow Instances
              </Title>
              <Text c="dimmed" size="sm" mb="lg">
                {filteredInstances.length === 0 && workflowInstances.length > 0
                  ? 'No instances match the current filters.'
                  : 'No workflows have been triggered yet. Create a workflow template to get started.'}
              </Text>
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                onClick={() => navigate('/workflow-templates')}
              >
                Create Workflow Template
              </Button>
            </div>
          </Group>
        </Paper>
      )}
    </Container>
  )
}
