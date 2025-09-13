import { Button, Grid, Group, Modal, NumberInput } from "@mantine/core"

import { useForm } from "@mantine/form"
import { zodResolver } from "mantine-form-zod-resolver"
import { useTranslation } from "react-i18next"

import { useState } from "react"
import type { IProduct } from "~/app/common/validations/productSchema"
import {
  purchaseOrderItemSchema,
  type IPurchaseOrderItem,
} from "~/app/common/validations/purchaseOrderItemSchema"
import Form from "~/app/components/Form"
import { SearchableSelect } from "~/app/partials/SearchableSelect"

interface IPurchaseItemFormProps {
  products: IProduct[]
  purchaseOrderItem: IPurchaseOrderItem
  opened: boolean
  onClose: () => void
  onSubmit: (purchaseOrderItem: IPurchaseOrderItem) => void
}

export default function PurchaseItemForm({
  products,
  purchaseOrderItem,
  opened,
  onClose,
  onSubmit,
}: IPurchaseItemFormProps) {
  const { t } = useTranslation(['purchaseOrders'])
  const [amount, setAmount] = useState<number>(purchaseOrderItem.amount || 0)

  const form = useForm({
    mode: "uncontrolled",
    validateInputOnBlur: true,
    validate: zodResolver(purchaseOrderItemSchema),
    initialValues: {
      id: purchaseOrderItem.id,
      productId: purchaseOrderItem.productId,
      quantity: purchaseOrderItem.quantity,
      rate: purchaseOrderItem.rate,
      tax: purchaseOrderItem.tax || undefined,
    },
    onValuesChange: ({ tax, quantity, rate }) => {
      const taxPercentage = (quantity * rate * (tax || 1)) / 100
      const currentAmount = tax
        ? taxPercentage + quantity * rate
        : quantity * rate

      setAmount(currentAmount)
    },
  })

  const handleSubmit = (currentPurchaseOrderItem: IPurchaseOrderItem) => {
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
    value: product.id || "",
    label: product.name,
  }))

  return (
    <Modal.Root opened={opened} onClose={handleClose} zIndex={1000}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            {purchaseOrderItem?.id
              ? t('purchaseOrders:editPurchaseOrderItem', 'Edit purchase order item')
              : t('purchaseOrders:addPurchaseOrderItem', 'Add purchase order item')}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid.Col>
              <SearchableSelect
                withAsterisk
                label={t('purchaseOrders:productItemToPurchase', 'Product item to purchase')}
                placeholder={t('purchaseOrders:selectProduct', 'Select a product')}
                data={productsOptions}
                name="productId"
                clearable
                {...form.getInputProps("productId")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk
                label={t('purchaseOrders:quantity', 'Quantity')}
                name="quantity"
                {...form.getInputProps("quantity")}
                onChange={(quantity) => {
                  form
                    .getInputProps("quantity")
                    .onChange(quantity === "" ? undefined : quantity)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk
                label={t('purchaseOrders:rate', 'Rate')}
                name="rate"
                {...form.getInputProps("rate")}
                onChange={(rate) => {
                  form
                    .getInputProps("rate")
                    .onChange(rate === "" ? undefined : rate)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label={t('purchaseOrders:tax', 'Tax')}
                name="tax"
                suffix="%"
                {...form.getInputProps("tax")}
                onChange={(tax) => {
                  form
                    .getInputProps("tax")
                    .onChange(tax === "" ? undefined : tax)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label={t('purchaseOrders:amount', 'Amount')}
                name="amount"
                hideControls
                disabled
                value={amount}
              />
            </Grid.Col>
            <Grid.Col>
              <Group justify="flex-end" mt="md">
                <Button variant="outline" onClick={handleClose}>
                  {t('common:cancel', 'Cancel')}
                </Button>
                <Button type="submit">
                  {t('common:save', 'Save')}
                </Button>
              </Group>
            </Grid.Col>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
