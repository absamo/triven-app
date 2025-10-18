import {
  Badge,
  Card,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconTrendingUp } from '@tabler/icons-react'

/**
 * Simplified demo version of Inventory Command Center
 * Shows mock data to demonstrate the widget functionality
 */
export default function InventoryCommandCenterDemo() {
  // Mock data for demonstration
  const mockHealthScore = 78
  const mockRating = 'good'

  const getHealthColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'green'
      case 'good':
        return 'teal'
      case 'fair':
        return 'yellow'
      case 'poor':
        return 'orange'
      case 'critical':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <Paper withBorder p="lg" radius="md" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={3}>🎯 Inventory Command Center</Title>
            <Text size="sm" c="dimmed">
              AI-powered insights and predictive alerts
            </Text>
          </div>
          <Badge size="lg" color="green" variant="dot">
            Live
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {/* Health Score */}
          <Card withBorder padding="lg">
            <Stack gap="md" align="center">
              <Text size="sm" fw={600} c="dimmed">
                HEALTH SCORE
              </Text>
              <RingProgress
                size={120}
                thickness={12}
                sections={[{ value: mockHealthScore, color: getHealthColor(mockRating) }]}
                label={
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xl" fw={700}>
                      {mockHealthScore}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {mockRating.toUpperCase()}
                    </Text>
                  </div>
                }
              />
              <Group gap="xs">
                <IconTrendingUp size={16} color="green" />
                <Text size="sm" c="green">
                  +5% vs last month
                </Text>
              </Group>
            </Stack>
          </Card>

          {/* Critical Alerts */}
          <Card withBorder padding="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={600} c="dimmed">
                  CRITICAL ALERTS
                </Text>
                <Badge color="red" size="sm">
                  3
                </Badge>
              </Group>

              <Stack gap="xs">
                <Group gap="xs">
                  <IconAlertTriangle size={16} color="red" />
                  <Text size="sm">Stockout risk: Widget A</Text>
                </Group>
                <Group gap="xs">
                  <IconAlertTriangle size={16} color="orange" />
                  <Text size="sm">Low stock: Product B</Text>
                </Group>
                <Group gap="xs">
                  <IconAlertTriangle size={16} color="orange" />
                  <Text size="sm">Dead stock detected</Text>
                </Group>
              </Stack>
            </Stack>
          </Card>

          {/* Revenue Opportunities */}
          <Card withBorder padding="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={600} c="dimmed">
                  REVENUE OPPORTUNITIES
                </Text>
                <Badge color="green" size="sm">
                  $12.5K
                </Badge>
              </Group>

              <Stack gap="xs">
                <Text size="sm">💡 Optimize pricing: +$5.2K</Text>
                <Text size="sm">📦 Prevent stockouts: +$4.8K</Text>
                <Text size="sm">🎯 Cross-sell: +$2.5K</Text>
              </Stack>
            </Stack>
          </Card>
        </SimpleGrid>

        <Text size="xs" c="dimmed" ta="center">
          This is a demo preview. Full widget implementation in progress.
        </Text>
      </Stack>
    </Paper>
  )
}
