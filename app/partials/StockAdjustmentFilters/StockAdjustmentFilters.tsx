import { Checkbox, type ComboboxItem, Grid, Input, MultiSelect, TextInput } from '@mantine/core'
import { DatePickerInput, type DatesRangeValue, type DateValue } from '@mantine/dates'
import { IconCalendar, IconSearch } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import classes from './StockAdjustmentFilters.module.css'

type FiltersProps = {
  searchProps?: {
    description: string
  }
  reasonProps?: {
    description: string
    data: ComboboxItem[]
  }
  siteProps?: {
    description: string
    data: ComboboxItem[]
  }
  dateProps?: {
    description: string
  }
  onFilter: (data: any) => void
  route: string
}

export default function StockAdjustmentFilters({
  searchProps,
  reasonProps,
  siteProps,
  dateProps,
  onFilter,
  route,
}: FiltersProps) {
  const { t } = useTranslation('inventory')

  const [searchValue, setSearchValue] = useState<string | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [sites, setSites] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DatesRangeValue>([null, null])
  const [singleDate, setSingleDate] = useState<DateValue>(null)
  const [isRangeMode, setIsRangeMode] = useState<boolean>(false)

  const fetcher = useFetcher()

  const fetchStockAdjustmentData = (
    search: string | null,
    reasons: string[],
    sites: string[],
    isRange: boolean,
    dateRange?: DatesRangeValue,
    singleDate?: DateValue
  ) => {
    let params = ''

    if (search) {
      params += `search=${JSON.stringify(search)}`
    }
    if (reasons && reasons.length > 0) {
      params += `${params ? '&' : ''}reasons=${JSON.stringify(reasons)}`
    }
    if (sites && sites.length > 0) {
      params += `${params ? '&' : ''}sites=${JSON.stringify(sites)}`
    }

    // Handle date filtering based on mode
    if (isRange && dateRange && dateRange[0]) {
      const startOfDay = new Date(dateRange[0])
      startOfDay.setHours(0, 0, 0, 0)

      // If end date is provided, use it; otherwise use start date as end date
      const endDate = dateRange[1] || dateRange[0]
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)

      params += `${params ? '&' : ''}dateFrom=${JSON.stringify(startOfDay)}`
      params += `&dateTo=${JSON.stringify(endOfDay)}`
    } else if (!isRange && singleDate) {
      const startOfDay = new Date(singleDate)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(singleDate)
      endOfDay.setHours(23, 59, 59, 999)

      params += `${params ? '&' : ''}dateFrom=${JSON.stringify(startOfDay)}`
      params += `&dateTo=${JSON.stringify(endOfDay)}`
    }

    fetcher.load(`${route}?${params}`)
  }

  const data = fetcher.data

  useEffect(() => {
    if (data) {
      onFilter(data)
    }
  }, [data, onFilter])

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setSearchValue(value)
    fetchStockAdjustmentData(value, reasons, sites, isRangeMode, dateRange, singleDate)
  }

  const handleTextInputClick = () => {
    setSearchValue('')
    fetchStockAdjustmentData('', reasons, sites, isRangeMode, dateRange, singleDate)
  }

  const handleReasonChange = (values: string[]) => {
    setReasons(values)
    fetchStockAdjustmentData(searchValue, values, sites, isRangeMode, dateRange, singleDate)
  }

  const handleSiteChange = (values: string[]) => {
    setSites(values)
    fetchStockAdjustmentData(searchValue, reasons, values, isRangeMode, dateRange, singleDate)
  }

  const handleDateChange = (value: DatesRangeValue) => {
    setDateRange(value)
    fetchStockAdjustmentData(searchValue, reasons, sites, isRangeMode, value, singleDate)
  }

  const handleSingleDateChange = (value: DateValue) => {
    setSingleDate(value)
    fetchStockAdjustmentData(searchValue, reasons, sites, isRangeMode, dateRange, value)
  }

  const handleUnifiedDateChange = (value: any) => {
    if (isRangeMode) {
      handleDateChange(value as DatesRangeValue)
    } else {
      handleSingleDateChange(value as DateValue)
    }
  }

  const handleRangeModeToggle = (checked: boolean) => {
    setIsRangeMode(checked)
    // Clear both dates when switching modes
    setDateRange([null, null])
    setSingleDate(null)
    fetchStockAdjustmentData(searchValue, reasons, sites, checked, [null, null], null)
  }

  return (
    <Grid mb={20} grow>
      {searchProps && (
        <Grid.Col span={3}>
          <TextInput
            radius="md"
            size="sm"
            rightSectionWidth={42}
            leftSection={<IconSearch size={18} stroke={1.5} />}
            onChange={handleTextInputChange}
            value={searchValue || ''}
            label={searchProps?.description}
            placeholder={t('searchByReference')}
            classNames={{
              label: classes.label,
            }}
            rightSection={
              searchValue ? <Input.ClearButton onClick={handleTextInputClick} /> : undefined
            }
          />
        </Grid.Col>
      )}

      {reasonProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={reasonProps?.data}
            value={reasons || []}
            onChange={handleReasonChange}
            label={reasonProps?.description}
            placeholder={reasons.length > 0 ? '' : t('selectReasons')}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: 'bottom-start',
              shadow: 'md',
            }}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}

      {siteProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={siteProps?.data}
            value={sites || []}
            onChange={handleSiteChange}
            label={siteProps?.description}
            placeholder={sites.length > 0 ? '' : t('selectSites')}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: 'bottom-start',
              shadow: 'md',
            }}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}

      {dateProps && (
        <Grid.Col span={3}>
          <DatePickerInput
            type={isRangeMode ? 'range' : undefined}
            radius="md"
            size="sm"
            leftSection={<IconCalendar size={18} stroke={1.5} />}
            rightSection={
              <Checkbox
                size="xs"
                checked={isRangeMode}
                onChange={(event) => handleRangeModeToggle(event.currentTarget.checked)}
                aria-label={t('toggleRangeMode')}
              />
            }
            label={dateProps?.description}
            placeholder={isRangeMode ? t('selectDateRange') : t('selectDate')}
            valueFormat="DD/MM/YYYY"
            value={isRangeMode ? dateRange : singleDate}
            onChange={handleUnifiedDateChange}
            classNames={{
              label: classes.label,
            }}
            allowSingleDateInRange={isRangeMode}
            clearable
            hideOutsideDates={isRangeMode}
            dropdownType={isRangeMode ? 'popover' : undefined}
          />
        </Grid.Col>
      )}
    </Grid>
  )
}
