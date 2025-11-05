import { Flex, Table, Text, Tooltip } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { IconAlertCircle, IconExclamationCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import type { IRole } from '~/app/common/validations/roleSchema'
import { Title } from '~/app/partials/Title'

interface RoleProps {
  roles: IRole[]
  permissions: string[]
}

export default function RolePage({ roles = [], permissions = [] }: RoleProps) {
  const { t } = useTranslation(['roles', 'common'])
  const canCreate = permissions.includes('create:roles')
  const canUpdate = permissions.includes('update:roles')

  const navigate = useNavigate()

  const handleRoleClick = (role: IRole) => {
    if (canUpdate || !role.editable) {
      // Navigate to edit for custom roles with update permission, or any role with read permission
      navigate(`/roles/${role.id}/edit`)
    }
  }

  const rows = roles.map((role) => {
    const hasNoPermissions = !role.permissions || role.permissions.length === 0

    return (
      <Table.Tr
        key={role.id}
        onClick={() => handleRoleClick(role)}
        style={{
          cursor: 'pointer',
          opacity: !role.editable ? 0.8 : 1,
        }}
      >
        <Table.Td style={{ whiteSpace: 'nowrap' }}>
          <Text size="sm">{role.name}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed" lineClamp={1}>
            {role.description || t('roles:noDescription', 'No description provided')}
          </Text>
        </Table.Td>
        <Table.Td style={{ whiteSpace: 'nowrap' }}>
          <Text size="sm">
            {!role.editable
              ? t('roles:builtInRole', 'Built-in role')
              : t('roles:customRole', 'Custom role')}
          </Text>
        </Table.Td>
        <Table.Td style={{ textAlign: 'center', width: '60px', verticalAlign: 'middle' }}>
          {hasNoPermissions && (
            <Tooltip
              label={t('roles:noPermissionsWarning', 'This role has no permissions assigned')}
              withArrow
              position="left"
              color="dark"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <IconAlertCircle
                  size={20}
                  style={{
                    color: 'var(--mantine-color-yellow-6)',
                    display: 'block',
                  }}
                />
              </div>
            </Tooltip>
          )}
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/roles/create'} canCreate={canCreate} description={t('roles:pageDescription')}>
        {t('roles:title')}
      </Title>

      <Table verticalSpacing="xs" highlightOnHover withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('roles:name', 'Name')}</Table.Th>
            <Table.Th>{t('roles:description', 'Description')}</Table.Th>
            <Table.Th>{t('roles:type', 'Type')}</Table.Th>
            <Table.Th style={{ textAlign: 'center', width: '60px' }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}
