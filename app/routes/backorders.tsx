import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from 'react-router'

import type { IBackorder } from '~/app/common/validations/backorderSchema'
import { Notification } from '~/app/components'
import BackordersPage from '~/app/pages/Backorders/Backorders'
import { getBackorders, updateBackorderStatus } from '~/app/services/backorders.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:backorders'])

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const statuses = url.searchParams.getAll('status')
  const backorderReferences = url.searchParams.getAll('backorderReference')
  const fromDate = url.searchParams.get('fromDate')
  const toDate = url.searchParams.get('toDate')

  const filters = {
    search,
    statuses,
    backorderReferences,
    fromDate,
    toDate,
  }

  const backorders = await getBackorders(request, filters)

  return {
    backorders,
    permissions:
      user?.role?.permissions?.filter(
        (permission) =>
          permission === 'create:backorders' ||
          permission === 'update:backorders' ||
          permission === 'delete:backorders'
      ) || [],
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const backorderId = formData.get('backorderId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updateBackorderStatus(request, { backorderId, status })
}

export default function BackordersRoute({ loaderData, actionData }: any) {
  const { backorders, permissions } = loaderData as {
    backorders: IBackorder[]
    permissions: string[]
  }

  return (
    <>
      <BackordersPage backorders={backorders} permissions={permissions} />
      {actionData && (
        <Notification
          notification={
            (
              actionData as {
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
