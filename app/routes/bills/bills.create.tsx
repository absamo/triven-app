import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from 'react-router'

import BillForm from '~/app/pages/Bills/BillForm'
import { Notification } from '~/app/components'
import { createBill, getMaxBillNumber } from '~/app/services/bills.server'
import { type IBill } from '~/app/common/validations/billSchema'
import { getPurchaseOrdersWithoutCancelledBills } from '~/app/services/purchases.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/bills.create'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['create:bills'])

  const billReference = await getMaxBillNumber(request)

  const bill = {
    billReference: `BI-${billReference}`,
    purchaseOrderId: '',
    billDate: new Date(),
    dueDate: new Date(),
    purchaseOrderItems: [],
  }

  const purchaseOrders = await getPurchaseOrdersWithoutCancelledBills(request)

  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    bill,
    purchaseOrders,
    currency: baseCurrency,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const billReference = formData.get('billReference') as IBill['billReference']
  const billDate = JSON.parse(formData.get('billDate') as string) as IBill['billDate']
  const dueDate = JSON.parse(formData.get('dueDate') as string) as IBill['dueDate']
  const purchaseOrderId = formData.get('purchaseOrderId') as IBill['purchaseOrderId']
  const notes = formData.get('notes') as IBill['notes']

  return await createBill(request, {
    billReference,
    billDate,
    dueDate,
    purchaseOrderId,
    notes,
  })
}

export default function BillsCreateRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { bill, currency, purchaseOrders } = loaderData as {
    bill: IBill
    currency: ICurrency
    purchaseOrders: IPurchaseOrder[]
  }

  return (
    <>
      <BillForm
        bill={bill}
        purchaseOrders={purchaseOrders}
        currency={currency}
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
