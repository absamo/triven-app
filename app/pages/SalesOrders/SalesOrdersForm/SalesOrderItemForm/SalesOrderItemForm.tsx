import { Grid, Modal, NumberInput } from '@mantine/core'

import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'

import { useState } from 'react'
import { type IProduct } from '~/app/common/validations/productSchema'
import {
  salesOrderItemSchema,
  type ISalesOrderItem,
} from '~/app/common/validations/salesOrderItemSchema'
import Form from '~/app/components/Form'
import { SearchableSelect } from '~/app/partials/SearchableSelect'

interface ISalesOrderItemFormProps {
  products: IProduct[]
  salesOrderItem: ISalesOrderItem
  opened: boolean
  onClose: () => void
  onSubmit: (salesOrderItem: ISalesOrderItem) => void
}

export default function SalesOrderItemForm({
  products,
  salesOrderItem,
  opened,
  onClose,
  onSubmit,
}: ISalesOrderItemFormProps) {
  const { t } = useTranslation(['salesOrders', 'forms', 'common'])
  const [amount, setAmount] = useState<number>(salesOrderItem.amount || 0)

  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnBlur: true,
    validate: zodResolver(salesOrderItemSchema),
    initialValues: {
      id: salesOrderItem.id,
      productId: salesOrderItem.productId,
      quantity: salesOrderItem.quantity,
      rate: salesOrderItem.rate,
      tax: salesOrderItem.tax || undefined,
      status: salesOrderItem.status,
    },
    onValuesChange: ({ tax, quantity, rate }) => {
      const taxPercentage = (quantity * rate * (tax || 1)) / 100
      const currentAmount = tax ? taxPercentage + quantity * rate : quantity * rate

      setAmount(currentAmount)
    },
  })

  const handleSubmit = (currentPurchaseOrderItem: ISalesOrderItem) => {
    const product = products.find(
      (product: IProduct) => product.id === currentPurchaseOrderItem.productId
    )

    onSubmit({
      ...currentPurchaseOrderItem,
      amount,
      product,
    })

    form.reset()
    onClose()
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const productsOptions = products.map((product: IProduct) => ({
    value: product.id || '',
    label: product.name,
  }))

  return (
    <Modal.Root opened={opened} onClose={handleClose} zIndex={1000}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            {salesOrderItem?.id
              ? t('salesOrders:editSalesOrderItem', 'Edit sales order item')
              : t('salesOrders:addSalesOrderItem', 'Add sales order item')}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid.Col>
              <SearchableSelect
                withAsterisk
                label={t('salesOrders:productItem', 'Product item')}
                placeholder={t('forms:selectProduct', 'Select a product')}
                data={productsOptions}
                name="productId"
                clearable
                {...form.getInputProps('productId')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk
                label={t('common:quantity', 'Quantity')}
                name="quantity"
                {...form.getInputProps('quantity')}
                onChange={(quantity) => {
                  form.getInputProps('quantity').onChange(quantity === '' ? undefined : quantity)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk
                label={t('salesOrders:rate', 'Rate')}
                name="rate"
                {...form.getInputProps('rate')}
                onChange={(rate) => {
                  form.getInputProps('rate').onChange(rate === '' ? undefined : rate)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label={t('salesOrders:tax', 'Tax')}
                name="tax"
                suffix="%"
                {...form.getInputProps('tax')}
                onChange={(tax) => {
                  form.getInputProps('tax').onChange(tax === '' ? undefined : tax)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label={t('common:amount', 'Amount')}
                name="amount"
                hideControls
                disabled
                value={amount}
              />
            </Grid.Col>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
