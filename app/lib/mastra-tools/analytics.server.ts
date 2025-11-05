/**
 * Analytics Infrastructure
 *
 * Provides business intelligence calculations for inventory management
 * Based on plan.md Section 4: Analytics & Recommendations
 */

import { prisma } from '../../db.server'

/**
 * Calculate sales velocity for a product
 * Returns average units sold per day over the specified period
 *
 * @param productId - The product to analyze
 * @param days - Number of days to analyze (default: 30)
 * @returns Average units sold per day, or 0 if no sales data
 */
export async function calculateSalesVelocity(
  productId: string,
  days: number = 30
): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all sales order items for this product within the time period
    const salesData = await prisma.salesOrderItem.findMany({
      where: {
        productId,
        salesOrder: {
          orderDate: {
            gte: startDate,
          },
          status: {
            in: ['Issued', 'Shipped', 'PartiallyShipped', 'Delivered', 'PartiallyDelivered'],
          },
        },
      },
      select: {
        quantity: true,
      },
    })

    if (salesData.length === 0) {
      return 0
    }

    // Calculate total units sold
    const totalUnitsSold = salesData.reduce((sum, item) => sum + item.quantity, 0)

    // Calculate velocity (units per day)
    const velocity = totalUnitsSold / days

    return Math.round(velocity * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error('[Analytics] Failed to calculate sales velocity:', error)
    return 0
  }
}

/**
 * Calculate reorder point for a product
 * Based on lead time and sales velocity with safety stock buffer
 *
 * Formula: Reorder Point = (Lead Time × Sales Velocity) + Safety Stock
 *
 * @param productId - The product to analyze
 * @param leadTimeDays - Supplier lead time in days
 * @param safetyStockDays - Additional buffer in days (default: 7)
 * @returns Recommended reorder point quantity
 */
export async function calculateReorderPoint(
  productId: string,
  leadTimeDays: number,
  safetyStockDays: number = 7
): Promise<number> {
  try {
    // Calculate sales velocity over the past 90 days for more accurate trend
    const velocity = await calculateSalesVelocity(productId, 90)

    if (velocity === 0) {
      // No sales history - use a conservative default
      return leadTimeDays * 2 // Assume 2 units per day default
    }

    // Calculate reorder point with safety stock
    const totalLeadTime = leadTimeDays + safetyStockDays
    const reorderPoint = Math.ceil(velocity * totalLeadTime)

    return reorderPoint
  } catch (error) {
    console.error('[Analytics] Failed to calculate reorder point:', error)
    return 0
  }
}

/**
 * Calculate economic order quantity (EOQ)
 * Optimal order quantity that minimizes total inventory costs
 *
 * Formula: EOQ = √((2 × Annual Demand × Order Cost) / Holding Cost)
 *
 * @param productId - The product to analyze
 * @param orderCost - Fixed cost per order (default: 50)
 * @param holdingCostPercent - Annual holding cost as % of unit cost (default: 0.25 = 25%)
 * @returns Recommended order quantity
 */
export async function calculateEOQ(
  productId: string,
  orderCost: number = 50,
  holdingCostPercent: number = 0.25
): Promise<number> {
  try {
    // Get product cost
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { costPrice: true },
    })

    if (!product || product.costPrice <= 0) {
      return 0
    }

    // Calculate annual demand based on 365-day sales velocity
    const dailyVelocity = await calculateSalesVelocity(productId, 365)
    const annualDemand = dailyVelocity * 365

    if (annualDemand === 0) {
      return 0
    }

    // Calculate holding cost per unit per year
    const holdingCost = product.costPrice * holdingCostPercent

    if (holdingCost === 0) {
      return 0
    }

    // EOQ formula
    const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost)

    return Math.ceil(eoq)
  } catch (error) {
    console.error('[Analytics] Failed to calculate EOQ:', error)
    return 0
  }
}

/**
 * Get low stock products based on reorder point
 * Returns products where current stock is below recommended reorder point
 *
 * @param companyId - Company to analyze
 * @param limit - Maximum number of products to return (default: 20)
 * @returns Array of products with low stock details
 */
export async function getLowStockProducts(
  companyId: string,
  limit: number = 20
): Promise<
  Array<{
    id: string
    name: string
    sku: string
    currentStock: number
    reorderPoint: number
    salesVelocity: number
    daysUntilStockout: number
  }>
