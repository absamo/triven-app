import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from "react-router"
import { getAgencies } from "~/app/services/agencies.server"
import { Notification } from "~/app/components"
import CustomerForm from "~/app/pages/Customers/CustomerForm"
import {
  getCustomersById,
  updateCustomer,
} from "~/app/services/customers.server"
import { type ICustomer } from "~/app/common/validations/customerSchema"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/customers.edit"
import type { IAgency } from "~/app/common/validations/agencySchema"
import type { ISite } from "~/app/common/validations/siteSchema"

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  const customer = await getCustomersById(params.id)

  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["update:customers"])

  const agencies = (await getAgencies(request)) as IAgency[]
  const sites =
    agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites ||
    []

  return {
    customer,
    agencies,
    sites,
  }
}

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData()

  const firstName = formData.get("firstName") as ICustomer["firstName"]
  const lastName = formData.get("lastName") as ICustomer["lastName"]
  const agencyId = formData.get("agencyId") as ICustomer["agencyId"]
  const siteId = formData.get("siteId") as ICustomer["siteId"]
  const phone = formData.get("phone") as ICustomer["phone"]
  const email = JSON.parse(
    formData.get("email") as string
  ) as ICustomer["email"]
  const companyName = formData.get("companyName") as ICustomer["companyName"]
  const billingAddress = JSON.parse(formData.get("billingAddress") as string)
  const shippingAddress = JSON.parse(formData.get("shippingAddress") as string)
  const useBillingAddressAsShippingAddress = JSON.parse(
    formData.get("useBillingAddressAsShippingAddress") as string
  )

  return await updateCustomer(
    {
      id: params.id,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      agencyId,
      siteId,
      billingAddress,
      shippingAddress,
      useBillingAddressAsShippingAddress,
    },
    request
  )
}

export default function CustomersEditRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { customer, sites, agencies } = loaderData as unknown as {
    customer: ICustomer
    sites: ISite[]
    agencies: IAgency[]
  }

  return (
    <>
      <CustomerForm
        customer={customer}
        sites={sites}
        agencies={agencies}
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
