import { useEffect } from 'react'
import { useRevalidator } from 'react-router'

interface UseAutoRevalidateOptions {
  interval?: number
  enabled?: boolean
}

export function useAutoRevalidate({
  interval = 30000, // 30 seconds by default
  enabled = true,
}: UseAutoRevalidateOptions = {}) {
  const revalidator = useRevalidator()

  useEffect(() => {
    if (!enabled) return

    const intervalId = setInterval(() => {
      revalidator.revalidate()
    }, interval)

    return () => {
      clearInterval(intervalId)
    }
  }, [revalidator, interval, enabled])

  return {
    revalidate: revalidator.revalidate,
    isRevalidating: revalidator.state === 'loading',
  }
}
