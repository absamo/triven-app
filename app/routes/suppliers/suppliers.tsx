import { type LoaderFunction, type LoaderFunctionArgs, useLoaderData } from 'react-router'
import type { ISupplier } from '~/app/common/validations/supplierSchema'
import Suppliers from '~/app/pages/Suppliers'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getSuppliers } from '~/app/services/suppliers.server'
import type { Route } from './+types/suppliers'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:suppliers'])

  const suppliers = await getSuppliers(request)
  return {
    suppliers,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:suppliers' ||
        permission === 'update:suppliers' ||
        permission === 'delete:suppliers'
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
