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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    // Less than 1 minute
    if (diffInMinutes < 1) {
      return 'Just now'
    }
    // Less than 1 hour
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
    }
    // Less than 24 hours
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
    }
    // Less than 7 days
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
    }
    // More than 7 days - show full date with time
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
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
                  <Box mb={6}>
                    <Text size="sm" fw={600}>
                      {comment.user.name || comment.user.email}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {formatDateTime(comment.createdAt)}
                    </Text>
                  </Box>
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
