import { prisma } from '~/app/db.server'

interface RevenueOpportunity {
  id: string
  type: string
  title: string
  estimatedRevenue: number
  confidence: number
  products: Array<{
    id: string
    name: string
    currentStock: number
    suggestedStock: number
    unitPrice: number
  }>
  action: {
    label: string
    endpoint: string
    method: string
  }
  reasoning: string
  expiresAt?: Date
  createdAt: Date
}

interface GenerateOpportunitiesParams {
  companyId: string
  agencyId?: string
  siteId?: string
  dateRange?: {
    startDate: Date
    endDate: Date
  }
}

export async function generateRevenueOpportunities({
  companyId,
  agencyId,
  siteId,
  dateRange,
}: GenerateOpportunitiesParams): Promise<RevenueOpportunity[]> {
  const opportunities: RevenueOpportunity[] = []

  try {
    // 1. High-Demand Out-of-Stock Opportunities
    const stockoutOpps = await findStockoutOpportunities({ companyId, agencyId, siteId, dateRange })
    opportunities.push(...stockoutOpps)

    // 2. Fast-Moving Inventory Opportunities
    const fastMovingOpps = await findFastMovingOpportunities({ companyId, agencyId, siteId, dateRange })
    opportunities.push(...fastMovingOpps)

    // 3. Low Stock Opportunities (simpler, inventory-based)
    const lowStockOpps = await findLowStockOpportunities({ companyId, agencyId, siteId })
    opportunities.push(...lowStockOpps)

    // Sort by estimated revenue (descending) and return top opportunities
    return opportunities.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue).slice(0, 5)
  } catch (error) {
    console.error('❌ Error generating revenue opportunities:', error)
    return []
  }
}

// Find products that are out of stock but have recent demand
async function findStockoutOpportunities({
  companyId,
  agencyId,
  siteId,
  dateRange,
}: GenerateOpportunitiesParams): Promise<RevenueOpportunity[]> {
  // Use date range or default to last 30 days
  const startDate = dateRange?.startDate || (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  })()
  const endDate = dateRange?.endDate || new Date()

  // Get out-of-stock products
  const outOfStockProducts = await prisma.product.findMany({
    where: {
      companyId,
      ...(agencyId && { agencyId }),
      ...(siteId && { siteId }),
      active: true,
      OR: [{ status: 'OutOfStock' }, { availableQuantity: { lte: 0 } }],
    },
    include: {
      salesOrderItems: {
        where: {
          salesOrder: {
            orderDate: { gte: startDate, lte: endDate },
          },
        },
        select: {
          quantity: true,
          amount: true,
        },
      },
    },
  })

  const opportunities: RevenueOpportunity[] = []

  for (const product of outOfStockProducts) {
    // Calculate recent demand
    const totalQuantitySold = product.salesOrderItems.reduce(
      (sum: number, item) => sum + (item.quantity || 0),
      0
    )

    if (totalQuantitySold > 0) {
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 30
      const avgDailyDemand = totalQuantitySold / daysInPeriod
      const suggestedStock = Math.ceil(avgDailyDemand * 30) // 30 days supply
      const estimatedRevenue = suggestedStock * product.sellingPrice

      opportunities.push({
        id: `stockout-${product.id}`,
        type: 'STOCKOUT',
        title: `Restock High-Demand Item: ${product.name}`,
        estimatedRevenue,
        confidence: 0.85,
        products: [
          {
            id: product.id,
            name: product.name,
            currentStock: 0,
            suggestedStock,
            unitPrice: product.sellingPrice,
          },
        ],
        action: {
          label: 'Create Purchase Order',
          endpoint: '/api/inventory/purchase-orders',
          method: 'POST',
        },
        reasoning: `This product sold ${totalQuantitySold} units in the selected period but is currently out of stock. Restocking could capture ${estimatedRevenue.toFixed(0)} in potential revenue.`,
        createdAt: new Date(),
      })
    }
  }

  return opportunities
}

