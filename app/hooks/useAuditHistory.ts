import type { AuditEvent } from '@prisma/client'
import { useCallback, useEffect, useState } from 'react'

interface AuditHistoryOptions {
  productId: string
  limit?: number
  userId?: string
  eventType?: 'create' | 'update' | 'delete'
  startDate?: Date
  endDate?: Date
  enabled?: boolean
}

interface AuditHistoryResult {
  items: AuditEvent[]
  total: number
  nextCursor: string | null
  hasMore: boolean
}

interface UseAuditHistoryReturn {
  events: AuditEvent[]
  total: number
  isLoading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAuditHistory(options: AuditHistoryOptions): UseAuditHistoryReturn {
  const { productId, limit = 20, userId, eventType, startDate, endDate, enabled = true } = options

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const buildUrl = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      if (cursor) params.set('cursor', cursor)
      if (userId) params.set('userId', userId)
      if (eventType) params.set('eventType', eventType)

      // Handle startDate - convert to Date if it's a string
      if (startDate) {
        const startDateObj = startDate instanceof Date ? startDate : new Date(startDate)
        if (!Number.isNaN(startDateObj.getTime())) {
          params.set('startDate', startDateObj.toISOString())
        }
      }

      // Handle endDate - convert to Date if it's a string
      if (endDate) {
        const endDateObj = endDate instanceof Date ? endDate : new Date(endDate)
        if (!Number.isNaN(endDateObj.getTime())) {
          params.set('endDate', endDateObj.toISOString())
        }
      }

      return `/api/audit/products/${productId}?${params.toString()}`
    },
    [productId, limit, userId, eventType, startDate, endDate]
  )

  const fetchData = useCallback(
    async (cursor?: string, append = false) => {
      if (!enabled || !productId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(buildUrl(cursor))

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message || `Failed to fetch audit history: ${response.statusText}`
          )
        }

        const data: AuditHistoryResult = await response.json()

        // Check if response has an error field (even with 200 status)
        if ('error' in data) {
          const errorData = data as { error?: string; message?: string }
          throw new Error(errorData.message || errorData.error || 'Unknown error')
        }

        setEvents((prev) => (append ? [...prev, ...data.items] : data.items))
        setTotal(data.total)
        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        setError(error)
        console.error('[useAuditHistory] Error:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [enabled, productId, buildUrl]
  )

  // Initial fetch and re-fetch when filters change
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [enabled, fetchData, startDate, endDate, eventType, userId])

  // Load more function for pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return
    await fetchData(nextCursor, true)
  }, [hasMore, isLoading, nextCursor, fetchData])

  // Refetch from beginning
  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return {
    events,
    total,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  }
}
