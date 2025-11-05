import { Badge, Menu, Table, Text, UnstyledButton } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconDotsVertical } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from 'react-router'
import { PURCHASE_ORDER_STATUSES } from '~/app/common/constants'
import { getPurchaseOrderStatusLabel } from '~/app/common/helpers/purchase'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { IPurchaseReceive } from '~/app/common/validations/purchaseReceiveSchema'
import { PurchaseOrderFilters } from '~/app/partials/PurchaseOrderFilters'
import { Title } from '~/app/partials/Title'

interface PurchaseReceivesProps {
  purchaseReceives: IPurchaseReceive[]
  purchaseOrders: IPurchaseOrder[]
  permissions: string[]
}

type FetcherData = {
  purchaseReceives: IPurchaseReceive[]
}

export default function PurchaseReceivesPage({
  purchaseReceives,
  permissions,

  purchaseOrders,
}: PurchaseReceivesProps) {
  const { t } = useTranslation(['purchaseReceives', 'common'])

  // Helper function to get translated status labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case PURCHASE_ORDER_STATUSES.PENDING:
        return t('purchaseReceives:pending', 'Pending')
      case PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED:
        return t('purchaseReceives:partiallyReceived', 'Partially received')
      case PURCHASE_ORDER_STATUSES.RECEIVED:
        return t('purchaseReceives:received', 'Received')
      case PURCHASE_ORDER_STATUSES.CANCELLED:
        return t('purchaseReceives:cancelled', 'Cancelled')
      default:
        return status
    }
  }

  const [data, setData] = useState<FetcherData | null>(null)
  const [purchaseOrderReference, setPurchaseOrderReference] = useState<string>()
  const location = useLocation()
  useEffect(() => {
    if (location.state?.purchaseOrderReference) {
      setPurchaseOrderReference(location.state.purchaseOrderReference)
    }
  }, [location.state?.purchaseOrderReference])

  const canCreate = permissions.includes('create:purchaseReceives')
  const canUpdate = permissions.includes('update:purchaseReceives')

  const navigate = useNavigate()

  const submit = useSubmit()

  const form = useForm()

  const handleSubmit = () => {
    const { status, purchaseReceiveId } = form.values
    const formData = new FormData()
    formData.append('status', JSON.stringify(status))
    formData.append('purchaseReceiveId', purchaseReceiveId)
    submit(formData, { method: 'post', action: '/purchase-receives' })
  }

  const rows = (data?.purchaseReceives || purchaseReceives).map(
    ({
      id,
      receivedDate,
      purchaseOrder,
      purchaseReceiveReference,
      receivedQuantity,
      status,
      purchaseOrderId,
    }) => {
      const orderedQuantity = (purchaseOrder?.purchaseOrderItems || []).reduce(
        (acc, item) => acc + item.quantity,
        0
      )

      const purchaseReceivesStatus = getPurchaseOrderStatusLabel(status)
      return (
        <Table.Tr
          key={id}
          onClick={() => {
            canUpdate && navigate(`/purchase-receives/${id}/edit`)
          }}
        >
          <Table.Td>{purchaseOrder?.supplier?.name}</Table.Td>
          <Table.Td>{purchaseOrder?.purchaseOrderReference}</Table.Td>
          <Table.Td>{orderedQuantity}</Table.Td>
          <Table.Td>{purchaseReceiveReference}</Table.Td>
          <Table.Td>{receivedQuantity}</Table.Td>
          <Table.Td>
            <Text size="sm"> {dayjs(receivedDate).format('DD-MM-YYYY')}</Text>
          </Table.Td>
          <Table.Td>
            <Badge color={purchaseReceivesStatus.color} variant="light">
              {purchaseReceivesStatus.label}
            </Badge>
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
                    component={Link}
                    to={'/purchase-orders'}
                    state={{
                      purchaseOrderReference: purchaseOrder?.purchaseOrderReference,
                    }}
                  >
                    {t('purchaseReceives:viewPurchaseOrders', 'View Purchase Orders')}
                  </Menu.Item>

                  <Menu.Item
                    type="submit"
                    color="red"
                    disabled={status === PURCHASE_ORDER_STATUSES.CANCELLED}
                    onClick={() => {
                      form.setValues({
                        purchaseReceiveId: id,
                        status: PURCHASE_ORDER_STATUSES.CANCELLED,
                      })
                    }}
                  >
                    {t('purchaseReceives:cancelOrder', 'Cancel order')}
                  </Menu.Item>
                </Form>
              </Menu.Dropdown>
            </Menu>
          </Table.Td>
        </Table.Tr>
      )
    }
  )

  return (
    <>
      <Title to={'/purchase-receives/create'} canCreate={canCreate}>
        {t('purchaseReceives:title', 'Purchase Receives')}
      </Title>

      <PurchaseOrderFilters
        searchProps={{
          description: t('purchaseReceives:search', 'Search'),
        }}
        statusOrderProps={{
          data: [
            {
              value: PURCHASE_ORDER_STATUSES.PENDING,
              label: getStatusLabel(PURCHASE_ORDER_STATUSES.PENDING),
            },
            {
              value: PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
              label: getStatusLabel(PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED),
            },
            {
              value: PURCHASE_ORDER_STATUSES.RECEIVED,
              label: getStatusLabel(PURCHASE_ORDER_STATUSES.RECEIVED),
            },
            {
              value: PURCHASE_ORDER_STATUSES.CANCELLED,
              label: getStatusLabel(PURCHASE_ORDER_STATUSES.CANCELLED),
            },
          ],

          description: t('purchaseReceives:filterByReceivedStatus', 'Filter by received status'),
        }}
        purchaseOrderProps={{
          data: purchaseOrders.map((purchaseOrder: IPurchaseOrder) => {
            return purchaseOrder?.purchaseOrderReference
          }),
          values: purchaseOrderReference ? [purchaseOrderReference] : [],
          description: t('purchaseReceives:filterByPurchaseOrder', 'Filter by purchase order'),
          purchaseOrderReference: location.state?.purchaseOrderReference,
        }}
        dateProps={{
          description: t('purchaseReceives:filterByReceivedDate', 'Filter by received date'),
        }}
        route="/api/purchase-receives-search"
        onFilter={setData}
      />

      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('purchaseReceives:supplierName', 'Supplier Name')}</Table.Th>
            <Table.Th>{t('purchaseReceives:purchaseOrderNumber', 'Purchase Order #')}</Table.Th>
            <Table.Th>{t('purchaseReceives:orderedQty', 'Ordered Qty')}</Table.Th>
            <Table.Th>{t('purchaseReceives:purchaseReceiveNumber', 'Purchase Receive #')}</Table.Th>
            <Table.Th>{t('purchaseReceives:receivedQty', 'Received Qty')}</Table.Th>
            <Table.Th>{t('purchaseReceives:receivedDate', 'Received Date')}</Table.Th>

            <Table.Th>{t('purchaseReceives:status', 'Status')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">
                <Text size="sm" c="dimmed">
                  {t('purchaseReceives:noPurchaseReceivesFound', 'No purchase receives found')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </>
  )
}
