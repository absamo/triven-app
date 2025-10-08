import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction } from 'react-router'
import InvoicesPage from '~/app/pages/Invoices'
import { getInvoices, updateInvoiceStatus } from '~/app/services/invoices.server'
import { Notification } from '~/app/components'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/invoices'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import { getSalesOrders } from '~/app/services/sales.server'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:invoices'])

  const invoices = await getInvoices(request)
  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)
  const salesOrders = await getSalesOrders(request)

  return {
    invoices,
    currency: baseCurrency,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:invoices' ||
        permission === 'update:invoices' ||
        permission === 'delete:invoices'
    ),
    salesOrders,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const invoiceId = formData.get('invoiceId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updateInvoiceStatus(request, {
    invoiceId,
    status,
  })
}

export default function InvoicesRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { invoices, permissions, currency, salesOrders } = loaderData as unknown as {
    invoices: IInvoice[]
    permissions: string[]
    currency: ICurrency
    salesOrders: ISalesOrder[]
  }

  return (
    <>
      <InvoicesPage
        invoices={invoices}
        currency={currency}
        permissions={permissions}
        salesOrders={salesOrders}
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
