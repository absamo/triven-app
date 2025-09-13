import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from "react-router"

import { PAYMENT_METHODS } from "~/app/common/constants"
import { Notification } from "~/app/components"
import { getCustomers } from "~/app/services/customers.server"
import {
  createPaymentReceived,
  getMaxPaymentReceivedNumber,
} from "~/app/services/payments.server"
import { type IPaymentsReceived } from "~/app/common/validations/paymentsReceivedSchema"
import PaymentsReceivedForm from "~/app/pages/PaymentsReceived/PaymentsReceivedForm"
import { getInvoiceToPay } from "~/app/services/invoices.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/paymentsReceived.create"
import type { ICurrency } from "~/app/common/validations/currencySchema"
import type { ICustomer } from "~/app/common/validations/customerSchema"
import type { IInvoice } from "~/app/common/validations/invoiceSchema"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["create:paymentsReceived"])

  const paymentReceivedNumber = await getMaxPaymentReceivedNumber(request)

  let paymentReceivedReference = paymentReceivedNumber

  const paymentReceived = {
    paymentReference: `PR-${paymentReceivedReference}`,
    customerId: "",
    paymentDate: new Date(),
    paymentMethod: PAYMENT_METHODS.BANKTRANSFER,
    amountReceived: 0,
    invoiceId: "",
  }

  const customers = await getCustomers(request)
  const invoices = await getInvoiceToPay(request)

  const baseCurrency = user?.company?.currencies?.find(
    (currency) => currency.base
  )

  return {
    paymentReceived,
    customers,
    currency: baseCurrency,
    invoices,
  }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const paymentReference = formData.get(
    "paymentReference"
  ) as IPaymentsReceived["paymentReference"]
  const paymentMethod = JSON.parse(
    formData.get("paymentMethod") as string
  ) as IPaymentsReceived["paymentMethod"]
  const paymentDate = JSON.parse(
    formData.get("paymentDate") as string
  ) as IPaymentsReceived["paymentDate"]
  const customerId = formData.get(
    "customerId"
  ) as IPaymentsReceived["customerId"]
  const invoiceId = formData.get("invoiceId") as IPaymentsReceived["invoiceId"]
  const notes = formData.get("notes") as IPaymentsReceived["notes"]
  const amountReceived = JSON.parse(
    formData.get("amountReceived") as string
  ) as IPaymentsReceived["amountReceived"]

  return await createPaymentReceived(request, {
    paymentReference,
    paymentMethod,
    paymentDate,
    customerId,
    notes,
    amountReceived,
    invoiceId,
  })
}

export default function PaymentReceivedCreateRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
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
                  status: "Success" | "Warning" | "Error" | null
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
