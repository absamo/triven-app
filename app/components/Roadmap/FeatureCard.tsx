import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconArrowUp, IconMessageCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { FeatureComment, FeatureWithVotes } from '~/app/lib/roadmap/types'
import { CommentsModal } from './CommentsModal'
import classes from './Roadmap.module.css'

interface FeatureCardProps {
  feature: FeatureWithVotes
  isAdmin?: boolean
  currentUserId: string
}

export function FeatureCard({ feature, isAdmin = false, currentUserId }: FeatureCardProps) {
  const navigate = useNavigate()
  const { colorScheme } = useMantineColorScheme()
  const [opened, { open, close }] = useDisclosure(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
  const [comments, setComments] = useState<FeatureComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // User can delete their own feature if it's in TODO status and has no votes
  const canDelete =
    feature.createdById === currentUserId && feature.status === 'TODO' && feature.voteCount === 0

  // User can edit their own feature or admin can edit any
  const canEdit = isAdmin || feature.createdById === currentUserId

  const handleCardClick = () => {
    if (canEdit) {
      navigate(`/roadmap/edit/${feature.id}`)
    }
  }

  const handleCommentClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLoadingComments) {
      setIsLoadingComments(true)
      try {
        const response = await fetch(`/api/roadmap/features/${feature.id}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
          open()
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      } finally {
        setIsLoadingComments(false)
      }
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    openDelete()
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append('intent', 'delete')
      const response = await fetch(`/roadmap/edit/${feature.id}`, {
        method: 'POST',
        body: formData,
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete feature:', error)
      setIsDeleting(false)
      closeDelete()
    }
  }

  return (
    <>
      <Card
        shadow="none"
        padding="sm"
        radius="md"
        className={classes.featureCard}
        withBorder
        onClick={handleCardClick}
        style={{
          cursor: canEdit ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack gap="xs" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Group
            justify="space-between"
            align="flex-start"
            pb="xs"
            style={{
              borderBottom: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Text fw={500} size="sm" lineClamp={1} style={{ flex: 1 }}>
              {feature.title}
            </Text>

            {canDelete && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                aria-label="Delete feature"
                onClick={handleDeleteClick}
              >
                <IconTrash size={14} />
              </ActionIcon>
            )}
          </Group>

          {feature.description && (
            <Text
              size="xs"
              c="dimmed"
              lineClamp={3}
              className={classes.cardDescription}
              style={{ flex: 1 }}
            >
              {feature.description}
            </Text>
          )}
        </Stack>

        <Group gap="xs" pt="xs" onClick={(e) => e.stopPropagation()}>
          <Tooltip
            label="Upvote this feature"
            openDelay={300}
            color={colorScheme === 'dark' ? 'gray.8' : 'gray.9'}
            withArrow
          >
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

          <Badge
            variant="light"
            color="gray"
            size="md"
            leftSection={<IconMessageCircle size={12} />}
            onClick={handleCommentClick}
            style={{ cursor: 'pointer' }}
          >
            {feature.commentCount || 0}
          </Badge>

          <Tooltip
            label={`Created on ${new Date(feature.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}`}
            openDelay={300}
            color={colorScheme === 'dark' ? 'gray.8' : 'gray.9'}
            withArrow
          >
            <Text size="xs" c="dimmed" className={classes.authorText} ml="auto">
              {feature.createdBy.name || feature.createdBy.email.split('@')[0]}
            </Text>
          </Tooltip>
        </Group>
      </Card>

      <CommentsModal
        opened={opened}
        onClose={close}
        comments={comments}
        featureTitle={feature.title}
      />

      <Modal opened={deleteOpened} onClose={closeDelete} title="Delete Feature Request" centered>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete "{feature.title}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={isDeleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
