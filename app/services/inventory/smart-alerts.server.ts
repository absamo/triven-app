import type { AlertSeverity, AlertType } from '@prisma/client'
import { prisma } from '~/app/db.server'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  financialImpact: number
  affectedProducts: string[]
  suggestedAction: string
  quickAction?: {
    label: string
    endpoint: string
    method: string
    params: Record<string, any>
  }
  daysUntilCritical?: number
  aiConfidence?: number
  createdAt: Date
}

interface WhereClause {
  companyId: string
  agencyId?: string
  siteId?: string
}

/**
 * Generate smart alerts for inventory issues
 */
export async function generateSmartAlerts(params: {
  companyId: string
  agencyId?: string
  siteId?: string
  dateRange?: {
    startDate: Date
    endDate: Date
  }
}): Promise<Alert[]> {
  const { companyId, agencyId, siteId, dateRange } = params

  const where: WhereClause = { companyId }
  if (agencyId) where.agencyId = agencyId
  if (siteId) where.siteId = siteId

  const alerts: Alert[] = []

  // Generate different types of alerts
  const stockoutAlerts = await detectStockoutRisks(where)
  const deadStockAlerts = await detectDeadStock(where)
  const imbalanceAlerts = await detectStockImbalances(where)
  const backorderAlerts = await detectHighValueBackorders(where)

  alerts.push(...stockoutAlerts, ...deadStockAlerts, ...imbalanceAlerts, ...backorderAlerts)

  // Save alerts to database
  await saveAlerts(alerts)

  // Sort by priority (severity + financial impact)
  return alerts.sort((a, b) => {
    const priorityA = getSeverityWeight(a.severity) + a.financialImpact / 1000
    const priorityB = getSeverityWeight(b.severity) + b.financialImpact / 1000
    return priorityB - priorityA
  })
}

/**
 * Detect products at risk of stockout
 */
