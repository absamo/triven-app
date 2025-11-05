/**
 * Product Management Tools
 *
 * Implements 4 Mastra tools for product inventory operations:
 * 1. updateProductStock - Adjust product quantity with reason tracking
 * 2. updateProductPrice - Update product pricing
 * 3. createProduct - Create new products with full details
 * 4. updateProductDetails - Update product information
 *
 * Based on plan.md User Story 1: Product Management Operations
 */

import { z } from 'zod'
import { prisma } from '../../db.server'
import {
  formatCurrency,
  formatError,
  formatKeyValue,
  formatNumber,
  formatSuccess,
} from './tool-formatters'

/**
 * Tool 1: Update Product Stock
 * Adjusts product inventory quantity with reason tracking and optimistic locking
 */
export const updateProductStock = {
  description:
    'Update the stock quantity of a product. Use this to adjust inventory levels for reasons like receiving shipments, returns, damages, or corrections. Supports both absolute quantity updates and relative adjustments (e.g., +10 or -5).',
  parameters: z.object({
    productId: z.string().optional().describe('The unique ID of the product to update'),
    sku: z.string().optional().describe('Alternative: product SKU instead of ID'),
    adjustment: z
      .string()
      .describe(
        'Stock adjustment: use "+10" to add, "-5" to subtract, or "100" to set absolute quantity'
      ),
    reason: z
      .enum([
        'purchase',
        'sale',
        'return',
        'damage',
        'loss',
        'correction',
        'transfer_in',
        'transfer_out',
        'other',
      ])
      .describe('Reason for the stock adjustment'),
    notes: z.string().optional().describe('Additional notes about the adjustment'),
  }),
  execute: async ({
    productId,
    sku,
    adjustment,
    reason,
    notes,
  }: {
    productId?: string
    sku?: string
    adjustment: string
    reason: string
    notes?: string
  }) => {
    try {
      // Get user context from agent runtime
      // Note: This will be passed via agent context in the route handler
      const userId = (global as any).__mastraUserId || 'system'

      // Find product by ID or SKU
      if (!productId && !sku) {
        return {
          success: false,
          message: formatError('Either productId or sku must be provided'),
          error: 'Missing product identifier',
        }
      }

      const product = await prisma.product.findFirst({
        where: productId ? { id: productId } : { sku },
        select: {
          id: true,
          name: true,
          sku: true,
          availableQuantity: true,
          version: true,
          companyId: true,
          agencyId: true,
          siteId: true,
        },
      })

      if (!product) {
        const error = `Product not found${sku ? ` with SKU: ${sku}` : ''}`
        return { success: false, message: formatError(error), error }
      }

      // Parse adjustment (support +10, -5, or absolute 100)
      const adjustmentStr = adjustment.trim()
      let newQuantity: number
      let adjustmentAmount: number

      if (adjustmentStr.startsWith('+')) {
        adjustmentAmount = Number.parseInt(adjustmentStr.slice(1))
        newQuantity = product.availableQuantity + adjustmentAmount
      } else if (adjustmentStr.startsWith('-')) {
        adjustmentAmount = -Number.parseInt(adjustmentStr.slice(1))
        newQuantity = product.availableQuantity + adjustmentAmount
      } else {
        newQuantity = Number.parseInt(adjustmentStr)
        adjustmentAmount = newQuantity - product.availableQuantity
      }

      // Validate quantity
      if (Number.isNaN(newQuantity) || newQuantity < 0) {
        const error = `Invalid quantity: ${adjustment}. Result cannot be negative.`
        return { success: false, message: formatError(error), error }
      }

      // Update product with optimistic locking
      await prisma.product.update({
        where: {
          id: product.id,
          version: product.version,
        },
        data: {
          availableQuantity: newQuantity,
          physicalStockOnHand: newQuantity,
          accountingStockOnHand: newQuantity,
          adjustedQuantity: { increment: adjustmentAmount },
          version: { increment: 1 },
        },
      })

      // Create stock adjustment history record
      await prisma.stockAdjustmentHistory.create({
        data: {
          productId: product.id,
          openingStock: product.availableQuantity,
          adjustedQuantity: adjustmentAmount,
          physicalStockOnHand: newQuantity,
          accountingStockOnHand: newQuantity,
          reference: notes || `Stock adjusted via AI assistant (${reason})`,
          createdById: userId,
        },
      })

      return {
        success: true,
        message: `${formatSuccess(`Stock updated for ${product.name}`)}\n\n${formatKeyValue({
          Product: product.name,
          SKU: product.sku || 'N/A',
          'Previous Stock': formatNumber(product.availableQuantity),
          Adjustment:
            adjustmentAmount > 0
              ? `+${formatNumber(adjustmentAmount)}`
              : formatNumber(adjustmentAmount),
          'New Stock': formatNumber(newQuantity),
          Reason: reason,
        })}`,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          previousStock: product.availableQuantity,
          newStock: newQuantity,
          adjustment: adjustmentAmount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Handle optimistic locking conflict
      if (errorMessage.includes('Record to update not found')) {
        const conflictError = 'Product was modified by another user. Please retry.'
        return { success: false, message: formatError(conflictError), error: conflictError }
      }

      return {
        success: false,
        message: formatError(`Failed to update stock: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 2: Update Product Price
 * Updates product pricing (cost price and/or selling price)
 */
export const updateProductPrice = {
  description:
    'Update the pricing of a product. Can update cost price, selling price, or both. Use this when prices change from suppliers or when adjusting retail prices.',
  parameters: z.object({
    productId: z.string().optional().describe('The unique ID of the product to update'),
    sku: z.string().optional().describe('Alternative: product SKU instead of ID'),
    costPrice: z.number().positive().optional().describe('New cost price (purchase price)'),
    sellingPrice: z.number().positive().optional().describe('New selling price (retail price)'),
    reason: z.string().optional().describe('Reason for the price change'),
  }),
  execute: async ({
    productId,
    sku,
    costPrice,
    sellingPrice,
    reason,
  }: {
    productId?: string
    sku?: string
    costPrice?: number
    sellingPrice?: number
    reason?: string
  }) => {
    try {
      // Validate at least one price is provided
      if (!costPrice && !sellingPrice) {
        const error = 'At least one price (costPrice or sellingPrice) must be provided'
        return { success: false, message: formatError(error), error }
      }

      // Find product
      if (!productId && !sku) {
        return {
          success: false,
          message: formatError('Either productId or sku must be provided'),
          error: 'Missing product identifier',
        }
      }

      const product = await prisma.product.findFirst({
        where: productId ? { id: productId } : { sku },
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          sellingPrice: true,
          version: true,
        },
      })

      if (!product) {
        const error = `Product not found${sku ? ` with SKU: ${sku}` : ''}`
        return { success: false, message: formatError(error), error }
      }

      // Prepare update data
      const newCostPrice = costPrice ?? product.costPrice
      const newSellingPrice = sellingPrice ?? product.sellingPrice

      // Update product
      await prisma.product.update({
        where: {
          id: product.id,
          version: product.version,
        },
        data: {
          costPrice: newCostPrice,
          sellingPrice: newSellingPrice,
          version: { increment: 1 },
        },
      })

      // Calculate profit margin
      const marginPercent =
        newSellingPrice > 0 ? ((newSellingPrice - newCostPrice) / newSellingPrice) * 100 : 0

      return {
        success: true,
        message: `${formatSuccess(`Price updated for ${product.name}`)}\n\n${formatKeyValue({
          Product: product.name,
          SKU: product.sku || 'N/A',
          'Cost Price': `${formatCurrency(product.costPrice)} → ${formatCurrency(newCostPrice)}`,
          'Selling Price': `${formatCurrency(product.sellingPrice)} → ${formatCurrency(newSellingPrice)}`,
          'Profit Margin': `${marginPercent.toFixed(1)}%`,
          ...(reason && { Reason: reason }),
        })}`,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          previousCostPrice: product.costPrice,
          newCostPrice,
          previousSellingPrice: product.sellingPrice,
          newSellingPrice,
          marginPercent: Math.round(marginPercent * 100) / 100,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to update price: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 3: Create Product
 * Creates a new product with full details
 */
export const createProduct = {
  description:
    'Create a new product in the inventory system. Use this to add new items to your catalog with complete details including pricing, stock levels, and categorization.',
  parameters: z.object({
    name: z.string().min(1).describe('Product name'),
    sku: z.string().optional().describe('Product SKU (stock keeping unit)'),
    description: z.string().optional().describe('Product description'),
    categoryId: z.string().describe('Category ID this product belongs to'),
    costPrice: z.number().positive().describe('Cost price (purchase price from supplier)'),
    sellingPrice: z.number().positive().describe('Selling price (retail price)'),
    openingStock: z.number().int().nonnegative().describe('Initial stock quantity'),
    reorderPoint: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Reorder point (when to restock)'),
    safetyStockLevel: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Safety stock level (minimum buffer)'),
    barcode: z.string().optional().describe('Product barcode'),
    brand: z.string().optional().describe('Product brand'),
    tags: z.array(z.string()).optional().describe('Product tags for categorization'),
  }),
  execute: async ({
    name,
    sku,
    description,
    categoryId,
    costPrice,
    sellingPrice,
    openingStock,
    reorderPoint,
    safetyStockLevel,
    barcode,
    brand,
    tags,
  }: {
    name: string
    sku?: string
    description?: string
    categoryId: string
    costPrice: number
    sellingPrice: number
    openingStock: number
    reorderPoint?: number
    safetyStockLevel?: number
    barcode?: string
    brand?: string
    tags?: string[]
  }) => {
    try {
      // Get user context from global scope (set by route handler)
      const userId = ((global as Record<string, unknown>).__mastraUserId as string) || 'system'
      const companyId = 'default-company'
      const agencyId = 'default-agency'
      const siteId = 'default-site'

      // Validate category exists
      const category = await prisma.category.findFirst({
        where: { id: categoryId },
      })

      if (!category) {
        const error = `Category not found with ID: ${categoryId}`
        return { success: false, message: formatError(error), error }
      }

      // Check if SKU already exists
      if (sku) {
        const existingProduct = await prisma.product.findFirst({
          where: { sku },
        })

        if (existingProduct) {
          const error = `Product with SKU ${sku} already exists`
          return { success: false, message: formatError(error), error }
        }
      }

      // Create product
      const openingValue = openingStock * costPrice
      const product = await prisma.product.create({
        data: {
          name,
          sku,
          description,
          categoryId,
          costPrice,
          sellingPrice,
          openingStock,
          openingValue,
          availableQuantity: openingStock,
          physicalStockOnHand: openingStock,
          accountingStockOnHand: openingStock,
          adjustedQuantity: 0,
          reorderPoint: reorderPoint ?? null,
          safetyStockLevel: safetyStockLevel ?? null,
          barcode: barcode || `AUTO-${Date.now()}`,
          brand: brand ?? null,
          tags: tags ?? [],
          companyId,
          agencyId,
          siteId,
          active: true,
          returnable: true,
          trackable: true,
          status: 'Available',
          unit: 'Pieces',
          createdby: userId,
          version: 1,
        },
      })

      return {
        success: true,
        message: `${formatSuccess(`Product created: ${product.name}`)}\n\n${formatKeyValue({
          Name: product.name,
          SKU: product.sku || 'Auto-generated',
          'Cost Price': formatCurrency(product.costPrice),
          'Selling Price': formatCurrency(product.sellingPrice),
          'Opening Stock': formatNumber(openingStock),
          Category: category.name,
        })}`,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          stock: product.availableQuantity,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to create product: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 4: Update Product Details
 * Updates non-pricing product information
 */
export const updateProductDetails = {
  description:
    'Update product information like name, description, category, reorder levels, or other details. Use this for non-pricing updates to product catalog.',
  parameters: z.object({
    productId: z.string().optional().describe('The unique ID of the product to update'),
    sku: z.string().optional().describe('Alternative: product SKU instead of ID'),
    name: z.string().min(1).optional().describe('New product name'),
    description: z.string().optional().describe('New product description'),
    categoryId: z.string().optional().describe('New category ID'),
    reorderPoint: z.number().int().positive().optional().describe('New reorder point'),
    safetyStockLevel: z.number().int().positive().optional().describe('New safety stock level'),
    brand: z.string().optional().describe('New brand name'),
    tags: z.array(z.string()).optional().describe('New tags (replaces existing)'),
    active: z.boolean().optional().describe('Set product active/inactive status'),
  }),
  execute: async ({
    productId,
    sku,
    name,
    description,
    categoryId,
    reorderPoint,
    safetyStockLevel,
    brand,
    tags,
    active,
  }: {
    productId?: string
    sku?: string
    name?: string
    description?: string
    categoryId?: string
    reorderPoint?: number
    safetyStockLevel?: number
    brand?: string
    tags?: string[]
    active?: boolean
  }) => {
    try {
      // Find product
      if (!productId && !sku) {
        return {
          success: false,
          message: formatError('Either productId or sku must be provided'),
          error: 'Missing product identifier',
        }
      }

      const product = await prisma.product.findFirst({
        where: productId ? { id: productId } : { sku },
        select: {
          id: true,
          name: true,
          sku: true,
          categoryId: true,
          version: true,
        },
      })

      if (!product) {
        const error = `Product not found${sku ? ` with SKU: ${sku}` : ''}`
        return { success: false, message: formatError(error), error }
      }

      // Validate category if provided
      let categoryName = ''
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: { id: categoryId },
        })

        if (!category) {
          const error = `Category not found with ID: ${categoryId}`
          return { success: false, message: formatError(error), error }
        }
        categoryName = category.name
      }

      // Prepare update data (only include fields that were provided)
      const updateData: Record<string, unknown> = {
        version: { increment: 1 },
      }

      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (categoryId !== undefined) updateData.categoryId = categoryId
      if (reorderPoint !== undefined) updateData.reorderPoint = reorderPoint
      if (safetyStockLevel !== undefined) updateData.safetyStockLevel = safetyStockLevel
      if (brand !== undefined) updateData.brand = brand
      if (tags !== undefined) updateData.tags = tags
      if (active !== undefined) updateData.active = active

      // Update product
      const updatedProduct = await prisma.product.update({
        where: {
          id: product.id,
          version: product.version,
        },
        data: updateData,
        include: {
          category: {
            select: { name: true },
          },
        },
      })

      // Build detailed message showing what changed
      const changes: Record<string, string> = {
        Product: updatedProduct.name,
        SKU: updatedProduct.sku || 'N/A',
      }

      if (name) changes['Name Updated'] = name
      if (categoryName) changes['Category'] = categoryName
      if (reorderPoint) changes['Reorder Point'] = formatNumber(reorderPoint)
      if (safetyStockLevel) changes['Safety Stock'] = formatNumber(safetyStockLevel)
      if (brand) changes['Brand'] = brand
      if (tags && tags.length > 0) changes['Tags'] = tags.join(', ')
      if (active !== undefined) changes['Status'] = active ? 'Active' : 'Inactive'

      return {
        success: true,
        message: `${formatSuccess('Product details updated')}\n\n${formatKeyValue(changes)}`,
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          sku: updatedProduct.sku,
          category: updatedProduct.category.name,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to update product: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Read-only Tool 5: Get Products
 * Retrieves a list of products from the inventory
 */
export const getProducts = {
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
}

/**
 * Read-only Tool 6: Search Products
 * Search for products by name, SKU, or category
 */
export const searchProducts = {
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
}

/**
 * Read-only Tool 7: Get Inventory Stats
 * Get overall inventory statistics and insights
 */
export const getInventoryStats = {
  description:
    'Get overall inventory statistics and insights. Returns: totalProducts (count), inStock (count), lowStock (count), outOfStock (count), totalCategories (count), estimatedValue (currency string like $1234.56), healthStatus (healthy/warning/critical)',
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
}

/**
 * Read-only Tool 8: Get Low Stock Products
 * Get products that are running low on stock
 */
export const getLowStockProducts = {
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
}

/**
 * Read-only Tool 9: Get Out of Stock Products
 * Get products that are completely out of stock
 */
export const getOutOfStockProducts = {
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
}

// Export only read-only product tools
export const productTools = {
  getProducts,
  searchProducts,
  getInventoryStats,
  getLowStockProducts,
  getOutOfStockProducts,
}

// Write operations kept internal for future use (not exported)
// const productWriteTools = {
//   updateProductStock,
//   updateProductPrice,
//   createProduct,
//   updateProductDetails,
// }
