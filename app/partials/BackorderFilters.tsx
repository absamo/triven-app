import { ActionIcon, Grid, MultiSelect, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { IconFilterOff, IconX } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

interface BackorderFiltersProps {
  searchProps: {
    description: string
  }
  statusOrderProps: {
    data: { value: string; label: string }[]
    description: string
  }
  backorderProps: {
    data: string[]
    values: string[]
    description: string
    backorderReference?: string
  }
  dateProps: {
    description: string
  }
  route: string
  onFilter: (data: any) => void
}

export function BackorderFilters({
  searchProps,
  statusOrderProps,
  backorderProps,
  dateProps,
  route,
  onFilter,
}: BackorderFiltersProps) {
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [backorders, setBackorders] = useState<string[]>(backorderProps.values)
  const [date, setDate] = useState<Date | null>(null)

  const fetcher = useFetcher({ key: 'backorder-filters' })

  const clearFilters = useCallback(() => {
    setSearch('')
    setStatuses([])
    setBackorders([])
    setDate(null)
  }, [])

  const clearDate = useCallback(() => {
    setDate(null)
  }, [])

  const hasActiveFilters = search || statuses.length > 0 || backorders.length > 0 || date

  const submitFilters = useCallback(() => {
    const searchParams = new URLSearchParams()

    if (search) searchParams.set('search', search)
    if (statuses.length > 0) searchParams.set('statuses', JSON.stringify(statuses))
    if (backorders.length > 0) searchParams.set('backorders', JSON.stringify(backorders))
    if (date) searchParams.set('date', dayjs(date).format('YYYY-MM-DD'))

    fetcher.submit(searchParams, {
      method: 'GET',
      action: route,
    })
  }, [search, statuses, backorders, date, route, fetcher])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      submitFilters()
    }, 100) // Short delay to prevent too many rapid requests

    return () => clearTimeout(timeoutId)
  }, [search, statuses, backorders, date, submitFilters])

  useEffect(() => {
    if (fetcher.data) {
      onFilter(fetcher.data)
    }
  }, [fetcher.data, onFilter])

  useEffect(() => {
    if (backorderProps.backorderReference) {
      setBackorders([backorderProps.backorderReference])
    }
  }, [backorderProps.backorderReference])

  return (
    <Grid mb={20} grow>
      <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
        <TextInput
          placeholder={searchProps.description}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
        <MultiSelect
          placeholder={statusOrderProps.description}
          data={statusOrderProps.data}
          value={statuses}
          onChange={setStatuses}
          searchable
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
        <MultiSelect
          placeholder={backorderProps.description}
          data={backorderProps.data}
          value={backorders}
          onChange={setBackorders}
          searchable
        />
      </Grid.Col>

      <Grid.Col span={{ base: 10, sm: 5, md: 2 }}>
        <DateInput
          placeholder={dateProps.description}
          value={date}
          onChange={(value) => setDate(value ? new Date(value) : null)}
          rightSection={
            date ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={clearDate}
                title="Clear date"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
        />
      </Grid.Col>

      <Grid.Col span="auto">
        <ActionIcon
          variant="light"
          color="gray"
          size="lg"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          title="Clear all filters"
        >
          <IconFilterOff size={18} />
        </ActionIcon>
      </Grid.Col>
    </Grid>
  )
}

export default BackorderFilters
