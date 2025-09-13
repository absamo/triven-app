import {
  ActionIcon,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
  IconEdit,
  IconExclamationCircle,
  IconUsers
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { IRole } from "~/app/common/validations/roleSchema";
import { Title } from "~/app/partials/Title";

interface RoleProps {
  roles: IRole[]
  permissions: string[]
}

export default function RolePage({ roles = [], permissions = [] }: RoleProps) {
  const { t } = useTranslation(['roles', 'common']);
  const canCreate = permissions.includes("create:roles")
  const canUpdate = permissions.includes("update:roles")

  const navigate = useNavigate()

  const roleCards = roles.map(({ name, id, editable, description }) => {
    const handleRoleClick = () => {
      if (!editable) {
        showNotification({
          message: t('roles:cannotEditDefaultRoles'),
          autoClose: 2000,
          color: "red",
          icon: <IconExclamationCircle size="1rem" />,
        })
      } else {
        canUpdate && navigate(`/roles/${id}/edit`)
      }
    }

    return (
      <Card
        key={id}
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          cursor: editable && canUpdate ? 'pointer' : 'default',
          opacity: !editable ? 0.8 : 1
        }}
      >
        <Group justify="space-between" mb="xs">
          <Text fw={500} size="lg">
            {name}
          </Text>

          {editable && canUpdate && (
            <Tooltip label={t('common:edit', 'Edit')}>
              <ActionIcon
                variant="light"
                color="blue"
                onClick={handleRoleClick}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>        <Stack gap="xs">
          <Text size="sm" c="dimmed" lineClamp={2}>
            {description || t('roles:noDescription', 'No description provided')}
          </Text>

          <Group gap="xs" mt="sm">
            <Group gap={4}>
              <IconUsers size={14} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">
                {!editable
                  ? t('roles:builtInRole', 'Built-in role')
                  : t('roles:customRole', 'Custom role')
                }
              </Text>
            </Group>
          </Group>
        </Stack>

        {!editable && (
          <UnstyledButton
            onClick={handleRoleClick}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'not-allowed'
            }}
          />
        )}
      </Card>
    )
  })

  return (
    <>
      <Title to={"/roles/create"} canCreate={canCreate}>
        {t('roles:title')}
      </Title>

      <Text size="sm" c="dimmed" mb="lg">
        {t('roles:pageDescription', 'Manage user roles and permissions for your organization')}
      </Text>

      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing="md"
        mt="md"
      >
        {roleCards}
      </SimpleGrid>

      {roles.length === 0 && (
        <Card shadow="sm" padding="xl" radius="md" withBorder mt="md">
          <Stack align="center" gap="md">
            <IconUsers size={48} color="var(--mantine-color-dimmed)" />
            <Text ta="center" c="dimmed">
              {t('roles:noRoles', 'No roles found')}
            </Text>
            <Text size="sm" ta="center" c="dimmed">
              {t('roles:createFirstRole', 'Create your first role to get started')}
            </Text>
          </Stack>
        </Card>
      )}
    </>
  )
}
