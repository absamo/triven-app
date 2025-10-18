import { prisma } from '~/app/db.server'

export interface HealthScoreBreakdown {
  stockLevelAdequacy: number
  turnoverRate: number
  agingInventory: number
  backorderRate: number
  supplierReliability: number
}

export interface HealthScore {
  current: number
  change: number
  previousScore: number
  breakdown: HealthScoreBreakdown
  trend: Array<{ date: string; score: number }>
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

/**
 * Calculate inventory health score for a company/agency/site
 */
export async function calculateHealthScore(params: {
  companyId: string
  agencyId?: string
  siteId?: string
  dateRange?: { startDate: Date; endDate: Date }
}): Promise<HealthScore> {
  const { companyId, agencyId, siteId, dateRange } = params

  // Build where clause for filtering
  const where: any = { companyId }
  if (agencyId) where.agencyId = agencyId
  if (siteId) where.siteId = siteId

  // Calculate each component of the health score
  const breakdown = await calculateBreakdown(where)

  // Calculate overall score (weighted average)
  const current = Math.round(
    breakdown.stockLevelAdequacy * 0.3 +
      breakdown.turnoverRate * 0.25 +
      breakdown.agingInventory * 0.2 +
      breakdown.backorderRate * 0.15 +
      breakdown.supplierReliability * 0.1
  )

  // Calculate change based on date range or company history
  let previousScore = current
  let trendDays = 30 // Default to 30 days
  let previousDate: Date

  if (dateRange?.startDate && dateRange?.endDate) {
    // Use the filtered date range
    const rangeDays = Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    trendDays = Math.min(rangeDays, 90) // Cap at 90 days for trend

    // Get score from before the start date
    previousDate = new Date(dateRange.startDate)
    previousDate.setDate(previousDate.getDate() - 1)
  } else {
    // No filter: get score from 30 days ago
    previousDate = new Date()
    previousDate.setDate(previousDate.getDate() - 30)
  }

  const previousRecord = await prisma.inventoryHealthScore.findFirst({
    where: {
      companyId,
      agencyId: agencyId || null,
      siteId: siteId || null,
      date: { lte: previousDate },
    },
    orderBy: { date: 'desc' },
  })

  if (previousRecord) {
    previousScore = previousRecord.overallScore
  }

  const change =
    previousScore !== current
      ? Number(((current - previousScore) / previousScore) * 100).toFixed(1)
      : 0

  // Get trend data based on date range or default period
  const trendData =
    dateRange?.startDate && dateRange?.endDate
      ? await getHealthScoreTrendByDateRange({
          companyId,
          agencyId,
          siteId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
      : await getHealthScoreTrend({
          companyId,
          agencyId,
          siteId,
          days: trendDays,
        })

  // Determine rating
  const rating = getHealthRating(current)

  // Save current score
  await saveHealthScore({
    companyId,
    agencyId,
    siteId,
    score: current,
    breakdown,
  })

  return {
    current,
    change: Number(change),
    previousScore,
    breakdown,
    trend: trendData,
    rating,
  }
}

/**
 * Calculate breakdown of health score components
 */
async function calculateBreakdown(where: any): Promise<HealthScoreBreakdown> {
  // Stock Level Adequacy (30%)
  const stockLevelAdequacy = await calculateStockLevelAdequacy(where)

  // Turnover Rate (25%)
  const turnoverRate = await calculateTurnoverRate(where)

  // Aging Inventory (20%)
  const agingInventory = await calculateAgingInventory(where)

  // Backorder Rate (15%)
  const backorderRate = await calculateBackorderRate(where)

  // Supplier Reliability (10%)
  const supplierReliability = await calculateSupplierReliability(where)

  return {
    stockLevelAdequacy,
    turnoverRate,
    agingInventory,
    backorderRate,
    supplierReliability,
  }
}

/**
 * Calculate stock level adequacy score (0-100)
 * Based on percentage of products at healthy stock levels
 */
async function calculateStockLevelAdequacy(where: any): Promise<number> {
  const products = await prisma.product.findMany({
    where: {
      ...where,
      active: true,
    },
    select: {
      id: true,
      availableQuantity: true,
      reorderPoint: true,
      safetyStockLevel: true,
      status: true,
    },
  })

  if (products.length === 0) return 50 // Neutral score for no products

  let healthyProducts = 0

  products.forEach((product) => {
    const minHealthyLevel = product.safetyStockLevel || product.reorderPoint || 0
    const isHealthy =
      product.availableQuantity >= minHealthyLevel * 1.5 &&
      !['OutOfStock', 'Critical', 'LowStock'].includes(product.status)

    if (isHealthy) healthyProducts++
  })

  return Math.round((healthyProducts / products.length) * 100)
}

/**
 * Calculate turnover rate score (0-100)
 * Based on inventory turnover compared to industry benchmark (6-8 times per year is good)
 */
async function calculateTurnoverRate(where: any): Promise<number> {
  // Use 90 days for more accurate annual turnover calculation
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Get total sales value for last 90 days
  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      companyId: where.companyId,
      agencyId: where.agencyId,
      siteId: where.siteId,
      orderDate: { gte: ninetyDaysAgo },
      status: { notIn: ['Cancelled'] },
    },
    include: {
      salesOrderItems: {
        select: {
          amount: true,
        },
      },
    },
  })

