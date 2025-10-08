import { Badge, Menu, Table, Text } from '@mantine/core'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from 'react-router'

import { useForm } from '@mantine/form'
import { useEffect, useState } from 'react'
import { SALES_ORDERS_STATUSES } from '~/app/common/constants'
import { formatCurrency } from '~/app/common/helpers/money'
import { getSalesOrderStatusLabel } from '~/app/common/helpers/sales'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ISalesOrderItem } from '~/app/common/validations/salesOrderItemSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import { TableActionsMenu } from '~/app/components'
import { SalesOrderFilters } from '~/app/partials/SalesOrderFilters'
import { Title } from '~/app/partials/Title'

interface SalesOrdersProps {
  salesOrders: ISalesOrder[]
  permissions: string[]
}

type FetcherData = {
  salesOrders: ISalesOrder[]
}

export default function SalesOrdersPage({ salesOrders = [], permissions = [] }: SalesOrdersProps) {
  const { t } = useTranslation(['salesOrders', 'common'])
  const [salesOrderReference, setSalesOrderReference] = useState<string>()
  const [data, setData] = useState<FetcherData | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (location.state?.salesOrderReference) {
      setSalesOrderReference(location.state.salesOrderReference)
    }
  }, [location.state?.salesOrderReference])

  const canCreate = permissions.includes('create:salesOrders')
  const canUpdate = permissions.includes('update:salesOrders')

  const navigate = useNavigate()

  const submit = useSubmit()

  const form = useForm()

  const handleSubmit = () => {
    const formData = new FormData()
    formData.append('status', JSON.stringify(form.values.status))
    formData.append('salesOrderId', form.values.salesOrderId)
    submit(formData, { method: 'post', action: '/sales-orders' })
  }

  const rows = (data?.salesOrders || salesOrders).map((salesOrder: ISalesOrder) => {
    const statusObj = salesOrder?.status
      ? getSalesOrderStatusLabel(salesOrder.status)
      : { label: '', color: 'gray' }
    const status = statusObj.label || statusObj.color ? statusObj : { label: '', color: 'gray' }

    // Get translated status label
    const getTranslatedStatusLabel = (statusValue: string) => {
      switch (statusValue) {
        case SALES_ORDERS_STATUSES.PENDING:
          return t('salesOrders:pending')
        case SALES_ORDERS_STATUSES.ISSUED:
          return t('salesOrders:issued')
        case SALES_ORDERS_STATUSES.SHIPPED:
          return t('salesOrders:shipped')
        case SALES_ORDERS_STATUSES.DELIVERED:
          return t('salesOrders:delivered')
        case SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED:
          return t('salesOrders:partiallyDelivered')
        case SALES_ORDERS_STATUSES.CANCELLED:
          return t('salesOrders:cancelled')
        default:
          return ''
      }
    }

    const totalAmount = salesOrder.salesOrderItems?.reduce(
      (acc: number, item: ISalesOrderItem) => acc + (item.amount || 0),
      0
    ) as number
    const baseCurrency = salesOrder.company?.currencies?.find(
      (currency: ICurrency) => currency.base
    )

    return (
      <Table.Tr
        key={salesOrder.id}
        onClick={() => {
          canUpdate && navigate(`/sales-orders/${salesOrder.id}/edit`)
        }}
        style={{ position: 'relative' }}
        onMouseEnter={() => setHoveredRowId(salesOrder.id ?? null)}
        onMouseLeave={() => setHoveredRowId(null)}
      >
        <Table.Td>
          <Text size="sm">{dayjs(salesOrder.orderDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{salesOrder.salesOrderReference}</Table.Td>
        <Table.Td>{`${salesOrder.customer?.firstName} ${salesOrder.customer?.lastName}`}</Table.Td>
        <Table.Td>{salesOrder.agency?.name}</Table.Td>
        <Table.Td>
          <Badge color={status.color} variant="light">
            {salesOrder.status ? getTranslatedStatusLabel(salesOrder.status) : ''}
          </Badge>
        </Table.Td>

        <Table.Td>
          <Text size="sm">{formatCurrency(totalAmount, baseCurrency?.symbol || '$')}</Text>
        </Table.Td>
        <Table.Td onClick={(event) => event.stopPropagation()}>
          <TableActionsMenu itemId={salesOrder.id} hoveredRowId={hoveredRowId}>
            <Form onSubmit={form.onSubmit(handleSubmit)}>
              <Menu.Item
                type="submit"
                disabled={
                  salesOrder.status === SALES_ORDERS_STATUSES.ISSUED ||
                  salesOrder.status === SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED ||
                  salesOrder.status === SALES_ORDERS_STATUSES.DELIVERED ||
                  salesOrder.status === SALES_ORDERS_STATUSES.CANCELLED
                }
                onClick={() => {
                  form.setValues({
                    salesOrderId: salesOrder.id,
                    status: SALES_ORDERS_STATUSES.ISSUED,
                  })
                }}
              >
                {t('sendOrderToCustomer')}
              </Menu.Item>
              <Menu.Item
                type="submit"
                component={Link}
                to={'/invoices'}
                // state={{
                //   purchaseOrderReference:
                //     purchaseOrder.purchaseOrderReference,
                // }}
              >
                {t('salesOrders:viewInvoices')}
              </Menu.Item>
              <Menu.Item
                type="submit"
                color="red"
                disabled={
                  salesOrder.status === SALES_ORDERS_STATUSES.CANCELLED
                  // salesOrder.status ===
                  //   SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED ||
                  // salesOrder.status === SALES_ORDERS_STATUSES.DELIVERED ||
                  // salesOrder.status === SALES_ORDERS_STATUSES.CANCELLED ||
                  // salesOrder.invoices?.some(
                  //   (invoice: Pick<IInvoice, "status">) =>
                  //     invoice.status === INVOICE_STATUSES.PAID ||
                  //     invoice.status === INVOICE_STATUSES.PARTIALLYPAID
                  // )
                }
                onClick={() => {
                  form.setValues({
                    salesOrderId: salesOrder.id,
                    status: SALES_ORDERS_STATUSES.CANCELLED,
                  })
                }}
              >
                {t('salesOrders:cancelOrder')}
              </Menu.Item>
            </Form>
          </TableActionsMenu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/sales-orders/create'} canCreate={canCreate}>
        {t('salesOrders:title')}
      </Title>

      <SalesOrderFilters
        searchProps={{
          description: t('salesOrders:search'),
        }}
        statusOrderProps={{
          data: [
            { value: SALES_ORDERS_STATUSES.ISSUED, label: t('salesOrders:issued') },
            { value: SALES_ORDERS_STATUSES.PENDING, label: t('salesOrders:pending') },
            {
              value: SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED,
              label: t('salesOrders:partiallyDelivered'),
            },
            { value: SALES_ORDERS_STATUSES.DELIVERED, label: t('salesOrders:delivered') },
            { value: SALES_ORDERS_STATUSES.CANCELLED, label: t('salesOrders:cancelled') },
          ],

          description: t('salesOrders:filterByOrderStatuses'),
        }}
        salesOrderProps={{
          data: salesOrders.map((salesOrder: ISalesOrder) => {
            return salesOrder?.salesOrderReference
          }),
          values: salesOrderReference ? [salesOrderReference] : [],
          description: t('salesOrders:filterBySalesOrder'),
          salesOrderReference: location.state?.salesOrderReference,
        }}
        dateProps={{
          description: t('salesOrders:filterByOrderDate'),
        }}
        route="/api/sales-orders-search"
        onFilter={setData}
      />
      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('salesOrders:orderDate')}</Table.Th>
            <Table.Th>{t('salesOrders:salesOrderReference')}</Table.Th>
            <Table.Th>{t('salesOrders:customerName')}</Table.Th>
            <Table.Th>{t('salesOrders:agency')}</Table.Th>
            <Table.Th>{t('salesOrders:orderStatus')}</Table.Th>
            <Table.Th>{t('salesOrders:amount')}</Table.Th>
            <Table.Th style={{ textAlign: 'center', width: 50 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">
                <Text size="sm" c="dimmed">
                  {t('salesOrders:noSalesOrdersFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </>
  )
}
