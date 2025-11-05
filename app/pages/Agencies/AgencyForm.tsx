import { Grid, MultiSelect, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { agencySchema, type IAgency } from '~/app/common/validations/agencySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ILocation } from '~/app/common/validations/locationSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import { Currency, Form } from '~/app/components'
import { Location } from '~/app/partials/Location'
import { Title } from '~/app/partials/Title'

interface AgencyFormProps {
  agency: IAgency
  errors: Record<string, string>
  sites: ISite[]
  defaultCurrencies: ICurrency[]
}

export default function AgenciesForm({
  agency,
  errors,
  sites,
  defaultCurrencies,
}: AgencyFormProps) {
  const { t } = useTranslation(['agencies', 'forms', 'common'])

  const form = useForm({
    validate: zodResolver(agencySchema),
    initialValues: {
      ...agency,
      sites: agency.sites || [],
      location: agency.location || {
        name: '',
        address: '',
        country: '',
        city: '',
        postalCode: '',
      },
      currency: agency.currency || {
        currencyCode: '',
        currencyName: '',
        countryName: '',
        isoCode: '',
      },
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({ name, sites }: IAgency) => {
    const formData = new FormData()

    formData.append('name', name)
    formData.append('sites', JSON.stringify(sites))
    formData.append(
      'currency',
      JSON.stringify({
        ...form.values.currency,
      })
    )
    formData.append(
      'location',
      JSON.stringify({
        ...form.values.location,
      })
    )

    submit(formData, { method: 'post' })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/agencies'}>
          {agency.id ? t('agencies:editAgency') : t('agencies:addAgency')}
        </Title>

        <Form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:name')}
              name="name"
              mt="sm"
              {...form.getInputProps('name')}
              error={form.getInputProps('name').error || errors?.name}
            />
          </Grid.Col>

          <Grid.Col span={6} mt={12}>
            <Currency
              name="currency.currencyCode"
              value={form.values.currency.currencyCode}
              onChange={(currency: ICurrency) => {
                form.setFieldValue('currency', {
                  ...agency.currency,
                  ...currency,
                })
              }}
              required
              companyCurrencies={defaultCurrencies}
              restrictToCompanyCurrencies
              error={form.getInputProps('currency.currencyCode').error}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <MultiSelect
              checkIconPosition="right"
              label={t('agencies:sites')}
              name="sites"
              placeholder={form.values.sites.length > 0 ? '' : t('agencies:selectSites')}
              data={(sites || []).reduce(
                (acc: { value: string; label: string }[], site: ISite) => {
                  if (!form.values.sites.some((w: ISite) => w.id === site.id)) {
                    acc.push({
                      value: site.id || '',
                      label: site.name,
                    })
                  }
                  return acc
                },
                [] as { value: string; label: string }[]
              )}
              value={form.values.sites.map((site: ISite) => site.name)}
              onChange={(value) => {
                const currentsites: ISite[] = (sites || []).filter((site: ISite) => {
                  return value.includes(site.name) || value.includes(site.id || '')
                }) as ISite[]

                form.getInputProps('sites').onChange(currentsites)
              }}
              error={form.getInputProps('sites').error}
            />
          </Grid.Col>
          <Location
            name="location"
            value={form.values.location as ILocation}
            onChange={(location: ILocation) => {
              form.setFieldValue('location', location)
            }}
            errors={form.errors as ILocation}
          />
        </Form>
      </Grid.Col>
    </Grid>
  )
}
