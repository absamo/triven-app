import type { LoaderFunction } from "react-router"
import InactiveUser from "~/app/pages/InactiveUser"

export { InactiveUser as default }

export const loader: LoaderFunction = async ({ request }) => {
    // This page doesn't require authentication since the user is inactive
    // Just return empty data
    return {}
}
