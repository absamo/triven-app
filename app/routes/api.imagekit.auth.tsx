import type { LoaderFunctionArgs } from 'react-router'
import { getImagekitAuthParams } from '~/app/lib/imagekit'

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const authParams = getImagekitAuthParams()

        return new Response(
            JSON.stringify(authParams),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (error) {
        console.error('ImageKit auth error:', error)
        return new Response(
            JSON.stringify({ error: 'Authentication failed' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}
