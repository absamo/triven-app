import { ActionIcon, Alert, Badge, Grid, Loader, Table, Text, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'

import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { IconEdit, IconExclamationCircle } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useSubmit } from 'react-router'
import { PURCHASE_ORDER_STATUSES } from '~/app/common/constants'
import { getPurchaseOrderItemsStatusLabel } from '~/app/common/helpers/purchase'
import type { IPurchaseOrderItem } from '~/app/common/validations/purchaseOrderItemSchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { IPurchaseReceiveItem } from '~/app/common/validations/purchaseReceiveItemSchema'
import {
  type IPurchaseReceive,
  purchaseReceiveSchema,
} from '~/app/common/validations/purchaseReceiveSchema'
import { Form } from '~/app/components'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'
import PurchaseReceiveItemForm from './PurchaseReceiveItemForm'

interface PurchaseReceivesFormProps {
  purchaseReceive: IPurchaseReceive
  purchaseOrders: IPurchaseOrder[]
  errors: Record<string, string>
}

export default function PurchaseReceivesForm({
  purchaseReceive,
  purchaseOrders,
  errors,
}: PurchaseReceivesFormProps) {
  const { t } = useTranslation(['purchaseReceives', 'common'])

  const [opened, { open, close }] = useDisclosure(false)
  const [purchaseReceiveItem, setPurchaseReceiveItem] = useState<IPurchaseReceiveItem>(
    {} as IPurchaseReceiveItem
  )

  const [purchaseOrderFetched, setPurchaseOrderFetched] = useState(false)

  const form = useForm({
    validate: zodResolver(purchaseReceiveSchema),
    initialValues: {
      id: purchaseReceive.id,
      purchaseReceiveReference: purchaseReceive.purchaseReceiveReference,
      receivedDate: new Date(purchaseReceive.receivedDate),
      purchaseOrderId: purchaseReceive.purchaseOrderId,
      notes: purchaseReceive.notes,
      purchaseReceiveItems: purchaseReceive.purchaseReceiveItems || [],
    },
  })

  const fetcher = useFetcher()

  type FetcherData = {
    purchaseOrder: IPurchaseOrder
  }

  const data = fetcher.data as FetcherData

  useEffect(() => {
    if (data) {
      form.setFieldValue(
        'purchaseReceiveItems',
        ((data.purchaseOrder.purchaseOrderItems || [])?.map((purchaseItem: IPurchaseOrderItem) => {
          const purchaseReceiveItems = (data.purchaseOrder.purchaseReceives || [])
            .filter(
              (purchaseReceive: IPurchaseReceive) =>
                purchaseReceive.status !== PURCHASE_ORDER_STATUSES.CANCELLED
            )
            ?.flatMap((item: IPurchaseReceive) => item.purchaseReceiveItems)

          // as IPurchaseReceiveItem[]

          const receivedItem = (purchaseReceiveItems || [])?.find(
            (item) => item?.productId === purchaseItem?.productId
          )

          const receivedQuantity = receivedItem?.receivedQuantity || 0

          //TODO: add status to purchase receive item and filter out cancelled status

          return {
            purchaseOrderId: purchaseItem.id,
            productId: purchaseItem?.productId,
            product: purchaseItem.product,
            receivedQuantity,
            orderedQuantity: purchaseItem.quantity,
          }
        }) as IPurchaseReceiveItem[]) || []
      )
    }
  }, [data])

  const handlePurchaseReceiveItemClick = ({
    id,
    purchaseOrderId,
    product,
    productId,
    orderedQuantity,
    receivedQuantity,
  }: IPurchaseReceiveItem) => {
    setPurchaseReceiveItem({
      id,
      purchaseOrderId,
      product,
      productId,
      orderedQuantity,
      receivedQuantity,
    })
    open()
  }

  const submit = useSubmit()

  const handleSubmit = ({
    purchaseReceiveReference,
    receivedDate,
    purchaseOrderId,
  }: IPurchaseReceive) => {
    const formData = new FormData()

    formData.append('purchaseReceiveReference', purchaseReceiveReference)
    formData.append('receivedDate', JSON.stringify(receivedDate))
    formData.append('purchaseOrderId', purchaseOrderId)
    formData.append('purchaseReceiveItems', JSON.stringify(form.values.purchaseReceiveItems))

    if (form.values.purchaseReceiveItems.length === 0) {
      form.setErrors({
        purchaseReceiveItems: t(
          'purchaseReceives:purchaseReceiveItemRequired',
          'Please add a purchase item to receive item before submitting the form'
        ),
      })
      return
    }

    submit(formData, { method: 'post' })
  }

  const purchaseOrderOptions = purchaseOrders.map((purchaseOrder: IPurchaseOrder) => ({
    value: purchaseOrder.id,
    label: purchaseOrder.purchaseOrderReference,
  }))

  const handleClose = () => {
    setPurchaseReceiveItem({} as IPurchaseReceiveItem)
    close()
  }

  const purchaseOrderCancelled =
    purchaseReceive.purchaseOrder?.status === PURCHASE_ORDER_STATUSES.CANCELLED

  const canEdit =
    (!purchaseOrderCancelled && purchaseReceive?.status === PURCHASE_ORDER_STATUSES.PENDING) ||
    !purchaseReceive?.id

  const purchaseReceivedCancelled = purchaseReceive?.status === PURCHASE_ORDER_STATUSES.CANCELLED

  const rows = (form.values.purchaseReceiveItems || []).map(
    ({
      id,
      product,
      productId,
      receivedQuantity,
      orderedQuantity,
      purchaseOrderId,
      purchaseReceive,
    }) => {
      const status = getPurchaseOrderItemsStatusLabel(
        orderedQuantity,
        receivedQuantity,
        purchaseReceivedCancelled
      )

      return (
        <Table.Tr key={productId}>
          <Table.Td>
            <Text size="sm" w={200}>
              {product?.name}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{orderedQuantity}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{receivedQuantity}</Text>
          </Table.Td>
          <Table.Td>
            <Badge color={status.color} variant="light">
              {status.label}
            </Badge>
          </Table.Td>
          {/* <Table.Td>
            {canEdit && (
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() =>
                  form.setFieldValue("purchaseReceiveItems", [
                    ...(form.values.purchaseReceiveItems || []).filter(
                      (purchaseReceiveItem: IPurchaseReceiveItem) =>
                        purchaseReceiveItem.productId !== product?.id
                    ),
                  ])
                }
              >
                <IconTrash style={{ width: 16, height: 16 }} stroke={1.5} />
              </ActionIcon>
            )}
          </Table.Td> */}
          <Table.Td>
            {!purchaseReceivedCancelled && (
              <ActionIcon
                variant="subtle"
                onClick={() => {
                  handlePurchaseReceiveItemClick({
                    id,
                    purchaseOrderId,
                    product,
                    productId,
                    orderedQuantity,
                    receivedQuantity,
                  })
                }}
              >
                <IconEdit style={{ width: 16, height: 16 }} stroke={1.5} />
              </ActionIcon>
            )}
          </Table.Td>
        </Table.Tr>
      )
    }
  )

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/purchase-receives'}>
            {purchaseReceive.id
              ? t('purchaseReceives:editPurchaseReceive', 'Edit a purchase receive')
              : t('purchaseReceives:addPurchaseReceive', 'Add a purchase receive')}
          </Title>

          {form.errors.purchaseReceiveItems && (
            <Alert variant="light" color="red" icon={<IconExclamationCircle />} withCloseButton>
              <Text size="sm">{form.errors.purchaseReceiveItems}</Text>
            </Alert>
          )}

          <Form onSubmit={purchaseReceivedCancelled ? undefined : form.onSubmit(handleSubmit)}>
            <Grid.Col span={4}>
              <TextInput
                withAsterisk
                label={t(
                  'purchaseReceives:purchaseReceiveReferenceLabel',
                  'Purchase receive reference'
                )}
                name="purchaseReceiveReference"
                disabled={purchaseReceivedCancelled}
                {...form.getInputProps('purchaseReceiveReference')}
                error={
                  form.getInputProps('purchaseReceiveReference').error ||
                  errors?.purchaseReceiveReference
                }
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('purchaseReceives:receivedDateLabel', 'Received date')}
                name="receivedDate"
                minDate={new Date()}
                clearable={!purchaseReceivedCancelled}
                disabled={purchaseReceivedCancelled}
                {...form.getInputProps('receivedDate')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <SearchableSelect
                withAsterisk
                label={t('purchaseReceives:purchaseOrder', 'Purchase order')}
                placeholder={t('purchaseReceives:selectPurchaseOrder', 'Select a purchase order')}
                name="purchaseOrderId"
                clearable={canEdit}
                disabled={!canEdit}
                onClear={() => {
                  form.getInputProps('purchaseReceiveItems').onChange([])
                }}
                data={purchaseOrderOptions}
                onChange={(currentPurchaseOrderId: string) => {
                  if (!currentPurchaseOrderId) {
                    form.getInputProps('purchaseOrderId').onChange('')
                    return
                  }

                  form.getInputProps('purchaseOrderId').onChange(currentPurchaseOrderId)
                  fetcher.load(`/api/purchaseOrders/${currentPurchaseOrderId}`)
                }}
                value={form.values.purchaseOrderId}
                rightSection={fetcher.state === 'loading' ? <Loader size={16} /> : null}
                searchValue={purchaseOrderFetched ? '' : undefined}
                error={form.errors?.purchaseOrderId}
              />
            </Grid.Col>

            <Grid.Col>
              <Table verticalSpacing="xs" highlightOnHover={canEdit} striped mt={'md'}>
                <Table.Thead fz={12}>
                  <Table.Tr>
                    <Table.Th>
                      {t('purchaseReceives:purchaseReceiveItem', 'Purchase receive item')}
                    </Table.Th>
                    <Table.Th>{t('purchaseReceives:orderedQty', 'Ordered Qty')}</Table.Th>
                    <Table.Th>{t('purchaseReceives:receivedQty', 'Received Qty')}</Table.Th>
                    <Table.Th>{t('purchaseReceives:status', 'Status')}</Table.Th>
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
                          {t('purchaseReceives:noPurchaseItemsFound', 'No purchase items found')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              {opened && (
                <PurchaseReceiveItemForm
                  purchaseReceiveItem={purchaseReceiveItem}
                  opened={opened}
                  onClose={handleClose}
                  onSubmit={(currentPurchaseReceiveItem) => {
                    form.setFieldValue('purchaseReceiveItems', [
                      ...form.values.purchaseReceiveItems.map((item) => {
                        if (item.productId === currentPurchaseReceiveItem.productId) {
                          return {
                            id: currentPurchaseReceiveItem.id,
                            productId: currentPurchaseReceiveItem.productId,
                            receivedQuantity: currentPurchaseReceiveItem.receivedQuantity,
                            orderedQuantity: currentPurchaseReceiveItem.orderedQuantity,
                            purchaseOrderId: currentPurchaseReceiveItem.purchaseOrderId,
                            product: currentPurchaseReceiveItem.product,
                          }
                        }

                        return item
                      }),
                    ])
                  }}
                />
              )}
            </Grid.Col>
            {/* )} */}
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
