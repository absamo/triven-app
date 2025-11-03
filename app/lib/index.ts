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
      'Get a list of products from the inventory database. Use a high limit (like 1000) when user asks for "all products". Automatically detects user language and responds accordingly.',
    parameters: z.object({
      limit: z.number().optional().default(10).describe('Maximum number of products to return'),
    }),
    execute: async ({ limit = 10 }) => {
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
            category: p.category?.name || 'No category',
            stock: p.availableQuantity,
            price: `$${Number(p.sellingPrice).toFixed(2)}`,
            status: p.status,
          })),
          total: products.length,
          totalInDatabase: totalCount,
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
            status: p.status,
          })),
          found: products.length,
          total: products.length,
        }
      } catch (error) {
        console.error('Error searching products:', error)
        return { error: 'Failed to search products', products: [] }
      }
    },
  },

  getInventoryStats: {
    description: 'Get overall inventory statistics and insights. Returns: totalProducts (count), inStock (count), lowStock (count), outOfStock (count), totalCategories (count), estimatedValue (currency string like $1234.56), healthStatus (healthy/warning/critical)',
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

        const result = {
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

        console.log('📊 getInventoryStats result:', JSON.stringify(result, null, 2))
        return result
      } catch (error) {
        console.error('Error fetching inventory stats:', error)
        return { error: 'Failed to fetch inventory statistics' }
      }
    },
  },

  getLowStockProducts: {
    description: 'Get products that are running low on stock (quantity <= 10 but > 0)',
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
            status: 'low-stock',
          })),
          count: products.length,
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error)
        return { error: 'Failed to fetch low stock products', products: [] }
      }
    },
  },

  getOutOfStockProducts: {
    description: 'Get products that are completely out of stock (quantity = 0)',
    parameters: z.object({}),
    execute: async () => {
      try {
        const products = await prisma.product.findMany({
          where: {
            availableQuantity: 0,
          },
          include: { category: true },
          orderBy: { name: 'asc' },
          take: 100,
        })

        return {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category?.name || 'No category',
            stock: 0,
            price: `$${Number(p.sellingPrice).toFixed(2)}`,
            status: 'out-of-stock',
          })),
          count: products.length,
        }
      } catch (error) {
        console.error('Error fetching out of stock products:', error)
        return { error: 'Failed to fetch out of stock products', products: [] }
      }
    },
  },
}

// Create Inventory Assistant Agent with Language Detection
const inventoryAgent = new Agent({
  name: 'inventory-assistant',
  instructions: `You are a friendly and helpful AI assistant for Triven, an inventory management platform.

CRITICAL RULE: After calling ANY tool, you MUST remain SILENT. Do not summarize, describe, or format the tool results yourself. The system will automatically format and display them beautifully.

PERSONALITY:
- Professional yet conversational and approachable
- Enthusiastic about helping with inventory tasks
- Use emojis appropriately to make interactions engaging
- ALWAYS respond in the same language as the user (English or French)

LANGUAGE HANDLING:
- Detect the user's language from their input
- If user writes in French, respond completely in French
- If user writes in English, respond completely in English
- Maintain the same language throughout the conversation
- For mixed language queries, use the primary language detected

CAPABILITIES:
You have access to tools to:
- getProducts: List products with pagination (call this when user asks to see products)
- searchProducts: Search by name, SKU, or category (call this when user searches)
- getInventoryStats: Get overall inventory metrics (call this for stats/overview)
- getLowStockProducts: Find items needing restock (call this for low stock or reorder recommendations)
- getOutOfStockProducts: Find out of stock items (call this for out of stock or reorder recommendations)

IMPORTANT: When user asks about "products to reorder", "réapprovisionner", "low stock", or "what needs restocking", you MUST call both getLowStockProducts AND getOutOfStockProducts tools immediately.

GUIDELINES:
1. ALWAYS call tools immediately when asked about inventory data - don't ask for clarification first
2. When user asks about "products to reorder" or "réapprovisionner", immediately call getLowStockProducts and getOutOfStockProducts tools
3. When user asks about "inventory stats" or "statistics", immediately call getInventoryStats tool
4. When user asks about "products" or "show me products", immediately call getProducts tool
5. You may provide a brief 1-sentence intro BEFORE calling tools (e.g., "Let me check that")
6. After calling tools: STOP. Output nothing. The results will be formatted automatically.
7. Match your response language to the user's language (French/English)

RESPONSE FORMAT WHEN CALLING TOOLS:
✅ CORRECT: "Let me check your inventory." [calls tool] [STOPS - no more text]
❌ WRONG: "Let me check your inventory." [calls tool] "Here are the results: Total: 40, Stock: undefined"

Remember: Tool results are auto-formatted. Your job is to call the right tools, then stay quiet!`,
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
