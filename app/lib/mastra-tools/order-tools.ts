/**
 * Order Management Tools
 *
 * Implements 4 Mastra tools for order and sales operations:
 * 1. viewOrderDetails - Get detailed information about an order
 * 2. listRecentOrders - Get recent sales orders
 * 3. updateOrderStatus - Update the status of an order
 * 4. createSalesOrder - Create a new sales order
 *
 * Based on plan.md User Story 3: Order and Sales Operations
 */

import type { SalesOrderStatus } from '@prisma/client'
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
 * Tool 1: View Order Details
 * Gets complete information about a specific order
 */
export const viewOrderDetails = {
  description:
    'Get detailed information about a specific sales order including customer details, items, quantities, prices, and current status. Use this when a user asks about a specific order.',
  parameters: z.object({
    salesOrderNumber: z
      .string()
      .describe('Sales order number or reference (e.g., "SO-000001" or "000001")'),
  }),
  execute: async ({ salesOrderNumber }: { salesOrderNumber: string }) => {
    try {
      const order = await prisma.salesOrder.findFirst({
        where: {
          OR: [{ salesOrderReference: salesOrderNumber }, { salesOrderNumber: salesOrderNumber }],
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          salesOrderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      })

      if (!order) {
        return {
          success: false,
          message: formatError(
            `\nOrder "${salesOrderNumber}" not found. Please check the order number and try again.`
          ),
          error: 'Order not found',
        }
      }

      // Calculate total amount from items
      const totalAmount = order.salesOrderItems.reduce((sum, item) => sum + item.amount, 0)

      // Format items table
      const itemsTable = formatTable(
        ['Product', 'SKU', 'Quantity', 'Rate', 'Amount'],
        order.salesOrderItems.map((item) => [
          item.product.name,
          item.product.sku || 'N/A',
          item.quantity.toString(),
          formatCurrency(item.rate),
          formatCurrency(item.amount),
        ])
      )

      const orderInfo = formatKeyValue({
        'Order Number': order.salesOrderNumber,
        'Order Reference': order.salesOrderReference,
        Customer: `${order.customer.firstName} ${order.customer.lastName}`,
        Email: order.customer.email || 'N/A',
        Phone: order.customer.phone || 'N/A',
        Status: order.status,
        'Order Date': formatDate(order.orderDate),
        'Total Amount': formatCurrency(totalAmount),
        'Items Count': order.salesOrderItems.length.toString(),
      })

      return {
        success: true,
        message: `Order Details\n\n${orderInfo}\n\n**Items:**\n${itemsTable}`,
        order: {
          id: order.id,
          salesOrderNumber: order.salesOrderNumber,
          status: order.status,
          totalAmount,
          itemCount: order.salesOrderItems.length,
          customer: {
            name: `${order.customer.firstName} ${order.customer.lastName}`,
            email: order.customer.email,
          },
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to get order details: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 2: List Recent Orders
 * Gets a list of recent sales orders
 */
export const listRecentOrders = {
  description:
    'Get a list of recent sales orders with customer information and order totals. Use this to show recent activity or when a user asks about recent orders.',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of orders to return (default: 20)'),
    status: z
      .enum([
        'Pending',
        'Issued',
        'Shipped',
        'PartiallyShipped',
        'Delivered',
        'PartiallyDelivered',
        'Cancelled',
        'Returned',
      ])
      .optional()
      .describe('Filter by order status'),
  }),
  execute: async ({ limit = 20, status }: { limit?: number; status?: SalesOrderStatus }) => {
    try {
      const orders = await prisma.salesOrder.findMany({
        where: status ? { status } : undefined,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          salesOrderItems: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: { orderDate: 'desc' },
        take: limit,
      })

      if (orders.length === 0) {
        return {
          success: true,
          message: status ? `No ${status} orders found.` : 'No orders found.',
          orders: [],
          total: 0,
        }
      }

      // Format as table with calculated totals
      const tableData = orders.map((order) => {
        const total = order.salesOrderItems.reduce((sum, item) => sum + item.amount, 0)
        return [
          order.salesOrderNumber,
          `${order.customer.firstName} ${order.customer.lastName}`,
          formatDate(order.orderDate),
          order.status,
          order.salesOrderItems.length.toString(),
          formatCurrency(total),
        ]
      })

      const table = formatTable(
        ['Order #', 'Customer', 'Date', 'Status', 'Items', 'Total'],
        tableData
      )

      return {
        success: true,
        message: `Found ${orders.length} orders\n\n${table}`,
        orders: orders.map((order) => {
          const total = order.salesOrderItems.reduce((sum, item) => sum + item.amount, 0)
          return {
            id: order.id,
            salesOrderNumber: order.salesOrderNumber,
            customer: `${order.customer.firstName} ${order.customer.lastName}`,
            status: order.status,
            totalAmount: total,
            itemCount: order.salesOrderItems.length,
            orderDate: order.orderDate,
          }
        }),
        total: orders.length,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to list orders: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 3: Update Order Status
 * Updates the status of a sales order
 */
export const updateOrderStatus = {
  description:
    'Update the status of a sales order. Use this to mark orders as shipped, delivered, cancelled, etc. Valid statuses: Pending, Issued, Shipped, PartiallyShipped, Delivered, PartiallyDelivered, Cancelled, Returned.',
  parameters: z.object({
    salesOrderNumber: z
      .string()
      .describe('Sales order number or reference (e.g., "SO-000001" or "000001")'),
    status: z
      .enum([
        'Pending',
        'Issued',
        'Shipped',
        'PartiallyShipped',
        'Delivered',
        'PartiallyDelivered',
        'Cancelled',
        'Returned',
      ])
      .describe('New status for the order'),
  }),
  execute: async ({
    salesOrderNumber,
    status,
  }: {
    salesOrderNumber: string
    status: SalesOrderStatus
  }) => {
    try {
      const order = await prisma.salesOrder.findFirst({
        where: {
          OR: [{ salesOrderReference: salesOrderNumber }, { salesOrderNumber: salesOrderNumber }],
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!order) {
        return {
          success: false,
          message: formatError(`\nOrder "${salesOrderNumber}" not found. Unable to update status.`),
          error: 'Order not found',
        }
      }

      // Update order status
      const updatedOrder = await prisma.salesOrder.update({
        where: { id: order.id },
        data: { status },
      })

      return {
        success: true,
        message: `${formatSuccess(`Order status updated`)}\n\n${formatKeyValue({
          'Order Number': order.salesOrderNumber,
          Customer: `${order.customer.firstName} ${order.customer.lastName}`,
          'Previous Status': order.status,
          'New Status': status,
        })}`,
        order: {
          id: updatedOrder.id,
          salesOrderNumber: updatedOrder.salesOrderNumber,
          previousStatus: order.status,
          newStatus: status,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to update order status: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 4: Create Sales Order
 * Creates a new sales order (simplified version)
 */
export const createSalesOrder = {
  description:
    'Create a new sales order for a customer. Provide customer ID and order items with product IDs, quantities, and prices.',
  parameters: z.object({
    customerId: z.string().describe('The ID of the customer placing the order'),
    items: z
      .array(
        z.object({
          productId: z.string().describe('Product ID'),
          quantity: z.number().int().positive().describe('Quantity to order'),
          rate: z
            .number()
            .positive()
            .optional()
            .describe('Price per unit (uses product selling price if not provided)'),
        })
      )
      .min(1)
      .describe('Order items'),
    salesOrderReference: z.string().optional().describe('Order reference'),
  }),
  execute: async ({
    customerId,
    items,
    salesOrderReference,
  }: {
    customerId: string
    items: Array<{ productId: string; quantity: number; rate?: number }>
    salesOrderReference?: string
  }) => {
    try {
      // TODO: Get user context
      const companyId = 'default-company'
      const agencyId = 'default-agency'
      const siteId = 'default-site'

      // Validate customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      })

      if (!customer) {
        return {
          success: false,
          message: formatError('Customer not found'),
          error: 'Customer not found',
        }
      }

      // Validate products and get prices
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
        const rate = item.rate ?? product.sellingPrice
        const amount = rate * item.quantity
        return { ...item, rate, amount, product }
      })

      const total = orderItems.reduce((sum, item) => sum + item.amount, 0)

      // Generate order number
      const salesOrderNumber = `SO-${Date.now()}`
      const reference = salesOrderReference || salesOrderNumber

      // Create order
      const order = await prisma.salesOrder.create({
        data: {
          salesOrderNumber,
          salesOrderReference: reference,
          customerId,
          companyId,
          agencyId,
          siteId,
          orderDate: new Date(),
          status: 'Pending',
          paymentTerms: 'Net30',
          salesOrderItems: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              status: 'Pending',
            })),
          },
        },
        include: {
          salesOrderItems: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      })

      // Format items
      const itemsList = order.salesOrderItems
        .map(
          (item) =>
            `• ${item.product.name}: ${item.quantity} × ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)}`
        )
        .join('\n')

      return {
        success: true,
        message: `${formatSuccess(`Sales order created: ${order.salesOrderNumber}`)}\n\n${formatKeyValue(
          {
            'Order Number': order.salesOrderNumber,
            'Order Reference': order.salesOrderReference,
            Customer: `${customer.firstName} ${customer.lastName}`,
            Status: order.status,
            Total: formatCurrency(total),
          }
        )}\n\n**Items:**\n${itemsList}`,
        order: {
          id: order.id,
          salesOrderNumber: order.salesOrderNumber,
          totalAmount: total,
          itemCount: items.length,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to create order: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

// Export only read-only order tools
export const orderTools = {
  viewOrderDetails,
  listRecentOrders,
}

// Write operations kept internal for future use (not exported)
// const orderWriteTools = {
//   updateOrderStatus,
//   createSalesOrder,
// }
