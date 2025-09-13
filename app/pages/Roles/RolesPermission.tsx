import { Flex, Switch } from "@mantine/core"
import { useTranslation } from "react-i18next"

interface RolesPermissionProps {
  permissions: string[]
  name: string
  onChange: (permissions: string[]) => void
  label?: string
}

export default function RolesPermission({
  permissions,
  onChange,
  name,
  label,
}: RolesPermissionProps) {
  const { t } = useTranslation(['roles', 'common']);

  return (
    <Switch.Group value={permissions} label={label} mt={20}>
      <Flex mt="xs" justify={"space-between"}>
        <Switch
          value={`full:${name}`}
          label={t('roles:permissions.fullAccess')}
          labelPosition="left"
          size="xs"
          onClick={(event) => {
            if (event.currentTarget.checked) {
              onChange([
                ...permissions,
                `full:${name}`,
                `read:${name}`,
                `create:${name}`,
                `update:${name}`,
                `delete:${name}`,
              ])
            } else {
              onChange(
                permissions.filter(
                  (p) =>
                    p !== `full:${name}` &&
                    p !== `read:${name}` &&
                    p !== `create:${name}` &&
                    p !== `update:${name}` &&
                    p !== `delete:${name}`
                )
              )
            }
          }}
        />

        <Switch
          value={`read:${name}`}
          label={t('roles:permissions.view')}
          labelPosition="left"
          size="xs"
          onClick={(event) => {
            if (event.currentTarget.checked) {
              onChange([...permissions, `read:${name}`])
            } else {
              onChange([
                ...permissions.filter(
                  (p) =>
                    p !== `full:${name}` &&
                    p !== `read:${name}` &&
                    p !== `create:${name}` &&
                    p !== `update:${name}` &&
                    p !== `delete:${name}`
                ),
              ])
            }
          }}
        />

        <Switch
          value={`create:${name}`}
          label={t('roles:permissions.create')}
          labelPosition="left"
          size="xs"
          onClick={(event) => {
            if (event.currentTarget.checked) {
              onChange([
                ...permissions.filter(
                  (p) => p !== `read:${name}` && p !== `create:${name}`
                ),
                `read:${name}`,
                `create:${name}`,
                permissions.includes(
                  `read:${name}` && `update:${name}` && `delete:${name}`
                )
                  ? `full:${name}`
                  : "",
              ])
            } else {
              onChange([
                ...permissions.filter(
                  (p) => p !== `full:${name}` && p !== `create:${name}`
                ),
              ])
            }
          }}
        />

        <Switch
          value={`update:${name}`}
          label={t('roles:permissions.update')}
          labelPosition="left"
          size="xs"
          onClick={(event) => {
            if (event.currentTarget.checked) {
              onChange([
                ...permissions.filter(
                  (p) =>
                    p !== `read:${name}` &&
                    p !== `create:${name}` &&
                    p !== `update:${name}`
                ),
                `read:${name}`,
                `create:${name}`,
                `update:${name}`,
                permissions.includes(
                  `read:${name}` && `create:${name}` && `delete:${name}`
                )
                  ? `full:${name}`
                  : "",
              ])
            } else {
              onChange([
                ...permissions.filter(
                  (p) => p !== `full:${name}` && p !== `update:${name}`
                ),
              ])
            }
          }}
        />
        <Switch
          value={`delete:${name}`}
          label={t('roles:permissions.delete')}
          labelPosition="left"
          size="xs"
          onClick={(event) => {
            if (event.currentTarget.checked) {
              onChange([
                ...permissions,
                `full:${name}`,
                `read:${name}`,
                `create:${name}`,
                `update:${name}`,
                `delete:${name}`,
              ])
            } else {
              onChange([
                ...permissions.filter(
                  (p) => p !== `full:${name}` && p !== `delete:${name}`
                ),
              ])
            }
          }}
        />

        {/* <Switch
          value={ROLE_PERMISSIONS.ARCHIVE}
          label="Archive"
          labelPosition="left"
          onClick={(event) => {
          setCheckedPermission(`${event.currentTarget.value}`)
          }}
          size="xs"
        /> */}

        {/* {canApprouve && (
          <>
            <Divider orientation="vertical" h={20} />
            <Switch
              value={ROLE_PERMISSIONS.APPROUVE}
              label="Approve"
              labelPosition="left"
              onClick={(event) => {
              setCheckedPermission(`${event.currentTarget.value}`)
              }}
              size="xs"
            />
          </>
        )} */}
      </Flex>
    </Switch.Group>
  )
}
