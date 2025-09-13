import { ActionIcon, Badge, Box, Card, Group, SegmentedControl, SimpleGrid, Stack, Text, Tooltip } from "@mantine/core"
import { IconAlertTriangle, IconBuilding, IconBuildingStore, IconEdit, IconMapPin } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { SITE_TYPES } from "~/app/common/constants"
import { getSiteTypeLabel } from "~/app/common/helpers/site"

import { type ISite } from "~/app/common/validations/siteSchema"
import { Title } from "~/app/partials/Title"

interface SitesProps {
  sites: ISite[]
  permissions: string[]
}

export default function SitesPage({
  sites = [],
  permissions = [],
}: SitesProps) {
  const { t } = useTranslation(['sites', 'common'])
  const canCreate = permissions.includes("create:sites")
  const canUpdate = permissions.includes("update:sites")
  const [typeFilter, setTypeFilter] = useState<string>(SITE_TYPES.WAREHOUSE)

  const navigate = useNavigate()

  // Filter sites based on selected type
  const filteredSites = sites.filter(site => {
    return site.type === typeFilter
  })

  const getSiteIcon = (type: string) => {
    switch (type) {
      case 'WAREHOUSE':
        return <IconBuilding size={16} />
      case 'STORE':
        return <IconBuildingStore size={16} />
      default:
        return <IconBuilding size={16} />
    }
  }

  return (
    <>
      <Title to={"/sites/create"} canCreate={canCreate}>
        {t('sites:title')}
      </Title>

      {sites.length > 0 && (
        <Box mt="md" mb="lg">
          <SegmentedControl
            value={typeFilter}
            onChange={setTypeFilter}
            data={[
              {
                label: t('sites:warehouse'),
                value: SITE_TYPES.WAREHOUSE
              },
              {
                label: t('sites:store'),
                value: SITE_TYPES.STORE
              }
            ]}
          />
        </Box>
      )}

      {filteredSites.length === 0 ? (
        <Card withBorder p="xl" radius="md" mt={20}>
          <Stack align="center" gap="sm">
            <IconBuilding size={48} color="var(--mantine-color-gray-5)" />
            <Text size="lg" fw={500} c="dimmed">
              {sites.length === 0 ? t('sites:emptyState') : t('sites:noSitesMatchFilter')}
            </Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing="md"
          mt={20}
        >
          {filteredSites.map(({ id, name, location, type, agency }) => {
            const siteType = getSiteTypeLabel(type, t)
            const address = location?.address ? `${location?.address}, ` : ""
            const postalCode = location?.postalCode ? `${location?.postalCode}, ` : ""
            const fullAddress = location ? `${address}${postalCode}${location?.city} (${location?.country})` : ""

            return (
              <Card
                key={id}
                withBorder
                p="lg"
                radius="md"
                style={{
                  cursor: canUpdate ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => canUpdate && navigate(`/sites/${id}/edit`)}
                className={canUpdate ? 'hover:shadow-md hover:border-blue-300' : ''}
              >
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    {getSiteIcon(type)}
                    <Text fw={600} size="lg" truncate>
                      {name}
                    </Text>
                  </Group>
                  {canUpdate && (
                    <Tooltip label={t('common:edit')}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/sites/${id}/edit`)
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>

                <Stack gap="xs">
                  <Group gap="xs">
                    <Badge color={siteType.color} variant="light">
                      {siteType.label}
                    </Badge>
                  </Group>

                  {fullAddress && (
                    <Group gap="xs">
                      <IconMapPin size={16} color="var(--mantine-color-gray-6)" />
                      <Text size="sm" c="dimmed" truncate>
                        {fullAddress}
                      </Text>
                    </Group>
                  )}

                  <Group justify="space-between" align="center">
                    {agency ? (
                      <Text size="sm" c="dimmed">
                        {agency.name}
                      </Text>
                    ) : (
                      <Group gap="xs">
                        <Tooltip label={t('sites:notAssociatedWithAgency')}>
                          <IconAlertTriangle color="orange" size={16} />
                        </Tooltip>
                        <Text size="sm" c="orange">
                          {t('sites:notAssociatedWithAgency')}
                        </Text>
                      </Group>
                    )}
                  </Group>
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      )}
    </>
  )
}
