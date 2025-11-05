import { Grid, Modal } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { currencySchema, type ICurrency } from '~/app/common/validations/currencySchema'
import Currency from '~/app/components/Currency'

import Form from '~/app/components/Form'

type CurrencyProps = Omit<ICurrency, 'base' | 'symbol'> & {
  flag: ReactElement
}

interface CurrencyFormProps {
  opened: boolean
  onClose: () => void
  order: number
}

export default function CurrencyForm({ opened, onClose, order }: CurrencyFormProps) {
  const { t } = useTranslation(['settings', 'common'])

  const form = useForm({
    validate: zodResolver(currencySchema),
    initialValues: {
      currencyCode: '',
      currencyName: '',
      countryName: '',
      isoCode: '',
    },
  })

  const submit = useSubmit()

  const handleSubmit = (curency: ICurrency) => {
    const formData = new FormData()

    formData.append('currencyCode', curency.currencyCode)
    formData.append('currencyName', curency.currencyName || '')
    formData.append('countryName', curency.countryName || '')
    formData.append('isoCode', curency.isoCode || '')
    formData.append('order', order.toString())

    submit(formData, { method: 'post' })

    form.reset()
    onClose()
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const handleChange = (currency: CurrencyProps | undefined) => {
    form.setValues({
      ...form.values,
      currencyCode: currency?.currencyCode,
      currencyName: currency?.currencyName,
      countryName: currency?.countryName,
      isoCode: currency?.isoCode,
    })
  }

  return (
    <Modal.Root opened={opened} onClose={handleClose}>
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{t('settings:addNewCurrency', 'Add a new currency')}</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={form.onSubmit(handleSubmit)} fixedBtn={false}>
            <Grid.Col>
              <Currency
                onChange={handleChange}
                name="currencyCode"
                required
                error={form.getInputProps('currencyCode').error}
              />
            </Grid.Col>
          </Form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
