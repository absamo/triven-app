import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import type { FeatureStatus, FeatureWithVotes } from '~/app/lib/roadmap/types'
import { FeatureCard } from './FeatureCard'
import classes from './Roadmap.module.css'

interface KanbanColumnProps {
  title: string
  status: FeatureStatus
  color: string
  features: FeatureWithVotes[]
  isAdmin?: boolean
}

export function KanbanColumn({
  title,
  status,
  color,
  features,
  isAdmin = false,
}: KanbanColumnProps) {
  return (
    <Paper className={classes.kanbanColumn} shadow="xs" radius="lg" withBorder>
      <div className={classes.columnHeader}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={3} size="h5" fw={600}>
            {title}
          </Title>
          <Badge color={color} variant="light" size="md" circle>
            {features.length}
          </Badge>
        </Group>
      </div>

      <div className={classes.columnBody}>
        {features.length === 0 ? (
          <div className={classes.emptyState}>
            <Text c="dimmed" size="sm" ta="center">
              No features yet
            </Text>
          </div>
        ) : (
          <Stack gap="xs">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} isAdmin={isAdmin} />
            ))}
          </Stack>
        )}
      </div>
    </Paper>
  )
}
