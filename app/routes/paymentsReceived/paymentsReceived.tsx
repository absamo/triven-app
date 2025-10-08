import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction } from 'react-router'
import PaymentsReceivedPage from '~/app/pages/PaymentsReceived'
import { Notification } from '~/app/components'
import { getPaymentsReceived, updatePaymentReceivedStatus } from '~/app/services/payments.server'

import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/paymentsReceived'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPaymentsReceived } from '~/app/common/validations/paymentsReceivedSchema'
import { getInvoices } from '~/app/services/invoices.server'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:paymentsReceived'])

  const paymentsReceived = await getPaymentsReceived(request)

  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)

  const invoices = await getInvoices(request)

  return {
    paymentsReceived,
    currency: baseCurrency,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:paymentsReceived' ||
        permission === 'update:paymentsReceived' ||
        permission === 'delete:paymentsReceived'
    ),
    invoices,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const paymentReceivedId = formData.get('paymentReceivedId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updatePaymentReceivedStatus(request, {
    paymentReceivedId,
    status,
  })
}

export default function PaymentReceivedRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { paymentsReceived, permissions, currency, invoices } = loaderData as unknown as {
    paymentsReceived: IPaymentsReceived[]
    permissions: string[]
    currency: ICurrency
    invoices: IInvoice[]
  }

  return (
    <>
      <PaymentsReceivedPage
        paymentsReceived={paymentsReceived}
        currency={currency}
        permissions={permissions}
        invoices={invoices}
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
