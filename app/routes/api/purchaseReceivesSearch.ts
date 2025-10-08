import { type LoaderFunctionArgs, type LoaderFunction } from 'react-router'

import { getFilteredPurchaseReceives } from '~/app/services/purchases.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = JSON.parse(url.searchParams.get('search') as string) as string

  const statuses =
    (JSON.parse(url.searchParams.get('statuses') as string) as unknown as string[]) || []

  const purchaseOrders =
    (JSON.parse(url.searchParams.get('purchaseOrders') as string) as unknown as string[]) || []

  const date = JSON.parse(url.searchParams.get('date') as string) as Date | null

  const purchaseReceives = await getFilteredPurchaseReceives(request, {
    search,
    statuses,
    purchaseOrders,
    date,
  })

  return { purchaseReceives }
}
