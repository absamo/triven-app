/**
 * Recommendation and Analytics Tools
 *
 * Implements 3 Mastra tools for AI-powered inventory recommendations:
 * 1. getReorderRecommendations - Get products that need reordering
 * 2. getTopSellingProducts - Get best-selling products
 * 3. getInventoryHealth - Get overall inventory health metrics
 *
 * Based on plan.md User Story 4: Recommendation and Analytics
 * Uses analytics functions from analytics.server.ts
 */

import { z } from 'zod'
import {
  calculateInventoryTurnover,
  getLowStockProducts,
  getTopSellingProducts as getTopSelling,
} from './analytics.server'
import {
  formatCurrency,
  formatError,
  formatKeyValue,
  formatNumber,
  formatSuccess,
  formatTable,
} from './tool-formatters'

/**
 * Tool 1: Get Reorder Recommendations
 * Identifies products that need to be reordered based on stock levels
 */
export const getReorderRecommendations = {
  description:
    'Get AI-powered recommendations for which products need to be reordered. Shows products with low stock levels, days until stockout, and suggested reorder quantities. Use this to help users proactively manage inventory.',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of recommendations to return (default: 10)'),
  }),
  execute: async ({ limit = 10 }: { limit?: number }) => {
    try {
      // TODO: Get user context
      const companyId = 'default-company'

      const recommendations = await getLowStockProducts(companyId, limit)

      if (recommendations.length === 0) {
        return {
          success: true,
          message: formatSuccess(
            'All products are adequately stocked! No reorder recommendations at this time.'
          ),
          recommendations: [],
          total: 0,
        }
      }

      // Format as table
      const tableData = recommendations.map((rec) => {
        // Calculate suggested order quantity (2x reorder point)
        const suggestedQty = Math.max(rec.reorderPoint * 2, 10)
        return [
          rec.name,
          rec.sku || 'N/A',
          rec.currentStock.toString(),
          rec.reorderPoint.toString(),
          rec.daysUntilStockout.toFixed(1),
          suggestedQty.toString(),
        ]
      })

      const table = formatTable(
        [
          'Product',
          'SKU',
          'Current Stock',
          'Reorder Point',
          'Days Until Stockout',
          'Suggested Order Qty',
        ],
        tableData
      )

      return {
        success: true,
        message: `Found ${recommendations.length} products that need reordering\n\n${table}\n\n💡 **Tip:** Products are sorted by urgency (lowest days until stockout first).`,
        recommendations: recommendations.map((rec) => {
          const suggestedQty = Math.max(rec.reorderPoint * 2, 10)
          return {
            productId: rec.id,
            name: rec.name,
            sku: rec.sku,
            currentStock: rec.currentStock,
            reorderPoint: rec.reorderPoint,
            daysUntilStockout: rec.daysUntilStockout,
            suggestedOrderQuantity: suggestedQty,
          }
        }),
        total: recommendations.length,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to generate recommendations: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 2: Get Top Selling Products
 * Shows best-performing products by sales velocity
 */
export const getTopSellingProductsRecommendation = {
  description:
    'Get the top-selling products based on sales velocity over a specified time period. Shows which products are moving fastest and their sales rates. Use this to help users understand product performance.',
  parameters: z.object({
    days: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Number of days to analyze (default: 30)'),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of products to return (default: 10)'),
  }),
  execute: async ({ days = 30, limit = 10 }: { days?: number; limit?: number }) => {
    try {
      // TODO: Get user context
      const companyId = 'default-company'

      const topProducts = await getTopSelling(companyId, days, limit)

      if (topProducts.length === 0) {
        return {
          success: true,
          message: `No sales recorded in the last ${days} days.`,
          topProducts: [],
          total: 0,
        }
      }

      // Format as table
      const tableData = topProducts.map((product, index) => [
        (index + 1).toString(),
        product.name,
        product.sku || 'N/A',
        product.totalSold.toString(),
        `${formatNumber(product.salesVelocity, 1)}/day`,
        formatCurrency(product.revenue),
      ])

      const table = formatTable(
        ['Rank', 'Product', 'SKU', 'Units Sold', 'Velocity', 'Revenue'],
        tableData
      )

      const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0)
      const totalUnits = topProducts.reduce((sum, p) => sum + p.totalSold, 0)

      return {
        success: true,
        message: `Top ${topProducts.length} selling products (last ${days} days)\n\n${table}\n\n${formatKeyValue(
          {
            'Total Revenue': formatCurrency(totalRevenue),
            'Total Units Sold': totalUnits.toString(),
          }
        )}`,
        topProducts: topProducts.map((product, index) => ({
          rank: index + 1,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitsSold: product.totalSold,
          velocity: product.salesVelocity,
          revenue: product.revenue,
        })),
        total: topProducts.length,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to get top-selling products: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 3: Get Inventory Health Metrics
 * Provides overall inventory health analysis
 */
export const getInventoryHealth = {
  description:
    'Get comprehensive inventory health metrics including turnover rate, stock status distribution, and overall performance indicators. Use this to help users understand the overall state of their inventory.',
  parameters: z.object({
    days: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Number of days to analyze for turnover (default: 365)'),
  }),
  execute: async ({ days = 365 }: { days?: number }) => {
    try {
      // TODO: Get user context
      const companyId = 'default-company'

      // Calculate inventory turnover
      const turnoverRate = await calculateInventoryTurnover(companyId, days)

      // Get stock status counts
      const lowStockProducts = await getLowStockProducts(companyId, 100) // Get more for counting

      // Interpret turnover rate
      let turnoverAssessment = ''
      if (turnoverRate > 8) {
        turnoverAssessment = '🟢 Excellent - Inventory is moving very fast'
      } else if (turnoverRate > 4) {
        turnoverAssessment = '🟡 Good - Healthy inventory movement'
      } else if (turnoverRate > 2) {
        turnoverAssessment = '🟠 Fair - Room for improvement'
      } else {
        turnoverAssessment = '🔴 Poor - Inventory is moving slowly'
      }

      // Count urgency levels
      const urgentReorders = lowStockProducts.filter((p) => p.daysUntilStockout < 7).length
      const soonReorders = lowStockProducts.filter(
        (p) => p.daysUntilStockout >= 7 && p.daysUntilStockout < 14
      ).length

      return {
        success: true,
        message: `📊 **Inventory Health Report** (${days}-day period)

### Key Metrics

| Metric | Value |
|--------|-------|
| **Turnover Rate** | ${formatNumber(turnoverRate, 2)}x |
| **Assessment** | ${turnoverAssessment} |
| **Products Needing Reorder** | ${lowStockProducts.length} |
| **Urgent (< 7 days)** | ${urgentReorders} |
| **Soon (7-14 days)** | ${soonReorders} |

### Turnover Rate Benchmarks

| Range | Rating | Description |
|-------|--------|-------------|
| < 2x | 🔴 Poor | Overstocking - Inventory moving too slowly |
| 2-4x | 🟠 Fair | Room for improvement |
| 4-8x | 🟡 Good | Healthy inventory movement |
| > 8x | 🟢 Excellent | Fast-moving inventory |

### 💡 Recommendation

${
  urgentReorders > 0
    ? `⚠️ **Take immediate action** on ${urgentReorders} product(s) with urgent reorder needs (< 7 days until stockout).`
    : lowStockProducts.length > 0
      ? `👀 **Monitor closely:** ${lowStockProducts.length} product(s) approaching reorder points.`
      : '✅ **All good!** Inventory levels are healthy across the board.'
}`,
        metrics: {
          turnoverRate,
          productsNeedingReorder: lowStockProducts.length,
          urgentReorders,
          soonReorders,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to calculate inventory health: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

// Export all recommendation tools
export const recommendationTools = {
  getReorderRecommendations,
  getTopSellingProductsRecommendation,
  getInventoryHealth,
}
