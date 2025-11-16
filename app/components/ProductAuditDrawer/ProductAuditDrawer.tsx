import {
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Timeline,
} from '@mantine/core'
import type { AuditEvent } from '@prisma/client'
import { IconClock, IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuditHistory } from '~/app/hooks/useAuditHistory'
import { AuditFilterPanel, type AuditFilters } from './AuditFilterPanel'
import { FieldComparison } from './FieldComparison'

interface ProductAuditDrawerProps {
  opened: boolean
  onClose: () => void
  productId: string
  productName?: string
}

export function ProductAuditDrawer({
  opened,
  onClose,
  productId,
  productName,
}: ProductAuditDrawerProps) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<AuditFilters>({})
  const [, setCurrentTime] = useState(Date.now())

  // Update current time every minute to refresh relative timestamps
  useEffect(() => {
    if (!opened) return

    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [opened])

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  const { events, total, isLoading, error, hasMore, loadMore } = useAuditHistory({
    productId,
    enabled: opened,
    eventType: filters.eventType,
    startDate: filters.startDate,
    endDate: filters.endDate,
  })

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'create':
        return <IconPlus size={16} />
      case 'update':
        return <IconEdit size={16} />
      case 'delete':
        return <IconTrash size={16} />
      default:
        return <IconClock size={16} />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'create':
        return 'green'
      case 'update':
        return 'blue'
      case 'delete':
        return 'red'
      default:
        return 'gray'
    }
  }

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp)
    const now = new Date()

    // Validate the date
    if (Number.isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    // Less than 1 minute
    if (diffInMinutes < 1) {
      return t('audit.timeAgo.justNow', 'Just now')
    }
    // Less than 1 hour
    if (diffInMinutes < 60) {
      return t('audit.timeAgo.minutes', {
        count: diffInMinutes,
        defaultValue: '{{count}} minute ago',
        defaultValue_other: '{{count}} minutes ago',
      })
    }
    // Less than 24 hours
    if (diffInHours < 24) {
      return t('audit.timeAgo.hours', {
        count: diffInHours,
        defaultValue: '{{count}} hour ago',
        defaultValue_other: '{{count}} hours ago',
      })
    }
    // Less than 7 days
    if (diffInDays < 7) {
      return t('audit.timeAgo.days', {
        count: diffInDays,
        defaultValue: '{{count}} day ago',
        defaultValue_other: '{{count}} days ago',
      })
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

  const getEventDescription = (event: AuditEvent) => {
    const { eventType, changedFields, userName } = event
    const user = userName || t('audit.unknownUser', 'Unknown user')

    switch (eventType) {
      case 'create':
        return t('audit.eventDesc.create', {
          user,
          defaultValue: '{{user}} created this product',
        })
      case 'delete':
        return t('audit.eventDesc.delete', {
          user,
          defaultValue: '{{user}} deleted this product',
        })
      case 'update': {
        const fields = changedFields as string[] | null
        if (fields && fields.length > 0) {
          return t('audit.eventDesc.updateFields', {
            user,
            count: fields.length,
            defaultValue: '{{user}} updated {{count}} field',
            defaultValue_other: '{{user}} updated {{count}} fields',
          })
        }
        return t('audit.eventDesc.update', {
          user,
          defaultValue: '{{user}} updated this product',
        })
      }
      default:
        return t('audit.eventDesc.default', {
          user,
          eventType,
          defaultValue: '{{user}} performed {{eventType}}',
        })
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          {t('audit.title', 'Product History')}
        </Text>
      }
      position="right"
      size="lg"
    >
      <Box mb="md">
        <AuditFilterPanel onFilterChange={setFilters} activeFiltersCount={activeFiltersCount} />
      </Box>

      <ScrollArea style={{ height: 'calc(100vh - 200px)' }} offsetScrollbars>
        {isLoading && events.length === 0 ? (
          <Box p="xl" style={{ textAlign: 'center' }}>
            <Loader size="md" />
            <Text size="sm" c="dimmed" mt="md">
              {t('audit.loading', 'Loading history...')}
            </Text>
          </Box>
        ) : error ? (
          <Box p="xl" style={{ textAlign: 'center' }}>
            <IconX size={48} color="red" style={{ margin: '0 auto' }} />
            <Text size="sm" c="red" mt="md">
              {t('audit.error', 'Failed to load audit history')}
            </Text>
          </Box>
        ) : events.length === 0 ? (
          <Box p="xl" style={{ textAlign: 'center' }}>
            <IconClock size={48} color="gray" style={{ margin: '0 auto', opacity: 0.3 }} />
            <Text size="sm" c="dimmed" mt="md">
              {t('audit.empty', 'No changes yet')}
            </Text>
          </Box>
        ) : (
          <Stack gap="md">
            <Group justify="space-between" mb="sm">
              <Text size="sm" c="dimmed">
                {total} {t('audit.eventsFor', 'events for')}{' '}
                <Text component="span" fw={700}>
                  {productName || t('audit.thisProduct', 'this product')}
                </Text>
              </Text>
            </Group>

            <Timeline active={events.length} bulletSize={24} lineWidth={2}>
              {events.map((event) => (
                <Timeline.Item
                  key={event.id}
                  bullet={getEventIcon(event.eventType)}
                  color={getEventColor(event.eventType)}
                >
                  <Box mb="lg">
                    <Group justify="space-between" mb={4}>
                      <Badge color={getEventColor(event.eventType)} size="sm" variant="light">
                        {t(`audit.eventType.${event.eventType}`, event.eventType)}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {formatTimestamp(event.timestamp)}
                      </Text>
                    </Group>
                    <Text size="sm">{getEventDescription(event)}</Text>

                    <FieldComparison
                      eventType={event.eventType}
                      changedFields={event.changedFields as string[] | null}
                      beforeSnapshot={event.beforeSnapshot}
                      afterSnapshot={event.afterSnapshot}
                    />
                  </Box>
                </Timeline.Item>
              ))}
            </Timeline>

            {hasMore && (
              <Button onClick={loadMore} loading={isLoading} variant="light" fullWidth mt="md">
                {t('audit.loadMore', 'Load more')}
              </Button>
            )}
          </Stack>
        )}
      </ScrollArea>
    </Drawer>
  )
}
