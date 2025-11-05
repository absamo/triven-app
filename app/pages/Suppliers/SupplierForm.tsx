import { Grid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ILocation } from '~/app/common/validations/locationSchema'
import { type ISupplier, supplierSchema } from '~/app/common/validations/supplierSchema'
import { Currency, Form } from '~/app/components'
import { Location } from '~/app/partials/Location'
import { Title } from '~/app/partials/Title'

interface SupplierFormProps {
  supplier: ISupplier
  defaultCurrencies: ICurrency[]
  errors: Record<string, string>
}

export default function SuppliersForm({ supplier, defaultCurrencies, errors }: SupplierFormProps) {
  const { t } = useTranslation(['forms', 'suppliers', 'common'])

  const form = useForm({
    validate: zodResolver(supplierSchema),
    initialValues: {
      ...supplier,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({ name, email, phone, companyName }: ISupplier) => {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('companyName', companyName)
    formData.append('currency', JSON.stringify(form.values.currency))
    formData.append('location', JSON.stringify(form.values.location))
    submit(formData, { method: 'post' })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/suppliers'}>
          {supplier.id
            ? t('forms:editSupplier', 'Edit a supplier')
            : t('forms:addSupplier', 'Add a supplier')}
        </Title>

        <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:name', 'Name')}
              name="name"
              mt="sm"
              {...form.getInputProps('name')}
              error={form.getInputProps('name').error}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Currency
              value={form.values.currency?.isoCode}
              onChange={(currency: ICurrency) => {
                form.setFieldValue('currency', {
                  ...supplier.currency,
                  ...currency,
                })

                if (currency) {
                  form.setFieldError('currency.currencyCode', null)
                }
              }}
              required
              inputProps={{ mt: 'sm' }}
              name="currency.currencyCode"
              companyCurrencies={defaultCurrencies}
              restrictToCompanyCurrencies
              error={form.getInputProps('currency.currencyCode').error}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:email', 'Email')}
              name="email"
              mt="sm"
              {...form.getInputProps('email')}
              error={form.getInputProps('email').error || errors?.email}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('forms:companyName', 'Company name')}
              name="companyName"
              mt="sm"
              {...form.getInputProps('companyName')}
              error={form.getInputProps('companyName').error}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label={t('common:phone', 'Phone')}
              name="phone"
              mt="sm"
              {...form.getInputProps('phone')}
              error={form.getInputProps('phone').error}
            />
          </Grid.Col>

          <Location
            name="location"
            value={form.values.location as ILocation}
            onChange={(location: ILocation) => {
              form.setFieldValue('location', {
                ...form.values.location,
                ...location,
              })
            }}
            errors={form.errors as ILocation}
            fieldsetProps={{
              legend: t('suppliers:address', 'Address'),
            }}
          />
        </Form>
      </Grid.Col>
    </Grid>
  )
}