// Find fast-moving products that could benefit from increased stock
async function findFastMovingOpportunities({
  companyId,
  agencyId,
  siteId,
  dateRange,
}: GenerateOpportunitiesParams): Promise<RevenueOpportunity[]> {
  // Use date range or default to last 30 days
  const startDate = dateRange?.startDate || (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  })()
  const endDate = dateRange?.endDate || new Date()

  // Get products with recent sales
  const products = await prisma.product.findMany({
    where: {
      companyId,
      ...(agencyId && { agencyId }),
      ...(siteId && { siteId }),
      active: true,
      availableQuantity: { gt: 0 },
    },
    include: {
      salesOrderItems: {
        where: {
          salesOrder: {
            orderDate: { gte: startDate, lte: endDate },
          },
        },
        select: {
          quantity: true,
        },
      },
    },
  })

  const opportunities: RevenueOpportunity[] = []
  const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 30

  for (const product of products) {
    const totalQuantitySold = product.salesOrderItems.reduce(
      (sum: number, item) => sum + (item.quantity || 0),
      0
    )

    if (totalQuantitySold > 0) {
      const currentStock = product.availableQuantity || 0
      const avgDailyDemand = totalQuantitySold / daysInPeriod
      const daysOfStockRemaining = currentStock / avgDailyDemand

      // If stock will run out in less than 30 days (relaxed from 15)
      if (daysOfStockRemaining < 30 && daysOfStockRemaining > 0) {
        const suggestedStock = Math.ceil(avgDailyDemand * 45) // 45 days supply
        const additionalUnits = suggestedStock - currentStock
        const estimatedRevenue = additionalUnits * product.sellingPrice

        if (estimatedRevenue > 100) {
          // Only show opportunities with potential revenue
          opportunities.push({
            id: `fastmoving-${product.id}`,
            type: 'FAST_MOVING',
            title: `Increase Stock for Fast-Moving Item: ${product.name}`,
            estimatedRevenue,
            confidence: 0.75,
            products: [
              {
                id: product.id,
                name: product.name,
                currentStock,
                suggestedStock,
                unitPrice: product.sellingPrice,
              },
            ],
            action: {
              label: 'Increase Stock Level',
              endpoint: '/api/inventory/purchase-orders',
              method: 'POST',
            },
            reasoning: `Moving at ${avgDailyDemand.toFixed(1)} units/day. Current stock will last only ${Math.round(daysOfStockRemaining)} days. Increasing stock could generate ${estimatedRevenue.toFixed(0)} in additional revenue.`,
            createdAt: new Date(),
          })
        }
      }
    }
  }

  return opportunities
}

