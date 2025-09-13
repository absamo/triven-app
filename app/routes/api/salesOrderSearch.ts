import type { ComboboxItem } from "@mantine/core"
import { type LoaderFunctionArgs, type LoaderFunction } from "react-router"

import { getFilteredSalesOrders } from "~/app/services/sales.server"

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

  const salesOrders =
    (JSON.parse(
      url.searchParams.get("salesOrders") as string
    ) as unknown as string[]) || []

  const filteredSalesOrders = await getFilteredSalesOrders(request, {
    search,
    statuses,
    date,
    salesOrders,
  })

  return { salesOrders: filteredSalesOrders }
}
