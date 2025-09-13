import { type LoaderFunction, type LoaderFunctionArgs } from "react-router"
import { useLoaderData } from "react-router"

import Suppliers from "~/app/pages/Suppliers"
import { getSuppliers } from "~/app/services/suppliers.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import type { Route } from "./+types/suppliers"
import type { ISupplier } from "~/app/common/validations/supplierSchema"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ["read:suppliers"])

  const suppliers = await getSuppliers(request)
  return {
    suppliers,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === "create:suppliers" ||
        permission === "update:suppliers" ||
        permission === "delete:suppliers"
    ),
  }
}

export default function SuppliersRoute({ loaderData }: Route.ComponentProps) {
  const { suppliers, permissions } = loaderData as unknown as {
    suppliers: ISupplier[]
    permissions: string[]
  }

  return <Suppliers suppliers={suppliers} permissions={permissions} />
}
