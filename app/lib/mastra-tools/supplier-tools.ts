/**
 * Supplier and Purchase Order Tools
 *
 * Implements 3 Mastra tools for supplier and purchase order management:
 * 1. listSuppliers - Get list of suppliers
 * 2. createPurchaseOrder - Create new purchase orders
 * 3. updatePurchaseOrderStatus - Update PO status
 *
 * Based on plan.md User Story 5: Supplier and Purchase Order Operations
 */

import type { PurchaseOrderStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../db.server'
import {
  formatCurrency,
  formatDate,
  formatError,
  formatKeyValue,
  formatSuccess,
  formatTable,
} from './tool-formatters'

/**
 * Tool 1: List Suppliers
 * Gets all suppliers with basic information
 */
export const listSuppliers = {
  description:
    'Get a list of all suppliers in the system. Shows supplier names, contact information, and associated products. Use this when a user needs to know available suppliers.',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of suppliers to return (default: 50)'),
    active: z
      .boolean()
      .optional()
      .describe('Filter by active status (default: true shows only active)'),
  }),
  execute: async ({ limit = 50, active = true }: { limit?: number; active?: boolean }) => {
    try {
      const suppliers = await prisma.supplier.findMany({
        where: active ? { active: true } : undefined,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { companyName: 'asc' },
        take: limit,
      })

      if (suppliers.length === 0) {
        return {
          success: true,
          message: 'No suppliers found.',
          suppliers: [],
          total: 0,
        }
      }

      // Format as table
      const tableData = suppliers.map((supplier) => [
        supplier.companyName || supplier.name,
        supplier.email || 'N/A',
        supplier.phone || 'N/A',
        supplier._count.products.toString(),
        supplier.active ? '✓' : '✗',
      ])

      const table = formatTable(['Company', 'Email', 'Phone', 'Products', 'Active'], tableData)

      return {
        success: true,
        message: `Found ${suppliers.length} suppliers\n\n${table}`,
        suppliers: suppliers.map((supplier) => ({
          id: supplier.id,
          companyName: supplier.companyName || supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          productCount: supplier._count.products,
          active: supplier.active,
        })),
        total: suppliers.length,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to list suppliers: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 2: Create Purchase Order
 * Creates a new purchase order to order inventory from a supplier
 */
export const createPurchaseOrder = {
  description:
    'Create a new purchase order to order products from a supplier. Provide supplier ID and order items with product IDs, quantities, and prices.',
  parameters: z.object({
    supplierId: z.string().describe('The ID of the supplier to order from'),
    items: z
      .array(
        z.object({
          productId: z.string().describe('Product ID'),
          quantity: z.number().int().positive().describe('Quantity to order'),
          rate: z.number().positive().describe('Price per unit from supplier'),
        })
      )
      .min(1)
      .describe('Purchase order items'),
    expectedDeliveryDate: z.string().optional().describe('Expected delivery date (ISO format)'),
    reference: z.string().optional().describe('Purchase order reference/notes'),
  }),
  execute: async ({
    supplierId,
    items,
    expectedDeliveryDate,
    reference,
  }: {
    supplierId: string
    items: Array<{ productId: string; quantity: number; rate: number }>
    expectedDeliveryDate?: string
    reference?: string
  }) => {
    try {
      // TODO: Get user context
      const companyId = 'default-company'
      const agencyId = 'default-agency'
      const siteId = 'default-site'

      // Validate supplier
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      })

      if (!supplier) {
        return {
          success: false,
          message: formatError('Supplier not found'),
          error: 'Supplier not found',
        }
      }

      // Validate products
      const products = await prisma.product.findMany({
        where: {
          id: { in: items.map((item) => item.productId) },
        },
      })

      if (products.length !== items.length) {
        return {
          success: false,
          message: formatError('One or more products not found'),
          error: 'Invalid product IDs',
        }
      }

      // Calculate totals
      const orderItems = items.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) throw new Error(`Product ${item.productId} not found`)
        const amount = item.rate * item.quantity
        return { ...item, amount, product }
      })

      const total = orderItems.reduce((sum, item) => sum + item.amount, 0)

      // Generate PO number
      const purchaseOrderNumber = `PO-${Date.now()}`
      const purchaseOrderReference = reference || purchaseOrderNumber

      // Parse expected delivery date
      const deliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined

      // Create purchase order
      const po = await prisma.purchaseOrder.create({
        data: {
          purchaseOrderNumber,
          purchaseOrderReference,
          supplierId,
          companyId,
          agencyId,
          siteId,
          orderDate: new Date(),
          expectedDeliveryDate: deliveryDate,
          status: 'Pending',
          paymentTerms: 'Net30',
          reference,
          purchaseOrderItems: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            })),
          },
        },
        include: {
          purchaseOrderItems: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      })

      // Format items
      const itemsList = po.purchaseOrderItems
        .map(
          (item) =>
            `• ${item.product.name}: ${item.quantity} × ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)}`
        )
        .join('\n')

      return {
        success: true,
        message: `${formatSuccess(`Purchase order created: ${po.purchaseOrderNumber}`)}\n\n${formatKeyValue(
          {
            'PO Number': po.purchaseOrderNumber,
            'PO Reference': po.purchaseOrderReference,
            Supplier: supplier.companyName,
            Status: po.status,
            'Order Date': formatDate(po.orderDate),
            ...(po.expectedDeliveryDate && {
              'Expected Delivery': formatDate(po.expectedDeliveryDate),
            }),
            Total: formatCurrency(total),
          }
        )}\n\n**Items:**\n${itemsList}`,
        purchaseOrder: {
          id: po.id,
          purchaseOrderNumber: po.purchaseOrderNumber,
          totalAmount: total,
          itemCount: items.length,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to create purchase order: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 3: Update Purchase Order Status
 * Updates the status of a purchase order
 */
export const updatePurchaseOrderStatus = {
  description:
    'Update the status of a purchase order. Use this to track the procurement process. Valid statuses: Pending, Issued, PartiallyReceived, Received, Cancelled.',
  parameters: z.object({
    purchaseOrderId: z.string().optional().describe('The unique ID of the purchase order'),
    purchaseOrderNumber: z.string().optional().describe('Alternative: PO number instead of ID'),
    status: z
      .enum(['Pending', 'Issued', 'PartiallyReceived', 'Received', 'Cancelled'])
      .describe('New status for the purchase order'),
  }),
  execute: async ({
    purchaseOrderId,
    purchaseOrderNumber,
    status,
  }: {
    purchaseOrderId?: string
    purchaseOrderNumber?: string
    status: PurchaseOrderStatus
  }) => {
    try {
      if (!purchaseOrderId && !purchaseOrderNumber) {
        return {
          success: false,
          message: formatError('Either purchaseOrderId or purchaseOrderNumber must be provided'),
          error: 'Missing PO identifier',
        }
      }

      const po = await prisma.purchaseOrder.findFirst({
        where: purchaseOrderId ? { id: purchaseOrderId } : { purchaseOrderNumber },
        include: {
          supplier: {
            select: {
              companyName: true,
            },
          },
        },
      })

      if (!po) {
        return {
          success: false,
          message: formatError('Purchase order not found'),
          error: 'Purchase order not found',
        }
      }

      // Update PO status
      const updatedPO = await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status },
      })

      return {
        success: true,
        message: `${formatSuccess(`Purchase order status updated`)}\n\n${formatKeyValue({
          'PO Number': po.purchaseOrderNumber,
          Supplier: po.supplier.companyName,
          'Previous Status': po.status,
          'New Status': status,
        })}`,
        purchaseOrder: {
          id: updatedPO.id,
          purchaseOrderNumber: updatedPO.purchaseOrderNumber,
          previousStatus: po.status,
          newStatus: status,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to update purchase order status: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

// Export only read-only supplier tools
export const supplierTools = {
  listSuppliers,
}

// Write operations kept internal for future use (not exported)
// const supplierWriteTools = {
//   createPurchaseOrder,
//   updatePurchaseOrderStatus,
// }
