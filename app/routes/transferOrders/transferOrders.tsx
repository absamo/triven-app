import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'
import type { ITransferOrder } from '~/app/common/validations/transferOrderSchema'
import TransferOrders from '~/app/pages/TransferOrders'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getTransferOrders } from '~/app/services/transferOrders'
import type { Route } from './+types/transferOrders'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:transferOrders'])

  const transferOrders = await getTransferOrders(request)
  return {
    transferOrders,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:transferOrders' ||
        permission === 'update:transferOrders' ||
        permission === 'delete:transferOrders'
    ),
  }
}

export default function TransferOrdersRoute({ loaderData }: Route.ComponentProps) {
  const { transferOrders, permissions } = loaderData as unknown as {
    transferOrders: ITransferOrder[]
    permissions: string[]
  }

  return <TransferOrders transferOrders={transferOrders} permissions={permissions} />
}
