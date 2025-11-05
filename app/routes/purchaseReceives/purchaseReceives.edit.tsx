import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { IPurchaseReceiveItem } from '~/app/common/validations/purchaseReceiveItemSchema'
import type { IPurchaseReceive } from '~/app/common/validations/purchaseReceiveSchema'
import type { ISupplier } from '~/app/common/validations/supplierSchema'
import { Notification } from '~/app/components'
import PurchaseReceivesForm from '~/app/pages/PurchaseReceives/PurchaseReceivesForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import {
  getPurchaseOrders,
  getPurchaseReceive,
  updatePurchaseReceive,
} from '~/app/services/purchases.server'
import type { Route } from './+types/purchaseReceives.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['update:purchaseReceives'])

  const purchaseReceive = await getPurchaseReceive(params.id)

  const purchaseOrders = await getPurchaseOrders(request)

  return { purchaseReceive, purchaseOrders }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const purchaseReceiveReference = formData.get(
    'purchaseReceiveReference'
  ) as IPurchaseReceive['purchaseReceiveReference']
  const receivedDate = JSON.parse(
    formData.get('receivedDate') as string
  ) as IPurchaseReceive['receivedDate']
  const purchaseOrderId = formData.get('purchaseOrderId') as IPurchaseReceive['purchaseOrderId']

  const purchaseReceiveItems = JSON.parse(
    formData.get('purchaseReceiveItems') as string
  ) as IPurchaseReceiveItem[]

  const receivedQuantity = (purchaseReceiveItems || []).reduce(
    (acc, item) => acc + item.receivedQuantity,
    0
  )

  const orderedQuantity = (purchaseReceiveItems || []).reduce(
    (acc, item) => acc + item.orderedQuantity,
    0
  )

  return await updatePurchaseReceive(request, {
    id: params.id,
    purchaseReceiveReference,
    receivedDate,
    purchaseOrderId,
    receivedQuantity,
    orderedQuantity,
    purchaseReceiveItems,
  })
}

export default function PurchaseReceivesEditRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { purchaseReceive, purchaseOrders, suppliers } = loaderData as unknown as {
    purchaseReceive: IPurchaseReceive
    purchaseOrders: IPurchaseOrder[]
    suppliers: ISupplier[]
  }

  return (
    <>
      <PurchaseReceivesForm
        purchaseReceive={purchaseReceive}
        purchaseOrders={purchaseOrders}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
      />
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
    </>
  )
}
