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
  createPurchaseReceive,
  getMaxPurchaseReceiveNumber,
  getUnreceivedPurchaseOrders,
} from '~/app/services/purchases.server'
import type { Route } from './+types/purchaseReceives.create'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['create:purchaseReceives'])

  const purchaseReceiveReference = await getMaxPurchaseReceiveNumber(request)

  const purchaseReceive = {
    purchaseReceiveReference: `PR-${purchaseReceiveReference}`,
    purchaseOrderId: '',
    receivedDate: new Date(),
    purchaseReceiveItems: [],
  }

  const purchaseOrders = await getUnreceivedPurchaseOrders(request)

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

  return await createPurchaseReceive(request, {
    purchaseReceiveReference,
    receivedDate,
    purchaseOrderId,
    receivedQuantity,
    orderedQuantity,
    purchaseReceiveItems,
  })
}

export default function PurchaseReceivesCreateRoute({
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
