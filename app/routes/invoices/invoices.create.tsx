import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import { INVOICE_STATUSES } from '~/app/common/constants'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import { Notification } from '~/app/components'
import InvoiceForm from '~/app/pages/Invoices/InvoiceForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { createInvoice, getMaxInvoiceNumber } from '~/app/services/invoices.server'
import { getSalesOrders } from '~/app/services/sales.server'
import type { Route } from './+types/invoices.create'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['create:invoices'])

  const invoiceReference = await getMaxInvoiceNumber(request)

  const invoice = {
    invoiceReference: `IN-${invoiceReference}`,
    customerId: '',
    siteId: user.siteId,
    agencyId: user.agencyId,
    invoiceDate: new Date(),
    dueDate: new Date(),
    status: INVOICE_STATUSES.UNPAID,
    salesOrderItems: [],
  }

  const salesOrders = await getSalesOrders(request)

  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    invoice,
    salesOrders,
    currency: baseCurrency,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const invoiceReference = formData.get('invoiceReference') as IInvoice['invoiceReference']
  const status = JSON.parse(formData.get('status') as string) as IInvoice['status']
  const invoiceDate = JSON.parse(formData.get('invoiceDate') as string) as IInvoice['invoiceDate']
  const dueDate = JSON.parse(formData.get('dueDate') as string) as IInvoice['dueDate']
  const salesOrderId = formData.get('salesOrderId') as IInvoice['salesOrderId']
  const notes = formData.get('notes') as IInvoice['notes']

  return await createInvoice(request, {
    invoiceReference,
    status,
    invoiceDate,
    dueDate,
    salesOrderId,
    notes,
  })
}

export default function InvoiceCreateRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { invoice, currency, salesOrders } = loaderData as unknown as {
    invoice: IInvoice
    permissions: string[]
    currency: ICurrency
    salesOrders: ISalesOrder[]
  }
  return (
    <>
      <InvoiceForm
        invoice={invoice}
        salesOrders={salesOrders}
        currency={currency}
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
