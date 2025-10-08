import { PURCHASE_ORDER_STATUSES, SALES_ORDERS_STATUSES } from '~/app/common/constants'
import { getStockStatus } from '~/app/common/helpers/inventories'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function getInventoryAnalytics(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:analytics'])

  try {
    // Get basic inventory metrics
    const totalProducts = await prisma.product.count({
      where: { companyId: user.companyId },
    })

    const products = await prisma.product.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
        sellingPrice: true,
        physicalStockOnHand: true,
        accountingStockOnHand: true,
        availableQuantity: true,
        reorderPoint: true,
        category: {
          select: {
            name: true,
          },
        },
        purchaseOrderItems: {
          select: {
            quantity: true,
            purchaseOrder: {
              select: {
                status: true,
              },
            },
          },
        },
        salesOrderItems: {
          select: {
            quantity: true,
            salesOrder: {
              select: {
                status: true,
              },
            },
          },
        },
        purchaseReceiveItems: {
          select: {
            receivedQuantity: true,
          },
        },
      },
    })

    // Calculate detailed product metrics
    const detailedProducts = products.map((product) => {
      // Calculate quantities ordered (from purchase orders that are not cancelled)
      const qtyOrdered = product.purchaseOrderItems
        .filter(
          (item) =>
            item.purchaseOrder && item.purchaseOrder.status !== PURCHASE_ORDER_STATUSES.CANCELLED
        )
        .reduce((sum, item) => sum + item.quantity, 0)

      // Calculate quantities received (from purchase receives)
      const qtyIn = product.purchaseReceiveItems.reduce(
        (sum, item) => sum + item.receivedQuantity,
        0
      )

      // Calculate quantities sold/out (from sales orders that are not cancelled)
      const qtyOut = product.salesOrderItems
        .filter(
          (item) => item.salesOrder && item.salesOrder.status !== SALES_ORDERS_STATUSES.CANCELLED
        )
        .reduce((sum, item) => sum + item.quantity, 0)

      // Stock on hand (using physical stock)
      const stockOnHand = product.physicalStockOnHand || 0

      // Committed stock (quantities from issued/pending sales orders)
      const committedStock = product.salesOrderItems
        .filter(
          (item) =>
            item.salesOrder &&
            [
              SALES_ORDERS_STATUSES.PENDING,
              SALES_ORDERS_STATUSES.ISSUED,
              SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED,
            ].includes(item.salesOrder.status as any)
        )
        .reduce((sum, item) => sum + item.quantity, 0)

      // Available for sale (stock on hand minus committed)
      const availableForSale = Math.max(0, stockOnHand - committedStock)

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || 'N/A',
        categoryName: product.category?.name || 'Uncategorized',
        qtyOrdered,
        qtyIn,
        qtyOut,
        stockOnHand,
        committedStock,
        availableForSale,
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        reorderPoint: product.reorderPoint || 0,
      }
    })

    // Calculate total inventory value
    const totalValue = detailedProducts.reduce((sum, product) => {
      return sum + product.costPrice * product.stockOnHand
    }, 0)

    // Count low stock and out of stock items using standardized status calculation
    const productsWithCalculatedStatus = detailedProducts.map((product) => ({
      ...product,
      calculatedStatus: getStockStatus({
        accountingStockOnHand: product.stockOnHand,
        reorderPoint: product.reorderPoint,
        status: 'Available', // Default for calculation
      } as any),
    }))

    const lowStockItems = productsWithCalculatedStatus.filter(
      (p) => p.calculatedStatus === 'LowStock'
    ).length

    const outOfStockItems = productsWithCalculatedStatus.filter(
      (p) => p.calculatedStatus === 'OutOfStock'
    ).length

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      products: detailedProducts,
    }
  } catch (error) {
    console.error('Error fetching inventory analytics:', error)
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      products: [],
    }
  }
}
