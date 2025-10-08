import { Grid, Title as MantineTitle, Paper, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { roleSchema, type IRole } from '~/app/common/validations/roleSchema'
import { Form } from '~/app/components'
import { Title } from '~/app/partials/Title'
import RolesPermission from './RolesPermission'

interface roleFormProps {
  role: IRole
  errors: Record<string, string>
}

export default function RoleForm({ role, errors }: roleFormProps) {
  const { t } = useTranslation(['roles', 'common'])

  const form = useForm({
    validate: zodResolver(roleSchema),
    initialValues: {
      ...role,
    },
  })

  const submit = useSubmit()

  const handleSubmit = (values: { name: string; description?: IRole['description'] }) => {
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('description', values.description || '')
    formData.append('permissions', JSON.stringify(form.values.permissions))

    submit(formData, { method: 'post' })
  }

  const handlePermissionsChange = (permissions: string[]) => {
    form.setFieldValue('permissions', permissions)
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/roles'}>
          {role.id ? t('roles:editRole', 'Edit a role') : t('roles:addRole', 'Add a role')}
        </Title>
        <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
          <Grid.Col span={6}>
            <TextInput
              withAsterisk
              label={t('common:name', 'Name')}
              name="name"
              {...form.getInputProps('name')}
              error={form.getInputProps('name').error || errors?.name}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label={t('common:description', 'Description')}
              name="description"
              {...form.getInputProps('description')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Paper mt={30}>
              <MantineTitle order={5} mt={20}>
                {t('roles:inventories')}
              </MantineTitle>
              <Text c="dimmed" size="sm" mb={15}>
                {t('roles:selectInventoryPermissions')}
              </Text>
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.products')}
                name="products"
              />

              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.stockAdjustments')}
                name="stockAdjustments"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.categories')}
                name="categories"
              />
            </Paper>
            <Paper mt={30}>
              <MantineTitle order={5}>{t('roles:purchases')}</MantineTitle>
              <Text c="dimmed" size="sm">
                {t('roles:selectPurchasePermissions')}
              </Text>
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.suppliers')}
                name="suppliers"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.purchaseOrders')}
                name="purchaseOrders"
              />

              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.purchaseReceives')}
                name="purchaseReceives"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.bills')}
                name="bills"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.paymentsMade')}
                name="paymentsMade"
              />
            </Paper>

            <Paper mt={30}>
              <MantineTitle order={5} mt={20}>
                {t('roles:sales')}
              </MantineTitle>
              <Text c="dimmed" size="sm" mb={15}>
                {t('roles:selectSalesPermissions')}
              </Text>
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.customers')}
                name="customers"
              />

              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.salesOrders')}
                name="salesOrders"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.backorders')}
                name="backorders"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.invoices')}
                name="invoices"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.paymentsReceived')}
                name="paymentsReceived"
              />
            </Paper>

            <Paper mt={30}>
              <MantineTitle order={5} mt={20}>
                {t('roles:reports')}
              </MantineTitle>
              <Text c="dimmed" size="sm" mb={15}>
                {t('roles:selectReportPermissions')}
              </Text>
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.analytics')}
                name="analytics"
              />
            </Paper>

            <Paper mt={30} mb={100}>
              <MantineTitle order={5} mt={20}>
                {t('roles:settings')}
              </MantineTitle>
              <Text c="dimmed" size="sm" mb={15}>
                {t('roles:selectSettingsPermissions')}
              </Text>
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.roles')}
                name="roles"
              />

              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.team')}
                name="team"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.agencies')}
                name="agencies"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.sites')}
                name="sites"
              />
              <RolesPermission
                permissions={form.values.permissions || []}
                onChange={handlePermissionsChange}
                label={t('roles:modules.subscriptions')}
                name="subscriptions"
              />
            </Paper>
          </Grid.Col>
        </Form>
      </Grid.Col>
    </Grid>
  )
}
