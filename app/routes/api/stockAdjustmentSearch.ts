import { type LoaderFunction, type LoaderFunctionArgs } from "react-router"
import { getFilteredStockAdjustments } from "~/app/services/stockAdjustment.server"

export const loader: LoaderFunction = async ({
    request,
}: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const search = url.searchParams.get("search")
        ? JSON.parse(url.searchParams.get("search") as string) as string | null
        : null

    const reasons = url.searchParams.get("reasons")
        ? JSON.parse(url.searchParams.get("reasons") as string) as string[] | null
        : null

    const sites = url.searchParams.get("sites")
        ? JSON.parse(url.searchParams.get("sites") as string) as string[] | null
        : null

    const dateFrom = url.searchParams.get("dateFrom")
        ? JSON.parse(url.searchParams.get("dateFrom") as string) as string | null
        : null

    const dateTo = url.searchParams.get("dateTo")
        ? JSON.parse(url.searchParams.get("dateTo") as string) as string | null
        : null

    const filteredStockAdjustments = await getFilteredStockAdjustments(request, {
        search,
        reasons,
        sites,
        dateFrom,
        dateTo,
    })

    return { stockAdjustments: filteredStockAdjustments }
}
