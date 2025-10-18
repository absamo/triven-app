import { data, type LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { calculateHealthScore } from '~/app/services/inventory/health-score.server'
import { generateRevenueOpportunities } from '~/app/services/inventory/revenue-opportunities.server'
import { generateSmartAlerts } from '~/app/services/inventory/smart-alerts.server'

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request, ['read:analytics'])

    if (!user.companyId) {
      throw new Error('User company not found')
    }

    // Get query parameters
    const url = new URL(request.url)
    const agencyId = url.searchParams.get('agencyId') || undefined
    const siteId = url.searchParams.get('siteId') || undefined
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Parse date range if provided
    const dateRange =
      startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : undefined

    // Calculate health score
    const healthScore = await calculateHealthScore({
      companyId: user.companyId,
      agencyId,
      siteId,
      dateRange,
    })

    // Generate smart alerts
    const alerts = await generateSmartAlerts({
      companyId: user.companyId,
      agencyId,
      siteId,
      dateRange,
    })

    // Generate revenue opportunities
    const opportunities = await generateRevenueOpportunities({
      companyId: user.companyId,
      agencyId,
      siteId,
      dateRange,
    })

    // Calculate quick metrics
    // Use date range from filters or query all data from beginning
    const hasDateFilter = dateRange?.startDate && dateRange?.endDate

    const startDateForMetrics = dateRange?.startDate
    const endDateForMetrics = dateRange?.endDate || new Date()

    // Build date filter - only if dates are provided
    const dateFilter = hasDateFilter
      ? {
          orderDate: {
            gte: startDateForMetrics,
            lte: endDateForMetrics,
          },
        }
      : {} // No date filter = all time

    // Get sales orders for metrics calculation
    const recentOrders = await prisma.salesOrder.findMany({
      where: {
        companyId: user.companyId,
        ...(agencyId && { agencyId }),
        ...(siteId && { siteId }),
        ...dateFilter,
      },
      include: {
        salesOrderItems: {
          select: {
            quantity: true,
            amount: true,
          },
        },
      },
      orderBy: {
        orderDate: 'asc',
      },
    })

    // Calculate velocity data (units sold per day)
    const velocityByDate = new Map<string, number>()
    recentOrders.forEach((order) => {
      const dateKey = order.orderDate.toISOString().split('T')[0]
      const totalQuantity = order.salesOrderItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      )
      velocityByDate.set(dateKey, (velocityByDate.get(dateKey) || 0) + totalQuantity)
    })

    const velocityData = Array.from(velocityByDate.entries())
      .slice(-7)
      .map(([date, value]) => ({ date, value }))

    // Get backorder count (simplified - count all items)
    const backorderCount = await prisma.salesOrderItem.count({
      where: {
        salesOrder: {
          companyId: user.companyId,
          ...(agencyId && { agencyId }),
          ...(siteId && { siteId }),
          status: 'Pending',
        },
      },
    })

    // Get low stock count and calculate Capital Tied Up
    const products = await prisma.product.findMany({
      where: {
        companyId: user.companyId,
        ...(agencyId && { agencyId }),
        ...(siteId && { siteId }),
        active: true,
      },
      select: {
        id: true,
        physicalStockOnHand: true,
        availableQuantity: true,
        reorderPoint: true,
        costPrice: true,
        status: true,
      },
    })

    const lowStockCount = products.filter(
      (p) => (p.physicalStockOnHand || 0) <= (p.reorderPoint || 0)
    ).length

    // Calculate Capital Tied Up (total inventory value at cost)
    const capitalTiedUp = products.reduce(
      (sum, p) => sum + (p.availableQuantity || 0) * p.costPrice,
      0
    )

    // Calculate Revenue at Risk (out of stock/low stock items)
    const revenueAtRisk = products
      .filter(
        (p) => p.status === 'OutOfStock' || p.status === 'LowStock' || p.status === 'Critical'
      )
      .reduce((sum, p) => sum + (p.reorderPoint || 0) * p.costPrice * 1.5, 0) // Estimate with margin

    // Calculate Dead Stock value (items with zero movement in 90+ days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const recentSalesItems = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: {
        salesOrder: {
          companyId: user.companyId,
          ...(agencyId && { agencyId }),
          ...(siteId && { siteId }),
          orderDate: { gte: ninetyDaysAgo },
        },
      },
      _sum: {
        quantity: true,
      },
    })

    const productsWithSales = new Set(recentSalesItems.map((item) => item.productId))
    const deadStockProducts = products.filter((p) => !productsWithSales.has(p.id))
    const deadStockValue = deadStockProducts.reduce(
      (sum, p) => sum + (p.availableQuantity || 0) * p.costPrice,
      0
    )

    // Calculate actual Turnover Rate (times per year)
    // Turnover Rate = Cost of Goods Sold / Average Inventory Value
    const totalSalesValue = recentOrders.reduce((sum, order) => {
      return (
        sum +
        (order.salesOrderItems?.reduce((itemSum, item) => itemSum + (item.amount || 0), 0) || 0)
      )
    }, 0)

    const averageInventoryValue =
      products.reduce((sum, p) => sum + (p.availableQuantity || 0) * p.costPrice, 0) || 1

    // Calculate days in the period for proper annualization
    let daysInPeriod: number
    if (hasDateFilter && startDateForMetrics && endDateForMetrics) {
      // Use actual date range
      daysInPeriod =
        Math.ceil(
          (endDateForMetrics.getTime() - startDateForMetrics.getTime()) / (1000 * 60 * 60 * 24)
        ) || 1
    } else if (recentOrders.length > 0) {
      // No filter: calculate from first to last order
      const firstOrderDate = new Date(recentOrders[0].orderDate)
      const lastOrderDate = new Date(recentOrders[recentOrders.length - 1].orderDate)
      daysInPeriod =
        Math.ceil((lastOrderDate.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)) ||
        365 // Default to 1 year if same day
    } else {
      // No orders at all
      daysInPeriod = 365
    }

    // Calculate turnover for the period and annualize
    const periodTurnover = totalSalesValue / averageInventoryValue
    const annualTurnoverRate = daysInPeriod > 0 ? (periodTurnover * 365) / daysInPeriod : 0

    const metrics = {
      capitalTiedUp: {
        value: capitalTiedUp,
        change: 0, // TODO: Calculate historical comparison
        previousValue: capitalTiedUp,
        sparkline: [],
      },
      revenueAtRisk: {
        value: revenueAtRisk,
        change: 0,
        previousValue: revenueAtRisk,
        sparkline: [],
      },
      turnoverRate: {
        value: Number(annualTurnoverRate.toFixed(2)),
        change: 0,
        previousValue: Number(annualTurnoverRate.toFixed(2)),
        sparkline: [],
      },
      deadStock: {
        value: deadStockValue,
        items: deadStockProducts.length,
        change: 0,
        previousValue: deadStockValue,
        sparkline: [],
      },
      velocity: {
        value: velocityData[velocityData.length - 1]?.value || 0,
        trend:
          velocityData.length > 1
            ? (((velocityData[velocityData.length - 1]?.value || 0) -
                (velocityData[0]?.value || 1)) /
                (velocityData[0]?.value || 1)) *
              100
            : 0,
        data: velocityData,
      },
      backorders: {
        count: backorderCount,
        value: 0,
        trend: 0,
        data: [],
      },
      accuracy: {
        percentage: Math.round(healthScore.breakdown.stockLevelAdequacy),
        discrepancies: 0,
        trend: 0,
        data: [],
      },
      lowStock: {
        count: lowStockCount,
        criticalCount: alerts.filter((a) => a.severity === 'Critical').length,
        trend: 0,
        data: [],
      },
    }

    return data({
      healthScore: {
        overall: healthScore.current,
        breakdown: healthScore.breakdown,
      },
      alerts,
      opportunities,
      metrics,
    })
  } catch (error) {
    console.error('Error fetching command center data:', error)
    throw error
  }
}
