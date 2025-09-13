import {
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Input,
  MultiSelect,
  Paper,
  Popover,
  Stack,
  TextInput,
  Title,
  type ComboboxItem,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { IconCalendar, IconSearch } from "@tabler/icons-react"
import classes from "~/app/partials/PurchaseOrderFilters/PurchaseOrderFilters.module.css"

import { useState, useEffect } from "react"
import { useFetcher } from "react-router"

// import { useDebouncedValue } from "@mantine/hooks"

type FiltersProps = {
  searchProps?: {
    description: string
  }
  statusOrderProps?: {
    description: string
    data: ComboboxItem[]
  }
  purchaseOrderProps?: {
    description: string
    data: string[]
    values: string[]
    purchaseOrderReference: string
    billReference?: string
  }
  billsProps?: {
    description: string
    data: string[]
    values: string[]
    billReference: string
  }
  dateProps?: {
    description: string
  }
  onFilter: (data: any) => void
  route: string
}

export default function PurchaseOrderFilters({
  searchProps,
  statusOrderProps,
  purchaseOrderProps,
  billsProps,
  dateProps,
  onFilter,
  route,
}: FiltersProps) {
  const [searchValue, setSearchValue] = useState<string | null>(null)
  //const [debounced] = useDebouncedValue(searchValue, 100)
  const [statusOrders, setStatusOrders] = useState<string[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<string[]>(
    purchaseOrderProps?.values || []
  )
  const [bills, setBills] = useState<string[]>(billsProps?.values || [])
  const [dateValue, setDateValue] = useState<Date | null>(null)

  const fetcher = useFetcher()

  const fetchPurchaseOrderData = (
    search: string | null,
    statuses: string[],
    purchaseOrders: string[],
    bills: string[],
    date: Date | null
  ) => {
    let params = ""

    if (search) {
      params += `search=${JSON.stringify(search)}`
    }
    if (statuses) {
      params += `&statuses=${JSON.stringify(statuses)}`
    }
    if (date) {
      params += `&date=${JSON.stringify(date)}`
    }
    if (purchaseOrders?.length > 0) {
      params += `&purchaseOrders=${JSON.stringify(purchaseOrders)}`
    }
    if (bills?.length > 0) {
      params += `&bills=${JSON.stringify(bills)}`
    }

    fetcher.load(`${route}?${params}`)
  }

  const data = fetcher.data

  useEffect(() => {
    if (data) {
      onFilter(data)
    } else {
      if (purchaseOrderProps?.purchaseOrderReference) {
        const purchaseOrders = [purchaseOrderProps.purchaseOrderReference]
        setPurchaseOrders(purchaseOrders)

        let param = `?purchaseOrders=${JSON.stringify(purchaseOrders)}`

        if (purchaseOrderProps.billReference) {
          const bills = [purchaseOrderProps.billReference]
          param += `&bills=${JSON.stringify(bills)}`
        }
        fetcher.load(`${route}${param}`)
      }

      if (billsProps?.billReference) {
        const bills = [billsProps.billReference]
        setBills(bills)
        fetcher.load(`${route}?bills=${JSON.stringify(bills)}`)
      }
    }
  }, [
    data,
    purchaseOrderProps?.purchaseOrderReference,
    billsProps?.billReference,
  ])

  const handleTextInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value
    setSearchValue(value)
    fetchPurchaseOrderData(
      value,
      statusOrders,
      purchaseOrders,
      bills,
      dateValue
    )
  }

  const handleTextInputClick = () => {
    setSearchValue("")
    fetchPurchaseOrderData("", statusOrders, purchaseOrders, bills, dateValue)
  }

  const handleStatusOrderChange = (values: string[]) => {
    setStatusOrders(values)
    fetchPurchaseOrderData(
      searchValue,
      values,
      purchaseOrders,
      bills,
      dateValue
    )
  }

  const handlePurchaseOrderChange = (values: string[]) => {
    setPurchaseOrders(values)
    fetchPurchaseOrderData(searchValue, statusOrders, values, bills, dateValue)
  }

  const handleBillChange = (values: string[]) => {
    setBills(values)
    fetchPurchaseOrderData(
      searchValue,
      statusOrders,
      purchaseOrders,
      values,
      dateValue
    )
  }

  const handleDateChange = (date: Date | null) => {
    setDateValue(date)
    fetchPurchaseOrderData(
      searchValue,
      statusOrders,
      purchaseOrders,
      bills,
      date
    )
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
            value={searchValue || ""}
            label={searchProps?.description}
            classNames={{
              label: classes.label,
            }}
            rightSection={
              searchValue ? (
                <Input.ClearButton onClick={handleTextInputClick} />
              ) : undefined
            }
          />
        </Grid.Col>
      )}

      {purchaseOrderProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={purchaseOrderProps?.data.filter(
              (data) => !purchaseOrders.includes(data)
            )}
            value={purchaseOrders}
            onChange={handlePurchaseOrderChange}
            label={purchaseOrderProps?.description}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: "bottom-start",
              shadow: "md",
            }}
            classNames={{
              label: classes.label,
            }}
            clearable
          />
        </Grid.Col>
      )}

      {billsProps && (
        <Grid.Col span={3}>
          <MultiSelect
            data={billsProps?.data.filter((data) => !bills.includes(data))}
            value={bills}
            onChange={handleBillChange}
            label={billsProps?.description}
            hidePickedOptions
            comboboxProps={{
              width: 200,
              position: "bottom-start",
              shadow: "md",
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
              position: "bottom-start",
              shadow: "md",
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
