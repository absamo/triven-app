import { Menu, Table, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { IconDotsVertical, IconLockAccess, IconLockAccessOff } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Form, useNavigate, useSubmit } from 'react-router'
import type { ICustomer } from '~/app/common/validations/customerSchema'
import { Title } from '~/app/partials/Title'

interface CustomersProps {
  customers: ICustomer[]
  permissions: string[]
}

export default function CustomersPage({ customers = [], permissions = [] }: CustomersProps) {
  const { t } = useTranslation(['customers', 'common'])
  const navigate = useNavigate()
  const canCreate = permissions.includes('create:customers')
  const canUpdate = permissions.includes('update:customers')

  const submit = useSubmit()

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    customerId: ICustomer['id'],
    hasPortalAccess: ICustomer['hasPortalAccess']
  ) => {
    event.preventDefault()

    const formData = new FormData()
    formData.append('hasPortalAccess', JSON.stringify(hasPortalAccess))
    formData.append('customerId', customerId!)
    submit(formData, { method: 'post', action: '/customers' })
  }

  const theme = useMantineTheme()

  const rows = (customers || []).map((customer: ICustomer) => {
    return (
      <Table.Tr
        key={customer.id}
        onClick={() => {
          canUpdate && navigate(`/customers/${customer.id}/edit`)
        }}
      >
        <Table.Td>{`${customer.firstName} ${customer.lastName}`}</Table.Td>
        <Table.Td>{customer.email}</Table.Td>
        <Table.Td>{customer.phone}</Table.Td>
        <Table.Td>{customer.companyName}</Table.Td>
        <Table.Td onClick={(event) => event.stopPropagation()} align="right">
          <Menu withArrow position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <IconDotsVertical
                  size={16}
                  stroke={1.5}
                  onClick={(event) => event.preventDefault()}
                />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Form
                onSubmit={(event) => handleSubmit(event, customer.id, !customer.hasPortalAccess)}
              >
                <Menu.Item
                  type="submit"
                  leftSection={
                    customer.hasPortalAccess ? (
                      <IconLockAccessOff size={16} stroke={1.5} color={theme.colors.orange[5]} />
                    ) : (
                      <IconLockAccess size={16} stroke={1.5} color={theme.colors.blue[5]} />
                    )
                  }
                >
                  {customer.hasPortalAccess ? 'Lock portal access' : 'Enable portal access'}
                </Menu.Item>
              </Form>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/customers/create'} canCreate={canCreate}>
        {t('customers:title', 'Customers')}
      </Title>

      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('customers:fullName', 'Full Name')}</Table.Th>
            <Table.Th>{t('common:email', 'Email')}</Table.Th>
            <Table.Th>{t('common:phone', 'Phone')}</Table.Th>
            <Table.Th>{t('customers:companyName', 'Company Name')}</Table.Th>
            <Table.Th>{t('common:actions', 'Actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5} align="center">
                <Text size="sm" c="dimmed">
                  No customers found
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </>
  )
}
