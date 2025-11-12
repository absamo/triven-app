import { Avatar, Badge, Box, Button, Group, Stack, Text, Textarea, Tooltip } from '@mantine/core'
import { IconLock, IconSend } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { useApprovalSSE } from '~/app/hooks/useApprovalSSE'
import type { ApprovalCommentData } from '~/app/types/workflow-approvals'

interface ApprovalCommentsProps {
  approvalId: string
}

export function ApprovalComments({ approvalId }: ApprovalCommentsProps) {
  const fetcher = useFetcher<{ comments: ApprovalCommentData[] }>()
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [comments, setComments] = useState<ApprovalCommentData[]>([])

  // Fetch initial comments
  useEffect(() => {
    fetcher.load(`/api/approvals/${approvalId}/comments`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalId])

  // Update local state when data loads
  useEffect(() => {
    if (fetcher.data?.comments) {
      setComments(fetcher.data.comments)
    }
  }, [fetcher.data])

  // Listen for real-time comment updates
  useApprovalSSE({
    onUpdate: (update) => {
      if (update.type === 'approval_commented' && update.approvalId === approvalId) {
        // Reload comments when a new comment is added
        fetcher.load(`/api/approvals/${approvalId}/comments`)
      }
    },
  })

  const handleSubmit = () => {
    if (!newComment.trim()) return

    const formData = new FormData()
    formData.append('comment', newComment.trim())
    formData.append('isInternal', String(isInternal))

    fetcher.submit(formData, {
      method: 'POST',
      action: `/api/approvals/${approvalId}/comments`,
    })

    setNewComment('')
    setIsInternal(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Stack gap="md">
      <Text size="sm" fw={600}>
        Comments ({comments.length})
      </Text>

      {/* Comment List */}
      <Stack gap="sm">
        {comments.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No comments yet. Be the first to comment!
          </Text>
        ) : (
          comments.map((comment) => (
            <Box
              key={comment.id}
              p="sm"
              style={{ border: '1px solid #e9ecef', borderRadius: '8px' }}
            >
              <Group gap="sm" align="flex-start">
                <Avatar
                  src={comment.author.image}
                  alt={comment.author.name || comment.author.email}
                  size="sm"
                  radius="xl"
                >
                  {(comment.author.name || comment.author.email).charAt(0).toUpperCase()}
                </Avatar>

                <Stack gap={4} style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {comment.author.name || comment.author.email}
                    </Text>
                    {comment.isInternal && (
                      <Badge
                        size="xs"
                        variant="light"
                        color="orange"
                        leftSection={<IconLock size={10} />}
                      >
                        Internal
                      </Badge>
                    )}
                    <Text size="xs" c="dimmed">
                      {formatDate(comment.createdAt)}
                    </Text>
                  </Group>

                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {comment.comment}
                  </Text>
                </Stack>
              </Group>
            </Box>
          ))
        )}
      </Stack>

      {/* New Comment Form */}
      <Box>
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          minRows={3}
          maxRows={6}
          disabled={fetcher.state === 'submitting'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit()
            }
          }}
        />

        <Group justify="space-between" mt="xs">
          <Group gap="xs">
            <Tooltip label="Internal comments are only visible to team members">
              <Button
                size="xs"
                variant={isInternal ? 'filled' : 'light'}
                color="orange"
                leftSection={<IconLock size={14} />}
                onClick={() => setIsInternal(!isInternal)}
              >
                {isInternal ? 'Internal' : 'Public'}
              </Button>
            </Tooltip>
            <Text size="xs" c="dimmed">
              Press Cmd/Ctrl + Enter to send
            </Text>
          </Group>

          <Button
            size="sm"
            leftSection={<IconSend size={16} />}
            onClick={handleSubmit}
            disabled={!newComment.trim() || fetcher.state === 'submitting'}
            loading={fetcher.state === 'submitting'}
          >
            Comment
          </Button>
        </Group>
      </Box>
    </Stack>
  )
}
