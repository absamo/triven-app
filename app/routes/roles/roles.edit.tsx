import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import type { IRole } from '~/app/common/validations/roleSchema'
import { Notification } from '~/app/components'
import RolesForm from '~/app/pages/Roles/RolesForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getRole, updateRole } from '~/app/services/roles.server'
import type { Route } from './+types/roles.edit'

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  // Allow both read and update permissions - we'll control the form based on role.editable
  const user = await requireBetterAuthUser(request, ['read:roles'])

  const role = (await getRole(params.id)) as IRole

  return {
    role,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get('name') as IRole['name']
  const description = formData.get('description') as IRole['description']
  const permissions = JSON.parse(formData.get('permissions') as string) as IRole['permissions']

  return await updateRole(request, {
    id: params.id,
    name,
    description,
    permissions,
    editable: true,
  })
}

export default function EditRoleRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { role } = loaderData as {
    role: IRole
  }

  return (
    <>
      <RolesForm role={role} errors={(actionData as { errors: Record<string, string> })?.errors} />
      {actionData && (
        <Notification
          notification={
            (
              actionData as unknown as {
                notification: {
                  message: string | null
                  status: 'Success' | 'Warning' | 'Error' | null
                  redirectTo?: string | null
                  autoClose?: boolean
                }
              }
            )?.notification
          }
        />
      )}
    </>
  )
}
