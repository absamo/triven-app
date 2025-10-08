import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction } from 'react-router'

import { TRANSFER_ORDER_REASONS } from '~/app/common/constants'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { ITransferOrder } from '~/app/common/validations/transferOrderSchema'
import { Notification } from '~/app/components'
import TransferOrdersForm from '~/app/pages/TransferOrders/TransferOrdersForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getProducts } from '~/app/services/products.server'
import { getSites } from '~/app/services/sites.server'
import { createTransferOrder, getMaxTransferOrderNumber } from '~/app/services/transferOrders'
import type { Route } from './+types/transferOrders.create'

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['create:transferOrders'])

  const sites = await getSites(request)
  const products = await getProducts(request)

  const transferOrderReference = await getMaxTransferOrderNumber(request)
  const transferOrder: ITransferOrder = {
    transferOrderReference: `TO-${transferOrderReference}`,
    reason: TRANSFER_ORDER_REASONS.INTERNAL_TRANSFER,
    siteFromId: '',
    siteToId: '',
    transferOrderItems: [],
    transferOrderDate: new Date(),
  }

  return { transferOrder, sites, products }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const transferOrderReference = formData.get('transferOrderReference') as string
  const reason = JSON.parse(formData.get('reason') as string)
  const siteFromId = formData.get('siteFromId') as string
  const siteToId = formData.get('siteToId') as string
  const transferOrderDate = JSON.parse(formData.get('transferOrderDate') as string)
  const transferOrderItems = JSON.parse(formData.get('transferOrderItems') as string)

  return await createTransferOrder(request, {
    transferOrderReference,
    reason,
    siteFromId,
    siteToId,
    transferOrderDate,
    transferOrderItems,
  })
}

export default function CreateStoresRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { transferOrder, sites, products } = loaderData as unknown as {
    transferOrder: ITransferOrder
    sites: ISite[]
    products: any[]
  }

  return (
    <>
      <TransferOrdersForm
        transferOrder={transferOrder}
        sites={sites}
        products={products}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
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
