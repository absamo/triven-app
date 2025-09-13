import { type LoaderFunctionArgs, type LoaderFunction } from "react-router"

import { getFilteredPurchaseOrders } from "~/app/services/purchases.server"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = JSON.parse(url.searchParams.get("search") as string) as
    | string
    | null

  const statuses = JSON.parse(
    url.searchParams.get("statuses") as string
  ) as unknown as string[]

  const date = JSON.parse(url.searchParams.get("date") as string) as Date

  const purchaseOrders =
    (JSON.parse(
      url.searchParams.get("purchaseOrders") as string
    ) as unknown as string[]) || []

  const filteredPurchaseOrders = await getFilteredPurchaseOrders(request, {
    search,
    statuses,
    date,
    purchaseOrders,
  })

  return { purchaseOrders: filteredPurchaseOrders }
}
