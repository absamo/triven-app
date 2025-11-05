import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'

import { getPurchaseOrder } from '~/app/services/purchases.server'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  const purchaseOrder = await getPurchaseOrder(request, params.id)

  return { purchaseOrder }
}
