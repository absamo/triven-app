import type { ActionFunction, ActionFunctionArgs, LoaderFunction } from 'react-router'
import type { IBill } from '~/app/common/validations/billSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import { Notification } from '~/app/components'
import BillsPage from '~/app/pages/Bills'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getBills, updateBillStatus } from '~/app/services/bills.server'
import { getPurchaseOrders } from '~/app/services/purchases.server'
import type { Route } from './+types/bills'

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:bills'])

  const url = new URL(request.url)
  const purchaseOrderId = url.searchParams.get('purchaseOrderId') || undefined
  const paymentMadeId = url.searchParams.get('paymentMadeId') || undefined

  const bills = await getBills(request, { purchaseOrderId, paymentMadeId })
  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)
  const purchaseOrders = await getPurchaseOrders(request)

  return {
    bills,
    currency: baseCurrency,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:bills' ||
        permission === 'update:bills' ||
        permission === 'delete:bills'
    ),
    purchaseOrders,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const billId = formData.get('billId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updateBillStatus(request, {
    billId,
    status,
  })
}

export default function BillsRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { bills, currency, permissions, purchaseOrders } = loaderData as unknown as {
    bills: IBill[]
    currency: ICurrency
    permissions: string[]
    purchaseOrders: IPurchaseOrder[]
  }

  return (
    <>
      <BillsPage
        bills={bills}
        currency={currency}
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
      {/* </ContainerPartialPage> */}
    </>
  )
}
