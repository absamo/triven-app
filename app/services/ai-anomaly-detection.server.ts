import { Ollama } from 'ollama'
import { prisma } from '~/app/db.server'
import { createAndEmitNotification } from './notificationHelper.server'

const ollama = new Ollama({ host: 'http://localhost:11434' })

export async function detectInventoryAnomalies(companyId: string) {
  try {
    // Analyze recent stock movements
    const recentMovements = await getRecentStockMovements(companyId)
    const salesPatterns = await getRecentSalesPatterns(companyId)
    const supplierPerformance = await getSupplierPerformance(companyId)
    const inventoryHealth = await getInventoryHealthMetrics(companyId)

    const prompt = `
You are an AI inventory management expert analyzing business data for anomalies and potential issues.

STOCK MOVEMENTS (Last 30 days):
${JSON.stringify(recentMovements, null, 2)}

SALES PATTERNS (Last 30 days):
${JSON.stringify(salesPatterns, null, 2)}

SUPPLIER PERFORMANCE:
${JSON.stringify(supplierPerformance, null, 2)}

INVENTORY HEALTH METRICS:
${JSON.stringify(inventoryHealth, null, 2)}

Analyze this data for anomalies, unusual patterns, potential issues, or opportunities. Look for:

1. **Stock Discrepancies**: Unusual stock movements, inventory shrinkage
2. **Demand Spikes**: Sudden increases in sales that might indicate trends
3. **Supplier Issues**: Delayed deliveries, quality problems
4. **Unusual Sales Patterns**: Unexpected changes in buying behavior
5. **Inventory Imbalances**: Overstocking or understocking patterns
6. **Price Anomalies**: Products with unusual pricing relative to movement
7. **Seasonal Variances**: Unexpected seasonal changes

For each anomaly detected, assess:
- Type of anomaly
- Severity level (Low/Medium/High/Critical)
- Confidence in detection (0-1)
- Affected products
- Root cause analysis
- Recommended actions

Return JSON response:
{
  "anomalies": [
    {
      "type": "stock_discrepancy|demand_spike|supplier_delay|quality_issue|unusual_sales_pattern|inventory_shrinkage|price_anomaly|seasonal_variance",
      "severity": "Low|Medium|High|Critical",
      "description": "Clear, actionable description of the anomaly",
      "affectedProducts": ["product_id_1", "product_id_2"],
      "confidence": 0.85,
      "rootCause": "Analysis of why this anomaly occurred",
      "recommendedActions": [
        "Specific action 1",
        "Specific action 2"
      ],
      "financialImpact": "Estimated impact description",
      "timeframe": "When this issue needs attention"
    }
  ]
}

Only include genuine anomalies with confidence > 0.6. Be specific and actionable.
      `.trim()

    const response = await ollama.chat({
      model: 'llama3.1:8b',
      messages: [{ role: 'user', content: prompt }],
      format: 'json',
    })

    const anomalies = parseAnomalyResponse(response.message.content)

    // Store anomalies in database and create notifications
    const storedAnomalies = []

    // Ensure we have valid anomalies array
    if (!anomalies || !anomalies.anomalies || !Array.isArray(anomalies.anomalies)) {
      console.warn('No valid anomalies found in response')
      return []
    }

    for (const anomaly of anomalies.anomalies) {
      if (anomaly.confidence >= 0.6) {
        const storedAnomaly = await prisma.inventoryAnomaly.create({
          data: {
            type: anomaly.type as any,
            severity: anomaly.severity as any,
            description: anomaly.description,
            affectedProducts: anomaly.affectedProducts,
            recommendedActions: anomaly.recommendedActions,
            confidence: anomaly.confidence,
            companyId,
            metadata: {
              rootCause: anomaly.rootCause,
              financialImpact: anomaly.financialImpact,
              timeframe: anomaly.timeframe,
            },
          },
        })

        storedAnomalies.push(storedAnomaly)

        // Create notifications for high and critical anomalies
        if (anomaly.severity === 'High' || anomaly.severity === 'Critical') {
          await createAnomalyNotification(anomaly, companyId)
        }
      }
    }

    return storedAnomalies
  } catch (error) {
    console.error('Anomaly detection failed:', error)
    throw new Error(
      `Failed to detect anomalies: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

async function getRecentStockMovements(companyId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const stockAdjustments = await prisma.stockAdjustment.findMany({
    where: {
      companyId,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          availableQuantity: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return stockAdjustments.map((adj) => ({
    id: adj.id,
    date: adj.date,
    reason: adj.reason,
    status: adj.status,
    products: adj.products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.availableQuantity,
    })),
  }))
}

async function getRecentSalesPatterns(companyId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      companyId,
      orderDate: { gte: thirtyDaysAgo },
    },
    include: {
      salesOrderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPrice: true,
            },
          },
        },
      },
    },
    orderBy: { orderDate: 'desc' },
  })

  // Aggregate by product and by day
  const dailySales: Record<string, Record<string, { quantity: number; revenue: number }>> = {}
  const productTotals: Record<
    string,
    { quantity: number; revenue: number; name: string; sku: string }
  > = {}

  salesOrders.forEach((order) => {
    const day = order.orderDate.toISOString().split('T')[0]

    order.salesOrderItems.forEach((item) => {
      const productId = item.product.id

      // Daily aggregation
      if (!dailySales[day]) dailySales[day] = {}
      if (!dailySales[day][productId]) {
        dailySales[day][productId] = { quantity: 0, revenue: 0 }
      }
      dailySales[day][productId].quantity += item.quantity
      dailySales[day][productId].revenue += item.amount

      // Product totals
      if (!productTotals[productId]) {
        productTotals[productId] = {
          quantity: 0,
          revenue: 0,
          name: item.product.name,
          sku: item.product.sku || '',
        }
      }
      productTotals[productId].quantity += item.quantity
      productTotals[productId].revenue += item.amount
    })
  })

  return {
    totalOrders: salesOrders.length,
    dailySales,
    topProducts: Object.entries(productTotals)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data })),
    averageDailySales: salesOrders.length / 30,
  }
}

async function getSupplierPerformance(companyId: string) {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      companyId,
      orderDate: { gte: sixtyDaysAgo },
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      purchaseReceives: true,
    },
  })

  const supplierMetrics: Record<
    string,
    {
      name: string
      totalOrders: number
      onTimeDeliveries: number
      lateDeliveries: number
      averageDelayDays: number
      totalValue: number
    }
  > = {}

  purchaseOrders.forEach((order) => {
    const supplierId = order.supplier.id

    if (!supplierMetrics[supplierId]) {
      supplierMetrics[supplierId] = {
        name: order.supplier.name,
        totalOrders: 0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        averageDelayDays: 0,
        totalValue: 0,
      }
    }

    supplierMetrics[supplierId].totalOrders++

    // Calculate delivery performance
    order.purchaseReceives.forEach((receive) => {
      const expectedDate = order.expectedDeliveryDate
      const receivedDate = receive.receivedDate

      if (expectedDate && receivedDate) {
        const delayDays = Math.ceil(
          (receivedDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (delayDays <= 0) {
          supplierMetrics[supplierId].onTimeDeliveries++
        } else {
          supplierMetrics[supplierId].lateDeliveries++
          supplierMetrics[supplierId].averageDelayDays += delayDays
        }
      }
    })
  })

  // Calculate averages
  Object.values(supplierMetrics).forEach((metrics) => {
    if (metrics.lateDeliveries > 0) {
      metrics.averageDelayDays = metrics.averageDelayDays / metrics.lateDeliveries
    }
  })

  return Object.entries(supplierMetrics).map(([id, metrics]) => ({
    id,
    ...metrics,
    onTimePercentage:
      metrics.totalOrders > 0
        ? (metrics.onTimeDeliveries / (metrics.onTimeDeliveries + metrics.lateDeliveries)) * 100
        : 0,
  }))
}

async function getInventoryHealthMetrics(companyId: string) {
  const products = await prisma.product.findMany({
    where: {
      companyId,
      active: true,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  })

  const metrics = {
    totalProducts: products.length,
    outOfStock: products.filter((p) => p.availableQuantity === 0).length,
    lowStock: products.filter(
      (p) => p.availableQuantity > 0 && p.availableQuantity <= (p.reorderPoint || 5)
    ).length,
    overStock: products.filter((p) => p.availableQuantity > 100).length, // Arbitrary threshold
    totalInventoryValue: products.reduce((sum, p) => sum + p.availableQuantity * p.costPrice, 0),
    averageStockLevel:
      products.length > 0
        ? products.reduce((sum, p) => sum + p.availableQuantity, 0) / products.length
        : 0,
    categoriesWithIssues: identifyProblematicCategories(products),
  }

  return metrics
}

function identifyProblematicCategories(products: any[]) {
  const categoryMetrics: Record<
    string,
    {
      total: number
      outOfStock: number
      lowStock: number
    }
  > = {}

  products.forEach((product) => {
    const categoryName = product.category?.name || 'Uncategorized'

    if (!categoryMetrics[categoryName]) {
      categoryMetrics[categoryName] = { total: 0, outOfStock: 0, lowStock: 0 }
    }

    categoryMetrics[categoryName].total++

    if (product.availableQuantity === 0) {
      categoryMetrics[categoryName].outOfStock++
    } else if (product.availableQuantity <= (product.reorderPoint || 5)) {
      categoryMetrics[categoryName].lowStock++
    }
  })

  return Object.entries(categoryMetrics)
    .filter(([, metrics]) => {
      const issueRate = (metrics.outOfStock + metrics.lowStock) / metrics.total
      return issueRate > 0.3 // Categories with >30% stock issues
    })
    .map(([name, metrics]) => ({
      category: name,
      ...metrics,
      issuePercentage: Math.round(((metrics.outOfStock + metrics.lowStock) / metrics.total) * 100),
    }))
}

function parseAnomalyResponse(response: string) {
  try {
    const parsed = JSON.parse(response)

    // Validate structure
    if (!parsed.anomalies || !Array.isArray(parsed.anomalies)) {
      throw new Error('Invalid response structure')
    }

    // Valid enum values for AnomalyType
    const validTypes = [
      'stock_discrepancy',
      'demand_spike',
      'supplier_delay',
      'quality_issue',
      'unusual_sales_pattern',
      'inventory_shrinkage',
      'price_anomaly',
      'seasonal_variance',
      'inventory_imbalance',
    ]

    // Validate each anomaly
    parsed.anomalies.forEach((anomaly: any, index: number) => {
      if (
        !anomaly.type ||
        !anomaly.severity ||
        !anomaly.description ||
        typeof anomaly.confidence !== 'number' ||
        !Array.isArray(anomaly.recommendedActions)
      ) {
        throw new Error(`Invalid anomaly structure at index ${index}`)
      }

      // Handle pipe-separated type values - take the first valid one
      if (typeof anomaly.type === 'string' && anomaly.type.includes('|')) {
        const types = anomaly.type.split('|').map((t: string) => t.trim())
        const validType = types.find((t: string) => validTypes.includes(t))
        anomaly.type = validType || 'stock_discrepancy' // fallback to stock_discrepancy
      }

      // Ensure type is valid
      if (!validTypes.includes(anomaly.type)) {
        anomaly.type = 'stock_discrepancy' // fallback to stock_discrepancy
      }

      // Ensure affectedProducts is always an array
      if (!anomaly.affectedProducts || !Array.isArray(anomaly.affectedProducts)) {
        anomaly.affectedProducts = []
      }
    })
    return parsed
  } catch (error) {
    console.error('Failed to parse anomaly response:', error)
    console.error('Response was:', response)

    // Return empty result on parse failure
    return { anomalies: [] }
  }
}

async function createAnomalyNotification(anomaly: any, companyId: string) {
  try {
    const productId = anomaly.affectedProducts[0] || null

    // Get a system user for notifications (first admin user)
    const systemUser = await prisma.user.findFirst({
      where: {
        companyId,
        role: {
          name: {
            in: ['Admin', 'Manager'],
          },
        },
      },
    })

    if (!systemUser) {
      console.warn('No admin user found for anomaly notification')
      return
    }

    await createAndEmitNotification({
      message: `🤖 AI Alert: ${anomaly.description}`,
      status: anomaly.severity === 'Critical' ? 'Critical' : 'Available',
      companyId,
      productId,
      createdById: systemUser.id,
    })
  } catch (error) {
    console.error('Failed to create anomaly notification:', error)
  }
}

export async function getRecentAnomalies(companyId: string, limit: number = 20) {
  return prisma.inventoryAnomaly.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function resolveAnomaly(anomalyId: string) {
  return prisma.inventoryAnomaly.update({
    where: { id: anomalyId },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
    },
  })
}

export async function getAnomalyStats(companyId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const anomalies = await prisma.inventoryAnomaly.findMany({
    where: {
      companyId,
      createdAt: { gte: since },
    },
  })

  const stats = {
    total: anomalies.length,
    resolved: anomalies.filter((a) => a.isResolved).length,
    bySeverity: {
      Critical: anomalies.filter((a) => a.severity === 'Critical').length,
      High: anomalies.filter((a) => a.severity === 'High').length,
      Medium: anomalies.filter((a) => a.severity === 'Medium').length,
      Low: anomalies.filter((a) => a.severity === 'Low').length,
    },
    byType: anomalies.reduce((acc: Record<string, number>, anomaly) => {
      acc[anomaly.type] = (acc[anomaly.type] || 0) + 1
      return acc
    }, {}),
    averageConfidence:
      anomalies.length > 0
        ? anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length
        : 0,
  }

  return stats
}
