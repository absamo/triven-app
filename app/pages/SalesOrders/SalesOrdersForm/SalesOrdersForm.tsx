import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Menu,
  NumberInput,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'

import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconEdit,
  IconExclamationCircle,
  IconEye,
  IconPlus,
  IconTrash,
  IconTruck,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { Link, useFetcher, useSubmit } from 'react-router'
import { PRODUCT_STATUSES, PURCHASE_ORDER_PAYMENT_TERMS } from '~/app/common/constants'
import { type IAgency } from '~/app/common/validations/agencySchema'
import { type IProduct } from '~/app/common/validations/productSchema'
import { salesOrderSchema } from '~/app/common/validations/salesOrderSchema'
import { Form, TableActionsMenu } from '~/app/components'
import { AgencySites } from '~/app/partials/AgencySites'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'

import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { formatMoney } from '~/app/common/helpers/money'
import { type ICurrency } from '~/app/common/validations/currencySchema'
import { type ICustomer } from '~/app/common/validations/customerSchema'
import { type ISalesOrderItem } from '~/app/common/validations/salesOrderItemSchema'
import { type ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import SalesOrderItemForm from './SalesOrderItemForm'
import classes from './SalesOrdersForm.module.css'

interface SalesOrdersFormProps {
  salesOrder: ISalesOrder
  sites: ISite[]
  agencies: IAgency[]
  customers: ICustomer[]
  products: IProduct[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function SalesOrdersForm({
  salesOrder,
  sites,
  agencies,
  customers,
  products,
  currency,
  errors,
}: SalesOrdersFormProps) {
  const { t } = useTranslation(['salesOrders', 'forms', 'common'])
  const { t: tInventory } = useTranslation('inventory')

  // Product statuses for display
  const productsStatuses = [
    {
      label: tInventory('available'),
      color: 'green',
      type: PRODUCT_STATUSES.AVAILABLE,
    },
    {
      label: tInventory('critical'),
      color: 'orange',
      type: PRODUCT_STATUSES.CRITICAL,
    },
    {
      label: tInventory('lowStock'),
      color: 'yellow',
      type: PRODUCT_STATUSES.LOWSTOCK,
    },
    {
      label: tInventory('outOfStock'),
      color: 'red',
      type: PRODUCT_STATUSES.OUTOFSTOCK,
    },
    {
      label: tInventory('damaged'),
      color: 'red',
      type: PRODUCT_STATUSES.DAMAGED,
    },
    {
      label: tInventory('discontinued'),
      color: 'red',
      type: PRODUCT_STATUSES.DISCONTINUED,
    },
    {
      label: tInventory('inTransit'),
      color: 'blue',
      type: PRODUCT_STATUSES.INTRANSIT,
    },
    {
      label: tInventory('reserved'),
      color: 'blue',
      type: PRODUCT_STATUSES.RESERVED,
    },
    {
      label: tInventory('archived'),
      color: 'blue',
      type: PRODUCT_STATUSES.ARCHIVED,
    },
    {
      label: tInventory('onOrder'),
      color: 'blue',
      type: PRODUCT_STATUSES.ONORDER,
    },
  ]

  const [opened, { open, close }] = useDisclosure(false)
  const [salesOrderItem, setSalesOrderItem] = useState<ISalesOrderItem>({} as ISalesOrderItem)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  // State for inline product selection form
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [rate, setRate] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)

  // State to track created backorders for each sales order item (by salesOrderItemId)
  const [createdBackorders, setCreatedBackorders] = useState<
    Map<string, { backorderReference: string; backorderId: string }>
  >(new Map())

  const form = useForm({
    validate: zodResolver(salesOrderSchema),
    initialValues: {
      id: salesOrder.id,
      salesOrderReference: salesOrder.salesOrderReference,
      status: salesOrder.status,
      paymentTerms: salesOrder.paymentTerms,
      orderDate: new Date(salesOrder.orderDate),
      expectedShipmentDate: salesOrder.expectedShipmentDate
        ? new Date(salesOrder.expectedShipmentDate)
        : null,
      siteId: salesOrder.siteId,
      agencyId: salesOrder.agencyId,
      customerId: salesOrder.customerId,
      salesOrderItems: salesOrder.salesOrderItems || [],
    },
    onValuesChange: (values) => {
      // Form values changed
    },
  })

  // Track form errors when they change
  useEffect(() => {
    // Form errors updated
  }, [form.errors])

  // Clear sales order items when agency changes to ensure products match the selected agency
  // Only apply this filtering for NEW sales orders, not when editing existing ones
  useEffect(() => {
    // Skip filtering for existing sales orders that already have items
    if (salesOrder.id && salesOrder.salesOrderItems && salesOrder.salesOrderItems.length > 0) {
      return
    }

    // Only filter if agency is selected and we have items to filter
    if (form.values.agencyId && form.values.salesOrderItems.length > 0) {
      const validItems = form.values.salesOrderItems.filter((item) => {
        const product = products.find((p) => p.id === item.productId)
        return product && product.agencyId === form.values.agencyId
      })

      if (validItems.length !== form.values.salesOrderItems.length) {
        form.setFieldValue('salesOrderItems', validItems)
      }
    }
  }, [form.values.agencyId, products, salesOrder.id, salesOrder.salesOrderItems])

  // Clear inline form when agency or site changes
  useEffect(() => {
    setSelectedProduct('')
    setQuantity(1)
    setRate(0)
    setTax(0)
  }, [form.values.agencyId, form.values.siteId])

  // Add item function for inline form
  const addItem = () => {
    if (!selectedProduct) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const amount = quantity * rate

    const newItem = {
      id: undefined,
      productId: selectedProduct,
      product,
      quantity,
      rate,
      tax,
      amount,
      status: undefined,
    }

    form.setFieldValue(
      'salesOrderItems',
      [...form.values.salesOrderItems, newItem]
        .sort((a, b) => a.productId.localeCompare(b.productId))
        .reverse()
    )

    // Reset form
    setSelectedProduct('')
    setQuantity(1)
    setRate(0)
    setTax(0)
  }

  const submit = useSubmit()
  const backorderFetcher = useFetcher()

  // Handle backorder fetcher response
  useEffect(() => {
    if (backorderFetcher.state === 'idle' && backorderFetcher.data) {
      if (backorderFetcher.data.success && backorderFetcher.data.backorder) {
        // Update the created backorders map with the actual backorder reference
        const backorderReference = backorderFetcher.data.backorder.backorderReference
        const backorderId = backorderFetcher.data.backorder.id
        const salesOrderItemId = backorderFetcher.data.backorderItems?.[0]?.salesOrderItemId

        if (salesOrderItemId && backorderReference && backorderId) {
          setCreatedBackorders(
            (prev) =>
              new Map(
                prev.set(salesOrderItemId, {
                  backorderReference,
                  backorderId,
                })
              )
          )
        }

        // Show success notification with actual backorder reference
        notifications.show({
          title: 'Backorder Created',
          message:
            backorderFetcher.data.notification?.message ||
            `Backorder ${backorderReference} created successfully`,
          color: 'green',
          icon: <IconTruck style={{ width: 16, height: 16 }} />,
          autoClose: 3000, // Auto-close after 4 seconds
        })
      } else if (backorderFetcher.data.error) {
        // Show error notification
        notifications.show({
          title: 'Error',
          message: backorderFetcher.data.message || 'Failed to create backorder',
          color: 'red',
        })
      }
    }
  }, [backorderFetcher.state, backorderFetcher.data])

  const handleCreateBackorder = async (salesOrderItem: ISalesOrderItem) => {
    const fullProduct = products.find((p) => p.id === salesOrderItem.productId)

    if (!fullProduct) {
      notifications.show({
        title: 'Product Not Found',
        message: `Product with ID ${salesOrderItem.productId} could not be found. This may indicate a data consistency issue.`,
        color: 'red',
        icon: <IconExclamationCircle style={{ width: 16, height: 16 }} />,
      })
      return
    } // Prepare data in the format expected by the API
    const requestData = {
      salesOrderId: salesOrder.id,
      outOfStockItems: [
        {
          salesOrderItemId: salesOrderItem.id,
          productId: salesOrderItem.productId,
          requestedQuantity: salesOrderItem.quantity,
          availableQuantity: 0, // Assuming no stock available for backorder creation
          rate: salesOrderItem.rate,
        },
      ],
    }

    // Submit to our new API endpoint using fetcher
    backorderFetcher.submit(JSON.stringify(requestData), {
      method: 'post',
      action: '/api/salesorders',
      encType: 'application/json',
    })
  }

  const handleSubmit = ({
    salesOrderReference,
    paymentTerms,
    orderDate,
    expectedShipmentDate,
    agencyId,
    siteId,
    customerId,
  }: ISalesOrder) => {
    if (form.values.salesOrderItems.length === 0) {
      form.setErrors({
        salesOrderItems: t('salesOrders:atLeastOneSalesOrderItemRequired'),
      })
      return
    }

    const formData = new FormData()

    formData.append('salesOrderReference', salesOrderReference || '')
    formData.append('customerId', customerId)
    formData.append('orderDate', JSON.stringify(orderDate))
    formData.append('expectedShipmentDate', JSON.stringify(expectedShipmentDate))
    formData.append('paymentTerms', JSON.stringify(paymentTerms))
    formData.append('siteId', siteId)
    formData.append('agencyId', agencyId)

    formData.append(
      'salesOrderItems',
      JSON.stringify(
        form.values.salesOrderItems.map((salesOrderItems: ISalesOrderItem) => ({
          productId: salesOrderItems.productId,
          quantity: salesOrderItems.quantity,
          rate: salesOrderItems.rate,
          tax: salesOrderItems.tax || 0,
          amount: salesOrderItems.amount,
        }))
      )
    )

    submit(formData, { method: 'post' })
  }

  const customerOptions = customers.map((cutomer: ICustomer) => ({
    value: cutomer.id || '',
    label: `${cutomer.firstName} (${cutomer.lastName})`,
  }))

  // Filter products for inline form
  const usedProductIds = form.values.salesOrderItems.map((item: any) => item.productId)
  const availableProducts = products.filter(
    (product) =>
      !usedProductIds.includes(product.id) &&
      (!form.values.agencyId || product.agencyId === form.values.agencyId) &&
      (!form.values.siteId || product.siteId === form.values.siteId)
  )

  const productOptions = availableProducts.map((product) => ({
    value: product.id!,
    label: `${product.name} - ${product.sku || 'No SKU'}`,
  }))

  // Helper function to get error for a specific field
  const getItemError = (index: number, field: string) => {
    return form.errors[`salesOrderItems.${index}.${field}`]
  }

  // Helper function to check if a cell has an error
  const hasError = (index: number, field: string) => {
    return !!getItemError(index, field)
  }

  const rows = form.values.salesOrderItems.map((salesOrderItem, index) => {
    const { id, product, quantity, rate, tax, amount, status, productId } = salesOrderItem

    // Find the corresponding database sales order item to check for existing backorder
    const dbSalesOrderItem = salesOrder.salesOrderItems?.find(
      (item) =>
        item.id === salesOrderItem.id ||
        (item.productId === salesOrderItem.productId && !salesOrderItem.id)
    ) as any // Type assertion to access backorderItem

    return (
      <Table.Tr
        key={product?.id || id}
        style={{ position: 'relative' }}
        onMouseEnter={() => setHoveredRowId(product?.id || id || null)}
        onMouseLeave={() => setHoveredRowId(null)}
      >
        <Table.Td>
          <Text size="sm" w={220}>
            {product?.name}
          </Text>
        </Table.Td>
        <Table.Td>
          {(() => {
            const fullProduct = products.find((p) => p.id === productId)

            const currentStatus = productsStatuses.find(
              (statusItem) => statusItem.type === fullProduct?.status
            )

            return currentStatus ? (
              <Badge color={currentStatus.color} variant="light">
                {currentStatus.label}
              </Badge>
            ) : null
          })()}
        </Table.Td>
        <Table.Td>
          <Text size="sm" className={hasError(index, 'quantity') ? classes.errorText : undefined}>
            {quantity}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" className={hasError(index, 'rate') ? classes.errorText : undefined}>
            {formatMoney(rate)}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" className={hasError(index, 'tax') ? classes.errorText : undefined}>
            {tax || undefined}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" className={hasError(index, 'amount') ? classes.errorText : undefined}>
            {formatMoney(amount)}
          </Text>
        </Table.Td>
        <Table.Td style={{ textAlign: 'center', position: 'relative', padding: 0 }}>
          <TableActionsMenu itemId={product?.id || id} hoveredRowId={hoveredRowId} menuWidth={180}>
            <Menu.Item
              leftSection={<IconEdit style={{ width: 14, height: 14 }} />}
              onClick={() => {
                setSalesOrderItem({
                  id,
                  productId: salesOrderItem.productId,
                  product,
                  quantity,
                  rate,
                  tax,
                  amount,
                  status,
                })
                open()
              }}
            >
              {t('common:edit')}
            </Menu.Item>
            {/* Show view backorder if backorder exists (either from database or newly created) */}
            {(dbSalesOrderItem?.backorderItem ||
              createdBackorders.has(salesOrderItem.id || '')) && (
              <Menu.Item
                leftSection={<IconEye style={{ width: 14, height: 14 }} />}
                component={Link}
                to={
                  dbSalesOrderItem?.backorderItem
                    ? `/backorders/${dbSalesOrderItem.backorderItem.backorderId}/edit`
                    : `/backorders/${createdBackorders.get(salesOrderItem.id || '')?.backorderId}/edit`
                }
              >
                {dbSalesOrderItem?.backorderItem
                  ? `View Backorder (${dbSalesOrderItem.backorderItem.backorder?.backorderReference || 'N/A'})`
                  : `View backorder (${createdBackorders.get(salesOrderItem.id || '')?.backorderReference})`}
              </Menu.Item>
            )}
            {/* Only show create backorder if sales order is saved, no backorder exists, and product is out of stock */}
            {(() => {
              const fullProduct = products.find((p) => p.id === productId)
              const isOutOfStock =
                fullProduct?.availableQuantity === 0 ||
                fullProduct?.status === 'OutOfStock' ||
                (fullProduct?.availableQuantity || 0) < quantity

              return (
                salesOrder.id &&
                salesOrderItem.id &&
                !dbSalesOrderItem?.backorderItem &&
                !createdBackorders.has(salesOrderItem.id || '') &&
                isOutOfStock
              )
            })() && (
              <Menu.Item
                leftSection={<IconTruck style={{ width: 14, height: 14 }} />}
                onClick={() => handleCreateBackorder(salesOrderItem)}
              >
                {t('salesOrders:createBackorder')}
              </Menu.Item>
            )}
            <Menu.Item
              color="red"
              leftSection={<IconTrash style={{ width: 14, height: 14 }} />}
              onClick={() => {
                const newItems = (form.values.salesOrderItems || []).filter(
                  (item: ISalesOrderItem) => item.productId !== salesOrderItem.productId
                )
                form.setFieldValue('salesOrderItems', newItems)

                // Clean up the created backorders map for this item
                if (salesOrderItem.id) {
                  setCreatedBackorders((prev) => {
                    const updated = new Map(prev)
                    updated.delete(salesOrderItem.id!)
                    return updated
                  })
                }

                // Reset selected product if the removed product was selected
                if (selectedProduct === salesOrderItem.productId) {
                  setSelectedProduct('')
                }
              }}
            >
              {t('common:delete')}
            </Menu.Item>
          </TableActionsMenu>
        </Table.Td>
      </Table.Tr>
    )
  })

  const totalAmount = form.values.salesOrderItems.reduce((acc, item) => acc + (item.amount || 0), 0)

  const handleClose = () => {
    setSalesOrderItem({} as ISalesOrderItem)
    close()
  }

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/sales-orders'}>
            {salesOrder.id ? t('salesOrders:edit') : t('salesOrders:addSalesOrder')}
          </Title>

          {form.errors.salesOrderItems && (
            <Alert
              variant="light"
              color="red"
              icon={<IconExclamationCircle />}
              classNames={{
                root: 'sales-order-error-alert',
              }}
            >
              <Text size="sm" c="red">
                {form.errors.salesOrderItems}
              </Text>
            </Alert>
          )}

          <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
            <Grid.Col span={4}>
              <TextInput
                withAsterisk
                label={t('salesOrders:salesOrderReference')}
                name="salesOrderReference"
                {...form.getInputProps('salesOrderReference')}
                error={
                  form.getInputProps('salesOrderReference').error || errors?.salesOrderReference
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <SearchableSelect
                withAsterisk
                placeholder={t('forms:selectCustomer')}
                data={customerOptions}
                label={t('salesOrders:customer')}
                value={form.values.customerId}
                name="customerId"
                onChange={(currentCustomer: string) => {
                  form.setFieldValue('customerId', currentCustomer)
                }}
                error={form.getInputProps('customerId').error}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                withAsterisk
                label={t('forms:paymentTerms')}
                placeholder={t('salesOrders:selectPaymentTerm')}
                name="paymentTerms"
                data={[
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEONDATE,
                    label: t('salesOrders:dueOnDate'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.PAYMENTINADVANCE,
                    label: t('salesOrders:paymentInAdvance'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.NET15,
                    label: t('salesOrders:net15'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.NET30,
                    label: t('salesOrders:net30'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.NET60,
                    label: t('salesOrders:net60'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFMONTH,
                    label: t('salesOrders:dueEndOfMonth'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFNEXTMONTH,
                    label: t('salesOrders:dueEndOfNextMonth'),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEONRECEIPT,
                    label: t('salesOrders:dueOnReceipt'),
                  },
                ]}
                {...form.getInputProps('paymentTerms')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('salesOrders:orderDate')}
                name="orderDate"
                minDate={new Date()}
                clearable
                {...form.getInputProps('orderDate')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                valueFormat="DD/MM/YYYY"
                label={t('forms:expectedShipmentDate')}
                name="expectedShipmentDate"
                minDate={new Date()}
                clearable
                {...form.getInputProps('expectedShipmentDate')}
              />
            </Grid.Col>

            <AgencySites
              extraProps={{ colSpan: 6 }}
              agencyId={form.values.agencyId}
              agencies={agencies}
              sites={sites}
              siteId={form.values.siteId}
              onChange={({ agencyId, siteId }) => {
                form.setFieldValue('agencyId', agencyId)
                form.setFieldValue('siteId', siteId)
              }}
              error={{
                siteId: form.getInputProps('siteId').error,
                agencyId: form.getInputProps('agencyId').error,
              }}
            />

            <Grid.Col>
              <Text size="lg" fw={500} mb="md">
                {t('salesOrders:salesOrderItem')}
              </Text>

              <Group mb="md" align="end">
                <Select
                  placeholder={
                    !form.values.agencyId
                      ? t('common:selectAgencyFirst')
                      : availableProducts.length > 0
                        ? t('salesOrders:selectProduct', 'Select a product')
                        : t('salesOrders:noProductsAvailable', 'No products available')
                  }
                  data={productOptions}
                  value={selectedProduct}
                  onChange={(value) => setSelectedProduct(value || '')}
                  searchable
                  disabled={!form.values.agencyId || availableProducts.length === 0}
                  style={{ flex: 1 }}
                />
                <NumberInput
                  label={t('common:quantity')}
                  placeholder={t('common:quantity')}
                  value={quantity}
                  onChange={(value) => setQuantity(Number(value))}
                  min={1}
                  disabled={!selectedProduct}
                  style={{ width: 100 }}
                />
                <NumberInput
                  label={t('salesOrders:rate')}
                  placeholder={t('salesOrders:rate')}
                  value={rate}
                  onChange={(value) => setRate(Number(value))}
                  min={0}
                  step={0.01}
                  disabled={!selectedProduct}
                  style={{ width: 100 }}
                />
                <NumberInput
                  label={t('salesOrders:tax')}
                  placeholder={t('salesOrders:tax')}
                  value={tax}
                  onChange={(value) => setTax(Number(value))}
                  min={0}
                  step={0.01}
                  disabled={!selectedProduct}
                  style={{ width: 100 }}
                />
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={addItem}
                  color="blue"
                  disabled={!selectedProduct}
                >
                  {t('common:add')}
                </Button>
              </Group>

              {/* Info alert for backorder creation */}
              {!salesOrder.id && form.values.salesOrderItems.length > 0 && (
                <Alert variant="light" color="blue" icon={<IconExclamationCircle />} mt="md">
                  <Text size="sm">
                    <strong>Tip:</strong> Save this sales order first to enable backorder creation
                    from individual items.
                  </Text>
                </Alert>
              )}

              <Table verticalSpacing="xs" striped mt={'md'} withTableBorder highlightOnHover>
                <Table.Thead fz={12}>
                  <Table.Tr>
                    <Table.Th>{t('salesOrders:salesOrderItem')}</Table.Th>
                    <Table.Th>{tInventory('status')}</Table.Th>
                    <Table.Th>{t('common:quantity')}</Table.Th>
                    <Table.Th>{t('salesOrders:rate')}</Table.Th>
                    <Table.Th>{t('salesOrders:tax')}</Table.Th>
                    <Table.Th>{t('common:amount')}</Table.Th>
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
                          {t('salesOrders:noSalesItemsFound')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                {rows.length > 0 && !!totalAmount && (
                  <Table.Tfoot>
                    <Table.Tr className={classes.totalRow}>
                      <Table.Td colSpan={3} className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}>
                        <Text
                          fw={500}
                          ta="right"
                        >{`${t('common:total')} ( ${currency.symbol} )`}</Text>
                      </Table.Td>
                      <Table.Td className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}>
                        <Text fw={500}>{formatMoney(totalAmount)}</Text>
                      </Table.Td>
                      <Table.Td className={classes.totalCell}></Table.Td>
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>

              {/* Display sales order items errors */}
              {Object.keys(form.errors).some(
                (key) => key.startsWith('salesOrderItems.') && key.includes('.')
              ) && (
                <Alert
                  variant="light"
                  color="red"
                  icon={<IconExclamationCircle />}
                  mt="md"
                  classNames={{
                    root: 'sales-order-field-error-alert',
                  }}
                >
                  <Text size="sm" c="red">
                    {[
                      ...new Set(
                        Object.entries(form.errors)
                          .filter(
                            ([key]) => key.startsWith('salesOrderItems.') && key.includes('.')
                          )
                          .map(([, error]) => error)
                      ),
                    ].join('. ')}
                  </Text>
                </Alert>
              )}

              {opened && (
                <SalesOrderItemForm
                  products={
                    salesOrderItem.productId
                      ? products.filter(
                          (product) =>
                            (!form.values.agencyId || product.agencyId === form.values.agencyId) &&
                            (!form.values.siteId || product.siteId === form.values.siteId)
                        )
                      : products
                          .filter(
                            (product) =>
                              (!form.values.agencyId ||
                                product.agencyId === form.values.agencyId) &&
                              (!form.values.siteId || product.siteId === form.values.siteId)
                          )
                          .filter(
                            (product) =>
                              !form.values.salesOrderItems
                                .map((salesOrderItem) => salesOrderItem.productId)
                                .some((productId) => productId === product.id)
                          )
                  }
                  salesOrderItem={salesOrderItem}
                  opened={opened}
                  onClose={handleClose}
                  onSubmit={(currentSalesOrderItem) => {
                    form.setFieldValue(
                      'salesOrderItems',
                      [
                        ...form.values.salesOrderItems.filter((item) => {
                          return item.productId !== currentSalesOrderItem.productId
                        }),
                        {
                          id: currentSalesOrderItem.id,
                          productId: currentSalesOrderItem.productId,
                          rate: currentSalesOrderItem.rate,
                          quantity: currentSalesOrderItem.quantity,
                          tax: currentSalesOrderItem.tax,
                          amount: currentSalesOrderItem.amount,
                          product: currentSalesOrderItem.product,
                          status: currentSalesOrderItem.status,
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
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
