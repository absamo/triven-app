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
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { useDisclosure } from '@mantine/hooks'
import { IconEdit, IconExclamationCircle, IconPlus, IconTrash } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { PURCHASE_ORDER_PAYMENT_TERMS, PURCHASE_ORDER_STATUSES } from '~/app/common/constants'
import { formatMoney } from '~/app/common/helpers/money'
import { type IAgency } from '~/app/common/validations/agencySchema'
import { type ICurrency } from '~/app/common/validations/currencySchema'
import { type IProduct } from '~/app/common/validations/productSchema'
import { type IPurchaseOrderItem } from '~/app/common/validations/purchaseOrderItemSchema'
import {
  purchaseOrderSchema,
  type IPurchaseOrder,
} from '~/app/common/validations/purchaseOrderSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import { type ISupplier } from '~/app/common/validations/supplierSchema'
import { Form } from '~/app/components'
import { AgencySites } from '~/app/partials/AgencySites'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'
import PurchaseOrderItemForm from './PurchaseOrderItemForm'
import classes from './PurchaseOrdersForm.module.css'

interface PurchaseOrdersFormProps {
  purchaseOrder: IPurchaseOrder
  sites: ISite[]
  agencies: IAgency[]
  suppliers: ISupplier[]
  products: IProduct[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function PurchaseOrdersForm({
  purchaseOrder,
  sites,
  agencies,
  suppliers,
  products,
  currency,
  errors,
}: PurchaseOrdersFormProps) {
  const { t } = useTranslation(['purchaseOrders', 'forms', 'common'])
  const [opened, { open, close }] = useDisclosure(false)
  const [purchaseOrderItem, setPurchaseOrderItem] = useState<IPurchaseOrderItem>(
    {} as IPurchaseOrderItem
  )

  // State for inline product selection form
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [rate, setRate] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)

  // Helper function to translate payment terms
  const getPaymentTermLabel = (term: string) => {
    const termMap: Record<string, string> = {
      [PURCHASE_ORDER_PAYMENT_TERMS.DUEONDATE]: t('purchaseOrders:dueOnDate', 'Due on date'),
      [PURCHASE_ORDER_PAYMENT_TERMS.PAYMENTINADVANCE]: t(
        'purchaseOrders:paymentInAdvance',
        'Payment in advance'
      ),
      [PURCHASE_ORDER_PAYMENT_TERMS.NET15]: t('purchaseOrders:net15', 'Net 15'),
      [PURCHASE_ORDER_PAYMENT_TERMS.NET30]: t('purchaseOrders:net30', 'Net 30'),
      [PURCHASE_ORDER_PAYMENT_TERMS.NET60]: t('purchaseOrders:net60', 'Net 60'),
      [PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFMONTH]: t(
        'purchaseOrders:dueEndOfMonth',
        'Due end of month'
      ),
      [PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFNEXTMONTH]: t(
        'purchaseOrders:dueEndOfNextMonth',
        'Due end of next month'
      ),
      [PURCHASE_ORDER_PAYMENT_TERMS.DUEONRECEIPT]: t(
        'purchaseOrders:dueOnReceipt',
        'Due on receipt'
      ),
    }
    return termMap[term] || term
  }

  const form = useForm({
    validate: zodResolver(purchaseOrderSchema),
    initialValues: {
      id: purchaseOrder.id,
      purchaseOrderReference: purchaseOrder.purchaseOrderReference,
      paymentTerms: purchaseOrder.paymentTerms,
      orderDate: new Date(purchaseOrder.orderDate),
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate
        ? new Date(purchaseOrder.expectedDeliveryDate)
        : null,
      siteId: purchaseOrder.siteId,
      agencyId: purchaseOrder.agencyId,
      supplierId: purchaseOrder.supplierId,
      notes: purchaseOrder.notes,
      purchaseOrderItems: purchaseOrder.purchaseOrderItems || [],
    },
  })

  // Clear purchase order items when agency changes to ensure products match the selected agency
  useEffect(() => {
    if (form.values.agencyId) {
      const validItems = form.values.purchaseOrderItems.filter((item) => {
        const product = products.find((p) => p.id === item.productId)
        return product && product.agencyId === form.values.agencyId
      })

      if (validItems.length !== form.values.purchaseOrderItems.length) {
        form.setFieldValue('purchaseOrderItems', validItems)
      }
    }
  }, [form.values.agencyId, products])

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
    }

    form.setFieldValue(
      'purchaseOrderItems',
      [...form.values.purchaseOrderItems, newItem]
        .sort((a, b) => a.productId.localeCompare(b.productId))
        .reverse()
    )

