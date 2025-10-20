import { ActionIcon, Badge, Card, Group, Stack, Text, Tooltip } from '@mantine/core'
import { IconArrowUp, IconEdit, IconTrash } from '@tabler/icons-react'
import type { FeatureWithVotes } from '~/app/lib/roadmap/types'
import classes from './Roadmap.module.css'

interface FeatureCardProps {
  feature: FeatureWithVotes
  isAdmin?: boolean
}

export function FeatureCard({ feature, isAdmin = false }: FeatureCardProps) {
  const truncateDescription = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return `${text.slice(0, maxLength)}...`
  }

  return (
    <Card shadow="none" padding="sm" radius="md" className={classes.featureCard} withBorder>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Text fw={500} size="sm" lineClamp={2} style={{ flex: 1 }}>
            {feature.title}
          </Text>
          {isAdmin && (
            <Group gap={2} wrap="nowrap">
              <ActionIcon size="xs" variant="subtle" color="gray" aria-label="Edit feature">
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" color="gray" aria-label="Delete feature">
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        {feature.description && (
          <Text size="xs" c="dimmed" lineClamp={2} className={classes.cardDescription}>
            {truncateDescription(feature.description, 120)}
          </Text>
        )}

        <Group justify="space-between" align="center" mt={4}>
          <Tooltip label="Upvote this feature" openDelay={300}>
            <Badge
              variant={feature.userHasVoted ? 'filled' : 'light'}
              color={feature.userHasVoted ? 'blue' : 'gray'}
              size="md"
              leftSection={<IconArrowUp size={12} />}
              className={classes.voteBadge}
            >
              {feature.voteCount}
            </Badge>
          </Tooltip>

          <Text size="xs" c="dimmed" className={classes.authorText}>
            {feature.createdBy.name || feature.createdBy.email.split('@')[0]}
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}
