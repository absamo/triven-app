import { type LoaderFunctionArgs, type LoaderFunction } from "react-router"

import { getFilteredBills } from "~/app/services/bills.server"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = JSON.parse(url.searchParams.get("search") as string) as string

  const statuses =
    (JSON.parse(
      url.searchParams.get("statuses") as string
    ) as unknown as string[]) || []

  const purchaseOrders =
    (JSON.parse(
      url.searchParams.get("purchaseOrders") as string
    ) as unknown as string[]) || []

  const bills =
    (JSON.parse(
      url.searchParams.get("bills") as string
    ) as unknown as string[]) || []

  const billDate = JSON.parse(
    url.searchParams.get("date") as string
  ) as Date | null

  const filteredBills = await getFilteredBills(request, {
    search,
    statuses,
    purchaseOrders,
    bills,
    billDate,
  })

  return { bills: filteredBills }
}
