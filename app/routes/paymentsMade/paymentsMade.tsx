import { type ActionFunction, type ActionFunctionArgs, type LoaderFunction } from 'react-router'
import PaymentsMadePage from '~/app/pages/PaymentsMade'
import { getPaymentsMade, updatePaymentMadeStatus } from '~/app/services/payments.server'
import { Notification } from '~/app/components'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { IPaymentsMade } from '~/app/common/validations/paymentsMadeSchema'
import type { Route } from './+types/paymentsMade'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IBill } from '~/app/common/validations/billSchema'
import { getBills } from '~/app/services/bills.server'

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:paymentsMade'])

  const paymentsMade = await getPaymentsMade(request)
  const currency = user?.company?.currencies?.find((currency) => currency.base)
  const bills = await getBills(request)
  return {
    paymentsMade,
    currency,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:paymentsMade' ||
        permission === 'update:paymentsMade' ||
        permission === 'delete:paymentsMade'
    ),
    bills,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const paymentMadeId = formData.get('paymentMadeId') as string
  const status = JSON.parse(formData.get('status') as string)

  return await updatePaymentMadeStatus(request, {
    paymentMadeId,
    status,
  })
}

export default function PaymentsMadeRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { paymentsMade, currency, permissions, bills } = loaderData as unknown as {
    paymentsMade: IPaymentsMade[]
    permissions: string[]
    currency: ICurrency
    bills: IBill[]
  }

  return (
    <>
      <PaymentsMadePage
        paymentsMade={paymentsMade}
        currency={currency}
        permissions={permissions}
        bills={bills}
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
