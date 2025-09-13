import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from "react-router"

import InvoiceForm from "~/app/pages/Invoices/InvoiceForm"
import { Notification } from "~/app/components"
import { getCustomers } from "~/app/services/customers.server"
import { getInvoice, updateInvoice } from "~/app/services/invoices.server"
import { type IInvoice } from "~/app/common/validations/invoiceSchema"
import { getSalesOrdersToInvoice } from "~/app/services/sales.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/invoices.edit"
import type { ICurrency } from "~/app/common/validations/currencySchema"
import type { IAgency } from "~/app/common/validations/agencySchema"
import type { ICustomer } from "~/app/common/validations/customerSchema"
import type { ISalesOrder } from "~/app/common/validations/salesOrderSchema"
import type { ISite } from "~/app/common/validations/siteSchema"

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["update:invoices"])

  const invoice = await getInvoice(params.id)
  const customers = await getCustomers(request)
  const salesOrders = await getSalesOrdersToInvoice(request)

  const baseCurrency = user?.company?.currencies?.find(
    (currency) => currency.base
  )

  return {
    invoice,
    salesOrders,
    customers,
    currency: baseCurrency,
  }
}

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const invoiceReference = formData.get(
    "invoiceReference"
  ) as IInvoice["invoiceReference"]
  const status = JSON.parse(
    formData.get("status") as string
  ) as IInvoice["status"]
  const invoiceDate = JSON.parse(
    formData.get("invoiceDate") as string
  ) as IInvoice["invoiceDate"]
  const dueDate = JSON.parse(
    formData.get("dueDate") as string
  ) as IInvoice["dueDate"]
  const salesOrderId = formData.get("salesOrderId") as IInvoice["salesOrderId"]
  const notes = formData.get("notes") as IInvoice["notes"]

  return await updateInvoice(request, {
    id: params.id,
    invoiceReference,
    status,
    invoiceDate,
    dueDate,
    salesOrderId,
    notes,
  })
}

export default function InvoiceEditRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { invoice, currency, salesOrders } = loaderData as unknown as {
    invoice: IInvoice
    permissions: string[]
    currency: ICurrency
    customers: ICustomer[]
    salesOrders: ISalesOrder[]
  }

  return (
    <>
      <InvoiceForm
        invoice={invoice}
        salesOrders={salesOrders}
        currency={currency}
        errors={
          (actionData as unknown as { errors: Record<string, string> })?.errors
        }
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
