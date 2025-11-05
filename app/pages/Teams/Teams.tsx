import {
  Avatar,
  Badge,
  Group,
  Indicator,
  Menu,
  Stack,
  Switch,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconDots, IconMail, IconUserCheck, IconUserOff } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSubmit } from 'react-router'

import { getUserRoleLabel, getUserStatusLabel } from '~/app/common/helpers/user'
import type { ITeam } from '~/app/common/validations/teamSchema'
import { formatRelativeTime } from '~/app/lib/dayjs'
import { useAutoRevalidate } from '~/app/lib/hooks/useAutoRevalidate'
import { Title } from '~/app/partials/Title'
import styles from './Teams.module.css'

interface TeamsProps {
  teams: ITeam[]
  currentUser: any
  permissions: string[]
}

export default function TeamsPage({ teams = [], currentUser, permissions = [] }: TeamsProps) {
  const { t, i18n } = useTranslation(['teams', 'common'])
  const canCreate = permissions.includes('create:users')
  const canUpdate = permissions.includes('update:users')
  const canDelete = permissions.includes('delete:users')

  const [showActiveOnly, setShowActiveOnly] = useState(true)

  // Auto-revalidate data every 30 seconds to keep online status updated
  useAutoRevalidate({
    interval: 30000, // 30 seconds
    enabled: true,
  })

  const navigate = useNavigate()
  const submit = useSubmit()

  const handleAction = (actionType: string, userId: string) => {
    const formData = new FormData()
    formData.append('actionType', actionType)
    formData.append('userId', userId)
    submit(formData, { method: 'post' })
  }

  // Filter teams based on the toggle
  const filteredTeams = showActiveOnly ? teams.filter((team) => team.active !== false) : teams

  // Count online users
  const onlineCount = teams.filter((team) => team.isOnline && team.active !== false).length
  const totalActiveCount = teams.filter((team) => team.active !== false).length

  // Check if user is the last admin
  const getIsLastAdmin = (team: ITeam) => {
    const activeAdmins = teams.filter((t) => t.role?.name === 'Admin' && t.active !== false)
    return team.role?.name === 'Admin' && activeAdmins.length <= 1
  }

  const rows = filteredTeams.map((team) => {
    const status = getUserStatusLabel(team.status || '')
    const role = getUserRoleLabel(team.role?.name || '')
    const isLastAdmin = getIsLastAdmin(team)
    const cannotDeactivate = team.id === currentUser?.id || isLastAdmin
    return (
      <Table.Tr
        key={team.profile?.id}
        onClick={() => canUpdate && team.active && navigate(`/teams/${team.id}/edit`)}
        className={team.active === false ? styles.inactiveRow : styles.activeRow}
        style={{
          cursor: canUpdate && team.active ? 'pointer' : 'default',
        }}
        data-inactive={team.active === false}
      >
        <Table.Td>
          <Group>
            <Tooltip
              label={
                team.isOnline
                  ? t('teams:onlineNow')
                  : team.lastOnlineAt
                    ? t('teams:lastOnline', {
                        time: formatRelativeTime(team.lastOnlineAt, i18n.language),
                      })
                    : t('teams:neverOnline')
              }
              position="top"
              withArrow
            >
              <Indicator
                inline
                size={10}
                offset={7}
                position="bottom-end"
                color={team.isOnline ? 'green' : 'gray'}
                withBorder
              >
                <Avatar
                  size={40}
                  src={team.profile?.avatar}
                  radius={40}
                  color="initials"
                  name={`${team.profile?.firstName.charAt(0)}${team.profile?.lastName.charAt(0)}`}
                />
              </Indicator>
            </Tooltip>
            <Stack gap={0}>
              <Text size="sm">{`${team.profile?.firstName} ${team.profile?.lastName}`}</Text>
              <Text size="xs" c="dimmed">
                {team.email}
              </Text>
              <Text size="xs" c={team.isOnline ? 'green' : 'dimmed'}>
                {team.isOnline
                  ? t('teams:onlineNow')
                  : team.lastOnlineAt
                    ? formatRelativeTime(team.lastOnlineAt, i18n.language)
                    : t('teams:neverOnline')}
              </Text>
            </Stack>
          </Group>
        </Table.Td>

        <Table.Td>
          <Text size="sm">{role}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{team.agency?.name}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{team.site?.name}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </Table.Td>
        <Table.Td onClick={(e) => e.stopPropagation()}>
          {(canDelete || canUpdate) && (
            <Group justify="right">
              <Menu withArrow position="bottom-end">
                <Menu.Target>
                  <UnstyledButton onClick={(e) => e.stopPropagation()}>
                    <IconDots size={16} stroke={1.5} />
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Tooltip
                    label={
                      team.status !== 'Pending' ? t('teams:cannotResendForNonPending') : undefined
                    }
                    disabled={team.status === 'Pending'}
                  >
                    <Menu.Item
                      leftSection={<IconMail size={16} stroke={1.5} />}
                      onClick={() => handleAction('resendInvitation', team.id!)}
                      disabled={canUpdate && team.status !== 'Pending'}
                    >
                      {t('teams:resendInvitation', 'Resend Invitation')}
                    </Menu.Item>
                  </Tooltip>

                  {canDelete && (
                    <Tooltip
                      label={
                        team.id === currentUser?.id
                          ? t('teams:cannotDeactivateSelf')
                          : isLastAdmin
                            ? t('teams:cannotDeactivateLastAdmin')
                            : undefined
                      }
                      disabled={!cannotDeactivate}
                    >
                      <Menu.Item
                        leftSection={
                          team.active === false ? (
                            <IconUserCheck size={16} stroke={1.5} />
                          ) : (
                            <IconUserOff size={16} stroke={1.5} />
                          )
                        }
                        color={team.active === false ? 'green' : 'red'}
                        onClick={() =>
                          handleAction(team.active === false ? 'activate' : 'deactivate', team.id!)
                        }
                        disabled={cannotDeactivate}
                      >
                        {team.active === false
                          ? t('teams:reactivateAccount', 'Reactivate Account')
                          : t('teams:deactivateAccount', 'Deactivate Account')}
                      </Menu.Item>
                    </Tooltip>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/teams/create'} canCreate={canCreate} createLabel={t('teams:invite')}>
        {t('teams:title')}
      </Title>

      <Group justify="space-between" mt="md" mb="sm">
        <Text size="sm" c="dimmed">
          {t('teams:onlineMembers', '{{count}} of {{total}} members online', {
            count: onlineCount,
            total: totalActiveCount,
          })}
        </Text>
        <Switch
          checked={showActiveOnly}
          onChange={(event) => setShowActiveOnly(event.currentTarget.checked)}
          label={t('teams:showActiveOnly')}
          size="sm"
        />
      </Group>

      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={10}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('teams:name')}</Table.Th>
            <Table.Th>{t('teams:role')}</Table.Th>
            <Table.Th>{t('teams:agency')}</Table.Th>
            <Table.Th>{t('teams:site')}</Table.Th>
            <Table.Th>{t('teams:status')}</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}