// Find low stock opportunities (inventory-based, works without sales history)
async function findLowStockOpportunities({
  companyId,
  agencyId,
  siteId,
}: Omit<GenerateOpportunitiesParams, 'dateRange'>): Promise<RevenueOpportunity[]> {
  // Get products that are low on stock
  const lowStockProducts = await prisma.product.findMany({
    where: {
      companyId,
      ...(agencyId && { agencyId }),
      ...(siteId && { siteId }),
      active: true,
      OR: [
        { status: 'LowStock' },
        { status: 'Critical' },
        {
          AND: [
            { reorderPoint: { not: null } },
            { availableQuantity: { lte: 10 } }, // Low stock threshold
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      availableQuantity: true,
      reorderPoint: true,
      sellingPrice: true,
      costPrice: true,
      status: true,
    },
    take: 10,
  })

  const opportunities: RevenueOpportunity[] = []

  for (const product of lowStockProducts) {
    const currentStock = product.availableQuantity || 0
    const reorderLevel = product.reorderPoint || 10
    const suggestedStock = Math.max(reorderLevel * 2, 50) // Restock to 2x reorder point or 50 units
    const additionalUnits = suggestedStock - currentStock
    
    if (additionalUnits > 0) {
      const estimatedRevenue = additionalUnits * product.sellingPrice
      const margin = ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100

      opportunities.push({
        id: `lowstock-${product.id}`,
        type: 'LOW_STOCK',
        title: `Restock Critical Item: ${product.name}`,
        estimatedRevenue,
        confidence: 0.7,
        products: [
          {
            id: product.id,
            name: product.name,
            currentStock,
            suggestedStock,
            unitPrice: product.sellingPrice,
          },
        ],
        action: {
          label: 'Create Purchase Order',
          endpoint: '/api/inventory/purchase-orders',
          method: 'POST',
        },
        reasoning: `Currently at ${currentStock} units (${product.status}). Restocking to ${suggestedStock} units could generate ${estimatedRevenue.toFixed(0)} in revenue with ${margin.toFixed(0)}% margin.`,
        createdAt: new Date(),
      })
    }
  }

  return opportunities
}

// Find seasonal opportunities based on month-over-month trends
async function findSeasonalOpportunities({
  companyId,
  agencyId,
  siteId,
  dateRange,
}: GenerateOpportunitiesParams): Promise<RevenueOpportunity[]> {
  const currentMonth = new Date().getMonth()
  const lastYearSameMonth = new Date()
  lastYearSameMonth.setFullYear(lastYearSameMonth.getFullYear() - 1)
  lastYearSameMonth.setDate(1)

  const lastYearSameMonthEnd = new Date(lastYearSameMonth)
  lastYearSameMonthEnd.setMonth(lastYearSameMonthEnd.getMonth() + 1)
  lastYearSameMonthEnd.setDate(0)

  // Get products sold well during the same month last year
  const lastYearSales = await prisma.salesOrderItem.groupBy({
    by: ['productId'],
    where: {
      salesOrder: {
        companyId,
        ...(agencyId && { agencyId }),
        ...(siteId && { siteId }),
        orderDate: {
          gte: lastYearSameMonth,
          lte: lastYearSameMonthEnd,
        },
      },
    },
    _sum: {
      quantity: true,
      amount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
    take: 10,
  })

  if (lastYearSales.length === 0) {
    return []
  }

  const productIds = lastYearSales.map((sale) => sale.productId).filter(Boolean) as string[]

  // Get current stock levels for these products
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      active: true,
    },
    select: {
      id: true,
      name: true,
      availableQuantity: true,
      sellingPrice: true,
      costPrice: true,
    },
  })

  const opportunities: RevenueOpportunity[] = []

  for (const sale of lastYearSales) {
    const product = products.find((p) => p.id === sale.productId)
    if (!product) continue

    const lastYearQuantity = sale._sum.quantity || 0
    const currentStock = product.availableQuantity || 0

    // If current stock is less than last year's demand
    if (lastYearQuantity > currentStock) {
      const suggestedStock = Math.ceil(lastYearQuantity * 1.2) // 20% buffer
      const additionalUnits = suggestedStock - currentStock
      const estimatedRevenue = additionalUnits * product.sellingPrice

      if (estimatedRevenue > 100) {
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]

        opportunities.push({
          id: `seasonal-${product.id}`,
          type: 'SEASONAL',
          title: `Prepare for Seasonal Demand: ${product.name}`,
          estimatedRevenue,
          confidence: 0.65,
          products: [
            {
              id: product.id,
              name: product.name,
              currentStock,
              suggestedStock,
              unitPrice: product.sellingPrice,
            },
          ],
          action: {
            label: 'Stock Up Now',
            endpoint: '/api/inventory/purchase-orders',
            method: 'POST',
          },
          reasoning: `Last ${monthNames[currentMonth]}, this product sold ${lastYearQuantity} units. Current stock (${currentStock}) may not meet seasonal demand. Opportunity: ${estimatedRevenue.toFixed(0)}.`,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          createdAt: new Date(),
        })
      }
    }
  }

  return opportunities
}
