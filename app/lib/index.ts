import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { createOllama } from 'ai-sdk-ollama'
import { z } from 'zod'
import { prisma } from '~/app/db.server'

// Configure Ollama with cloud endpoint
const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'https://ollama.com',
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
})

// Define tools for inventory operations
const inventoryTools = {
  getProducts: {
    description:
      'Get a list of products from the inventory database. Use a high limit (like 1000) when user asks for "all products". Supports both English and French.',
    parameters: z.object({
      limit: z.number().optional().default(10).describe('Maximum number of products to return'),
      language: z.enum(['en', 'fr']).optional().default('en').describe('Response language'),
    }),
    execute: async ({ limit = 10, language = 'en' }) => {
      try {
        const [totalCount, products] = await Promise.all([
          prisma.product.count(),
          prisma.product.findMany({
            take: limit,
            include: { category: true },
            orderBy: { name: 'asc' },
          }),
        ])

        return {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category?.name || (language === 'fr' ? 'Aucune catégorie' : 'No category'),
            stock: p.availableQuantity,
            price: `$${Number(p.sellingPrice).toFixed(2)}`,
            status: p.status,
          })),
          total: products.length,
          totalInDatabase: totalCount,
          language,
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        return { error: 'Failed to fetch products', products: [] }
      }
    },
  },

  searchProducts: {
    description: 'Search for products by name, SKU, or category',
    parameters: z.object({
      query: z.string().describe('Search query to find products'),
      limit: z.number().optional().default(20).describe('Maximum results to return'),
    }),
    execute: async ({ query, limit = 20 }: { query: string; limit?: number }) => {
      try {
        const products = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { sku: { contains: query, mode: 'insensitive' } },
              { category: { name: { contains: query, mode: 'insensitive' } } },
            ],
          },
          include: { category: true },
          take: limit,
          orderBy: { name: 'asc' },
        })

        return {
          query,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category?.name || 'No category',
            stock: p.availableQuantity,
            price: `$${Number(p.sellingPrice).toFixed(2)}`,
          })),
          found: products.length,
        }
      } catch (error) {
        console.error('Error searching products:', error)
        return { error: 'Failed to search products', products: [] }
      }
    },
  },

  getInventoryStats: {
    description: 'Get overall inventory statistics and insights',
    parameters: z.object({}),
    execute: async () => {
      try {
        const [totalProducts, lowStock, outOfStock, categories] = await Promise.all([
          prisma.product.count(),
          prisma.product.count({ where: { availableQuantity: { lte: 10, gt: 0 } } }),
          prisma.product.count({ where: { availableQuantity: 0 } }),
          prisma.category.count(),
        ])

        const products = await prisma.product.findMany({
          select: {
            sellingPrice: true,
            availableQuantity: true,
          },
        })

        const totalValue = products.reduce(
          (sum, p) => sum + Number(p.sellingPrice) * p.availableQuantity,
          0
        )

        return {
          totalProducts,
          lowStock,
          outOfStock,
          inStock: totalProducts - outOfStock,
          totalCategories: categories,
          estimatedValue: `$${totalValue.toFixed(2)}`,
          healthStatus:
            outOfStock > totalProducts * 0.2
              ? 'critical'
              : lowStock > totalProducts * 0.1
                ? 'warning'
                : 'healthy',
        }
      } catch (error) {
        console.error('Error fetching inventory stats:', error)
        return { error: 'Failed to fetch inventory statistics' }
      }
    },
  },

  getLowStockProducts: {
    description: 'Get products that are running low on stock (quantity <= 10)',
    parameters: z.object({
      threshold: z.number().optional().default(10).describe('Stock level threshold'),
    }),
    execute: async ({ threshold = 10 }) => {
      try {
        const products = await prisma.product.findMany({
          where: {
            availableQuantity: { lte: threshold, gt: 0 },
          },
          include: { category: true },
          orderBy: { availableQuantity: 'asc' },
          take: 50,
        })

        return {
          threshold,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category?.name || 'No category',
            stock: p.availableQuantity,
            status: p.availableQuantity === 0 ? 'out-of-stock' : 'low-stock',
          })),
          count: products.length,
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error)
        return { error: 'Failed to fetch low stock products', products: [] }
      }
    },
  },
}

// Create Inventory Assistant Agent
const inventoryAgent = new Agent({
  name: 'inventory-assistant',
  instructions: `You are a friendly and helpful AI assistant for Triven, an inventory management platform.

PERSONALITY:
- Professional yet conversational and approachable
- Enthusiastic about helping with inventory tasks
- Use emojis appropriately to make interactions engaging
- Respond in the same language as the user (English or French)

CAPABILITIES:
You have access to tools to:
- Search and retrieve product information
- Check inventory levels and stock status
- Provide inventory statistics and insights
- Identify low-stock or out-of-stock items
- Answer questions about products and categories

GUIDELINES:
1. Always use the appropriate tool when asked about inventory data
2. Present information in a clear, structured format
3. Be proactive in suggesting relevant actions (e.g., "Would you like to see low stock items?")
4. When showing product lists, keep it concise unless user asks for details
5. If asked for "all products", use a high limit like 1000
6. For French queries, respond in French
7. When users greet you, be friendly and offer to help with inventory tasks
8. If you don't have access to certain data, be honest and suggest alternatives

RESPONSE FORMAT:
- Use markdown for better readability
- Use tables for product listings when appropriate
- Include relevant emojis for visual appeal
- Highlight important numbers and statistics
- Provide actionable insights when possible

Remember: You're here to make inventory management easier and more efficient!`,
  model: ollama(process.env.OLLAMA_MODEL || 'minimax-m2:cloud'),
  tools: inventoryTools,
})

// Initialize Mastra instance
const mastra = new Mastra({
  agents: { inventoryAgent },
})

// Export mastra instance (required by Mastra CLI)
export { mastra }

// Export agent getter for easy access
export const getInventoryAgent = () => mastra.getAgent('inventoryAgent')

// Default export for Mastra CLI
export default mastra
