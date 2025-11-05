import {
  ActionIcon,
  Alert,
  Button,
  Grid,
  Group,
  NumberInput,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { IconExclamationCircle, IconPlus, IconTrash } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'
import { TRANSFER_ORDER_REASONS } from '~/app/common/constants'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { ITransferOrderItem } from '~/app/common/validations/transferOrderItemSchema'

import type { ITransferOrder } from '~/app/common/validations/transferOrderSchema'

import { Form } from '~/app/components'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'
import TransferOrderItemForm from '../TransferOrderItemForm'

interface TransferOrderFormProps {
  transferOrder: ITransferOrder
  sites: ISite[]
  products: IProduct[]
  errors: Record<string, string>
}

export default function TransferOrdersForm({
  transferOrder,
  sites,
  products,
  errors,
}: TransferOrderFormProps) {
  const { t } = useTranslation('inventory')
  const [opened, { open, close }] = useDisclosure(false)
  const [transferOrderItem, setTransferOrderItem] = useState<ITransferOrderItem>(
    {} as ITransferOrderItem
  )

  // Inline form state
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)

  // Helper function to translate transfer order reasons
  const getTransferOrderReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      [TRANSFER_ORDER_REASONS.DAMAGED_ITEMS]: t('damagedItems'),
      [TRANSFER_ORDER_REASONS.INTERNAL_TRANSFER]: t('internalTransfer'),
      [TRANSFER_ORDER_REASONS.DEMO]: t('demo'),
      [TRANSFER_ORDER_REASONS.EXCESS_STOCK]: t('excessStock'),
      [TRANSFER_ORDER_REASONS.LOST_ITEMS]: t('lostItems'),
      [TRANSFER_ORDER_REASONS.QUALITY_CONTROL]: t('qualityControl'),
      [TRANSFER_ORDER_REASONS.RETURN_SUPPLIER]: t('returnSupplier'),
      [TRANSFER_ORDER_REASONS.UNACCOUNTED_INVENTORY]: t('unaccountedInventory'),
      [TRANSFER_ORDER_REASONS.PURCHASE]: t('purchase'),
      [TRANSFER_ORDER_REASONS.SALE]: t('sale'),
      [TRANSFER_ORDER_REASONS.RETURN]: t('return'),
      [TRANSFER_ORDER_REASONS.REFUND]: t('refund'),
      [TRANSFER_ORDER_REASONS.OTHER]: t('other'),
    }
    return reasonMap[reason] || reason
  }

  const form = useForm({
    // validate: zodResolver(transferOrderSchema),
    initialValues: {
      id: transferOrder.id,
      transferOrderReference: transferOrder.transferOrderReference,
      reason: transferOrder.reason,
      siteFromId: transferOrder.siteFromId,
      siteToId: transferOrder.siteToId,
      transferOrderDate: transferOrder.transferOrderDate,
      transferOrderItems: transferOrder.transferOrderItems || [],
      sourceSites: sites,
      destinationSites: transferOrder.id ? sites : [],
    },
  })

  const submit = useSubmit()

  // Clear inline form when source site changes
  useEffect(() => {
    setSelectedProduct('')
    setQuantity(1)
  }, [form.values.siteFromId])

  // Filter products for inline form
  const usedProductIds = form.values.transferOrderItems.map((item: any) => item.productId)
  const availableProducts = products.filter(
    (product) =>
      !usedProductIds.includes(product.id) &&
      (!form.values.siteFromId || product.siteId === form.values.siteFromId)
  )

  const productOptions = availableProducts.map((product) => ({
    value: product.id!,
    label: `${product.name} - ${product.sku || 'No SKU'}`,
  }))

  // Add item function for inline form
  const addItem = () => {
    if (!selectedProduct) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const newItem = {
      transferOrderId: transferOrder.id || '',
      productId: selectedProduct,
      quantity,
    }

    form.setFieldValue(
      'transferOrderItems',
      [...form.values.transferOrderItems, newItem]
        .sort((a, b) => a.productId.localeCompare(b.productId))
        .reverse()
    )

    // Reset form
    setSelectedProduct('')
    setQuantity(1)
  }

  // Remove item function
  const removeItem = (index: number) => {
    const items = [...form.values.transferOrderItems]
    items.splice(index, 1)
    form.setFieldValue('transferOrderItems', items)
  }

  const handleClose = () => {
    setTransferOrderItem({} as ITransferOrderItem)
    close()
  }

  const handleSubmit = ({
    transferOrderReference,
    reason,
    siteFromId,
    siteToId,
    transferOrderDate,
  }: ITransferOrder) => {
    const formData = new FormData()
    formData.append('transferOrderReference', transferOrderReference)
    formData.append('reason', JSON.stringify(reason))
    formData.append('siteFromId', siteFromId)
    formData.append('siteToId', siteToId)
    formData.append('transferOrderDate', JSON.stringify(transferOrderDate))
    formData.append(
      'transferOrderItems',
      JSON.stringify(
        form.values.transferOrderItems.map((transferOrderItem: ITransferOrderItem) => ({
          quantity: transferOrderItem.quantity,
          productId: transferOrderItem.productId,
        }))
      )
    )

    submit(formData, { method: 'post' })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/transfer-orders'}>
          {transferOrder.id ? t('editTransferOrder') : t('addTransferOrder')}
        </Title>
        <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
          <Grid.Col span={4}>
            <TextInput
              withAsterisk
              label={t('reference')}
              name="transferOrderReference"
              {...form.getInputProps('transferOrderReference')}
              error={form.getInputProps('transferOrderReference').error || errors?.name}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label={t('reason')}
              placeholder={t('selectAReason')}
              name="reason"
              withAsterisk
              value={form.values.reason}
              data={[
                {
                  value: TRANSFER_ORDER_REASONS.DAMAGED_ITEMS,
                  label: getTransferOrderReasonLabel(TRANSFER_ORDER_REASONS.DAMAGED_ITEMS),
                },
                {
                  value: TRANSFER_ORDER_REASONS.INTERNAL_TRANSFER,
                  label: getTransferOrderReasonLabel(TRANSFER_ORDER_REASONS.INTERNAL_TRANSFER),
                },
                {
                  value: TRANSFER_ORDER_REASONS.DEMO,
                  label: getTransferOrderReasonLabel(TRANSFER_ORDER_REASONS.DEMO),
                },
                {
                  value: TRANSFER_ORDER_REASONS.EXCESS_STOCK,
                  label: getTransferOrderReasonLabel(TRANSFER_ORDER_REASONS.EXCESS_STOCK),
                },
                {
                  value: TRANSFER_ORDER_REASONS.LOST_ITEMS,
                  label: getTransferOrderReasonLabel(TRANSFER_ORDER_REASONS.LOST_ITEMS),
                },
              ]}
              {...form.getInputProps('reason')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <DateInput
              valueFormat="DD/MM/YYYY"
              label={t('transferOrderDate')}
              name="transferOrderDate"
              minDate={new Date()}
              {...form.getInputProps('transferOrderDate')}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <SearchableSelect
              label={t('sourceSite')}
              placeholder={t('selectSourceSite')}
              name="siteFromId"
              withAsterisk
              data={form.values.sourceSites
                .filter((sourceSite: ISite) => sourceSite.id !== form.values.siteToId)
                .map((sourceSite: ISite) => {
                  return {
                    value: sourceSite.id || '',
                    label: sourceSite.name,
                  }
                })}
              {...form.getInputProps('siteFromId')}
              onChange={(value: string) => {
                const destinationSites = form.values.sourceSites.filter(
                  (site: ISite) => site.id !== value
                ) as ISite[]
                form.setFieldValue('destinationSites', destinationSites)
                form.getInputProps('siteFromId').onChange(value)
              }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <SearchableSelect
              label={t('destinationSite')}
              placeholder={t('selectDestinationSite')}
              name="siteToId"
              withAsterisk
              disabled={form.values.destinationSites.length === 0}
              data={form.values.destinationSites.map((destinationSite: ISite) => {
                return {
                  value: destinationSite.id || '',
                  label: destinationSite.name,
                }
              })}
              {...form.getInputProps('siteToId')}
            />
          </Grid.Col>

          {/* Inline Product Adding Section */}
          <Grid.Col>
            <Text size="lg" fw={600} mb="md">
              {t('addProduct')}
            </Text>

            {/* Inline Add Form */}
            <Grid grow mb={20}>
              <Grid.Col span={8}>
                <SearchableSelect
                  label={t('products')}
                  placeholder="Select a product"
                  data={productOptions}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  disabled={!form.values.siteFromId}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <NumberInput
                  label={t('quantity')}
                  placeholder="1"
                  min={1}
                  value={quantity}
                  onChange={(value) => setQuantity(typeof value === 'number' ? value : 1)}
                />
              </Grid.Col>
              <Grid.Col span="auto">
                <Group align="end" h={'100%'}>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={addItem}
                    disabled={!selectedProduct}
                    variant="light"
                  >
                    Add Item
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
            {form.values.transferOrderItems.length === 0 && (
              <Alert
                icon={<IconExclamationCircle size={16} />}
                color="yellow"
                variant="light"
                mb="md"
              >
                <Text size="sm">No products added yet</Text>
              </Alert>
            )}

            {/* Transfer Order Items Table */}
            {form.values.transferOrderItems.length > 0 && (
              <Table mt="md" highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('products')}</Table.Th>
                    <Table.Th>{t('quantity')}</Table.Th>
                    <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {form.values.transferOrderItems.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId)
                    return (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text size="sm">{product?.name || 'Unknown Product'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{item.quantity}</Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon color="red" variant="light" onClick={() => removeItem(index)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Grid.Col>

          {/* Modal for editing items */}
          {opened && (
            <TransferOrderItemForm
              products={availableProducts}
              transferOrderItem={transferOrderItem}
              opened={opened}
              onClose={handleClose}
              onSubmit={(currentTransferOrderItem: ITransferOrderItem) => {
                form.setFieldValue(
                  'transferOrderItems',
                  [
                    ...form.values.transferOrderItems.filter((item) => {
                      return item.productId !== currentTransferOrderItem.productId
                    }),
                    {
                      transferOrderId: currentTransferOrderItem.transferOrderId || '',
                      productId: currentTransferOrderItem.productId,
                      quantity: currentTransferOrderItem.quantity,
                    },
                  ]
                    .sort((a, b) => {
                      return a.productId.localeCompare(b.productId)
                    })
                    .reverse()
                )
              }}
            />
          )}
        </Form>
      </Grid.Col>
    </Grid>
  )
}
