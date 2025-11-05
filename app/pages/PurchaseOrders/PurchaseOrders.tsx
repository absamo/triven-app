import { Badge, Menu, Table, Text, UnstyledButton } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconDotsVertical } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from 'react-router'
import { PURCHASE_ORDER_STATUSES } from '~/app/common/constants'
import { formatCurrency } from '~/app/common/helpers/money'
import { getPurchaseOrderStatusLabel } from '~/app/common/helpers/purchase'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import { PurchaseOrderFilters } from '~/app/partials/PurchaseOrderFilters'
import { Title } from '~/app/partials/Title'

interface PurchaseOrdersProps {
  purchaseOrders: IPurchaseOrder[]
  permissions: string[]
}

type FetcherData = {
  purchaseOrders: IPurchaseOrder[]
}

export default function PurchaseOrdersPage({ purchaseOrders, permissions }: PurchaseOrdersProps) {
  const { t } = useTranslation(['purchaseOrders', 'common'])
  const [purchaseOrderReference, setPurchaseOrderReference] = useState<string>()
  const [data, setData] = useState<FetcherData | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (location.state?.purchaseOrderReference) {
      setPurchaseOrderReference(location.state.purchaseOrderReference)
    }
  }, [location.state?.purchaseOrderReference])

  const canCreate = permissions.includes('create:purchaseOrders')
  const canEdit = permissions.includes('update:purchaseOrders')

  const navigate = useNavigate()

  const submit = useSubmit()

  const form = useForm()

  const handleSubmit = () => {
    const formData = new FormData()
    formData.append('status', JSON.stringify(form.values.status))
    formData.append('purchaseOrderId', form.values.purchaseOrderId)
    submit(formData, { method: 'post', action: '/purchase-orders' })
  }

  const rows = (data?.purchaseOrders || purchaseOrders).map((purchaseOrder: IPurchaseOrder) => {
    const status = getPurchaseOrderStatusLabel(purchaseOrder?.status)
    const totalAmount = purchaseOrder.purchaseOrderItems?.reduce(
      (acc, item) => acc + (item.amount || 0),
      0
    )
    const baseCurrency = (purchaseOrder.company?.currencies || []).find(
      (currency: ICurrency) => currency.base
    ) || { symbol: '' }

    return (
      <Table.Tr
        key={purchaseOrder.id}
        onClick={() => {
          canEdit && navigate(`/purchase-orders/${purchaseOrder.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(purchaseOrder.orderDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{purchaseOrder.purchaseOrderReference}</Table.Td>
        <Table.Td>{purchaseOrder.supplier?.name}</Table.Td>
        <Table.Td>{purchaseOrder.agency?.name}</Table.Td>
        <Table.Td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatCurrency(totalAmount, baseCurrency.symbol || '$')}</Text>
        </Table.Td>
        <Table.Td onClick={(event) => event.stopPropagation()}>
          <Menu withArrow position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <IconDotsVertical
                  size={16}
                  stroke={1.5}
                  onClick={(event) => event.preventDefault()}
                />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Form onSubmit={form.onSubmit(handleSubmit)}>
                <Menu.Item
                  type="submit"
                  disabled={
                    purchaseOrder.status === PURCHASE_ORDER_STATUSES.ISSUED ||
                    purchaseOrder.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED ||
                    purchaseOrder.status === PURCHASE_ORDER_STATUSES.RECEIVED
                  }
                  onClick={() => {
                    form.setValues({
                      purchaseOrderId: purchaseOrder.id,
                      status: PURCHASE_ORDER_STATUSES.ISSUED,
                    })
                  }}
                >
                  {t('purchaseOrders:sendOrderToSupplier')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/purchase-receives'}
                  state={{
                    purchaseOrderReference: purchaseOrder.purchaseOrderReference,
                  }}
                >
                  {t('purchaseOrders:viewPurchaseReceives')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/bills'}
                  state={{
                    purchaseOrderReference: purchaseOrder.purchaseOrderReference,
                  }}
                >
                  {t('purchaseOrders:viewBills')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  color="red"
                  disabled={
                    purchaseOrder.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED ||
                    purchaseOrder.status === PURCHASE_ORDER_STATUSES.RECEIVED ||
                    purchaseOrder.status === PURCHASE_ORDER_STATUSES.CANCELLED ||
                    purchaseOrder.purchaseReceives?.some(
                      (purchaseReceive) =>
                        purchaseReceive.status === PURCHASE_ORDER_STATUSES.RECEIVED ||
                        purchaseReceive.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
                    )
                  }
                  onClick={() => {
                    form.setValues({
                      purchaseOrderId: purchaseOrder.id,
                      status: PURCHASE_ORDER_STATUSES.CANCELLED,
                    })
                  }}
                >
                  {t('purchaseOrders:cancelOrder')}
                </Menu.Item>
              </Form>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/purchase-orders/create'} canCreate={canCreate}>
        {t('purchaseOrders:title')}
      </Title>

      <PurchaseOrderFilters
        searchProps={{
          description: t('purchaseOrders:search'),
        }}
        statusOrderProps={{
          data: [
            { value: PURCHASE_ORDER_STATUSES.ISSUED, label: t('purchaseOrders:issued') },
            { value: PURCHASE_ORDER_STATUSES.PENDING, label: t('purchaseOrders:pending') },
            {
              value: PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
              label: t('purchaseOrders:partiallyReceived'),
            },
            { value: PURCHASE_ORDER_STATUSES.RECEIVED, label: t('purchaseOrders:received') },
            { value: PURCHASE_ORDER_STATUSES.CANCELLED, label: t('purchaseOrders:cancelled') },
          ],

          description: t('purchaseOrders:filterByOrderStatuses'),
        }}
        purchaseOrderProps={{
          data: purchaseOrders.map((purchaseOrder: IPurchaseOrder) => {
            return purchaseOrder?.purchaseOrderReference
          }),
          values: purchaseOrderReference ? [purchaseOrderReference] : [],
          description: t('purchaseOrders:filterByPurchaseOrder'),
          purchaseOrderReference: location.state?.purchaseOrderReference,
        }}
        dateProps={{
          description: t('purchaseOrders:filterByOrderDate'),
        }}
        route="/api/purchase-orders-search"
        onFilter={setData}
      />
      <Table verticalSpacing="xs" highlightOnHover={canEdit} withTableBorder striped>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('purchaseOrders:orderDate')}</Table.Th>
            <Table.Th>{t('purchaseOrders:purchaseOrderReference')}</Table.Th>
            <Table.Th>{t('purchaseOrders:supplierName')}</Table.Th>
            <Table.Th>{t('purchaseOrders:agency')}</Table.Th>
            <Table.Th>{t('purchaseOrders:orderStatus')}</Table.Th>
            <Table.Th>{t('purchaseOrders:amount')}</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">
                <Text size="sm" c="dimmed">
                  {t('purchaseOrders:noPurchaseOrdersFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </>
  )
}
