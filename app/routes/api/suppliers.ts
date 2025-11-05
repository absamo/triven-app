import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'

import { getPurchaseOrdersBySupplier } from '~/app/services/suppliers.server'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  const purchaseOrders = await getPurchaseOrdersBySupplier(request, params.id)
  return { purchaseOrders }
}
