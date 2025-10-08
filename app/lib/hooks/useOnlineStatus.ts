import { useCallback, useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'

interface UseOnlineStatusOptions {
  updateInterval?: number
  enabled?: boolean
}

export function useOnlineStatus({
  updateInterval = 30000, // 30 seconds
  enabled = true,
}: UseOnlineStatusOptions = {}) {
  const fetcher = useFetcher()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isOnlineRef = useRef<boolean>(true)

  const updateOnlineStatus = useCallback(
    (isOnline: boolean) => {
      if (!enabled) return

      fetcher.submit(JSON.stringify({ isOnline }), {
        method: 'POST',
        action: '/api/update-online-status',
        encType: 'application/json',
      })
      isOnlineRef.current = isOnline
    },
    [fetcher, enabled]
  )

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (!isOnlineRef.current) {
      updateOnlineStatus(true)
    }
  }, [updateOnlineStatus])

  useEffect(() => {
    if (!enabled) return

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Set initial online status
    updateOnlineStatus(true)

    // Periodic check for inactivity and status update
    const checkAndUpdate = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      const shouldBeOnline = timeSinceLastActivity < 5 * 60 * 1000 // 5 minutes

      if (shouldBeOnline !== isOnlineRef.current) {
        updateOnlineStatus(shouldBeOnline)
      } else if (shouldBeOnline) {
        // Send heartbeat even if status hasn't changed
        updateOnlineStatus(true)
      }
    }

    intervalRef.current = setInterval(checkAndUpdate, updateInterval)

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = Date.now()
        updateOnlineStatus(true)
      } else {
        updateOnlineStatus(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/update-online-status', JSON.stringify({ isOnline: false }))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Cleanup
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Set offline status on cleanup
      updateOnlineStatus(false)
    }
  }, [enabled, updateInterval, handleActivity, updateOnlineStatus])

  return {
    isTracking: enabled,
  }
}
