import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
  useActionData,
  useLoaderData,
} from 'react-router'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import { Notification } from '~/app/components'
import SalesOrders from '~/app/pages/SalesOrders'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getSalesOrders, updateSalesOrderStatus } from '~/app/services/sales.server'
import type { Route } from './+types/salesOrders'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:salesOrders'])
  const url = new URL(request.url)
  const salesOrderId = url.searchParams.get('salesOrderId') || undefined
  const salesOrders = await getSalesOrders(request, { salesOrderId })
  return {
    salesOrders,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:salesOrders' ||
        permission === 'update:salesOrders' ||
        permission === 'delete:salesOrders'
    ),
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const salesOrderId = formData.get('salesOrderId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updateSalesOrderStatus(request, { salesOrderId, status })
}

export default function SalesOrdersRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { salesOrders, permissions } = loaderData as {
    salesOrders: ISalesOrder[]
    permissions: string[]
  }
  return (
    <>
      <SalesOrders salesOrders={salesOrders} permissions={permissions} />
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
