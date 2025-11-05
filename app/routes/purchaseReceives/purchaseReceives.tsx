import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { IPurchaseReceive } from '~/app/common/validations/purchaseReceiveSchema'
import { Notification } from '~/app/components'
import PurchaseReceives from '~/app/pages/PurchaseReceives'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import {
  getPurchaseOrders,
  getPurchaseReceives,
  updatePurchaseReceiveStatus,
} from '~/app/services/purchases.server'
import type { Route } from './+types/purchaseReceives'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:purchaseReceives'])
  const purchaseReceives = await getPurchaseReceives(request)
  const purchaseOrders = await getPurchaseOrders(request)

  return {
    purchaseReceives,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:purchaseReceives' ||
        permission === 'update:purchaseReceives' ||
        permission === 'delete:purchaseReceives'
    ),
    purchaseOrders,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const purchaseReceiveId = formData.get('purchaseReceiveId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updatePurchaseReceiveStatus(request, {
    purchaseReceiveId,
    status,
  })
}

export default function PurchaseReceivesRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { purchaseReceives, permissions, purchaseOrders } = loaderData as unknown as {
    purchaseReceives: IPurchaseReceive[]
    permissions: string[]
    purchaseOrders: IPurchaseOrder[]
    purchaseOrderReference: string
  }

  return (
    <>
      <PurchaseReceives
        purchaseReceives={purchaseReceives}
        permissions={permissions}
        purchaseOrders={purchaseOrders}
      />
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
