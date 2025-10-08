import { Ollama } from 'ollama'
import { prisma } from '~/app/db.server'

export class DemandForecastingService {
  private ollama: Ollama

  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' })
  }

  async generateDemandForecast(productId: string, forecastDays: number = 30) {
    try {
      // Collect historical sales data
      const historicalData = await this.getHistoricalSalesData(productId)

      if (!historicalData || historicalData.salesHistory.length === 0) {
        throw new Error('Insufficient historical data for forecasting')
      }

      // Prepare data for AI analysis
      const prompt = this.buildForecastingPrompt(historicalData, forecastDays)

      // Get AI prediction
      const forecast = await this.ollama.chat({
        model: 'llama3.1:8b',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        format: 'json',
      })

      const parsedForecast = this.parseForecastResponse(forecast.message.content)

      // Store forecast in database
      const storedForecast = await prisma.demandForecast.create({
        data: {
          productId,
          forecastDate: new Date(Date.now() + forecastDays * 24 * 60 * 60 * 1000),
          predictedDemand: parsedForecast.predictedDemand,
          confidenceLevel: parsedForecast.confidence,
          factors: parsedForecast.factors || {},
        },
      })

      return {
        ...parsedForecast,
        id: storedForecast.id,
      }
    } catch (error) {
      console.error('Demand forecasting error:', error)
      throw new Error(
        `Failed to generate demand forecast: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async getHistoricalSalesData(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        salesOrderItems: {
          include: {
            salesOrder: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100, // Last 100 sales
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Aggregate sales by day/week/month
    const salesHistory = product.salesOrderItems.reduce((acc: any[], item) => {
      const date = item.salesOrder.orderDate.toISOString().split('T')[0]
      const existing = acc.find((entry) => entry.date === date)

      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.amount
      } else {
        acc.push({
          date,
          quantity: item.quantity,
          revenue: item.amount,
        })
      }

      return acc
    }, [])

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name,
        currentStock: product.availableQuantity,
        reorderPoint: product.reorderPoint,
        sellingPrice: product.sellingPrice,
      },
      salesHistory: salesHistory.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      totalSales: salesHistory.reduce((sum, entry) => sum + entry.quantity, 0),
      averageDailySales:
        salesHistory.length > 0
          ? salesHistory.reduce((sum, entry) => sum + entry.quantity, 0) / salesHistory.length
          : 0,
    }
  }

  private buildForecastingPrompt(historicalData: any, forecastDays: number): string {
    return `
You are an AI inventory management expert. Analyze the following historical sales data and provide a demand forecast.

Product Information:
- Name: ${historicalData.product.name}
- SKU: ${historicalData.product.sku}
- Category: ${historicalData.product.category}
- Current Stock: ${historicalData.product.currentStock}
- Selling Price: $${historicalData.product.sellingPrice}
- Current Reorder Point: ${historicalData.product.reorderPoint || 'Not set'}

Historical Sales Data (Last ${historicalData.salesHistory.length} days with sales):
${historicalData.salesHistory
  .map(
    (entry: any) =>
      `Date: ${entry.date}, Quantity Sold: ${entry.quantity}, Revenue: $${entry.revenue.toFixed(2)}`
  )
  .join('\n')}

Sales Summary:
- Total Sales (historical period): ${historicalData.totalSales} units
- Average Daily Sales: ${historicalData.averageDailySales.toFixed(2)} units/day
- Number of sales days: ${historicalData.salesHistory.length}

Task: Predict demand for the next ${forecastDays} days.

Consider these factors:
1. Seasonal trends and patterns
2. Recent sales velocity changes
3. Product lifecycle stage
4. Market conditions
5. Day-of-week patterns
6. Any visible trends in the data

Provide your response in JSON format:
{
  "predictedDemand": <integer - total units expected to be sold in next ${forecastDays} days>,
  "dailyAverageDemand": <float - average daily demand prediction>,
  "confidence": <float between 0 and 1 - confidence in prediction>,
  "factors": {
    "seasonality": "<string - seasonal factors considered>",
    "trend": "<string - trend analysis>",
    "volatility": "<string - demand volatility assessment>",
    "marketConditions": "<string - market condition assessment>"
  },
  "recommendedActions": [
    "<string - actionable recommendations based on forecast>"
  ],
  "riskFactors": [
    "<string - potential risks or uncertainties>"
  ]
}

Be realistic and conservative in your predictions. If historical data is limited, indicate lower confidence.
    `.trim()
  }

  private parseForecastResponse(response: string) {
    try {
      const parsed = JSON.parse(response)

      // Validate required fields
      if (typeof parsed.predictedDemand !== 'number' || parsed.predictedDemand < 0) {
        throw new Error('Invalid predictedDemand value')
      }

      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error('Invalid confidence value')
      }

      return {
        predictedDemand: Math.round(parsed.predictedDemand),
        dailyAverageDemand: parsed.dailyAverageDemand || parsed.predictedDemand / 30,
        confidence: parsed.confidence,
        factors: parsed.factors || {},
        recommendedActions: parsed.recommendedActions || [],
        riskFactors: parsed.riskFactors || [],
      }
    } catch (error) {
      console.error('Failed to parse forecast response:', error)
      console.error('Response was:', response)
      throw new Error('Invalid forecast response format')
    }
  }

  async getRecentForecasts(productId?: string, limit: number = 10) {
    const where = productId ? { productId } : {}

    return prisma.demandForecast.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            availableQuantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }

  async updateForecastAccuracy() {
    // Find forecasts where the forecast date has passed but accuracy hasn't been calculated
    const outdatedForecasts = await prisma.demandForecast.findMany({
      where: {
        forecastDate: {
          lt: new Date(),
        },
        accuracy: null,
      },
      include: {
        product: {
          include: {
            salesOrderItems: {
              include: {
                salesOrder: true,
              },
            },
          },
        },
      },
    })

    for (const forecast of outdatedForecasts) {
      try {
        // Calculate actual demand since forecast was made
        const actualSales = forecast.product.salesOrderItems
          .filter(
            (item) =>
              item.salesOrder.orderDate >= forecast.createdAt &&
              item.salesOrder.orderDate <= forecast.forecastDate
          )
          .reduce((sum, item) => sum + item.quantity, 0)

        // Calculate accuracy (1 - normalized absolute error)
        const error = Math.abs(forecast.predictedDemand - actualSales)
        const normalizedError =
          forecast.predictedDemand > 0 ? error / forecast.predictedDemand : actualSales > 0 ? 1 : 0
        const accuracy = Math.max(0, 1 - normalizedError)

        await prisma.demandForecast.update({
          where: { id: forecast.id },
          data: {
            actualDemand: actualSales,
            accuracy,
          },
        })
      } catch (error) {
        console.error(`Failed to update accuracy for forecast ${forecast.id}:`, error)
      }
    }
  }

  async generateAutoReorderRecommendations(companyId: string) {
    // Get products with low stock
    const products = await prisma.product.findMany({
      where: {
        companyId,
        active: true,
        availableQuantity: { lte: 20 }, // Simple low stock threshold
      },
      include: {
        category: true,
        suppliers: true,
        demandForecasts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    const recommendations = []

    for (const product of products) {
      try {
        // Generate forecast if none exists or latest is old
        let forecast = product.demandForecasts?.[0]

        if (
          !forecast ||
          new Date().getTime() - forecast.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000
        ) {
          // Generate new forecast if none exists or if it's older than 7 days
          try {
            const newForecast = await this.generateDemandForecast(product.id, 30)
            const foundForecast = await prisma.demandForecast.findUnique({
              where: { id: newForecast.id },
            })
            if (foundForecast) {
              forecast = foundForecast
            }
          } catch (error) {
            continue // Skip this product
          }
        }

        if (forecast && product.suppliers && product.suppliers.length > 0) {
          const supplier = product.suppliers[0] // Use first supplier for now

          // Calculate recommended order quantity
          const safetyStock = Math.max(5, Math.ceil(forecast.predictedDemand * 0.2)) // 20% safety stock
          const reorderQty = forecast.predictedDemand + safetyStock - product.availableQuantity

          if (reorderQty > 0) {
            const urgency = this.calculateUrgency(
              product.availableQuantity,
              forecast.predictedDemand
            )

            const recommendation = await prisma.purchaseOrderRecommendation.create({
              data: {
                productId: product.id,
                supplierId: supplier.id,
                recommendedQty: reorderQty,
                urgencyLevel: urgency,
                reasoning: `Based on AI forecast: ${forecast.predictedDemand} units predicted demand in next 30 days. Current stock: ${product.availableQuantity}. Recommended safety stock: ${safetyStock}.`,
                estimatedCost: reorderQty * product.costPrice,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
              },
            })

            recommendations.push(recommendation)
          }
        }
      } catch (error) {
        console.error(`Failed to generate recommendation for product ${product.id}:`, error)
      }
    }

    return recommendations
  }

  private calculateUrgency(
    currentStock: number,
    predictedDemand: number
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    const daysOfStock = currentStock / (predictedDemand / 30)

    if (daysOfStock <= 3) return 'Critical'
    if (daysOfStock <= 7) return 'High'
    if (daysOfStock <= 14) return 'Medium'
    return 'Low'
  }
}
