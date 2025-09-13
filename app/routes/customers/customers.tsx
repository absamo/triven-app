import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
} from "react-router"
import { useActionData, useLoaderData } from "react-router"
import CustomersPage from "~/app/pages/Customers"
import {
  getCustomers,
  updateCustomerPortalAccess,
} from "~/app/services/customers.server"
import { Notification } from "~/app/components"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/customers"
import type { ICustomer } from "~/app/common/validations/customerSchema"

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["read:customers"])

  const customers = await getCustomers(request)
  return {
    customers,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === "create:customers" ||
        permission === "update:customers" ||
        permission === "delete:customers"
    ),
  }
}

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData()

  const customerId = formData.get("customerId") as string
  const hasPortalAccess = JSON.parse(formData.get("hasPortalAccess") as string)

  return await updateCustomerPortalAccess(request, {
    customerId,
    hasPortalAccess,
  })
}

export default function CustomersRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { customers, permissions } = loaderData as {
    customers: ICustomer[]
    permissions: string[]
  }

  return (
    <>
      <CustomersPage customers={customers} permissions={permissions} />
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
