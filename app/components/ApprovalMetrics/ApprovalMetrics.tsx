import { Badge, Card, Grid, Group, Progress, RingProgress, Stack, Text } from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconHourglass,
  IconTrendingUp,
  IconX,
} from '@tabler/icons-react'
import { useEffect } from 'react'
import { useFetcher } from 'react-router'
import { useApprovalSSE } from '~/app/hooks/useApprovalSSE'

interface ApprovalMetricsData {
  metrics: {
    totalApprovals: number
    pendingApprovals: number
    approvedCount: number
    rejectedCount: number
    avgResolutionTimeHours: number
    completionRate: number
    byPriority: {
      Critical: number
      Urgent: number
      High: number
      Medium: number
      Low: number
    }
    byStatus: {
      pending: number
      approved: number
      rejected: number
      expired: number
    }
    recent: {
      total: number
      completed: number
      pending: number
    }
  }
}

export function ApprovalMetrics() {
  const fetcher = useFetcher<ApprovalMetricsData>()

  // Fetch metrics on mount
  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load('/api/approvals/metrics')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh metrics when approval updates occur
  useApprovalSSE({
    onUpdate: () => {
      fetcher.load('/api/approvals/metrics')
    },
  })

  const metrics = fetcher.data?.metrics

  if (!metrics) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed">
          Loading metrics...
        </Text>
      </Card>
    )
  }

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`
    }
    if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`
    }
    return `${Math.round((hours / 24) * 10) / 10}d`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'red'
      case 'Urgent':
        return 'orange'
      case 'High':
        return 'yellow'
      case 'Medium':
        return 'blue'
      case 'Low':
        return 'gray'
      default:
        return 'gray'
    }
  }

  return (
    <Stack gap="md">
      <Text size="lg" fw={600}>
        Approval Metrics
      </Text>

      {/* Overview Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Pending
              </Text>
              <IconHourglass size={20} color="var(--mantine-color-orange-6)" />
            </Group>
            <Text size="xl" fw={700}>
              {metrics.pendingApprovals}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Out of {metrics.totalApprovals} total
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Approved
              </Text>
              <IconCheck size={20} color="var(--mantine-color-green-6)" />
            </Group>
            <Text size="xl" fw={700}>
              {metrics.approvedCount}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {metrics.totalApprovals > 0
                ? `${Math.round((metrics.approvedCount / metrics.totalApprovals) * 100)}%`
                : '0%'}{' '}
              approval rate
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Avg Resolution
              </Text>
              <IconClock size={20} color="var(--mantine-color-blue-6)" />
            </Group>
            <Text size="xl" fw={700}>
              {formatDuration(metrics.avgResolutionTimeHours)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Average processing time
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Completion Rate
              </Text>
              <IconTrendingUp size={20} color="var(--mantine-color-teal-6)" />
            </Group>
            <Text size="xl" fw={700}>
              {metrics.completionRate}%
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {metrics.approvedCount + metrics.rejectedCount} of {metrics.totalApprovals}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Pending by Priority */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" fw={600} mb="md">
          Pending by Priority
        </Text>
        <Stack gap="xs">
          {Object.entries(metrics.byPriority).map(([priority, count]) => (
            <Group key={priority} justify="space-between">
              <Group gap="xs">
                <Badge color={getPriorityColor(priority)} variant="dot" size="sm">
                  {priority}
                </Badge>
              </Group>
              <Text size="sm" fw={500}>
                {count}
              </Text>
            </Group>
          ))}
        </Stack>
      </Card>

      {/* Status Distribution */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text size="sm" fw={600} mb="md">
              Status Distribution
            </Text>
            <Group justify="center" mb="md">
              <RingProgress
                size={160}
                thickness={16}
                sections={[
                  {
                    value:
                      metrics.totalApprovals > 0
                        ? (metrics.byStatus.pending / metrics.totalApprovals) * 100
                        : 0,
                    color: 'orange',
                    tooltip: `Pending: ${metrics.byStatus.pending}`,
                  },
                  {
                    value:
                      metrics.totalApprovals > 0
                        ? (metrics.byStatus.approved / metrics.totalApprovals) * 100
                        : 0,
                    color: 'green',
                    tooltip: `Approved: ${metrics.byStatus.approved}`,
                  },
                  {
                    value:
                      metrics.totalApprovals > 0
                        ? (metrics.byStatus.rejected / metrics.totalApprovals) * 100
                        : 0,
                    color: 'red',
                    tooltip: `Rejected: ${metrics.byStatus.rejected}`,
                  },
                  {
                    value:
                      metrics.totalApprovals > 0
                        ? (metrics.byStatus.expired / metrics.totalApprovals) * 100
                        : 0,
                    color: 'gray',
                    tooltip: `Expired: ${metrics.byStatus.expired}`,
                  },
                ]}
                label={
                  <Text size="lg" fw={700} ta="center">
                    {metrics.totalApprovals}
                    <br />
                    <Text size="xs" c="dimmed" fw={400}>
                      Total
                    </Text>
                  </Text>
                }
              />
            </Group>
            <Stack gap={4}>
              <Group justify="space-between">
                <Group gap="xs">
                  <IconHourglass size={14} color="var(--mantine-color-orange-6)" />
                  <Text size="xs">Pending</Text>
                </Group>
                <Text size="xs" fw={500}>
                  {metrics.byStatus.pending}
                </Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs">
                  <IconCheck size={14} color="var(--mantine-color-green-6)" />
                  <Text size="xs">Approved</Text>
                </Group>
                <Text size="xs" fw={500}>
                  {metrics.byStatus.approved}
                </Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs">
                  <IconX size={14} color="var(--mantine-color-red-6)" />
                  <Text size="xs">Rejected</Text>
                </Group>
                <Text size="xs" fw={500}>
                  {metrics.byStatus.rejected}
                </Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs">
                  <IconAlertCircle size={14} color="var(--mantine-color-gray-6)" />
                  <Text size="xs">Expired</Text>
                </Group>
                <Text size="xs" fw={500}>
                  {metrics.byStatus.expired}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text size="sm" fw={600} mb="md">
              Last 30 Days
            </Text>
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Total Requests
                  </Text>
                  <Text size="xs" fw={500}>
                    {metrics.recent.total}
                  </Text>
                </Group>
                <Progress value={100} color="blue" size="sm" radius="xl" />
              </div>

              <div>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Completed
                  </Text>
                  <Text size="xs" fw={500}>
                    {metrics.recent.completed} (
                    {metrics.recent.total > 0
                      ? Math.round((metrics.recent.completed / metrics.recent.total) * 100)
                      : 0}
                    %)
                  </Text>
                </Group>
                <Progress
                  value={
                    metrics.recent.total > 0
                      ? (metrics.recent.completed / metrics.recent.total) * 100
                      : 0
                  }
                  color="green"
                  size="sm"
                  radius="xl"
                />
              </div>

              <div>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    Pending
                  </Text>
                  <Text size="xs" fw={500}>
                    {metrics.recent.pending} (
                    {metrics.recent.total > 0
                      ? Math.round((metrics.recent.pending / metrics.recent.total) * 100)
                      : 0}
                    %)
                  </Text>
                </Group>
                <Progress
                  value={
                    metrics.recent.total > 0
                      ? (metrics.recent.pending / metrics.recent.total) * 100
                      : 0
                  }
                  color="orange"
                  size="sm"
                  radius="xl"
                />
              </div>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