  const totalSalesValue = salesOrders.reduce((sum, order) => {
    return sum + order.salesOrderItems.reduce((itemSum, item) => itemSum + item.amount, 0)
  }, 0)

  // Get average inventory value
  const products = await prisma.product.findMany({
    where: {
      ...where,
      active: true,
    },
    select: {
      availableQuantity: true,
      costPrice: true,
    },
  })

  const averageInventoryValue = products.reduce(
    (sum, p) => sum + p.availableQuantity * p.costPrice,
    0
  )

  if (averageInventoryValue === 0) return 50 // Neutral score
  if (totalSalesValue === 0) return 0 // No sales = poor turnover

  // Calculate quarterly turnover rate (90 days)
  const quarterlyTurnover = totalSalesValue / averageInventoryValue

  // Annualize it (multiply by 4 for 4 quarters)
  const annualTurnover = quarterlyTurnover * 4

  // Benchmark: 6-8 times per year is optimal
  // Score: 100 at 7, linear decay on either side
  let score: number
  if (annualTurnover >= 6 && annualTurnover <= 8) {
    score = 100
  } else if (annualTurnover < 6) {
    // Lower is worse (slow-moving inventory)
    score = Math.max(0, (annualTurnover / 6) * 100)
  } else {
    // Higher might indicate stockouts or too lean inventory
    score = Math.max(0, 100 - ((annualTurnover - 8) / 4) * 50)
  }

  return Math.round(score)
}

/**
 * Calculate aging inventory score (0-100)
 * Based on percentage of inventory older than 90 days
 */
