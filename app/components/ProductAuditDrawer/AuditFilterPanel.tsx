import { Collapse, Group, Select, Stack, Text, useMantineColorScheme } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar, IconChevronDown, IconChevronUp, IconFilter } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface AuditFilterPanelProps {
  onFilterChange: (filters: AuditFilters) => void
  activeFiltersCount: number
}

export interface AuditFilters {
  eventType?: 'create' | 'update' | 'delete' | 'duplicate'
  startDate?: Date
  endDate?: Date
}

export function AuditFilterPanel({ onFilterChange }: AuditFilterPanelProps) {
  const { t } = useTranslation()
  const { colorScheme } = useMantineColorScheme()
  const [expanded, setExpanded] = useState(false)
  const [eventType, setEventType] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])

  // Auto-apply filters when they change
  useEffect(() => {
    const filters: AuditFilters = {}

    if (eventType) {
      filters.eventType = eventType as 'create' | 'update' | 'delete' | 'duplicate'
    }
    // Only apply date filters if both dates are selected or both are null
    if (dateRange[0] && dateRange[1]) {
      filters.startDate = dateRange[0]
      filters.endDate = dateRange[1]
    }

    onFilterChange(filters)
  }, [eventType, dateRange, onFilterChange])

  return (
    <Stack
      gap="sm"
      w="100%"
      p="md"
      style={(theme) => ({
        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        borderRadius: theme.radius.md,
      })}
    >
      <Group
        gap="xs"
        align="center"
        mb={4}
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
        justify="space-between"
      >
        <Group gap="xs">
          <IconFilter size={16} />
          <Text size="sm" fw={500}>
            {t('audit.filters.title', 'Filters')}
          </Text>
        </Group>
        {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
      </Group>
      <Collapse in={expanded}>
        <Group justify="space-between" align="flex-end" grow>
          <Select
            label={t('audit.filters.eventType', 'Event Type')}
            placeholder={t('audit.filters.allEvents', 'All events')}
            data={[
              {
                value: 'create',
                label: t('audit.eventType.create', 'Created'),
              },
              {
                value: 'update',
                label: t('audit.eventType.update', 'Updated'),
              },
              {
                value: 'delete',
                label: t('audit.eventType.delete', 'Deleted'),
              },
              {
                value: 'duplicate',
                label: t('audit.eventType.duplicate', 'Duplicated'),
              },
            ]}
            value={eventType}
            onChange={setEventType}
            clearable
            size="xs"
            leftSection={<IconFilter size={14} />}
          />

          <DatePickerInput
            type="range"
            label={t('audit.filters.dateRange', 'Date Range')}
            placeholder={t('audit.filters.selectDates', 'Select date range')}
            value={dateRange}
            onChange={(value) => setDateRange(value as [Date | null, Date | null])}
            clearable
            size="xs"
            leftSection={<IconCalendar size={14} />}
            valueFormat="D MMM YYYY"
          />
        </Group>
      </Collapse>
    </Stack>
  )
}
