import { Grid, Select, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'
import { SITE_TYPES } from '~/app/common/constants'

import type { ILocation } from '~/app/common/validations/locationSchema'
import { type ISite, siteSchema } from '~/app/common/validations/siteSchema'

import { Form } from '~/app/components'
import { Location } from '~/app/partials/Location'
import { Title } from '~/app/partials/Title'

interface SiteFormProps {
  site: ISite
  errors: Record<string, string>
}

export default function SitesForm({ site, errors }: SiteFormProps) {
  const { t } = useTranslation(['sites', 'forms', 'common'])

  const form = useForm({
    validate: zodResolver(siteSchema),
    initialValues: {
      ...site,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({ name, location, type }: ISite) => {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('location', JSON.stringify(location))
    formData.append('type', JSON.stringify(type))

    submit(formData, { method: 'post' })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/sites'}>{site.id ? t('sites:editSite') : t('sites:addSite')}</Title>
        <Form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:name')}
              name="name"
              {...form.getInputProps('name')}
              error={form.getInputProps('name').error || errors?.name}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label={t('sites:siteType')}
              placeholder={t('sites:selectSiteType')}
              name="type"
              value={form.values.type}
              data={[
                { value: SITE_TYPES.WAREHOUSE, label: t('sites:warehouse') },
                { value: SITE_TYPES.STORE, label: t('sites:store') },
              ]}
              {...form.getInputProps('type')}
            />
          </Grid.Col>
          <Location
            name="location"
            fieldsetProps={{ legend: t('common:address') }}
            value={form.values.location as ILocation}
            onChange={(location: ILocation) => {
              form.setFieldValue('location', location)
            }}
          />
        </Form>
      </Grid.Col>
    </Grid>
  )
}