    // Reset form
    setSelectedProduct('')
    setQuantity(1)
    setRate(0)
    setTax(0)
  }

  const handlePurchaseItemClick = () => {
    setPurchaseOrderItem({
      id: undefined,
      productId: '',
      quantity: 1,
      rate: 0,
      tax: undefined,
      amount: 0,
    })
    open()
  }

  const submit = useSubmit()

  const handleSubmit = ({
    purchaseOrderReference,
    paymentTerms,
    orderDate,
    expectedDeliveryDate,
    agencyId,
    siteId,
    supplierId,
  }: IPurchaseOrder) => {
    const formData = new FormData()

    formData.append('purchaseOrderReference', purchaseOrderReference || '')
    formData.append('supplierId', supplierId)
    formData.append('orderDate', JSON.stringify(orderDate))
    formData.append('paymentTerms', JSON.stringify(paymentTerms))
    formData.append('siteId', siteId)
    formData.append('agencyId', agencyId)
    formData.append('expectedDeliveryDate', JSON.stringify(expectedDeliveryDate))
    formData.append(
      'purchaseOrderItems',
      JSON.stringify(
        form.values.purchaseOrderItems.map((purchaseOrderItem: IPurchaseOrderItem) => ({
          productId: purchaseOrderItem.productId,
          quantity: purchaseOrderItem.quantity,
          rate: purchaseOrderItem.rate,
          tax: purchaseOrderItem.tax || 0,
          amount: purchaseOrderItem.amount,
        }))
      )
    )

    if (form.values.purchaseOrderItems.length === 0) {
      form.setErrors({
        purchaseOrderItems: t(
          'purchaseOrders:purchaseOrderItemRequired',
          'Please add a purchase order item before submitting the form'
        ),
      })
      return
    }

    submit(formData, { method: 'post' })
  }

  const supplierOptions = suppliers.map((supplier: ISupplier) => ({
    value: supplier.id || '',
    label: supplier.name,
  }))

  // Filter products for inline form
  const usedProductIds = form.values.purchaseOrderItems.map((item: any) => item.productId)
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

  const handleClose = () => {
    setPurchaseOrderItem({} as IPurchaseOrderItem)
    close()
  }

  const canEdit = purchaseOrder.status === PURCHASE_ORDER_STATUSES.PENDING

  const rows = form.values.purchaseOrderItems.map(
    ({ id, product, quantity, rate, tax, amount, received }) => {
      return (
        <Table.Tr key={product?.id}>
          <Table.Td>
            <Text size="sm" w={220}>
              {product?.name}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{quantity}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{formatMoney(rate)}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{tax || undefined}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{formatMoney(amount)}</Text>
          </Table.Td>

          <Table.Td>
            {canEdit && (
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() =>
                  form.setFieldValue('purchaseOrderItems', [
                    ...(form.values.purchaseOrderItems || []).filter(
                      (purchaseOrderItem: IPurchaseOrderItem) =>
                        purchaseOrderItem.productId !== product?.id
                    ),
                  ])
                }
              >
                <IconTrash style={{ width: 16, height: 16 }} stroke={1.5} />
              </ActionIcon>
            )}
          </Table.Td>
          <Table.Td>
            {canEdit && (
              <ActionIcon
                variant="subtle"
                onClick={() => {
                  setPurchaseOrderItem({
                    id,
                    productId: product?.id || '',
                    product,
                    quantity,
                    rate,
                    tax,
                    amount,
                  })
                  open()
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

  const totalAmount = form.values.purchaseOrderItems.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  )

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/purchase-orders'}>
            {purchaseOrder.id
              ? t('purchaseOrders:editPurchaseOrder', 'Edit a purchase order')
              : t('purchaseOrders:addPurchaseOrder', 'Add a purchase order')}
          </Title>

          {form.errors.purchaseOrderItems && (
            <Alert
              variant="light"
              color="red"
              icon={<IconExclamationCircle />}
              withCloseButton
              mt={30}
            >
              <Text size="sm">{form.errors.purchaseOrderItems}</Text>
            </Alert>
          )}

          <Form
            onSubmit={(canEdit && form.onSubmit(handleSubmit)) || undefined}
            showSubmitButton={false}
          >
            <Grid.Col span={4}>
              <TextInput
                withAsterisk
                label={t('purchaseOrders:purchaseOrderReferenceLabel', 'Purchase Order reference')}
                name="purchaseOrderReference"
                disabled={!canEdit}
                {...form.getInputProps('purchaseOrderReference')}
                error={
                  form.getInputProps('purchaseOrderReference').error ||
                  errors?.purchaseOrderReference
                }
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <SearchableSelect
                withAsterisk
                placeholder={t('purchaseOrders:selectSupplier', 'Select a supplier')}
                data={supplierOptions}
                disabled={!canEdit}
                label={t('purchaseOrders:supplier', 'Supplier')}
                value={form.values.supplierId}
                name="supplierId"
                onChange={(currentSupplier: string) => {
                  form.setFieldValue('supplierId', currentSupplier)
                }}
                error={form.getInputProps('supplierId').error}
                clearable={canEdit}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label={t('purchaseOrders:paymentTerms', 'Payment Terms')}
                placeholder={t('purchaseOrders:selectPaymentTerm', 'Select a payment term')}
                name="paymentTerms"
                disabled={!canEdit}
                data={[
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEONDATE,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.DUEONDATE),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.PAYMENTINADVANCE,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.PAYMENTINADVANCE),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.NET15,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.NET15),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.NET30,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.NET30),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.NET60,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.NET60),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFMONTH,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFMONTH),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFNEXTMONTH,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.DUEENDOFNEXTMONTH),
                  },
                  {
                    value: PURCHASE_ORDER_PAYMENT_TERMS.DUEONRECEIPT,
                    label: getPaymentTermLabel(PURCHASE_ORDER_PAYMENT_TERMS.DUEONRECEIPT),
                  },
                ]}
                {...form.getInputProps('paymentTerms')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('purchaseOrders:orderDateLabel', 'Order date')}
                name="orderDate"
                disabled={!canEdit}
                minDate={new Date()}
                clearable={canEdit}
                {...form.getInputProps('orderDate')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                valueFormat="DD/MM/YYYY"
                label={t('purchaseOrders:expectedDeliveryDate', 'Expected Delivery Date')}
                name="expectedDeliveryDate"
                minDate={new Date()}
                clearable={canEdit}
                disabled={!canEdit}
                {...form.getInputProps('expectedDeliveryDate')}
              />
            </Grid.Col>

            <AgencySites
              disabled={!canEdit}
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
                {t('purchaseOrders:purchaseOrderItem', 'PURCHASE ORDER ITEM')}
              </Text>

              {canEdit && (
                <Group mb="md" align="end">
                  <Select
                    placeholder={
                      !form.values.agencyId
                        ? t('common:selectAgencyFirst')
                        : availableProducts.length > 0
                          ? t('purchaseOrders:selectProduct', 'Select a product')
                          : t('purchaseOrders:noProductsAvailable', 'No products available')
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
                    label={t('purchaseOrders:rate')}
                    placeholder={t('purchaseOrders:rate')}
                    value={rate}
                    onChange={(value) => setRate(Number(value))}
                    min={0}
                    step={0.01}
                    disabled={!selectedProduct}
                    style={{ width: 100 }}
                  />
                  <NumberInput
                    label={t('purchaseOrders:tax')}
                    placeholder={t('purchaseOrders:tax')}
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
              )}

              <Table
                verticalSpacing="xs"
                highlightOnHover={canEdit}
                striped
                mt={'md'}
                withTableBorder
              >
                <Table.Thead fz={12}>
                  <Table.Tr>
                    <Table.Th>
                      {t('purchaseOrders:purchaseOrderItem', 'PURCHASE ORDER ITEM')}
                    </Table.Th>
                    <Table.Th>{t('purchaseOrders:quantity', 'QUANTITY')}</Table.Th>
                    <Table.Th>{t('purchaseOrders:rate', 'RATE')}</Table.Th>
                    <Table.Th>{t('purchaseOrders:tax', 'TAX')}</Table.Th>
                    <Table.Th>{t('purchaseOrders:amountHeader', 'AMOUNT')}</Table.Th>
                    {/* <Table.Th>STATUS</Table.Th> */}
                    <Table.Th></Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length > 0 ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={8} align="center">
                        <Text size="sm" c="dimmed">
                          {t('purchaseOrders:noPurchaseItemsFound', 'No purchase items found')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                {rows.length > 0 && !!totalAmount && (
                  <Table.Tfoot>
                    <Table.Tr className={classes.totalRow}>
                      <Table.Td colSpan={2} className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}>
                        <Text
                          fw={500}
                          ta="right"
                        >{`${t('purchaseOrders:total', 'Total')} ( ${currency.symbol} )`}</Text>
                      </Table.Td>
                      <Table.Td className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}>
                        <Text fw={500}>{formatMoney(totalAmount)}</Text>
                      </Table.Td>
                      <Table.Td className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}></Table.Td>
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
              {opened && (
                <PurchaseOrderItemForm
                  products={
                    purchaseOrderItem.productId
                      ? products.filter((product) =>
                          form.values.agencyId ? product.agencyId === form.values.agencyId : true
                        )
                      : products
                          .filter((product) =>
                            form.values.agencyId ? product.agencyId === form.values.agencyId : true
                          )
                          .filter(
                            (product) =>
                              !form.values.purchaseOrderItems
                                .map((purchaseOrderItem) => purchaseOrderItem.productId)
                                .some((productId) => productId === product.id)
                          )
                  }
                  purchaseOrderItem={purchaseOrderItem}
                  opened={opened}
                  onClose={handleClose}
                  onSubmit={(currentPurchaseItem) => {
                    form.setFieldValue(
                      'purchaseOrderItems',
                      [
                        ...form.values.purchaseOrderItems.filter((item) => {
                          return item.productId !== currentPurchaseItem.productId
                        }),
                        {
                          id: currentPurchaseItem.id,
                          productId: currentPurchaseItem.productId,
                          rate: currentPurchaseItem.rate,
                          quantity: currentPurchaseItem.quantity,
                          tax: currentPurchaseItem.tax,
                          amount: currentPurchaseItem.amount,
                          product: currentPurchaseItem.product,
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