> {
  try {
    // Get all active products for the company
    const products = await prisma.product.findMany({
      where: {
        companyId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        availableQuantity: true,
        reorderPoint: true,
        safetyStockLevel: true,
      },
      take: 100, // Limit initial query for performance
    })

    const lowStockProducts: Array<{
      id: string
      name: string
      sku: string
      currentStock: number
      reorderPoint: number
      salesVelocity: number
      daysUntilStockout: number
    }> = []

    // Analyze each product
    for (const product of products) {
      const velocity = await calculateSalesVelocity(product.id, 30)

      // Calculate reorder point if not set in product
      let reorderPoint = product.reorderPoint || 0
      if (reorderPoint === 0) {
        // Use default lead time of 14 days if not available
        reorderPoint = await calculateReorderPoint(product.id, 14)
      }

      // Check if stock is below reorder point
      if (product.availableQuantity <= reorderPoint) {
        // Calculate days until stockout
        const daysUntilStockout =
          velocity > 0 ? Math.floor(product.availableQuantity / velocity) : 999

        lowStockProducts.push({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          currentStock: product.availableQuantity,
          reorderPoint,
          salesVelocity: velocity,
          daysUntilStockout,
        })
      }
    }

    // Sort by urgency (days until stockout, ascending)
    lowStockProducts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)

    return lowStockProducts.slice(0, limit)
  } catch (error) {
    console.error('[Analytics] Failed to get low stock products:', error)
    return []
  }
}

/**
 * Get top selling products for a company
 * Returns products with highest sales velocity
 *
 * @param companyId - Company to analyze
 * @param days - Number of days to analyze (default: 30)
 * @param limit - Maximum number of products to return (default: 10)
 * @returns Array of top selling products with metrics
 */
export async function getTopSellingProducts(
  companyId: string,
  days: number = 30,
  limit: number = 10
): Promise<
  Array<{
    id: string
    name: string
    sku: string
    salesVelocity: number
    totalSold: number
    revenue: number
  }>
> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get sales data grouped by product
    const salesData = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: {
        salesOrder: {
          companyId,
          orderDate: {
            gte: startDate,
          },
          status: {
            in: ['Issued', 'Shipped', 'PartiallyShipped', 'Delivered', 'PartiallyDelivered'],
          },
        },
      },
      _sum: {
        quantity: true,
        amount: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    })

    // Get product details
    const topProducts = await Promise.all(
      salesData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true },
        })

        if (!product) {
          return null
        }

        const totalSold = item._sum?.quantity || 0
        const revenue = item._sum?.amount || 0
        const salesVelocity = totalSold / days

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          salesVelocity: Math.round(salesVelocity * 100) / 100,
          totalSold,
          revenue,
        }
      })
    )

    return topProducts.filter((p) => p !== null) as Array<{
      id: string
      name: string
      sku: string
      salesVelocity: number
      totalSold: number
      revenue: number
    }>
  } catch (error) {
    console.error('[Analytics] Failed to get top selling products:', error)
    return []
  }
}

/**
 * Calculate inventory turnover ratio
 * Measures how many times inventory is sold and replaced over a period
 *
 * Formula: Inventory Turnover = Cost of Goods Sold / Average Inventory Value
 *
 * @param companyId - Company to analyze
 * @param days - Number of days to analyze (default: 365)
 * @returns Inventory turnover ratio
 */
export async function calculateInventoryTurnover(
  companyId: string,
  days: number = 365
): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Calculate COGS (Cost of Goods Sold) from completed sales orders
    const salesData = await prisma.salesOrderItem.aggregate({
      where: {
        salesOrder: {
          companyId,
          orderDate: {
            gte: startDate,
          },
          status: {
            in: ['Shipped', 'Delivered'],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    })

    // Get average inventory value
    const products = await prisma.product.findMany({
      where: { companyId, active: true },
      select: { availableQuantity: true, costPrice: true },
    })

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.availableQuantity * p.costPrice,
      0
    )

    // Calculate average cost per unit sold
    const totalQuantitySold = salesData._sum.quantity || 0
    if (totalQuantitySold === 0 || totalInventoryValue === 0) {
      return 0
    }

    // Estimate COGS (this is simplified - in reality you'd track actual COGS)
    const totalQuantity = products.reduce((sum, p) => sum + p.availableQuantity, 0)
    const avgCost = totalQuantity > 0 ? totalInventoryValue / totalQuantity : 0
    const cogs = totalQuantitySold * avgCost

    // Calculate turnover ratio
    const turnover = cogs / totalInventoryValue

    return Math.round(turnover * 100) / 100
  } catch (error) {
    console.error('[Analytics] Failed to calculate inventory turnover:', error)
    return 0
  }
}
