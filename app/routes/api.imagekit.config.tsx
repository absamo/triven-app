import type { LoaderFunctionArgs } from 'react-router'
import { isImagekitConfigured } from '~/app/lib/imagekit'

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const configured = isImagekitConfigured()
        return new Response(
            JSON.stringify({
                configured,
                environment: {
                    hasPublicKey: !!process.env.IMAGEKIT_PUBLIC_KEY,
                    hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
                    hasUrlEndpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
                    publicKeyPrefix: process.env.IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + '...',
                    privateKeyPrefix: process.env.IMAGEKIT_PRIVATE_KEY?.substring(0, 10) + '...',
                    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
                }
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (error) {
        console.error('ImageKit config check error:', error)
        return new Response(
            JSON.stringify({
                error: 'Configuration check failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}
