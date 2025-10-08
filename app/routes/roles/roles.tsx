import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'

import Roles from '~/app/pages/Roles'
import { getRoles } from '~/app/services/roles.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/roles'
import type { IRole } from '~/app/common/validations/roleSchema'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:roles'])

  const roles = await getRoles(request)
  return {
    roles,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:roles' ||
        permission === 'update:roles' ||
        permission === 'delete:roles'
    ),
  }
}

export default function RolesRoute({ loaderData }: Route.ComponentProps) {
  const { roles, permissions } = loaderData as {
    roles: IRole[]
    permissions: string[]
  }

  return <Roles roles={roles} permissions={permissions} />
}
