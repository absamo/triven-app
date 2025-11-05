import { type ComboboxItem, Grid, Input, MultiSelect, TextInput } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconCalendar, IconSearch } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import classes from '~/app/partials/SalesOrderFilters/SalesOrderFilters.module.css'

// import { useDebouncedValue } from "@mantine/hooks"

type FiltersProps = {
  searchProps?: {
    description: string
  }
  statusOrderProps?: {
    description: string
    data: ComboboxItem[]
  }
  salesOrderProps?: {
    description: string
    data: string[]
    values: string[]
    salesOrderReference: string
    invoiceReference?: string
  }
  invoicesProps?: {
    description: string
    data: string[]
    values: string[]
    invoiceReference: string
  }
  dateProps?: {
    description: string
  }
  onFilter: (data: any) => void
  route: string
}

export default function SalesOrderFilters({
  searchProps,
  statusOrderProps,
  salesOrderProps,
  invoicesProps,
  dateProps,
  onFilter,
  route,
}: FiltersProps) {
  const [searchValue, setSearchValue] = useState<string | null>(null)
  //const [debounced] = useDebouncedValue(searchValue, 100)
  const [statusOrders, setStatusOrders] = useState<string[]>([])
  const [salesOrders, setSalesOrders] = useState<string[]>(salesOrderProps?.values || [])
  const [invoices, setInvoices] = useState<string[]>(invoicesProps?.values || [])
  const [dateValue, setDateValue] = useState<Date | null>(null)

  const fetcher = useFetcher()

  const fetchSalesOrderData = (
    search: string | null,
    statuses: string[],
    salesOrders: string[],
    invoices: string[],
    date: Date | null
  ) => {
    let params = ''

    if (search) {
      params += `search=${JSON.stringify(search)}`
    }
    if (statuses) {
      params += `&statuses=${JSON.stringify(statuses)}`
    }
    if (date) {
      params += `&date=${JSON.stringify(date)}`
    }
    if (salesOrders?.length > 0) {
      params += `&salesOrders=${JSON.stringify(salesOrders)}`
    }
    if (invoices?.length > 0) {
      params += `&invoices=${JSON.stringify(invoices)}`
    }

    fetcher.load(`${route}?${params}`)
  }

  const data = fetcher.data

  useEffect(() => {
    if (data) {
      onFilter(data)
    } else {
      if (salesOrderProps?.salesOrderReference) {
        const salesOrders = [salesOrderProps.salesOrderReference]
        setSalesOrders(salesOrders)

        let param = `?salesOrders=${JSON.stringify(salesOrders)}`

        if (salesOrderProps.invoiceReference) {
          const invoices = [salesOrderProps.invoiceReference]
          param += `&invoices=${JSON.stringify(invoices)}`
        }
        fetcher.load(`${route}${param}`)
      }

      if (invoicesProps?.invoiceReference) {
        const invoices = [invoicesProps.invoiceReference]
        setInvoices(invoices)
        fetcher.load(`${route}?invoices=${JSON.stringify(invoices)}`)
      }
    }
  }, [data, salesOrderProps?.salesOrderReference, invoicesProps?.invoiceReference])

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setSearchValue(value)
    fetchSalesOrderData(value, statusOrders, salesOrders, invoices, dateValue)
  }

  const handleTextInputClick = () => {
    setSearchValue('')
    fetchSalesOrderData('', statusOrders, salesOrders, invoices, dateValue)
  }

  const handleStatusOrderChange = (values: string[]) => {
    setStatusOrders(values)
    fetchSalesOrderData(searchValue, values, salesOrders, invoices, dateValue)
  }

  const handleSalesOrderChange = (values: string[]) => {
    setSalesOrders(values)
    fetchSalesOrderData(searchValue, statusOrders, values, invoices, dateValue)
  }

  const handleInvoiceChange = (values: string[]) => {
    setInvoices(values)
    fetchSalesOrderData(searchValue, statusOrders, salesOrders, values, dateValue)
  }

  const handleDateChange = (date: Date | null) => {
    setDateValue(date)
    fetchSalesOrderData(searchValue, statusOrders, salesOrders, invoices, date)
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
            classNames={{
              label: classes.label,
            }}
            rightSection={
              searchValue ? <Input.ClearButton onClick={handleTextInputClick} /> : undefined
            }
          />
        </Grid.Col>
      )}

      {salesOrderProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={salesOrderProps?.data.filter((data) => !salesOrders.includes(data))}
            value={salesOrders}
            onChange={handleSalesOrderChange}
            label={salesOrderProps?.description}
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

      {invoicesProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={invoicesProps?.data.filter((data) => !invoices.includes(data))}
            value={invoices}
            onChange={handleInvoiceChange}
            label={invoicesProps?.description}
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

      {statusOrderProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={statusOrderProps?.data}
            value={statusOrders || []}
            onChange={handleStatusOrderChange}
            label={statusOrderProps?.description}
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
            valueFormat="DD-MM-YYYY"
            label={dateProps?.description}
            value={dateValue}
            onChange={handleDateChange}
            rightSectionWidth={42}
            leftSection={<IconCalendar size={18} stroke={1.5} />}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}
    </Grid>
  )
}
