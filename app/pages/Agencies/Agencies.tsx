import { ActionIcon, Badge, Card, Group, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core'
import { IconCurrencyDollar, IconEdit, IconMapPin } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import type { IAgency } from '~/app/common/validations/agencySchema'
import { Title } from '~/app/partials/Title'

interface AgencyProps {
  agencies: IAgency[]
  permissions: string[]
}

export default function AgenciesPage({ agencies = [], permissions = [] }: AgencyProps) {
  const { t } = useTranslation(['agencies', 'common'])
  const canCreate = permissions.includes('create:agencies')
  const canUpdate = permissions.includes('update:agencies')

  const navigate = useNavigate()

  return (
    <>
      <Title to={'/agencies/create'} canCreate={canCreate}>
        {t('agencies:title')}
      </Title>

      {agencies.length === 0 ? (
        <Card withBorder p="xl" radius="md" mt={20}>
          <Stack align="center" gap="sm">
            <IconMapPin size={48} color="var(--mantine-color-gray-5)" />
            <Text size="lg" fw={500} c="dimmed">
              {t('agencies:emptyState')}
            </Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt={20}>
          {agencies.map(({ id, name, location, currency }) => (
            <Card
              key={id}
              withBorder
              p="lg"
              radius="md"
              style={{
                cursor: canUpdate ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
              onClick={() => canUpdate && navigate(`/agencies/${id}/edit`)}
              className={canUpdate ? 'hover:shadow-md hover:border-blue-300' : ''}
            >
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="lg" truncate>
                  {name}
                </Text>
                {canUpdate && (
                  <Tooltip label={t('common:edit')}>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/agencies/${id}/edit`)
                      }}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>

              <Stack gap="xs">
                {location && (
                  <Group gap="xs">
                    <IconMapPin size={16} color="var(--mantine-color-gray-6)" />
                    <Text size="sm" c="dimmed">
                      {`${location.city}, ${location.country}`}
                    </Text>
                  </Group>
                )}

                {currency && (
                  <Group gap="xs">
                    <IconCurrencyDollar size={16} color="var(--mantine-color-gray-6)" />
                    <Badge variant="light" size="sm">
                      {currency.currencyCode}
                    </Badge>
                  </Group>
                )}
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </>
  )
}
