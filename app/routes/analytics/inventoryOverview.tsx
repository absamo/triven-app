import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'
import { InventoryOverview } from '~/app/pages/Analytics'
import { getInventoryAnalytics } from '~/app/services/analytics.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/inventoryOverview'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:analytics'])

  const analyticsData = (await getInventoryAnalytics(request)) || {
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  }

  return {
    analyticsData,
    permissions: user?.role.permissions.filter((permission) => permission === 'read:analytics'),
  }
}

export default function InventoryOverviewRoute({ loaderData }: Route.ComponentProps) {
  const { analyticsData, permissions } = loaderData as unknown as {
    analyticsData: {
      totalProducts: number
      totalValue: number
      lowStockItems: number
      outOfStockItems: number
      products: Array<{
        id: string
        name: string
        sku: string
        categoryName: string
        qtyOrdered: number
        qtyIn: number
        qtyOut: number
        stockOnHand: number
        committedStock: number
        availableForSale: number
        costPrice: number
        sellingPrice: number
        reorderPoint: number
      }>
    }
    permissions: string[]
  }

  return <InventoryOverview analyticsData={analyticsData} permissions={permissions} />
}