async function calculateAgingInventory(where: any): Promise<number> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Get all stock adjustments older than 90 days (last movement)
  const products = await prisma.product.findMany({
    where: {
      ...where,
      active: true,
    },
    include: {
      stockAdjustmentHistories: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (products.length === 0) return 50

  let agingProducts = 0

  products.forEach((product) => {
    const lastMovement = product.stockAdjustmentHistories[0]?.createdAt
    if (!lastMovement || lastMovement < ninetyDaysAgo) {
      agingProducts++
    }
  })

  const agingPercentage = (agingProducts / products.length) * 100

  // Lower aging percentage is better
  return Math.round(Math.max(0, 100 - agingPercentage))
}

/**
 * Calculate backorder rate score (0-100)
 * Based on ratio of backorders to total orders
 */
async function calculateBackorderRate(where: any): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Count total sales orders
  const totalOrders = await prisma.salesOrder.count({
    where: {
      companyId: where.companyId,
      agencyId: where.agencyId,
      siteId: where.siteId,
      orderDate: { gte: thirtyDaysAgo },
    },
  })

  // Count backorders
  const backorders = await prisma.backorder.count({
    where: {
      companyId: where.companyId,
      agencyId: where.agencyId,
      siteId: where.siteId,
      originalOrderDate: { gte: thirtyDaysAgo },
      status: { in: ['Pending', 'Partial'] },
    },
  })

  if (totalOrders === 0) return 100 // No orders, perfect score

  const backorderPercentage = (backorders / totalOrders) * 100

  // Lower backorder percentage is better
  return Math.round(Math.max(0, 100 - backorderPercentage * 5)) // 5x multiplier to make it more sensitive
}

/**
 * Calculate supplier reliability score (0-100)
 * Based on on-time delivery percentage
 */
async function calculateSupplierReliability(where: any): Promise<number> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Get all completed purchase orders in last 90 days
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      companyId: where.companyId,
      agencyId: where.agencyId,
      siteId: where.siteId,
      orderDate: { gte: ninetyDaysAgo },
      status: { in: ['Received'] },
    },
    include: {
      purchaseReceives: {
        orderBy: { receivedDate: 'asc' },
        take: 1,
      },
    },
  })

  if (purchaseOrders.length === 0) return 75 // Neutral-good score for no data

  let onTimeDeliveries = 0

  purchaseOrders.forEach((po) => {
    if (po.expectedDeliveryDate && po.purchaseReceives[0]?.receivedDate) {
      const expected = new Date(po.expectedDeliveryDate)
      const actual = new Date(po.purchaseReceives[0].receivedDate)
      if (actual <= expected) {
        onTimeDeliveries++
      }
    }
  })

  const onTimePercentage = (onTimeDeliveries / purchaseOrders.length) * 100

  return Math.round(onTimePercentage)
}

/**
 * Get health score trend for specified number of days
 */
export async function getHealthScoreTrend(params: {
  companyId: string
  agencyId?: string
  siteId?: string
  days: number
}): Promise<Array<{ date: string; score: number }>> {
  const { companyId, agencyId, siteId, days } = params

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const scores = await prisma.inventoryHealthScore.findMany({
    where: {
      companyId,
      agencyId: agencyId || null,
      siteId: siteId || null,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      overallScore: true,
    },
  })

  return scores.map((score) => ({
    date: score.date.toISOString().split('T')[0],
    score: Math.round(score.overallScore),
  }))
}

/**
 * Get health score trend for a specific date range
 */
export async function getHealthScoreTrendByDateRange(params: {
  companyId: string
  agencyId?: string
  siteId?: string
  startDate: Date
  endDate: Date
}): Promise<Array<{ date: string; score: number }>> {
  const { companyId, agencyId, siteId, startDate, endDate } = params

  const scores = await prisma.inventoryHealthScore.findMany({
    where: {
      companyId,
      agencyId: agencyId || null,
      siteId: siteId || null,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      overallScore: true,
    },
  })

  return scores.map((score) => ({
    date: score.date.toISOString().split('T')[0],
    score: Math.round(score.overallScore),
  }))
}

/**
 * Save health score to database
 */
async function saveHealthScore(params: {
  companyId: string
  agencyId?: string
  siteId?: string
  score: number
  breakdown: HealthScoreBreakdown
}): Promise<void> {
  const { companyId, agencyId, siteId, score, breakdown } = params

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.inventoryHealthScore.upsert({
    where: {
      companyId_agencyId_siteId_date: {
        companyId,
        agencyId: agencyId || '',
        siteId: siteId || '',
        date: today,
      },
    },
    create: {
      companyId,
      agencyId,
      siteId,
      date: today,
      overallScore: score,
      stockLevelAdequacy: breakdown.stockLevelAdequacy,
      turnoverRate: breakdown.turnoverRate,
      agingInventory: breakdown.agingInventory,
      backorderRate: breakdown.backorderRate,
      supplierReliability: breakdown.supplierReliability,
    },
    update: {
      overallScore: score,
      stockLevelAdequacy: breakdown.stockLevelAdequacy,
      turnoverRate: breakdown.turnoverRate,
      agingInventory: breakdown.agingInventory,
      backorderRate: breakdown.backorderRate,
      supplierReliability: breakdown.supplierReliability,
    },
  })
}

/**
 * Get health rating from score
 */
function getHealthRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  if (score >= 40) return 'poor'
  return 'critical'
}
