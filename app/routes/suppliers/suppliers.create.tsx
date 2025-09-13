import {
  type LoaderFunctionArgs,
  type LoaderFunction,
  type ActionFunction,
  type ActionFunctionArgs,
} from "react-router"

import type { ISupplier } from "~/app/common/validations/supplierSchema"
import SupplierForm from "~/app/pages/Suppliers/SupplierForm"
import { createSupplier } from "~/app/services/suppliers.server"
import { Notification } from "~/app/components"
import { type ICurrency } from "~/app/common/validations/currencySchema"
import { getCurrenciesByCompany } from "~/app/services/settings.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/suppliers.create"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ["create:suppliers"])

  const supplier: ISupplier = {
    name: "",
    email: "",
    phone: "",
    companyName: "",
    currency: { currencyCode: "" },
    location: {
      address: "",
      city: "",
      country: "",
      postalCode: "",
    },
  }

  const defaultCurrencies: ICurrency[] =
    ((await getCurrenciesByCompany(request)) as ICurrency[]) || []

  return { supplier, defaultCurrencies }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get("name") as ISupplier["name"]
  const companyName = formData.get("companyName") as ISupplier["companyName"]
  const email = formData.get("email") as ISupplier["email"]
  const phone = formData.get("phone") as ISupplier["phone"]
  const currency = JSON.parse(
    formData.get("currency") as string
  ) as ISupplier["currency"]

  const location = JSON.parse(
    formData.get("location") as string
  ) as ISupplier["location"]

  return await createSupplier(request, {
    name,
    email,
    phone,
    companyName,
    currency,
    location,
  })
}

export default function CreateSuppliersRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { supplier, defaultCurrencies } = loaderData as {
    supplier: ISupplier
    defaultCurrencies: ICurrency[]
  }

  return (
    <>
      <SupplierForm
        supplier={supplier}
        defaultCurrencies={defaultCurrencies}
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
