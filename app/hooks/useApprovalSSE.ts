// T036: React hook for Server-Sent Events approval updates
import { useEffect, useState } from 'react'
import { useRevalidator } from 'react-router'

interface ApprovalUpdate {
  type: 'approval_status_changed' | 'approval_assigned' | 'approval_commented' | 'connected'
  approvalId?: string
  data?: unknown
}

interface UseApprovalSSEOptions {
  onUpdate?: (update: ApprovalUpdate) => void
  autoRevalidate?: boolean
}

export function useApprovalSSE({ onUpdate, autoRevalidate = true }: UseApprovalSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<ApprovalUpdate | null>(null)
  const revalidator = useRevalidator()

  useEffect(() => {
    const eventSource = new EventSource('/api/approval-stream')

    console.log('[Approval SSE] Connection established')

    eventSource.addEventListener('connected', () => {
      console.log('[Approval SSE] Connected')
      setIsConnected(true)
    })

    eventSource.addEventListener('approval', (event) => {
      try {
        const update = JSON.parse(event.data) as ApprovalUpdate
        console.log('[Approval SSE] Received update:', update)

        setLastUpdate(update)

        // Call custom handler if provided
        if (onUpdate) {
          onUpdate(update)
        }

        // Auto-revalidate to refresh data
        if (autoRevalidate) {
          revalidator.revalidate()
        }
      } catch (error) {
        console.error('[Approval SSE] Failed to parse message:', error)
      }
    })

    eventSource.onerror = (error) => {
      console.error('[Approval SSE] Error:', error)
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      console.log('[Approval SSE] Connection closed')
      eventSource.close()
      setIsConnected(false)
    }
  }, [onUpdate, autoRevalidate, revalidator])

  return {
    isConnected,
    lastUpdate,
  }
}
