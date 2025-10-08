import { Grid, Modal, NumberInput } from '@mantine/core'

import { useForm } from '@mantine/form'
import { useTranslation } from 'react-i18next'

import { type IProduct } from '~/app/common/validations/productSchema'
import { type ITransferOrderItem } from '~/app/common/validations/transferOrderItemSchema'
import Form from '~/app/components/Form'
import { SearchableSelect } from '~/app/partials/SearchableSelect'

interface ITransferOrderItemFormProps {
  products: IProduct[]
  transferOrderItem: ITransferOrderItem
  opened: boolean
  onClose: () => void
  onSubmit: (transferOrderItem: ITransferOrderItem) => void
}

export default function TransferOrderItemForm({
  products,
  transferOrderItem,
  opened,
  onClose,
  onSubmit,
}: ITransferOrderItemFormProps) {
  const { t } = useTranslation(['inventory', 'forms', 'common'])

  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnBlur: true,
    // validate: zodResolver(transferOrderItemSchema),
    initialValues: {
      id: transferOrderItem.id,
      productId: transferOrderItem.productId,
      quantity: transferOrderItem.quantity || 1,
    },
  })

  const handleSubmit = (currentTransferOrderItem: ITransferOrderItem) => {
    const product = products.find(
      (product: IProduct) => product.id === currentTransferOrderItem.productId
    )

    onSubmit({
      ...currentTransferOrderItem,
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
            {transferOrderItem?.id
              ? t('inventory:editTransferOrderItem', 'Edit transfer order item')
              : t('inventory:addTransferOrderItem', 'Add transfer order item')}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid.Col>
              <SearchableSelect
                withAsterisk
                label={t('inventory:productItem', 'Product item')}
                placeholder={t('forms:selectProduct', 'Select a product')}
                data={productsOptions}
                name="productId"
                clearable
                {...form.getInputProps('productId')}
              />
            </Grid.Col>
            <Grid.Col>
              <NumberInput
                withAsterisk
                label={t('common:quantity', 'Quantity')}
                name="quantity"
                min={1}
                {...form.getInputProps('quantity')}
                onChange={(quantity) => {
                  form.getInputProps('quantity').onChange(quantity === '' ? 1 : quantity)
                }}
              />
            </Grid.Col>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
