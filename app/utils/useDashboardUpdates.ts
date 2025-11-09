import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

// Singleton EventSource manager for dashboard updates
class DashboardStreamManager {
  private static instance: DashboardStreamManager | null = null
  private eventSource: EventSource | null = null
  private listeners: Set<(event: DashboardUpdateEvent) => void> = new Set()
  private connectionListeners: Set<(connected: boolean) => void> = new Set()
  private connectionCount = 0
  private isConnected = false

  private constructor() {}

  static getInstance(): DashboardStreamManager {
    if (!DashboardStreamManager.instance) {
      DashboardStreamManager.instance = new DashboardStreamManager()
    }
    return DashboardStreamManager.instance
  }

  connect(): void {
    this.connectionCount++

    if (this.eventSource) {
      // Connection already exists, just notify this listener of current state
      this.connectionListeners.forEach((listener) => listener(this.isConnected))
      return
    }

    this.eventSource = new EventSource('/api/dashboard-stream')

    this.eventSource.onopen = () => {
      this.isConnected = true
      this.connectionListeners.forEach((listener) => listener(true))
    }

    this.eventSource.onerror = () => {
      this.isConnected = false
      this.connectionListeners.forEach((listener) => listener(false))
    }

    this.eventSource.addEventListener('dashboard-updates', (event) => {
      try {
        const data = JSON.parse(event.data)
        const updateEvent: DashboardUpdateEvent = data.data
        this.listeners.forEach((listener) => listener(updateEvent))
      } catch (error) {
        console.error('[DashboardStream] Failed to parse update:', error)
      }
    })
  }

  disconnect(): void {
    this.connectionCount--

    // Only close if no more listeners
    if (this.connectionCount <= 0 && this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.connectionCount = 0
      this.isConnected = false
    }
  }

  addUpdateListener(listener: (event: DashboardUpdateEvent) => void): void {
    this.listeners.add(listener)
  }

  removeUpdateListener(listener: (event: DashboardUpdateEvent) => void): void {
    this.listeners.delete(listener)
  }

  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.add(listener)
    // Immediately notify of current state
    listener(this.isConnected)
  }

  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.delete(listener)
  }
}

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
    const manager = DashboardStreamManager.getInstance()

    const handleUpdate = (event: DashboardUpdateEvent) => {
      setLastUpdate(event)
      // Trigger a refetch of dashboard data - use query params to get fresh data
      fetcher.load('/dashboard?refresh=true')
    }

    const handleConnection = (connected: boolean) => {
      setIsConnected(connected)
    }

    // Connect and add listeners
    manager.connect()
    manager.addUpdateListener(handleUpdate)
    manager.addConnectionListener(handleConnection)

    return () => {
      manager.removeUpdateListener(handleUpdate)
      manager.removeConnectionListener(handleConnection)
      manager.disconnect()
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
