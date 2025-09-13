import type { Prisma, SalesOrderStatus } from "@prisma/client"
import { type ISalesOrder } from "~/app/common/validations/salesOrderSchema"
import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import { emitter } from "~/app/utils/emitter.server"
import { BACKORDER_ITEM_STATUSES, BACKORDER_STATUSES, INVOICE_STATUSES, SALES_ORDERS_STATUSES } from "../common/constants"
import { type IProduct } from "../common/validations/productSchema"
import { getMaxBackorderNumber } from "./backorders.server"

export async function getSalesOrders(
  request: Request,
  { salesOrderId }: { salesOrderId?: string } = {}
) {
  const user = await requireBetterAuthUser(request, ["read:salesOrders"])



  const salesOrders = await prisma.salesOrder.findMany({
    where: { companyId: user.companyId as string, id: salesOrderId },
    include: {
      customer: true,
      agency: true,
      company: { select: { currencies: true } },
      salesOrderItems: { include: { product: true } },
      invoices: {
        where: {
          status: {
            notIn: [INVOICE_STATUSES.CANCELLED],
          },
        },
      },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return salesOrders || []
}

export async function getSalesOrdersByProductId(
  request: Request,
  productId: IProduct["id"]
) {
  const user = await requireBetterAuthUser(request, ["read:salesOrders"])

  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      companyId: user.companyId as string,
      salesOrderItems: { some: { productId } },
    },
    include: {
      customer: true,
      salesOrderItems: {
        include: { product: true, salesOrder: true },
      },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })


  return salesOrders || []
}

export async function getSalesOrdersToInvoice(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:salesOrders"])

  const sales = await prisma.salesOrder.findMany({
    where: {
      companyId: user.companyId as string,
      status: { notIn: [SALES_ORDERS_STATUSES.CANCELLED] },
      invoices: {
        none: {
          status: {
            in: [
              INVOICE_STATUSES.PARTIALLYPAID,
              INVOICE_STATUSES.PAID,
              INVOICE_STATUSES.OVERPAID,
            ],
          },
        },
      },
    },
    include: {
      salesOrderItems: { include: { product: true } },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return sales || []
}

export async function getSalesOrder(salesOrderId: ISalesOrder["id"]) {
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      site: true,
      customer: true,
      salesOrderItems: {
        select: {
          id: true,
          quantity: true,
          rate: true,
          tax: true,
          amount: true,
          status: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              costPrice: true,
              status: true,
            },
          },
          backorderItem: {
            include: {
              backorder: {
                select: {
                  id: true,
                  backorderReference: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            productId: "desc",
          },
        ],
      },
      agency: true,
      company: { select: { currencies: true } },
    },
  })

  return salesOrder
}

export async function getFilteredSalesOrders(
  request: Request,
  {
    search,
    statuses,
    date,
    salesOrders,
  }: {
    search: string | null
    statuses: string[] | null
    date: Date | null
    salesOrders: string[]
  }
) {
  const user = await requireBetterAuthUser(request, ["read:salesOrders"])

  const currentSearch = !!search || search === ""

  return (
    (await prisma.salesOrder.findMany({
      where: {
        companyId: user.companyId as string,
        OR: currentSearch
          ? [
            {
              salesOrderReference: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              agency: {
                name: { contains: search, mode: "insensitive" },
              },
            },
            {
              customer: {
                OR: [
                  {
                    firstName: { contains: search, mode: "insensitive" },
                  },
                  {
                    lastName: { contains: search, mode: "insensitive" },
                  },
                ],
              },
            },
          ]
          : undefined,
        AND: [
          {
            status:
              (statuses || []).length > 0
                ? {
                  in: statuses as SalesOrderStatus[],
                }
                : undefined,
          },
          {
            orderDate: date
              ? {
                gte: date,
              }
              : undefined,
          },
          {
            salesOrderReference:
              salesOrders.length > 0
                ? {
                  in: salesOrders,
                }
                : undefined,
          },
        ],
      },
      include: {
        customer: true,
        agency: true,
        salesOrderItems: { include: { product: true } },
        company: { select: { currencies: true } },
        invoices: true,
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    })) || []
  )
}

export async function getMaxSalesOrderNumber(
  request: Request
): Promise<string> {
  const user = await requireBetterAuthUser(request, ["read:salesOrders"])

  const aggregateSalesOrderNumber = await prisma.salesOrder.aggregate({
    where: { companyId: user.companyId as string },
    _max: {
      salesOrderNumber: true,
    },
  })

  const salesOrderNumber =
    parseInt(aggregateSalesOrderNumber?._max.salesOrderNumber || "00000") + 1

  return salesOrderNumber.toString().padStart(5, "0")
}

export async function createSalesOrder(
  request: Request,
  salesOrder: ISalesOrder
) {
  const user = await requireBetterAuthUser(request, ["create:salesOrders"])

  const foundSalesOrder = await prisma.salesOrder.findFirst({
    where: {
      salesOrderReference: salesOrder?.salesOrderReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundSalesOrder) {
    return {
      errors: {
        salesOrderReference: "A sales order already exists with this reference",
      },
    }
  }
  try {
    const salesOrderNumber = await getMaxSalesOrderNumber(request)

    await prisma.salesOrder.create({
      data: {
        status: SALES_ORDERS_STATUSES.PENDING,
        expectedShipmentDate: salesOrder.expectedShipmentDate,
        orderDate: new Date(salesOrder.orderDate),
        salesOrderReference: salesOrder.salesOrderReference,
        salesOrderNumber,
        company: {
          connect: {
            id: user.companyId as string,
          },
        },
        customer: {
          connect: {
            id: salesOrder.customerId,
          },
        },
        site: {
          connect: {
            id: salesOrder.siteId,
          },
        },
        agency: {
          connect: {
            id: salesOrder.agencyId,
          },
        },
        salesOrderItems: {
          create: salesOrder.salesOrderItems?.map((item) => ({
            ...item,
            status: SALES_ORDERS_STATUSES.PENDING,
          })) as Prisma.SalesOrderItemCreateWithoutSalesOrderInput[],
        },
        paymentTerms: salesOrder.paymentTerms,
      },
    })

    // Emit dashboard update event for real-time updates
    emitter.emit("dashboard-updates", {
      action: "sales_order_created",
      salesOrderReference: salesOrder.salesOrderReference,
      itemCount: salesOrder.salesOrderItems?.length || 0,
      totalAmount: salesOrder.salesOrderItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
      timestamp: Date.now(),
      companyId: user.companyId,
    })

    return {
      notification: {
        message: "Sales order created successfully",
        status: "Success",
        redirectTo: "/sales-orders",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Sales order could not be created",
        status: "Error",
      },
    }
  }
}

export async function updateSalesOrder(
  request: Request,
  salesOrder: ISalesOrder
) {
  const user = await requireBetterAuthUser(request, ["update:salesOrders"])

  const foundSalesOrder = await prisma.salesOrder.findFirst({
    where: {
      salesOrderReference: salesOrder?.salesOrderReference,
      id: { not: salesOrder.id },
      companyId: user.companyId as string,
    },
  })

  if (foundSalesOrder) {
    return {
      errors: {
        salesOrderReference: "A sales order already exists with this reference",
      },
    }
  }

  try {
    await prisma.salesOrder.update({
      where: { id: salesOrder.id },
      data: {
        salesOrderReference: salesOrder.salesOrderReference,
        customer: {
          connect: {
            id: salesOrder.customerId,
          },
        },
        site: {
          connect: {
            id: salesOrder.siteId,
          },
        },
        agency: {
          connect: {
            id: salesOrder.agencyId,
          },
        },
        expectedShipmentDate: salesOrder.expectedShipmentDate,
        orderDate: salesOrder.orderDate,
        salesOrderItems: {
          deleteMany: {},
          create: salesOrder.salesOrderItems?.map((item) => ({
            ...item,
            status: SALES_ORDERS_STATUSES.PENDING,
          })) as Prisma.SalesOrderItemCreateWithoutSalesOrderInput[],
        },
        paymentTerms: salesOrder.paymentTerms,
      },
    })

    // Emit dashboard update event for real-time updates
    emitter.emit("dashboard-updates", {
      action: "sales_order_updated",
      salesOrderReference: salesOrder.salesOrderReference,
      itemCount: salesOrder.salesOrderItems?.length || 0,
      totalAmount: salesOrder.salesOrderItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
      timestamp: Date.now(),
      companyId: user.companyId,
    })

    return {
      notification: {
        message: "Sales order updated successfully",
        status: "Success",
        redirectTo: "/sales-orders",
      },
    }
  } catch {
    return {
      notification: {
        message: "Sales order could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function updateSalesOrderStatus(
  request: Request,
  {
    salesOrderId,
    status,
  }: { salesOrderId: ISalesOrder["id"]; status: ISalesOrder["status"] }
) {
  const user = await requireBetterAuthUser(request, ["update:salesOrders"])

  try {
    const invoices =
      (await prisma.invoice.findMany({
        where: {
          salesOrderId,
          status: {
            not: INVOICE_STATUSES.CANCELLED,
          },
        },
      })) || []

    if (invoices.length > 0) {
      return {
        notification: {
          message:
            "Sales order status could not be cancelled because an invoice has been created for this sales order",
          status: "Error",
          autoClose: false,
        },
      }
    }

    await prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        status,
      },
    })

    return {
      notification: {
        message: "Sales order status updated successfully",
        status: "Success",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Sales order status could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

/**
 * Check stock availability and create backorders for out-of-stock items
 */
export async function processSalesOrderStockCheck(
  request: Request,
  salesOrderId: string
) {
  const user = await requireBetterAuthUser(request, ["update:salesOrders"])

  // Get sales order with items and product stock information
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      salesOrderItems: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!salesOrder) {
    throw new Error("Sales order not found")
  }

  const outOfStockItems: Array<{
    salesOrderItemId: string
    productId: string
    requestedQuantity: number
    availableQuantity: number
    rate: number
  }> = []

  // Check stock availability for each item
  for (const item of salesOrder.salesOrderItems) {
    const availableQuantity = item.product.availableQuantity || 0

    if (availableQuantity < item.quantity) {
      outOfStockItems.push({
        salesOrderItemId: item.id,
        productId: item.productId,
        requestedQuantity: item.quantity,
        availableQuantity,
        rate: item.rate,
      })
    }
  }

  // If there are out-of-stock items, create a backorder
  if (outOfStockItems.length > 0) {
    return await createBackorderFromSalesOrder(request, {
      salesOrderId,
      outOfStockItems,
    })
  }

  // All items in stock, mark sales order as confirmed
  await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: { status: SALES_ORDERS_STATUSES.ISSUED },
  })

  return {
    notification: {
      message: "Sales order confirmed - all items in stock",
      status: "Success",
    },
  }
}

/**
 * Create backorder from sales order out-of-stock items
 */
export async function createBackorderFromSalesOrder(
  request: Request,
  {
    salesOrderId,
    outOfStockItems,
  }: {
    salesOrderId: string
    outOfStockItems: Array<{
      salesOrderItemId: string
      productId: string
      requestedQuantity: number
      availableQuantity: number
      rate: number
    }>
  }
) {
  const user = await requireBetterAuthUser(request, ["create:backorders"])

  // Get sales order details
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { company: true },
  })

  if (!salesOrder) {
    throw new Error("Sales order not found")
  }

  // Generate backorder reference
  const backorderReference = await getMaxBackorderNumber(request)

  // Create the backorder
  const backorder = await prisma.backorder.create({
    data: {
      backorderReference,
      backorderNumber: backorderReference,
      customerId: salesOrder.customerId,
      salesOrderId: salesOrder.id,
      status: BACKORDER_STATUSES.PENDING,
      originalOrderDate: salesOrder.orderDate,
      agencyId: salesOrder.agencyId,
      companyId: salesOrder.companyId,
      siteId: salesOrder.siteId,
      notes: `Auto-created from Sales Order ${salesOrder.salesOrderReference}`,
    },
  })

  // Create backorder items for out-of-stock products
  const backorderItems = await Promise.all(
    outOfStockItems.map(async (item) => {
      const shortageQuantity = item.requestedQuantity - item.availableQuantity

      return await prisma.backorderItem.create({
        data: {
          backorderId: backorder.id,
          productId: item.productId,
          salesOrderItemId: item.salesOrderItemId,
          orderedQuantity: shortageQuantity,
          fulfilledQuantity: 0,
          remainingQuantity: shortageQuantity,
          rate: item.rate,
          amount: shortageQuantity * item.rate,
          status: BACKORDER_ITEM_STATUSES.PENDING,
        },
      })
    })
  )

  // Update sales order status to indicate partial fulfillment
  await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: { status: SALES_ORDERS_STATUSES.PARTIALLY_SHIPPED },
  })

  return {
    backorder,
    backorderItems,
    notification: {
      message: `Backorder ${backorderReference} successfully created.`,
      status: "Success",
    },
  }
}

/**
 * Fulfill backorder item and update related sales order status
 */
export async function fulfillBackorderItem(
  request: Request,
  backorderItemId: string,
  fulfilledQuantity: number
) {
  const user = await requireBetterAuthUser(request, ["update:backorders"])

  // Update the backorder item
  const backorderItem = await prisma.backorderItem.update({
    where: { id: backorderItemId },
    data: {
      fulfilledQuantity: {
        increment: fulfilledQuantity,
      },
      remainingQuantity: {
        decrement: fulfilledQuantity,
      },
    },
    include: {
      backorder: {
        include: {
          salesOrder: true,
          backorderItems: true,
        },
      },
    },
  })

  // Update backorder item status
  const newItemStatus = backorderItem.remainingQuantity <= 0
    ? BACKORDER_ITEM_STATUSES.FULFILLED
    : BACKORDER_ITEM_STATUSES.PARTIALLY_FULFILLED

  await prisma.backorderItem.update({
    where: { id: backorderItemId },
    data: { status: newItemStatus },
  })

  // Check if all backorder items are fulfilled
  const allItemsFulfilled = backorderItem.backorder.backorderItems.every(
    (item: any) => item.id === backorderItemId
      ? backorderItem.remainingQuantity <= 0
      : item.remainingQuantity <= 0
  )

  // Update backorder status
  if (allItemsFulfilled) {
    await prisma.backorder.update({
      where: { id: backorderItem.backorderId },
      data: { status: BACKORDER_STATUSES.FULFILLED },
    })

    // Check if all backorders for the sales order are fulfilled
    if (backorderItem.backorder.salesOrderId) {
      const remainingBackorders = await prisma.backorder.findMany({
        where: {
          salesOrderId: backorderItem.backorder.salesOrderId,
          status: { not: BACKORDER_STATUSES.FULFILLED },
        },
      })

      // If no remaining backorders, update sales order to delivered
      if (remainingBackorders.length === 0) {
        await prisma.salesOrder.update({
          where: { id: backorderItem.backorder.salesOrderId },
          data: { status: SALES_ORDERS_STATUSES.DELIVERED },
        })
      }
    }
  } else {
    // Some items still pending, mark as partial
    await prisma.backorder.update({
      where: { id: backorderItem.backorderId },
      data: { status: BACKORDER_STATUSES.PARTIAL },
    })
  }

  return {
    backorderItem,
    notification: {
      message: "Backorder item fulfilled successfully",
      status: "Success",
    },
  }
}

/**
 * Get backorders for a specific sales order
 */
export async function getBackordersForSalesOrder(salesOrderId: string) {
  return await prisma.backorder.findMany({
    where: { salesOrderId },
    include: {
      backorderItems: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
    },
  })
}

/**
 * Get sales order backorder summary
 */
export async function getSalesOrderBackorderSummary(salesOrderId: string) {
  const backorders = await getBackordersForSalesOrder(salesOrderId)

  const summary = {
    totalBackorders: backorders.length,
    pendingBackorders: backorders.filter((bo: any) => bo.status === BACKORDER_STATUSES.PENDING).length,
    partialBackorders: backorders.filter((bo: any) => bo.status === BACKORDER_STATUSES.PARTIAL).length,
    fulfilledBackorders: backorders.filter((bo: any) => bo.status === BACKORDER_STATUSES.FULFILLED).length,
    cancelledBackorders: backorders.filter((bo: any) => bo.status === BACKORDER_STATUSES.CANCELLED).length,
    totalBackorderedItems: backorders.reduce((total: number, bo: any) => total + bo.backorderItems.length, 0),
    totalBackorderedValue: backorders.reduce((total: number, bo: any) =>
      total + bo.backorderItems.reduce((itemTotal: number, item: any) => itemTotal + item.amount, 0), 0
    ),
  }

  return { backorders, summary }
}
