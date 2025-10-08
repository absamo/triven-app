import { Ollama } from 'ollama'
import { PRODUCT_STATUSES } from '~/app/common/constants'
import { getStockStatus } from '~/app/common/helpers/inventories'
import { prisma } from '~/app/db.server'

export class BusinessIntelligenceService {
  private ollama: Ollama

  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' })
  }

  async generateBusinessInsights(
    companyId: string,
    focusArea?: string,
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      const context = await this.getBusinessDataSummary(companyId, timeRange)

      const prompt = `
You are a business intelligence expert analyzing inventory management data for actionable insights.

Analysis Period: ${timeRange?.description || 'last 30 days'}
Date Range: ${timeRange?.startDate.toISOString().split('T')[0] || 'N/A'} to ${timeRange?.endDate.toISOString().split('T')[0] || 'N/A'}

Current Business Context:
- Company ID: ${companyId}
- Total Products: ${context.totalProducts}
- Inventory Value: $${context.inventoryValue.toLocaleString()}
- Low Stock Items: ${context.lowStockItems}
- Critical Stock Items: ${context.criticalStockItems}
- Out of Stock: ${context.outOfStockItems}
- Recent Sales Trend (${timeRange?.description || 'last 30 days'}): ${context.salesTrend}
- Total Revenue (${timeRange?.description || 'last 30 days'}): $${context.totalRevenue.toLocaleString()}
- Average Order Value: $${context.averageOrderValue.toFixed(2)}
- Top Selling Products: ${JSON.stringify(context.topProducts)}
- Underperforming Products: ${JSON.stringify(context.underperformingProducts)}
- Supplier Performance Summary: ${JSON.stringify(context.supplierSummary)}
- Inventory Turnover: ${context.inventoryTurnover.toFixed(2)}x annually
- Stock Coverage: ${context.stockCoverageDays.toFixed(1)} days average

${focusArea ? `Focus Area: ${focusArea}` : ''}

Provide actionable business insights including:
1. Key performance indicators analysis for the specified time period
2. Opportunities for improvement
3. Risk areas that need attention
4. Specific actionable recommendations
5. Predicted outcomes if recommendations are followed

Format as markdown with clear sections and bullet points. Be specific and include numbers where relevant.
Make insights practical and immediately actionable for inventory management.
Reference the specific time period analyzed in your insights.
      `.trim()

      const response = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
      })

      // Map focusArea to valid InsightType
      const getValidInsightType = (focusArea?: string) => {
        switch (focusArea) {
          case 'inventory':
            return 'inventory_optimization'
          case 'sales':
            return 'sales_trend'
          case 'profitability':
            return 'cost_analysis'
          case 'efficiency':
            return 'inventory_optimization'
          case 'growth':
            return 'sales_trend'
          case 'supplier':
            return 'supplier_performance'
          case 'business_performance':
            return 'inventory_optimization'
          default:
            return 'inventory_optimization'
        }
      }

      // Store insight in database
      const insight = await prisma.businessInsight.create({
        data: {
          companyId,
          content: response.message.content,
          type: getValidInsightType(focusArea) as any,
          date: new Date(),
          metadata: {
            ...context,
            timeRange: timeRange
              ? {
                  startDate: timeRange.startDate.toISOString(),
                  endDate: timeRange.endDate.toISOString(),
                  description: timeRange.description,
                }
              : undefined,
          },
        },
      })

      return {
        content: response.message.content,
        id: insight.id,
        context,
      }
    } catch (error) {
      console.error('Business insights generation failed:', error)
      throw new Error(
        `Failed to generate business insights: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async processNaturalLanguageQuery(
    query: string,
    companyId: string,
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      // Check if this is specifically a low stock query
      const isLowStockQuery =
        query.toLowerCase().includes('low stock') ||
        query.toLowerCase().includes('low inventory') ||
        query.toLowerCase().includes('out of stock') ||
        query.toLowerCase().includes('critical stock') ||
        query.toLowerCase().includes('show low stock') ||
        query.toLowerCase().includes('list low stock')

      // For low stock queries, return only the filtered low stock data
      if (isLowStockQuery) {
        return await this.getLowStockItemsOnly(companyId, timeRange)
      }

      // For all other queries, use the full business data
      const businessData = await this.getBusinessDataSummary(companyId, timeRange)

      const prompt = `
You are an AI business analyst for an inventory management system. Answer the following question using the provided business data.

Question: "${query}"
Analysis Period: ${timeRange?.description || 'last 30 days'}
Date Range: ${timeRange?.startDate.toISOString().split('T')[0] || 'N/A'} to ${timeRange?.endDate.toISOString().split('T')[0] || 'N/A'}

Available Business Data:
${JSON.stringify(businessData, null, 2)}

Additional Context:
- This is real business data from an active inventory management system
- Focus on inventory, sales, suppliers, and business operations
- Provide specific numbers and actionable insights
- Reference the specific time period in your analysis
- If you need more data to answer accurately, specify what additional information would be helpful

Provide a clear, actionable answer with specific numbers and recommendations where appropriate.
Format the response in markdown for better readability.
            `.trim()
      const response = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
      })

      return response.message.content
    } catch (error) {
      console.error('Natural language query processing failed:', error)
      throw new Error(
        `Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getLowStockItemsOnly(
    companyId: string,
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      // Get products with stock status
      const products = await prisma.product.findMany({
        where: { companyId, active: true },
        include: {
          category: { select: { name: true } },
        },
      })

      // Calculate stock status for each product
      const productsWithCalculatedStatus = products.map((product) => ({
        ...product,
        accountingStockOnHand: product.availableQuantity,
        calculatedStatus: getStockStatus({
          ...product,
          accountingStockOnHand: product.availableQuantity,
        } as any),
      }))

      // Filter for low stock, critical, and out of stock items only
      const lowStockProducts = productsWithCalculatedStatus
        .filter((p) => p.calculatedStatus === PRODUCT_STATUSES.LOWSTOCK)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          category: p.category?.name || 'Uncategorized',
          stock: p.availableQuantity,
          price: `$${p.sellingPrice.toFixed(2)}`,
        }))

      const criticalStockProducts = productsWithCalculatedStatus
        .filter((p) => p.calculatedStatus === PRODUCT_STATUSES.CRITICAL)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          category: p.category?.name || 'Uncategorized',
          stock: p.availableQuantity,
          price: `$${p.sellingPrice.toFixed(2)}`,
        }))

      const outOfStockProducts = productsWithCalculatedStatus
        .filter((p) => p.calculatedStatus === PRODUCT_STATUSES.OUTOFSTOCK)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          category: p.category?.name || 'Uncategorized',
          stock: p.availableQuantity,
          price: `$${p.sellingPrice.toFixed(2)}`,
        }))

      // Combine all low stock items
      const allLowStockItems = [
        ...lowStockProducts,
        ...criticalStockProducts,
        ...outOfStockProducts,
      ]

      // Return formatted response matching the expected structure
      return JSON.stringify({
        query: '',
        products: allLowStockItems,
        found: allLowStockItems.length,
        timeDescription: timeRange?.description || 'last 30 days',
      })
    } catch (error) {
      console.error('Failed to get low stock items:', error)
      return `Failed to retrieve low stock items: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  private async getBusinessDataSummary(
    companyId: string,
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    // Default to 30 days if no time range provided
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const startDate = timeRange?.startDate || defaultStartDate
    const endDate = timeRange?.endDate || new Date()

    // Get basic product metrics
    const products = await prisma.product.findMany({
      where: { companyId, active: true },
      include: {
        category: { select: { name: true } },
        salesOrderItems: {
          where: {
            salesOrder: {
              orderDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
          include: {
            salesOrder: true,
          },
        },
      },
    })

    // Get sales orders for the period
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        companyId,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        salesOrderItems: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    })

    // Get supplier data
    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      include: {
        purchaseOrders: {
          where: {
            orderDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    })

    // Calculate metrics using standardized status logic
    const totalProducts = products.length

    // Use the same status calculation logic as the UI
    const productsWithCalculatedStatus = products.map((product) => ({
      ...product,
      // Map availableQuantity to accountingStockOnHand for consistent stock status calculation
      accountingStockOnHand: product.availableQuantity,
      calculatedStatus: getStockStatus({
        ...product,
        accountingStockOnHand: product.availableQuantity,
      } as any),
    }))

    const lowStockProducts = productsWithCalculatedStatus
      .filter((p) => p.calculatedStatus === PRODUCT_STATUSES.LOWSTOCK)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        category: p.category?.name || 'Uncategorized',
        availableQuantity: p.availableQuantity,
        reorderPoint: p.reorderPoint,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
      }))

    const outOfStockProducts = productsWithCalculatedStatus
      .filter((p) => p.calculatedStatus === PRODUCT_STATUSES.OUTOFSTOCK)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        category: p.category?.name || 'Uncategorized',
        availableQuantity: p.availableQuantity,
        reorderPoint: p.reorderPoint,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
      }))

    const criticalStockProducts = productsWithCalculatedStatus
      .filter((p) => p.calculatedStatus === PRODUCT_STATUSES.CRITICAL)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        category: p.category?.name || 'Uncategorized',
        availableQuantity: p.availableQuantity,
        reorderPoint: p.reorderPoint,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
      }))

    const lowStockItems = lowStockProducts.length
    const outOfStockItems = outOfStockProducts.length
    const criticalStockItems = criticalStockProducts.length

    const inventoryValue = products.reduce((sum, p) => sum + p.availableQuantity * p.costPrice, 0)

    // Sales metrics
    const totalRevenue = salesOrders.reduce(
      (sum, order) =>
        sum + order.salesOrderItems.reduce((itemSum, item) => itemSum + item.amount, 0),
      0
    )
    const totalOrders = salesOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Product performance
    const productSales: Record<
      string,
      { quantity: number; revenue: number; name: string; sku: string }
    > = {}

    products.forEach((product) => {
      const totalQuantity = product.salesOrderItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalRevenue = product.salesOrderItems.reduce((sum, item) => sum + item.amount, 0)

      productSales[product.id] = {
        quantity: totalQuantity,
        revenue: totalRevenue,
        name: product.name,
        sku: product.sku || '',
      }
    })

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }))

    const underperformingProducts = Object.entries(productSales)
      .filter(([, data]) => data.quantity === 0)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }))

    // Supplier performance
    const supplierSummary = suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      recentOrders: supplier.purchaseOrders.length,
      isActive: supplier.active,
    }))

    // Calculate inventory turnover (simplified)
    const totalCostOfGoodsSold = salesOrders.reduce(
      (sum, order) =>
        sum +
        order.salesOrderItems.reduce((itemSum, item) => {
          const product = products.find((p) => p.id === item.productId)
          return itemSum + item.quantity * (product?.costPrice || 0)
        }, 0),
      0
    )
    const averageInventoryValue = inventoryValue // Simplified - should be average over period
    const inventoryTurnover =
      averageInventoryValue > 0 ? (totalCostOfGoodsSold / averageInventoryValue) * 12 : 0 // Annualized

    // Stock coverage days
    const totalDemand = products.reduce(
      (sum, p) => sum + p.salesOrderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )
    const analysisDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const dailyDemand = analysisDays > 0 ? totalDemand / analysisDays : 0
    const totalStock = products.reduce((sum, p) => sum + p.availableQuantity, 0)
    const stockCoverageDays = dailyDemand > 0 ? totalStock / dailyDemand : 0

    // Sales trend (simple comparison) - split the period in half
    const midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2)
    const firstHalfSales = salesOrders
      .filter((order) => order.orderDate >= startDate && order.orderDate < midDate)
      .reduce(
        (sum, order) =>
          sum + order.salesOrderItems.reduce((itemSum, item) => itemSum + item.amount, 0),
        0
      )

    const secondHalfSales = salesOrders
      .filter((order) => order.orderDate >= midDate && order.orderDate <= endDate)
      .reduce(
        (sum, order) =>
          sum + order.salesOrderItems.reduce((itemSum, item) => itemSum + item.amount, 0),
        0
      )

    const salesTrend =
      firstHalfSales > 0 ? ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100 : 0

    return {
      totalProducts,
      lowStockItems,
      criticalStockItems,
      outOfStockItems,
      lowStockProducts,
      criticalStockProducts,
      outOfStockProducts,
      inventoryValue,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topProducts,
      underperformingProducts,
      supplierSummary,
      inventoryTurnover,
      stockCoverageDays,
      salesTrend: salesTrend > 0 ? `+${salesTrend.toFixed(1)}%` : `${salesTrend.toFixed(1)}%`,
      totalCostOfGoodsSold,
      averageInventoryValue,
    }
  }

  async analyzeOverallProductPerformance(
    companyId: string,
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      // Default to 30 days if no time range provided
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const startDate = timeRange?.startDate || defaultStartDate
      const endDate = timeRange?.endDate || new Date()
      const timeDescription = timeRange?.description || 'last 30 days'

      const products = await prisma.product.findMany({
        where: { companyId, active: true },
        include: {
          category: true,
          salesOrderItems: {
            where: {
              salesOrder: {
                orderDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
            include: {
              salesOrder: true,
            },
          },
        },
      })

      // Calculate performance metrics for all products
      const productPerformance = products.map((product) => {
        const totalQuantitySold = product.salesOrderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )
        const totalRevenue = product.salesOrderItems.reduce((sum, item) => sum + item.amount, 0)
        const profitMargin =
          product.sellingPrice > 0
            ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100
            : 0

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || 'Uncategorized',
          currentStock: product.availableQuantity,
          reorderPoint: product.reorderPoint,
          totalQuantitySold,
          totalRevenue,
          profitMargin,
          stockStatus:
            product.availableQuantity <= (product.reorderPoint || 0) ? 'Low Stock' : 'Normal',
          salesTransactions: product.salesOrderItems.length,
        }
      })

      // Sort by different metrics
      const topSellingByQuantity = [...productPerformance]
        .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
        .slice(0, 5)

      const topSellingByRevenue = [...productPerformance]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)

      const lowPerformers = productPerformance.filter((p) => p.totalQuantitySold === 0).slice(0, 5)

      const lowStockProducts = productPerformance
        .filter((p) => p.stockStatus === 'Low Stock')
        .slice(0, 5)

      const highMarginProducts = [...productPerformance]
        .sort((a, b) => b.profitMargin - a.profitMargin)
        .slice(0, 5)

      const summaryData = {
        timePeriod: timeDescription,
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.active).length,
        totalSalesTransactions: productPerformance.reduce((sum, p) => sum + p.salesTransactions, 0),
        totalQuantitySold: productPerformance.reduce((sum, p) => sum + p.totalQuantitySold, 0),
        totalRevenue: productPerformance.reduce((sum, p) => sum + p.totalRevenue, 0),
        averageMargin:
          productPerformance.length > 0
            ? productPerformance.reduce((sum, p) => sum + p.profitMargin, 0) /
              productPerformance.length
            : 0,
        lowStockCount: lowStockProducts.length,
        noSalesCount: lowPerformers.length,
      }

      const prompt = `
Analyze the overall product performance across all products for this business.

Analysis Period: ${timeDescription}
Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}

