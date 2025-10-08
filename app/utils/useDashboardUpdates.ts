import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

interface DashboardUpdateEvent {
  action:
    | 'product_created'
    | 'product_updated'
    | 'stock_adjustment_created'
    | 'stock_adjustment_updated'
    | 'bulk_products_imported'
    | 'sales_order_created'
    | 'sales_order_updated'
  product?: {
    id: string
    name: string
    openingStock?: number
    sellingPrice?: number
    status?: string
    agencyId?: string
    siteId?: string
    adjustedQuantity?: number
    newStock?: number
  }
  products?: Array<{
    id: string
    name: string
    adjustedQuantity?: number
    newStock?: number
  }>
  adjustmentId?: string
  productCount?: number
  totalProcessed?: number
  salesOrderReference?: string
  itemCount?: number
  totalAmount?: number
  timestamp: number
  companyId: string
}

export function useDashboardUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<DashboardUpdateEvent | null>(null)
  const fetcher = useFetcher()

  useEffect(() => {
    const eventSource = new EventSource('/api/dashboard-stream')

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onerror = (error) => {
      setIsConnected(false)
    }

    eventSource.addEventListener('connected', (event) => {
      // Dashboard SSE connection confirmed
    })

    eventSource.addEventListener('dashboard-updates', (event) => {
      try {
        const data = JSON.parse(event.data)
        const updateEvent: DashboardUpdateEvent = data.data

        setLastUpdate(updateEvent)

        // Trigger a refetch of dashboard data - use query params to get fresh data
        fetcher.load('/dashboard?refresh=true')
      } catch (error) {
        // Failed to parse dashboard update
      }
    })

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [fetcher])

  const refreshDashboard = () => {
    fetcher.load('/dashboard?refresh=true')
  }

  return {
    isConnected,
    lastUpdate,
    refreshDashboard,
    isRefreshing: fetcher.state === 'loading',
    fetcher, // Return the fetcher instance so Dashboard can use it
  }
}
