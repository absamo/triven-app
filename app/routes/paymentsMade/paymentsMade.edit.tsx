import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import type { IBill } from '~/app/common/validations/billSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPaymentsMade } from '~/app/common/validations/paymentsMadeSchema'
import { Notification } from '~/app/components'
import PaymentsMadeForm from '~/app/pages/PaymentsMade/PaymentsMadeForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getBills } from '~/app/services/bills.server'
import { getPaymentMade, updatePaymentMade } from '~/app/services/payments.server'
import { getSuppliers } from '~/app/services/suppliers.server'
import type { Route } from './+types/paymentsMade.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['update:paymentsMade'])

  const paymentMade = await getPaymentMade(params.id)
  const suppliers = await getSuppliers(request)
  const bills = await getBills(request)

  const currency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    paymentMade,
    suppliers,
    currency,
    bills,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const paymentReference = formData.get('paymentReference') as IPaymentsMade['paymentReference']
  const paymentMethod = JSON.parse(
    formData.get('paymentMethod') as string
  ) as IPaymentsMade['paymentMethod']
  const paymentDate = JSON.parse(
    formData.get('paymentDate') as string
  ) as IPaymentsMade['paymentDate']
  const billId = formData.get('billId') as IPaymentsMade['billId']
  const notes = formData.get('notes') as IPaymentsMade['notes']
  const amountReceived = JSON.parse(
    formData.get('amountReceived') as string
  ) as IPaymentsMade['amountReceived']

  return await updatePaymentMade(request, {
    id: params.id,
    paymentReference,
    paymentMethod,
    paymentDate,
    notes,
    amountReceived,
    billId,
  })
}

export default function PaymentsMadeEditRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { paymentMade, currency, bills } = loaderData as unknown as {
    paymentMade: IPaymentsMade
    permissions: string[]
    currency: ICurrency
    bills: IBill[]
  }

  return (
    <>
      <PaymentsMadeForm
        paymentMade={paymentMade}
        bills={bills}
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
