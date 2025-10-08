import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from 'react-router'

import PurchaseOrders from '~/app/pages/PurchaseOrders'
import { updatePurchaseOrderStatus, getPurchaseOrders } from '~/app/services/purchases.server'
import { Notification } from '~/app/components'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { Route } from './+types/purchaseOrders'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:purchaseOrders'])

  const url = new URL(request.url)
  const billId = url.searchParams.get('billId') || undefined
  const purchaseOrderId = url.searchParams.get('purchaseOrderId') || undefined

  const purchaseOrders = await getPurchaseOrders(request, {
    billId,
    purchaseOrderId,
  })

  return {
    purchaseOrders,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:purchaseOrders' ||
        permission === 'update:purchaseOrders' ||
        permission === 'delete:purchaseOrders'
    ),
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const purchaseOrderId = formData.get('purchaseOrderId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updatePurchaseOrderStatus(request, { purchaseOrderId, status })
}

export default function PurchaseOrdersRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { purchaseOrders, permissions } = loaderData as unknown as {
    purchaseOrders: IPurchaseOrder[]
    permissions: string[]
  }

  return (
    <>
      <PurchaseOrders purchaseOrders={purchaseOrders} permissions={permissions} />
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
