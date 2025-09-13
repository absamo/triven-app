import type { LoaderFunctionArgs } from "react-router"
import { getImagekitAuthParams } from "~/app/lib/imagekit"

/**
 * API endpoint to get ImageKit authentication parameters for client-side uploads
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const authParams = getImagekitAuthParams()
        return Response.json(authParams)
    } catch (error) {
        console.error('Error getting ImageKit auth params:', error)
        return Response.json(
            { error: 'Failed to get authentication parameters' },
            { status: 500 }
        )
    }
}
