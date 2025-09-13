import type { LoaderFunctionArgs } from "react-router"
import { getBackorders } from "~/app/services/backorders.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireBetterAuthUser(request, ["read:backorders"])

    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const statusesParam = url.searchParams.get("statuses")
    const backordersParam = url.searchParams.get("backorders")
    const date = url.searchParams.get("date")

    // Parse JSON strings back to arrays
    const statuses = statusesParam ? JSON.parse(statusesParam) : []
    const backorderReferences = backordersParam ? JSON.parse(backordersParam) : []

    const filters = {
        search,
        statuses,
        backorderReferences,
        date: date ? new Date(date) : null,
    }

    const backorders = await getBackorders(request, filters)

    return { backorders }
}
