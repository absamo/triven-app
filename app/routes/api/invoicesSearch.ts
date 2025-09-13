import { type LoaderFunctionArgs, type LoaderFunction } from "react-router"

import { getFilteredInvoices } from "~/app/services/invoices.server"

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = JSON.parse(url.searchParams.get("search") as string) as string

  const statuses =
    (JSON.parse(
      url.searchParams.get("statuses") as string
    ) as unknown as string[]) || []

  const salesOrders =
    (JSON.parse(
      url.searchParams.get("salesOrders") as string
    ) as unknown as string[]) || []

  const invoices =
    (JSON.parse(
      url.searchParams.get("invoices") as string
    ) as unknown as string[]) || []

  const invoiceDate = JSON.parse(
    url.searchParams.get("date") as string
  ) as Date | null

  const filteredInvoices = await getFilteredInvoices(request, {
    search,
    statuses,
    salesOrders,
    invoices,
    invoiceDate,
  })

  return { invoices: filteredInvoices }
}