async function detectStockoutRisks(where: WhereClause): Promise<Alert[]> {
  const alerts: Alert[] = []

  // Get products with low stock or trending towards stockout
  const products = await prisma.product.findMany({
    where: {
      ...where,
      active: true,
      status: { in: ['LowStock', 'Available'] },
    },
    include: {
      salesOrderItems: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          quantity: true,
          createdAt: true,
        },
      },
      suppliers: {
        take: 1,
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  for (const product of products) {
    // Calculate daily sales velocity
    const totalSold = product.salesOrderItems.reduce((sum, item) => sum + item.quantity, 0)
    const daysOfData = 30
    const dailyVelocity = totalSold / daysOfData

    if (dailyVelocity > 0) {
      const daysUntilStockout = Math.floor(product.availableQuantity / dailyVelocity)

      if (daysUntilStockout <= 7 && daysUntilStockout > 0) {
        // Calculate revenue at risk
        const financialImpact = product.sellingPrice * dailyVelocity * 7 // 7 days of lost sales

        const severity: AlertSeverity =
          daysUntilStockout <= 3 ? 'Critical' : daysUntilStockout <= 5 ? 'High' : 'Medium'

        alerts.push({
          id: `stockout_${product.id}`,
          type: 'StockoutPredicted',
          severity,
          title: `${product.name} - Stockout in ${daysUntilStockout} days`,
          description: `Based on current sales velocity (${dailyVelocity.toFixed(1)} units/day), this product will be out of stock in ${daysUntilStockout} days`,
          financialImpact,
          affectedProducts: [product.id],
          suggestedAction: `Create purchase order for ${Math.ceil(dailyVelocity * 30)} units`,
          quickAction: product.suppliers[0]
            ? {
                label: 'Create Purchase Order',
                endpoint: '/api/purchase-orders',
                method: 'POST',
                params: {
                  productId: product.id,
                  quantity: Math.ceil(dailyVelocity * 30),
                  supplierId: product.suppliers[0].id,
                },
              }
            : undefined,
          daysUntilCritical: daysUntilStockout,
          aiConfidence: 0.9,
          createdAt: new Date(),
        })
      }
    }
  }

  return alerts
}

/**
 * Detect dead stock (no movement in 90 days)
 */
async function detectDeadStock(where: WhereClause): Promise<Alert[]> {
  const alerts: Alert[] = []

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const deadStockProducts = await prisma.product.findMany({
    where: {
      ...where,
      active: true,
      availableQuantity: { gt: 0 },
    },
    include: {
      stockAdjustmentHistories: {
        where: {
          createdAt: { gte: ninetyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      salesOrderItems: {
        where: {
          createdAt: { gte: ninetyDaysAgo },
        },
        take: 1,
      },
    },
  })

  const deadStock = deadStockProducts.filter(
    (p) => p.stockAdjustmentHistories.length === 0 && p.salesOrderItems.length === 0
  )

  if (deadStock.length > 0) {
    const totalValue = deadStock.reduce((sum, p) => sum + p.availableQuantity * p.costPrice, 0)

    alerts.push({
      id: `deadstock_${where.companyId}`,
      type: 'DeadStockAlert',
      severity: totalValue > 10000 ? 'High' : 'Medium',
      title: `${deadStock.length} SKUs with no movement in 90 days`,
      description: `Dead stock tying up $${totalValue.toFixed(2)} in capital`,
      financialImpact: -totalValue, // Negative because it's capital tied up
      affectedProducts: deadStock.map((p) => p.id),
      suggestedAction: 'Review and mark for clearance or write-off',
      createdAt: new Date(),
    })
  }

  return alerts
}

/**
 * Detect stock imbalances across locations
 */
async function detectStockImbalances(where: WhereClause): Promise<Alert[]> {
  const alerts: Alert[] = []

  // Only check if we have a site filter (looking within an agency)
  if (!where.siteId && where.agencyId) {
    // Get all sites in this agency
    const sites = await prisma.site.findMany({
      where: {
        agencyId: where.agencyId,
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (sites.length > 1) {
      // Check each product across sites
      const products = await prisma.product.groupBy({
        by: ['id', 'name', 'sellingPrice'],
        where: {
          companyId: where.companyId,
          agencyId: where.agencyId,
          active: true,
        },
      })

      for (const productGroup of products) {
        const productBySite = await prisma.product.findMany({
          where: {
            id: productGroup.id,
            siteId: { in: sites.map((s) => s.id) },
          },
          select: {
            siteId: true,
            availableQuantity: true,
            site: {
              select: {
                name: true,
              },
            },
          },
        })

        // Find sites with excess vs shortage
        const maxStock = Math.max(...productBySite.map((p) => p.availableQuantity))
        const minStock = Math.min(...productBySite.map((p) => p.availableQuantity))

        // If imbalance is significant
        if (maxStock > 50 && minStock < 10 && maxStock / (minStock || 1) > 3) {
          const fromSite = productBySite.find((p) => p.availableQuantity === maxStock)
          const toSite = productBySite.find((p) => p.availableQuantity === minStock)

          if (fromSite && toSite && fromSite.siteId !== toSite.siteId) {
            const transferQty = Math.floor((maxStock - minStock) / 2)
            const potentialRevenue = transferQty * productGroup.sellingPrice

            alerts.push({
              id: `imbalance_${productGroup.id}`,
              type: 'StockImbalance',
              severity: 'High',
              title: `Stock imbalance: ${productGroup.name}`,
              description: `${fromSite.site.name} has ${maxStock} units while ${toSite.site.name} has ${minStock}`,
              financialImpact: potentialRevenue,
              affectedProducts: [productGroup.id],
              suggestedAction: `Transfer ${transferQty} units from ${fromSite.site.name} to ${toSite.site.name}`,
              quickAction: {
                label: 'Create Transfer Order',
                endpoint: '/api/transfer-orders',
                method: 'POST',
                params: {
                  productId: productGroup.id,
                  quantity: transferQty,
                  fromSite: fromSite.siteId,
                  toSite: toSite.siteId,
                },
              },
              aiConfidence: 0.85,
              createdAt: new Date(),
            })
          }
        }
      }
    }
  }

  return alerts
}

/**
 * Detect high-value backorders
 */
async function detectHighValueBackorders(where: WhereClause): Promise<Alert[]> {
  const alerts: Alert[] = []

  const backorders = await prisma.backorder.findMany({
    where: {
      companyId: where.companyId,
      agencyId: where.agencyId,
      siteId: where.siteId,
      status: { in: ['Pending', 'Partial'] },
    },
    include: {
      backorderItems: {
        include: {
          product: true,
        },
      },
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  for (const backorder of backorders) {
    const totalValue = backorder.backorderItems.reduce((sum, item) => sum + item.amount, 0)

    if (totalValue > 1000) {
      alerts.push({
        id: `backorder_${backorder.id}`,
        type: 'HighValueBackorder',
        severity: totalValue > 5000 ? 'Critical' : 'High',
        title: `High-value backorder: ${backorder.customer.firstName} ${backorder.customer.lastName}`,
        description: `Backorder worth $${totalValue.toFixed(2)} pending fulfillment`,
        financialImpact: totalValue,
        affectedProducts: backorder.backorderItems.map((item) => item.productId),
        suggestedAction: `Review and expedite fulfillment`,
        createdAt: new Date(),
      })
    }
  }

  return alerts
}

/**
 * Save alerts to database
 */
async function saveAlerts(alerts: Alert[]): Promise<void> {
  for (const alert of alerts) {
    // Check if alert already exists and is active
    const existing = await prisma.smartAlert.findFirst({
      where: {
        id: alert.id,
        status: 'Active',
      },
    })

    if (!existing) {
      // Extract company info from the first affected product
      let companyId = ''
      let agencyId: string | undefined

      if (alert.affectedProducts.length > 0) {
        const product = await prisma.product.findUnique({
          where: { id: alert.affectedProducts[0] },
          select: { companyId: true, agencyId: true },
        })
        if (product) {
          companyId = product.companyId
          agencyId = product.agencyId
        }
      }

      await prisma.smartAlert.create({
        data: {
          id: alert.id,
          companyId,
          agencyId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          financialImpact: alert.financialImpact,
          affectedProducts: alert.affectedProducts,
          suggestedAction: alert.suggestedAction,
          quickAction: alert.quickAction as any,
          daysUntilCritical: alert.daysUntilCritical,
          aiConfidence: alert.aiConfidence,
          status: 'Active',
        },
      })
    }
  }
}

/**
 * Get active alerts from database
 */
export async function getActiveAlerts(params: {
  companyId: string
  agencyId?: string
  siteId?: string
  limit?: number
}): Promise<Alert[]> {
  const { companyId, agencyId, limit = 10 } = params

  const alerts = await prisma.smartAlert.findMany({
    where: {
      companyId,
      agencyId: agencyId || undefined,
      status: 'Active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ severity: 'desc' }, { financialImpact: 'desc' }],
    take: limit,
  })

  return alerts.map((alert) => ({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    financialImpact: alert.financialImpact,
    affectedProducts: alert.affectedProducts,
    suggestedAction: alert.suggestedAction,
    quickAction: alert.quickAction as any,
    daysUntilCritical: alert.daysUntilCritical || undefined,
    aiConfidence: alert.aiConfidence || undefined,
    createdAt: alert.createdAt,
  }))
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string, reason?: string): Promise<void> {
  await prisma.smartAlert.update({
    where: { id: alertId },
    data: {
      status: 'Dismissed',
      dismissedReason: reason,
    },
  })
}

/**
 * Get severity weight for priority calculation
 */
function getSeverityWeight(severity: AlertSeverity): number {
  const weights: Record<AlertSeverity, number> = {
    Critical: 1000,
    High: 500,
    Medium: 100,
    Low: 10,
  }
  return weights[severity] || 0
}
