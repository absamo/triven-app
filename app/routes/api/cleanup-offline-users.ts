import { data } from "react-router"
import { syncOnlineStatusWithSessions } from "~/app/services/session-based-online-status.server"

export async function action({ request }: { request: Request }) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 })
    }

    // Optional: Add authentication for cron jobs or API key validation
    const authHeader = request.headers.get('Authorization')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return data({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await syncOnlineStatusWithSessions()

        return data({
            success: true,
            message: `Synced online status: ${result.onlineCount} users marked online, ${result.offlineCount} users marked offline`,
            ...result
        })
    } catch (error) {
        console.error('Error in cleanup cron job:', error)
        return data({ error: 'Internal server error' }, { status: 500 })
    }
}