Overall Performance Summary:
- Total Products: ${summaryData.totalProducts}
- Active Products: ${summaryData.activeProducts}
- Total Sales Transactions: ${summaryData.totalSalesTransactions}
- Total Quantity Sold: ${summaryData.totalQuantitySold}
- Total Revenue: $${summaryData.totalRevenue.toFixed(2)}
- Average Profit Margin: ${summaryData.averageMargin.toFixed(1)}%
- Products with Low Stock: ${summaryData.lowStockCount}
- Products with No Sales: ${summaryData.noSalesCount}

Top Selling Products by Quantity:
${JSON.stringify(topSellingByQuantity, null, 2)}

Top Revenue Generating Products:
${JSON.stringify(topSellingByRevenue, null, 2)}

High Margin Products:
${JSON.stringify(highMarginProducts, null, 2)}

Low Performing Products (No Sales):
${JSON.stringify(lowPerformers, null, 2)}

Low Stock Products:
${JSON.stringify(lowStockProducts, null, 2)}

Provide comprehensive analysis including:
1. **Overall Performance Assessment** for the ${timeDescription} period
2. **Top Performers Analysis** - What's driving success
3. **Underperforming Products** - Identify issues and solutions
4. **Inventory Management** - Stock level optimization
5. **Profitability Insights** - Margin analysis and recommendations
6. **Strategic Recommendations** - Actionable next steps

