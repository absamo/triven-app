import { Avatar, Box, Divider, Group, Modal, ScrollArea, Text, Timeline } from '@mantine/core'
import type { FeatureComment } from '~/app/lib/roadmap/types'

interface CommentsModalProps {
  opened: boolean
  onClose: () => void
  comments: FeatureComment[]
  featureTitle: string
}

export function CommentsModal({ opened, onClose, comments, featureTitle }: CommentsModalProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Comments - ${featureTitle}`} size="lg">
      <Divider mb="md" />

      <ScrollArea h={400}>
        {comments.length === 0 ? (
          <Box py="xl">
            <Text size="sm" c="dimmed" ta="center">
              No comments yet
            </Text>
          </Box>
        ) : (
          <Timeline active={comments.length} bulletSize={32} lineWidth={2}>
            {comments.map((comment) => (
              <Timeline.Item
                key={comment.id}
                bullet={
                  <Avatar size="sm" radius="xl" color="blue">
                    {getInitials(comment.user.name || comment.user.email)}
                  </Avatar>
                }
              >
                <Box mb="lg">
                  <Group gap="xs" mb={6}>
                    <Text size="sm" fw={600}>
                      {comment.user.name || comment.user.email}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </Group>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Text>
                </Box>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </ScrollArea>
    </Modal>
  )
}
