import { Checkbox, Grid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import type { IAgency } from '~/app/common/validations/agencySchema'
import { customerSchema, type ICustomer } from '~/app/common/validations/customerSchema'
import type { ILocation } from '~/app/common/validations/locationSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import { Form } from '~/app/components'
import { AgencySites } from '~/app/partials/AgencySites'
import { Location } from '~/app/partials/Location'
import { Title } from '~/app/partials/Title'

interface CustomerFormProps {
  customer: ICustomer
  sites: ISite[]
  agencies: IAgency[]
  errors: Record<string, string>
}

export default function CustomerForm({ customer, sites, agencies, errors }: CustomerFormProps) {
  const { t } = useTranslation(['forms', 'common'])

  const form = useForm({
    validate: zodResolver(customerSchema),
    initialValues: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.companyName,
      siteId: customer.siteId,
      agencyId: customer.agencyId,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      useBillingAddressAsShippingAddress: customer.useBillingAddressAsShippingAddress,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({
    firstName,
    lastName,
    email,
    phone,
    billingAddress,
    shippingAddress,
    siteId,
    agencyId,
    companyName,
    useBillingAddressAsShippingAddress,
  }: ICustomer) => {
    const formData = new FormData()

    formData.append('firstName', firstName)
    formData.append('lastName', lastName)
    formData.append('email', JSON.stringify(email))
    formData.append('phone', phone || '')
    formData.append('siteId', siteId)
    formData.append('agencyId', agencyId)
    formData.append('billingAddress', JSON.stringify(billingAddress))
    formData.append('shippingAddress', JSON.stringify(shippingAddress))
    formData.append('companyName', companyName || '')
    formData.append(
      'useBillingAddressAsShippingAddress',
      JSON.stringify(useBillingAddressAsShippingAddress)
    )

    submit(formData, { method: 'post' })
  }

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/customers'}>
            {customer.id
              ? t('forms:editCustomer', 'Edit a customer')
              : t('forms:addCustomer', 'Add a new customer')}
          </Title>

          <Form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid.Col span={4}>
              <TextInput
                withAsterisk
                label={t('forms:firstName', 'First name')}
                name="firstName"
                {...form.getInputProps('firstName')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                withAsterisk
                label={t('forms:lastName', 'Last name')}
                name="lastName"
                {...form.getInputProps('lastName')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label={t('forms:companyName', 'Company name')}
                name="companyName"
                {...form.getInputProps('companyName')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                withAsterisk
                label={t('common:email', 'Email')}
                name="email"
                {...form.getInputProps('email')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label={t('common:phone', 'Phone')}
                name="phone"
                {...form.getInputProps('phone')}
              />
            </Grid.Col>

            <AgencySites
              agencies={agencies}
              sites={sites}
              agencyId={form.values.agencyId}
              siteId={form.values.siteId}
              onChange={({ agencyId, siteId }) => {
                form.setFieldValue('agencyId', agencyId)
                form.setFieldValue('siteId', siteId)
              }}
              error={{ siteId: errors?.siteId || '', agencyId: errors?.agencyId || '' }}
              extraProps={{ colSpan: 6 }}
            />

            <Grid.Col span={6}>
              <Location
                value={form.values.billingAddress || { city: '', country: '' }}
                onChange={(location: ILocation) => {
                  form.setFieldValue('billingAddress', location)
                }}
                name="billingAddress"
                label={t('forms:billingAddress', 'Billing Address')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Location
                value={form.values.shippingAddress || { city: '', country: '' }}
                onChange={(location: ILocation) => {
                  form.setFieldValue('shippingAddress', location)
                }}
                name="shippingAddress"
                label={t('forms:shippingAddress', 'Shipping Address')}
                fieldsetProps={{ disabled: form.values.useBillingAddressAsShippingAddress }}
              />
            </Grid.Col>

            <Grid.Col>
              <Checkbox
                label={t('forms:useBillingAsShipping', 'Use billing address as shipping address')}
                name="useBillingAddressAsShippingAddress"
                {...form.getInputProps('useBillingAddressAsShippingAddress', {
                  type: 'checkbox',
                })}
              />
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
