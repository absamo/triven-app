import { Grid, Modal, TextInput, NumberInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'

import Form from '~/app/components/Form'
import {
  purchaseReceiveItemSchema,
  type IPurchaseReceiveItem,
} from '~/app/common/validations/purchaseReceiveItemSchema'

interface IPurchaseReceiveItemFormProps {
  purchaseReceiveItem: IPurchaseReceiveItem
  opened: boolean
  onClose: () => void
  onSubmit: (purchaseReceiveItem: IPurchaseReceiveItem) => void
}

export default function PurchaseReceiveItemForm({
  purchaseReceiveItem,
  opened,
  onClose,
  onSubmit,
}: IPurchaseReceiveItemFormProps) {
  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnBlur: true,
    validate: zodResolver(purchaseReceiveItemSchema),
    initialValues: {
      id: purchaseReceiveItem.id,
      productId: purchaseReceiveItem.productId,
      purchaseReceiveId: purchaseReceiveItem.purchaseReceivedId,
      purchaseOrderId: purchaseReceiveItem.purchaseOrderId,
      product: purchaseReceiveItem.product,
      orderedQuantity: purchaseReceiveItem.orderedQuantity,
      receivedQuantity: purchaseReceiveItem.receivedQuantity,
    },
  })

  const handleSubmit = (currentPurchaseReceiveItem: IPurchaseReceiveItem) => {
    if (currentPurchaseReceiveItem.receivedQuantity < 0) {
      form.setFieldError('receivedQuantity', 'Received quantity cannot be less than zero')
      return
    }

    if (currentPurchaseReceiveItem.orderedQuantity < currentPurchaseReceiveItem.receivedQuantity) {
      form.setFieldError(
        'receivedQuantity',
        'Quantity to receive cannot be greater than ordered quantity'
      )
      return
    }

    onSubmit(currentPurchaseReceiveItem)

    form.reset()
    onClose()
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Modal.Root opened={opened} onClose={handleClose}>
      <Modal.Overlay zIndex={1000} />
      <Modal.Content style={{ zIndex: 2000 }}>
        <Modal.Header>
          <Modal.Title>Edit purchase receive item</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={form.onSubmit(handleSubmit)} fixedBtn={false}>
            <Grid.Col>
              <TextInput
                label={'Purchase order item'}
                name="product.name"
                disabled
                value={purchaseReceiveItem.product?.name}
              />
            </Grid.Col>

            <Grid.Col>
              <NumberInput
                label="Order quantity"
                name="orderedQuantity"
                hideControls
                disabled
                value={purchaseReceiveItem.orderedQuantity}
              />
            </Grid.Col>
            <Grid.Col>
              <NumberInput
                label="Received quantity"
                name="receivedQuantity"
                {...form.getInputProps('receivedQuantity')}
                onChange={(receivedQuantity) => {
                  form
                    .getInputProps('receivedQuantity')
                    .onChange(receivedQuantity === '' ? undefined : receivedQuantity)
                }}
              />
            </Grid.Col>
            {/* <Grid.Col>
              <NumberInput
                withAsterisk
                label="Quantity to receive"
                name="quantityToReceive"
                {...form.getInputProps("quantityToReceive")}
                onChange={(quantityToReceive) => {
                  form
                    .getInputProps("quantityToReceive")
                    .onChange(
                      quantityToReceive === "" ? undefined : quantityToReceive
                    )
                }}
              />
            </Grid.Col> */}
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
