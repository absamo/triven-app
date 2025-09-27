import type { ActionFunctionArgs } from "react-router"
import { getBetterAuthUser } from "~/app/services/better-auth.server"

/**
 * API endpoint to refresh user session data
 * This is particularly useful after subscription changes to update cached user data
 */
export async function action({ request }: ActionFunctionArgs) {
    try {
        // Get fresh user data from database
        const user = await getBetterAuthUser(request)

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            })
        }

        // Return fresh user data including subscription info
        return new Response(JSON.stringify({
            user: {
                id: user.id,
                email: user.email,
                currentPlan: user.subscriptions?.[0]?.planId || "Standard",
                planStatus: user.subscriptions?.[0]?.status || "trialing",
                trialPeriodDays: user.subscriptions?.[0]?.trialEnd
                    ? Math.max(0, Math.floor((user.subscriptions[0].trialEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0,
                subscriptions: user.subscriptions
            },
            success: true
        }), {
            headers: { "Content-Type": "application/json" }
        })
    } catch (error) {
        console.error('Session refresh error:', error)
        return new Response(JSON.stringify({
            error: "Failed to refresh session",
            success: false
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
}

// Only allow POST requests
export async function loader() {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
    })
}