Format as markdown with clear sections and specific recommendations.
Include context about the time period analyzed (${timeDescription}).
      `.trim()

      const response = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
      })

      return {
        analysis: response.message.content,
        summary: summaryData,
        topPerformers: {
          byQuantity: topSellingByQuantity,
          byRevenue: topSellingByRevenue,
          byMargin: highMarginProducts,
        },
        underperformers: lowPerformers,
        lowStockProducts: lowStockProducts,
        timeRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          description: timeDescription,
        },
      }
    } catch (error) {
      console.error('Overall product performance analysis failed:', error)
      throw new Error(
        `Failed to analyze overall product performance: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async analyzeProductPerformance(
    productId: string,
    analysisType: string = 'comprehensive',
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      // Default to 30 days if no time range provided
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const startDate = timeRange?.startDate || defaultStartDate
      const endDate = timeRange?.endDate || new Date()
      const timeDescription = timeRange?.description || 'last 30 days'

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          salesOrderItems: {
            where: {
              salesOrder: {
                orderDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
            include: {
              salesOrder: true,
            },
          },
          purchaseOrderItems: {
            where: {
              purchaseOrder: {
                orderDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      })

      if (!product) {
        throw new Error('Product not found')
      }

      const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name,
        currentStock: product.availableQuantity,
        reorderPoint: product.reorderPoint,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        margin: (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(
          2
        ),
        recentSales: product.salesOrderItems.length,
        totalQuantitySold: product.salesOrderItems.reduce((sum, item) => sum + item.quantity, 0),
        totalRevenue: product.salesOrderItems.reduce((sum, item) => sum + item.amount, 0),
        recentPurchases: product.purchaseOrderItems.length,
        timePeriod: timeDescription,
      }

      const prompt = `
Analyze the performance of this product based on the following data:

Product: ${productData.name} (${productData.sku})
Category: ${productData.category}
Current Stock: ${productData.currentStock}
Reorder Point: ${productData.reorderPoint || 'Not set'}
Cost Price: $${productData.costPrice}
Selling Price: $${productData.sellingPrice}
Profit Margin: ${productData.margin}%

Performance Analysis Period: ${timeDescription}
Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}

Recent Performance (${timeDescription}):
- Sales Transactions: ${productData.recentSales}
- Total Quantity Sold: ${productData.totalQuantitySold}
- Total Revenue: $${productData.totalRevenue.toFixed(2)}
- Recent Purchases: ${productData.recentPurchases}

Analysis Type: ${analysisType}

Provide insights on:
1. Sales performance and trends for the specified period
2. Profitability analysis
3. Inventory management effectiveness
4. Stock level optimization
5. Specific recommendations for this product

Format as markdown with clear sections and actionable recommendations.
Include context about the time period analyzed.
      `.trim()

      const response = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
      })

      return {
        product: productData,
        analysis: response.message.content,
        timeRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          description: timeDescription,
        },
      }
    } catch (error) {
      console.error('Product performance analysis failed:', error)
      throw new Error(
        `Failed to analyze product performance: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getOptimizationRecommendations(
    companyId: string,
    goal: string,
    timeRange?: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      const businessData = await this.getBusinessDataSummary(companyId, timeRange)

      const prompt = `
You are an inventory optimization expert. Analyze the business data and provide specific recommendations to achieve the goal: "${goal}"

Analysis Period: ${timeRange?.description || 'last 30 days'}
Date Range: ${timeRange?.startDate.toISOString().split('T')[0] || 'N/A'} to ${timeRange?.endDate.toISOString().split('T')[0] || 'N/A'}

Business Data Summary:
${JSON.stringify(businessData, null, 2)}

Based on this data and the specified time period, provide:

1. **Current State Analysis**
   - Key strengths and weaknesses
   - Performance metrics assessment

2. **Optimization Opportunities**
   - Specific areas for improvement
   - Quick wins vs. long-term strategies

3. **Action Plan**
   - Prioritized list of actions
   - Expected impact of each action
   - Implementation timeline

4. **Success Metrics**
   - KPIs to track progress
   - Target improvements

Focus on practical, implementable recommendations that align with the goal: "${goal}"
Format as markdown with clear sections and bullet points.
      `.trim()

      const response = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
      })

      return response.message.content
    } catch (error) {
      console.error('Optimization recommendations failed:', error)
      throw new Error(
        `Failed to generate optimization recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async explainKPITrends(
    companyId: string,
    kpiName: string,
    timeRange: { startDate: Date; endDate: Date; description: string }
  ) {
    try {
      const businessData = await this.getBusinessDataSummary(companyId, timeRange)

      // Get historical data for comparison
      const historicalData = await this.getHistoricalKPIData(companyId, kpiName, timeRange)

      const prompt = `
Explain the trends for the KPI: "${kpiName}" over the ${timeRange.description}.

Analysis Period: ${timeRange.description}
Date Range: ${timeRange.startDate.toISOString().split('T')[0]} to ${timeRange.endDate.toISOString().split('T')[0]}

Current Business Data:
${JSON.stringify(businessData, null, 2)}

Historical KPI Data:
${JSON.stringify(historicalData, null, 2)}

Provide analysis including:
1. **Trend Analysis**
   - What the trend shows for the specified period
   - Key changes over time
   - Patterns or seasonality

2. **Root Cause Analysis**
   - What's driving the trend
   - External and internal factors

3. **Business Impact**
   - What this means for the business
   - Financial implications

4. **Recommendations**
   - Actions to improve the trend
   - Monitoring strategies

Format as markdown with clear sections and specific insights.
Reference the specific time period (${timeRange.description}) in your analysis.
      `.trim()

      const response = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
      })

      return {
        kpi: kpiName,
        timeRange: timeRange.description,
        analysis: response.message.content,
        currentData: businessData,
        historicalData,
        dateRange: {
          startDate: timeRange.startDate.toISOString().split('T')[0],
          endDate: timeRange.endDate.toISOString().split('T')[0],
        },
      }
    } catch (error) {
      console.error('KPI trend explanation failed:', error)
      throw new Error(
        `Failed to explain KPI trends: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async getHistoricalKPIData(
    companyId: string,
    kpiName: string,
    timeRange: { startDate: Date; endDate: Date; description: string }
  ) {
    // This is a simplified implementation. In a real system, you'd want to store and track KPIs over time
    const startDate = timeRange.startDate
    const endDate = timeRange.endDate

    try {
      switch (kpiName.toLowerCase()) {
        case 'inventory turnover':
          return await this.calculateInventoryTurnoverHistory(companyId, startDate, endDate)
        case 'gross margin':
          return await this.calculateGrossMarginHistory(companyId, startDate, endDate)
        case 'stock coverage':
          return await this.calculateStockCoverageHistory(companyId, startDate, endDate)
        default:
          return { message: `Historical data for ${kpiName} not available yet` }
      }
    } catch (error) {
      return { error: `Failed to calculate historical data for ${kpiName}` }
    }
  }

  private async calculateInventoryTurnoverHistory(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Simplified calculation - in practice, you'd want more sophisticated time-series analysis
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        companyId,
        orderDate: { gte: startDate, lte: endDate },
      },
      include: {
        salesOrderItems: {
          include: {
            product: { select: { costPrice: true } },
          },
        },
      },
    })

    const totalCOGS = salesOrders.reduce(
      (sum, order) =>
        sum +
        order.salesOrderItems.reduce(
          (itemSum, item) => itemSum + item.quantity * item.product.costPrice,
          0
        ),
      0
    )

    const products = await prisma.product.findMany({
      where: { companyId, active: true },
    })

    const averageInventoryValue = products.reduce(
      (sum, p) => sum + p.availableQuantity * p.costPrice,
      0
    )

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const annualizedTurnover =
      averageInventoryValue > 0 ? (totalCOGS / averageInventoryValue) * (365 / days) : 0

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      inventoryTurnover: annualizedTurnover.toFixed(2),
      totalCOGS,
      averageInventoryValue,
      calculationDays: days,
    }
  }

  private async calculateGrossMarginHistory(companyId: string, startDate: Date, endDate: Date) {
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        companyId,
        orderDate: { gte: startDate, lte: endDate },
      },
      include: {
        salesOrderItems: {
          include: {
            product: { select: { costPrice: true } },
          },
        },
      },
    })

    let totalRevenue = 0
    let totalCOGS = 0

    salesOrders.forEach((order) => {
      order.salesOrderItems.forEach((item) => {
        totalRevenue += item.amount
        totalCOGS += item.quantity * item.product.costPrice
      })
    })

    const grossProfit = totalRevenue - totalCOGS
    const grossMarginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPercentage: grossMarginPercentage.toFixed(2),
    }
  }

  private async calculateStockCoverageHistory(companyId: string, startDate: Date, endDate: Date) {
    const products = await prisma.product.findMany({
      where: { companyId, active: true },
      include: {
        salesOrderItems: {
          where: {
            salesOrder: {
              orderDate: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    })

    const totalStock = products.reduce((sum, p) => sum + p.availableQuantity, 0)
    const totalDemand = products.reduce(
      (sum, p) => sum + p.salesOrderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dailyDemand = totalDemand / days
    const stockCoverageDays = dailyDemand > 0 ? totalStock / dailyDemand : 0

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalStock,
      totalDemand,
      dailyDemand: dailyDemand.toFixed(2),
      stockCoverageDays: stockCoverageDays.toFixed(1),
      calculationDays: days,
    }
  }

  async generateDailyInsights(companyId: string) {
    try {
      const businessData = await this.getBusinessDataSummary(companyId)

      const insights = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [
          {
            role: 'user',
            content: `Generate 3 key business insights for today based on this inventory management data: ${JSON.stringify(businessData, null, 2)}`,
          },
        ],
      })

      // Store insights in database
      const storedInsight = await prisma.businessInsight.create({
        data: {
          companyId,
          content: insights.message.content,
          type: 'daily_summary',
          date: new Date(),
          metadata: businessData,
        },
      })

      return {
        id: storedInsight.id,
        content: insights.message.content,
        data: businessData,
      }
    } catch (error) {
      console.error('Daily insights generation failed:', error)
      throw new Error(
        `Failed to generate daily insights: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async getRecentInsights(companyId: string, limit: number = 10) {
    return prisma.businessInsight.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async markInsightAsViewed(insightId: string) {
    return prisma.businessInsight.update({
      where: { id: insightId },
      data: { isViewed: true },
    })
  }
}
