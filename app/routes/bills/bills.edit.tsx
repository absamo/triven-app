import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from "react-router"

import BillForm from "~/app/pages/Bills/BillForm"
import { Notification } from "~/app/components"
import { getSuppliers } from "~/app/services/suppliers.server"
import { getBill, updateBill } from "~/app/services/bills.server"
import { type IBill } from "~/app/common/validations/billSchema"
import { getPurchaseOrders } from "~/app/services/purchases.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/bills.edit"
import type { ICurrency } from "~/app/common/validations/currencySchema"
import type { IPurchaseOrder } from "~/app/common/validations/purchaseOrderSchema"

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["update:bills"])

  const bill = await getBill(params.id)
  const suppliers = await getSuppliers(request)
  const purchaseOrders = await getPurchaseOrders(request)
  const currency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    bill,
    purchaseOrders,
    suppliers,
    currency,
  }
}

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const billReference = formData.get("billReference") as IBill["billReference"]
  const status = JSON.parse(formData.get("status") as string) as IBill["status"]
  const billDate = JSON.parse(
    formData.get("billDate") as string
  ) as IBill["billDate"]
  const dueDate = JSON.parse(
    formData.get("dueDate") as string
  ) as IBill["dueDate"]
  const purchaseOrderId = formData.get(
    "purchaseOrderId"
  ) as IBill["purchaseOrderId"]
  const notes = formData.get("notes") as IBill["notes"]

  return await updateBill(request, {
    id: params.id,
    billReference,
    status,
    billDate,
    dueDate,
    purchaseOrderId,
    notes,
  })
}

export default function BillsEditRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { bill, currency, purchaseOrders } = loaderData as unknown as {
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
        errors={
          (actionData as unknown as { errors: Record<string, string> })?.errors
        }
      />
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
    </>
  )
}
