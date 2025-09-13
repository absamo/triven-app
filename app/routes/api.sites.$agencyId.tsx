import type { LoaderFunction, LoaderFunctionArgs } from "react-router"
import { getSitesByAgency } from "~/app/services/sites.server"

export const loader: LoaderFunction = async ({
    params,
    request,
}: LoaderFunctionArgs) => {
    const { agencyId } = params

    if (!agencyId) {
        return { sites: [] }
    }

    const sites = await getSitesByAgency(request, agencyId)

    return { sites }
}
