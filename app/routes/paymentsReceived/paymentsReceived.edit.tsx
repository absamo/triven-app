import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from 'react-router'

import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ICustomer } from '~/app/common/validations/customerSchema'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import { type IPaymentsReceived } from '~/app/common/validations/paymentsReceivedSchema'
import { Notification } from '~/app/components'
import PaymentsReceivedForm from '~/app/pages/PaymentsReceived/PaymentsReceivedForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCustomers } from '~/app/services/customers.server'
import { getInvoices } from '~/app/services/invoices.server'
import { getPaymentReceived, updatePaymentReceived } from '~/app/services/payments.server'
import type { Route } from './+types/paymentsReceived.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['update:paymentsReceived'])

  const paymentReceived = await getPaymentReceived(params.id)

  const customers = await getCustomers(request)
  const user = await requireBetterAuthUser(request, ['update:paymentsReceived'])
  const invoices = await getInvoices(request)

  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    paymentReceived,
    customers,
    currency: baseCurrency,
    invoices,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const paymentReference = formData.get('paymentReference') as IPaymentsReceived['paymentReference']
  const paymentMethod = JSON.parse(
    formData.get('paymentMethod') as string
  ) as IPaymentsReceived['paymentMethod']
  const paymentDate = JSON.parse(
    formData.get('paymentDate') as string
  ) as IPaymentsReceived['paymentDate']
  const customerId = formData.get('customerId') as IPaymentsReceived['customerId']
  const invoiceId = formData.get('invoiceId') as IPaymentsReceived['invoiceId']
  const notes = formData.get('notes') as IPaymentsReceived['notes']
  const amountReceived = JSON.parse(
    formData.get('amountReceived') as string
  ) as IPaymentsReceived['amountReceived']

  return await updatePaymentReceived(request, {
    id: params.id,
    paymentReference,
    paymentMethod,
    paymentDate,
    customerId,
    notes,
    amountReceived,
    invoiceId,
  })
}

export default function PaymentReceivedEditRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { paymentReceived, customers, currency, invoices } = loaderData as {
    paymentReceived: IPaymentsReceived
    customers: ICustomer[]
    currency: ICurrency
    invoices: IInvoice[]
  }
  return (
    <>
      <PaymentsReceivedForm
        paymentReceived={paymentReceived}
        customers={customers}
        invoices={invoices}
        currency={currency}
        errors={(actionData as { errors: Record<string, string> })?.errors}
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
