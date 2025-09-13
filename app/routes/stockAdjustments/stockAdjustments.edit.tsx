import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunction,
  type ActionFunctionArgs,
} from "react-router"

import {
  updateAdjustment,
  getStockAdjustment,
} from "~/app/services/stockAdjustment.server"
import { getSites } from "~/app/services/sites.server"
import { type IStockAdjustment } from "~/app/common/validations/stockAdjustmentsSchema"
import StockAdjustmentForm from "~/app/pages/StockAdjustments/StockAdjustmentForm"
import { getProducts } from "~/app/services/products.server"
import { Notification } from "~/app/components"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/stockAdjustments.edit"
import type { IProduct } from "~/app/common/validations/productSchema"
import type { ISite } from "~/app/common/validations/siteSchema"

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  await requireBetterAuthUser(request, ["update:stockAdjustments"])

  const adjustment = await getStockAdjustment(params.id)
  const sites = await getSites(request)
  const products = await getProducts(request)

  return { adjustment, sites, products }
}

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const reason = formData.get("reason") as IStockAdjustment["reason"]
  const siteId = formData.get("siteId") as IStockAdjustment["siteId"]
  const reference = formData.get("reference") as IStockAdjustment["reference"]
  const notes = formData.get("notes") as IStockAdjustment["notes"]
  const date = JSON.parse(
    formData.get("date") as string
  ) as IStockAdjustment["date"]

  const products = JSON.parse(
    formData.get("products") as string
  ) as IStockAdjustment["products"]

  return await updateAdjustment(request, {
    id: params.id,
    reason,
    siteId,
    reference,
    notes,
    date,
    products,
  })
}

export default function EditAdjustmentsRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { adjustment, sites, products } = loaderData as unknown as {
    adjustment: IStockAdjustment
    sites: ISite[]
    products: IProduct[]
  }

  return (
    <>
      <StockAdjustmentForm
        adjustment={adjustment}
        sites={sites}
        products={products}
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
