import { useEffect } from 'react'
import { useFetcher } from 'react-router'

interface UseOnlineStatusOptions {
    updateInterval?: number
    enabled?: boolean
}

/**
 * Simplified online status hook that works with Better Auth sessions
 * Since Better Auth handles session lifecycle, we just need to send periodic heartbeats
 * to ensure the session stays active and the lastOnlineAt is updated
 */
export function useSessionBasedOnlineStatus({
    updateInterval = 60000, // 1 minute (less frequent since sessions handle the heavy lifting)
    enabled = true
}: UseOnlineStatusOptions = {}) {
    const fetcher = useFetcher()

    useEffect(() => {
        if (!enabled) return

        // Send initial heartbeat
        const sendHeartbeat = () => {
            fetcher.submit(
                JSON.stringify({ isOnline: true }),
                {
                    method: 'POST',
                    action: '/api/update-online-status',
                    encType: 'application/json'
                }
            )
        }

        // Send initial heartbeat
        sendHeartbeat()

        // Set up periodic heartbeat to keep session active
        const intervalId = setInterval(sendHeartbeat, updateInterval)

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                sendHeartbeat()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Handle beforeunload to update status
        const handleBeforeUnload = () => {
            // Use sendBeacon for reliable delivery during page unload
            navigator.sendBeacon('/api/update-online-status', JSON.stringify({ isOnline: false }))
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            clearInterval(intervalId)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [enabled, updateInterval])

    return {
        isTracking: enabled
    }
}
