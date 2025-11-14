import { Accordion, Box, Flex, Grid, Paper, Switch, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { type IRole, roleSchema } from '~/app/common/validations/roleSchema'
import { Form } from '~/app/components'
import { Title } from '~/app/partials/Title'
import RolesPermission from './RolesPermission'

interface roleFormProps {
  role: IRole
  errors: Record<string, string>
}

export default function RoleForm({ role, errors }: roleFormProps) {
  const { t } = useTranslation(['roles', 'common'])

  const isReadOnly = false // Allow admins to edit all roles including built-in ones
  const [accordionValue, setAccordionValue] = useState<string[]>([])

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

  const toggleAll = () => {
    if (accordionValue.length === 7) {
      setAccordionValue([])
    } else {
      setAccordionValue([
        'inventory',
        'workflows',
        'purchases',
        'sales',
        'reports',
        'settings',
        'aiInsights',
      ])
    }
  }

  const isExpanded = accordionValue.length === 7

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/roles'}>
          {role.id
            ? isReadOnly
              ? t('roles:viewRole', 'View a role')
              : t('roles:editRole', 'Edit a role')
            : t('roles:addRole', 'Add a role')}
        </Title>
        <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={!isReadOnly}>
          <Grid.Col span={12}>
            <TextInput
              withAsterisk
              label={t('common:name', 'Name')}
              name="name"
              {...form.getInputProps('name')}
              error={form.getInputProps('name').error || errors?.name}
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label={t('common:description', 'Description')}
              name="description"
              {...form.getInputProps('description')}
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Flex justify="flex-end" mb="md" mt="md">
              <Switch
                label={t('roles:expandAll', 'Expand All')}
                labelPosition="left"
                checked={isExpanded}
                onChange={toggleAll}
              />
            </Flex>
            <Accordion
              variant="separated"
              multiple
              value={accordionValue}
              onChange={setAccordionValue}
            >
              <Accordion.Item value="inventory">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:inventories')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:inventoryDescription',
                        'Manage products, stock adjustments, and categories'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.products')}
                    name="products"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.stockAdjustments')}
                    name="stockAdjustments"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.categories')}
                    name="categories"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.transferOrders')}
                    name="transferOrders"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="workflows">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:workflows')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:workflowsDescription',
                        'Manage approval workflows and view workflow history'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.approvals')}
                    name="approvals"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.workflows')}
                    name="workflows"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="purchases">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:purchases')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:purchasesDescription',
                        'Control supplier relationships, orders, receiving, and payments'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.suppliers')}
                    name="suppliers"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.purchaseOrders')}
                    name="purchaseOrders"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.purchaseReceives')}
                    name="purchaseReceives"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.bills')}
                    name="bills"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.paymentsMade')}
                    name="paymentsMade"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="sales">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:sales')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:salesDescription',
                        'Manage customer orders, invoicing, and payment collection'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.customers')}
                    name="customers"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.salesOrders')}
                    name="salesOrders"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.backorders')}
                    name="backorders"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.invoices')}
                    name="invoices"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.paymentsReceived')}
                    name="paymentsReceived"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="reports">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:reports')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:reportsDescription',
                        'Access analytics and business intelligence reports'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.analytics')}
                    name="analytics"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="settings">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:settings')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:settingsDescription',
                        'Configure plans, settings, roles, team members, agencies, and sites'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.plans')}
                    name="plans"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.settings')}
                    name="settings"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.roles')}
                    name="roles"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.team')}
                    name="team"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.agencies')}
                    name="agencies"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.sites')}
                    name="sites"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.subscriptions')}
                    name="subscriptions"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="aiInsights">
                <Accordion.Control>
                  <Box>
                    <Text fw={500}>{t('roles:aiInsights')}</Text>
                    <Text size="xs" c="dimmed">
                      {t(
                        'roles:aiInsightsDescription',
                        'Access AI assistant, roadmap features, and advanced insights'
                      )}
                    </Text>
                  </Box>
                </Accordion.Control>
                <Accordion.Panel>
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.aiAgent')}
                    name="aiAgent"
                    disabled={isReadOnly}
                  />
                  <RolesPermission
                    permissions={form.values.permissions || []}
                    onChange={handlePermissionsChange}
                    label={t('roles:modules.roadmap')}
                    name="roadmap"
                    disabled={isReadOnly}
                    isLast={true}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Grid.Col>
        </Form>
      </Grid.Col>
    </Grid>
  )
}
