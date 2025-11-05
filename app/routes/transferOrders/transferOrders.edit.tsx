import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'

import type { ISite } from '~/app/common/validations/siteSchema'
import type { ITransferOrder } from '~/app/common/validations/transferOrderSchema'
import { Notification } from '~/app/components'
import TransferOrdersForm from '~/app/pages/TransferOrders/TransferOrdersForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getProducts } from '~/app/services/products.server'
import { getSites } from '~/app/services/sites.server'
import { getTransferOrder, updateTransferOrder } from '~/app/services/transferOrders'
import type { Route } from './+types/transferOrders.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['update:transferOrders'])

  const transferOrder = await getTransferOrder(params.id)
  const sites = await getSites(request)
  const products = await getProducts(request)

  return {
    transferOrder,
    sites,
    products,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const transferOrderReference = formData.get('transferOrderReference') as string
  const reason = JSON.parse(formData.get('reason') as string)
  const siteFromId = formData.get('siteFromId') as string
  const siteToId = formData.get('siteToId') as string
  const transferOrderDate = JSON.parse(formData.get('transferOrderDate') as string)
  const transferOrderItems = JSON.parse(formData.get('transferOrderItems') as string)

  return await updateTransferOrder(request, {
    id: params.id,
    transferOrderReference,
    reason,
    siteFromId,
    siteToId,
    transferOrderDate,
    transferOrderItems,
  })
}

export default function EditSiteRoute({ loaderData, actionData }: Route.ComponentProps) {
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
