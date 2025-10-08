import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from 'react-router'

import { PAYMENT_METHODS } from '~/app/common/constants'
import { Notification } from '~/app/components'
import { createPaymentMade, getMaxPaymentMadeNumber } from '~/app/services/payments.server'
import { type IPaymentsMade } from '~/app/common/validations/paymentsMadeSchema'
import PaymentsMadeForm from '~/app/pages/PaymentsMade/PaymentsMadeForm'
import { getBillsToPay } from '~/app/services/bills.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { Route } from './+types/paymentsMade.create'
import type { IBill } from '~/app/common/validations/billSchema'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['create:paymentsMade'])

  let paymentMadeReference = await getMaxPaymentMadeNumber(request)

  const paymentMade = {
    paymentReference: `PM-${paymentMadeReference}`,
    paymentDate: new Date(),
    paymentMethod: PAYMENT_METHODS.BANKTRANSFER,
    amountReceived: '',
    billId: '',
  }

  const bills = await getBillsToPay(request)
  const currency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    paymentMade,
    currency,
    bills,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
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

  return await createPaymentMade(request, {
    paymentReference,
    paymentMethod,
    paymentDate,
    notes,
    amountReceived,
    billId,
  })
}

export default function PaymentsMadeCreateRoute({ loaderData, actionData }: Route.ComponentProps) {
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
        errors={(actionData as { errors: Record<string, string> })?.errors}
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
