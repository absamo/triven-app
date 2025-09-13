import type { PurchaseOrderStatus } from "@prisma/client"
import { BILL_STATUSES, PURCHASE_ORDER_STATUSES } from "~/app/common/constants"
import { type IProduct } from "~/app/common/validations/productSchema"
import { type IPurchaseOrder } from "~/app/common/validations/purchaseOrderSchema"
import { type IPurchaseReceive } from "~/app/common/validations/purchaseReceiveSchema"
import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"

export async function getPurchaseOrders(
  request: Request,
  {
    billId,
    purchaseOrderId,
  }: { billId?: string; purchaseOrderId?: string } = {}
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const purchases = await prisma.purchaseOrder.findMany({
    where: {
      companyId: user.companyId,
      id: purchaseOrderId,
      bills: billId ? { some: { id: billId } } : undefined,
    },
    include: {
      supplier: true,
      agency: true,
      purchaseOrderItems: { include: { product: true } },
      company: { select: { currencies: true } },
      purchaseReceives: true,
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return purchases || []
}

export async function getPurchaseOrdersWithoutCancelledBills(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      companyId: user.companyId,
      status: { notIn: [PURCHASE_ORDER_STATUSES.CANCELLED] },
      bills: {
        none: {
          status: {
            in: [
              BILL_STATUSES.UNPAID,
              BILL_STATUSES.PARTIALLYPAID,
              BILL_STATUSES.PAID,
              BILL_STATUSES.OVERPAID,
            ],
          },
        },
      },
    },
    include: {
      purchaseOrderItems: { include: { product: true } },
    },

    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return purchaseOrders || []
}

export async function getFilteredPurchaseOrders(
  request: Request,
  {
    search,
    statuses,
    date,
    purchaseOrders,
  }: {
    search: string | null
    statuses: string[] | null
    date: Date | null
    purchaseOrders: string[]
  }
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const currentSearch = !!search || search === ""

  return (
    (await prisma.purchaseOrder.findMany({
      where: {
        companyId: user.companyId,
        OR: currentSearch
          ? [
            {
              purchaseOrderReference: {
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
              supplier: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          ]
          : undefined,
        AND: [
          {
            status:
              (statuses || []).length > 0
                ? {
                  in: statuses as PurchaseOrderStatus[],
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
            purchaseOrderReference:
              purchaseOrders.length > 0
                ? {
                  in: purchaseOrders,
                }
                : undefined,
          },
        ],
      },
      include: {
        supplier: true,
        agency: true,
        purchaseOrderItems: { include: { product: true } },
        company: { select: { currencies: true } },
        purchaseReceives: true,
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    })) || []
  )
}

export async function getFilteredPurchaseOrdersByStatus(
  request: Request,
  statuses: string[]
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const suppliers = await prisma.purchaseOrder.findMany({
    where: {
      companyId: user.companyId,
      status:
        statuses.length > 0
          ? {
            in: statuses as PurchaseOrderStatus[],
          }
          : undefined,
    },
    include: {
      supplier: true,
      agency: true,
      purchaseOrderItems: { include: { product: true } },
      company: { select: { currencies: true } },
      purchaseReceives: true,
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return suppliers || []
}

export async function getUnreceivedPurchaseOrders(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const purchases = await prisma.purchaseOrder.findMany({
    where: {
      companyId: user.companyId,
      status: {
        in: [
          PURCHASE_ORDER_STATUSES.ISSUED,
          PURCHASE_ORDER_STATUSES.PENDING,
          PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
        ],
      },
      purchaseReceives: {
        every: {
          status: {
            notIn: [
              PURCHASE_ORDER_STATUSES.RECEIVED,
              PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
              PURCHASE_ORDER_STATUSES.PENDING,
            ],
          },
        },
      },
    },
    include: {
      purchaseOrderItems: { include: { product: true } },
      purchaseReceives: true,
    },

    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return purchases || []
}

export async function getPurchaseOrder(
  request: Request,
  purchaseOrderId: IPurchaseOrder["id"]
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      site: true,
      supplier: true,
      purchaseOrderItems: {
        include: { product: true },
        orderBy: [
          {
            productId: "desc",
          },
        ],
      },
      agency: true,
      purchaseReceives: {
        include: {
          purchaseReceiveItems: {
            include: { purchaseReceive: { include: { purchaseOrder: true } } },
          },
        },
      },
      company: { select: { currencies: true } },
      bills: true,
    },
  })

  return purchaseOrder
}

export async function getPurchaseOrdersByProductId(
  request: Request,
  productId: IProduct["id"]
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const purchases = await prisma.purchaseOrder.findMany({
    where: {
      companyId: user.companyId,
      purchaseOrderItems: { some: { productId } },
    },
    include: {
      supplier: true,
      purchaseOrderItems: { include: { product: true } },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return purchases || []
}

export async function getMaxPurchaseOrderNumber(
  request: Request
): Promise<string> {
  const user = await requireBetterAuthUser(request, ["read:purchaseOrders"])

  const aggregatePurchaseOrderNumber = await prisma.purchaseOrder.aggregate({
    where: { companyId: user.companyId },
    _max: {
      purchaseOrderNumber: true,
    },
  })

  const purchaseOrderNumber =
    parseInt(
      aggregatePurchaseOrderNumber?._max.purchaseOrderNumber || "00000"
    ) + 1

  return purchaseOrderNumber.toString().padStart(5, "0")
}

export async function createPurchaseOrder(
  request: Request,
  purchaseOrder: IPurchaseOrder
) {
  const user = await requireBetterAuthUser(request, ["create:purchaseOrders"])

  const foundPurchaseOrder = await prisma.purchaseOrder.findFirst({
    where: {
      purchaseOrderReference: purchaseOrder?.purchaseOrderReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundPurchaseOrder) {
    return {
      errors: {
        purchaseOrderReference:
          "A purchase order already exists with this reference",
      },
    }
  }
  try {
    const purchaseOrderNumber = await getMaxPurchaseOrderNumber(request)

    await prisma.purchaseOrder.create({
      data: {
        purchaseOrderReference: purchaseOrder.purchaseOrderReference,
        purchaseOrderNumber,
        companyId: user.companyId,
        supplierId: purchaseOrder.supplierId,
        siteId: purchaseOrder.siteId,
        agencyId: purchaseOrder.agencyId,
        status: PURCHASE_ORDER_STATUSES.PENDING,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        orderDate: new Date(purchaseOrder.orderDate),
        purchaseOrderItems: {
          create: purchaseOrder.purchaseOrderItems as any,
        },
        paymentTerms: purchaseOrder.paymentTerms,
      },
    })

    return {
      notification: {
        message: "Purchase order created successfully",
        status: "Success",
        redirectTo: "/purchase-orders",
      },
    }
  } catch {
    return {
      notification: {
        message: "Purchase order could not be created",
        status: "Error",
      },
    }
  }
}

export async function updatePurchaseOrder(
  request: Request,
  purchaseOrder: IPurchaseOrder
) {
  const user = await requireBetterAuthUser(request, ["update:purchaseOrders"])

  const foundPurchaseOrder = await prisma.purchaseOrder.findFirst({
    where: {
      purchaseOrderReference: purchaseOrder?.purchaseOrderReference,
      id: { not: purchaseOrder.id },
      companyId: user.companyId,
    },
  })

  if (foundPurchaseOrder) {
    return {
      errors: {
        purchaseOrderReference:
          "A purchase order already exists with this reference",
      },
    }
  }

  try {
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        purchaseOrderReference: purchaseOrder.purchaseOrderReference,
        supplier: { connect: { id: purchaseOrder.supplierId } },
        site: { connect: { id: purchaseOrder.siteId } },
        agency: { connect: { id: purchaseOrder.agencyId } },
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        orderDate: purchaseOrder.orderDate,
        purchaseOrderItems: {
          deleteMany: {},
          create: purchaseOrder.purchaseOrderItems as any,
        },
        paymentTerms: purchaseOrder.paymentTerms,
      },
    })

    return {
      notification: {
        message: "Purchase order updated successfully",
        status: "Success",
        redirectTo: "/purchase-orders",
      },
    }
  } catch {
    return {
      notification: {
        message: "Purchase order could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function updatePurchaseOrderStatus(
  request: Request,
  {
    purchaseOrderId,
    status,
  }: { purchaseOrderId: IPurchaseOrder["id"]; status: IPurchaseOrder["status"] }
) {
  const user = await requireBetterAuthUser(request, ["update:purchaseOrders"])

  try {
    if (status === PURCHASE_ORDER_STATUSES.CANCELLED) {
      const purchaseReceives = await prisma.purchaseReceive.findMany({
        where: {
          purchaseOrderId,
          status: { not: PURCHASE_ORDER_STATUSES.CANCELLED },
        },
      })

      if (purchaseReceives.length > 0) {
        return {
          notification: {
            message:
              "Purchase order cannot be cancelled because a purchase receive has been created on this purchase order",
            status: "Error",
            autoClose: false,
          },
        }
      }

      const bills =
        (await prisma.bill.findMany({
          where: {
            purchaseOrderId,
            status: {
              not: BILL_STATUSES.CANCELLED,
            },
          },
        })) || []

      if (bills.length > 0) {
        return {
          notification: {
            message:
              "Purchase order cannot be cancelled because a bill has been created on this purchase order",
            status: "Error",
            autoClose: false,
          },
        }
      }
    }

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status,
      },
    })

    return {
      notification: {
        message: "Purchase order status updated successfully",
        status: "Success",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Purchase order status could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function getFilteredPurchaseReceives(
  request: Request,
  {
    search,
    statuses,
    purchaseOrders,
    date: receivedDate,
  }: {
    search: string | null
    statuses: string[]
    purchaseOrders: string[]
    date: Date | null
  }
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseReceives"])

  const currentSearch = !!search || search === ""

  const purchaseReceives = await prisma.purchaseReceive.findMany({
    where: {
      companyId: user.companyId,
      OR: currentSearch
        ? [
          {
            purchaseReceiveReference: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            purchaseOrder: {
              supplier: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        ]
        : undefined,
      AND: [
        {
          status:
            statuses.length > 0
              ? {
                in: statuses as PurchaseOrderStatus[],
              }
              : undefined,
        },
        {
          receivedDate: receivedDate
            ? {
              gte: receivedDate,
            }
            : undefined,
        },
        {
          purchaseOrder:
            purchaseOrders.length > 0
              ? { purchaseOrderReference: { in: purchaseOrders } }
              : undefined,
        },
      ],
    },
    include: {
      purchaseOrder: {
        include: {
          supplier: true,
          purchaseOrderItems: true,
        },
      },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return purchaseReceives || []
}

export async function getPurchaseReceives(
  request: Request,
  { purchaseOrderReference }: { purchaseOrderReference?: string } = {}
) {
  const user = await requireBetterAuthUser(request, ["read:purchaseReceives"])

  const purchaseReceives = await prisma.purchaseReceive.findMany({
    where: {
      companyId: user.companyId,
      purchaseOrder: { purchaseOrderReference },
    },
    include: {
      purchaseOrder: {
        include: {
          purchaseOrderItems: true,
          supplier: true,
        },
      },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return purchaseReceives || []
}

export async function getMaxPurchaseReceiveNumber(
  request: Request
): Promise<string> {
  const user = await requireBetterAuthUser(request, ["read:purchaseReceives"])

  const aggregatePurchaseReceivedNumber =
    await prisma.purchaseReceive.aggregate({
      where: { companyId: user.companyId },
      _max: {
        purchaseReceiveNumber: true,
      },
    })

  const purchaseReceiveNumber =
    parseInt(
      aggregatePurchaseReceivedNumber?._max.purchaseReceiveNumber || "00000"
    ) + 1

  return purchaseReceiveNumber.toString().padStart(5, "0")
}

export async function getPurchaseReceive(
  purchaseReceiveId: IPurchaseOrder["id"]
) {
  const purchaseReceive = await prisma.purchaseReceive.findUnique({
    where: {
      id: purchaseReceiveId,
    },
    include: {
      purchaseOrder: true,
      purchaseReceiveItems: {
        include: {
          product: true,
          purchaseReceive: {
            include: {
              purchaseOrder: true,
            },
          },
        },
      },
    },
  })

  return purchaseReceive
}

export async function createPurchaseReceive(
  request: Request,
  purchaseReceive: IPurchaseReceive
) {
  const user = await requireBetterAuthUser(request, ["create:purchaseReceives"])

  const foundPurchaseReceive = await prisma.purchaseReceive.findFirst({
    where: {
      purchaseReceiveReference: purchaseReceive?.purchaseReceiveReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundPurchaseReceive) {
    return {
      errors: {
        purchaseReceiveReference:
          "A purchase receive already exists with this reference",
      },
    }
  }
  try {
    const purchaseReceiveNumber = await getMaxPurchaseReceiveNumber(request)

    const purchaseReceiveItems = purchaseReceive.purchaseReceiveItems || []

    const receivedQuantity = purchaseReceiveItems.reduce(
      (acc, item) => acc + item.receivedQuantity,
      0
    )

    const purchaseOrderItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: purchaseReceive.purchaseOrderId },
    })

    const orderedQuantity = purchaseOrderItems.reduce(
      (acc, item) => acc + item.quantity,
      0
    )

    let status: IPurchaseOrder["status"] = PURCHASE_ORDER_STATUSES.PENDING

    if (receivedQuantity > 0) {
      status =
        orderedQuantity === receivedQuantity
          ? PURCHASE_ORDER_STATUSES.RECEIVED
          : PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
    }

    await prisma.purchaseReceive.create({
      data: {
        purchaseReceiveReference: purchaseReceive.purchaseReceiveReference,
        purchaseReceiveNumber,
        companyId: user.companyId,
        receivedDate: new Date(purchaseReceive.receivedDate),
        purchaseOrderId: purchaseReceive.purchaseOrderId,
        receivedQuantity: purchaseReceive.receivedQuantity || 0,
        status,
        purchaseReceiveItems: {
          create: (purchaseReceive.purchaseReceiveItems || []).map((item) => ({
            purchaseOrderId: item.purchaseOrderId,
            productId: item.productId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
          })) as any,
        },
      },
    })

    await prisma.purchaseOrder.update({
      where: { id: purchaseReceive.purchaseOrderId },
      data: {
        status,
      },
    })

    return {
      notification: {
        message: "Purchase receive created successfully",
        status: "Success",
        redirectTo: "/purchase-receives",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Purchase receive could not be created",
        status: "Error",
      },
    }
  }
}

export async function updatePurchaseReceive(
  request: Request,
  purchaseReceive: IPurchaseReceive
) {
  const user = await requireBetterAuthUser(request, ["update:purchaseReceives"])

  const foundPurchaseReceive = await prisma.purchaseReceive.findFirst({
    where: {
      purchaseReceiveReference: purchaseReceive?.purchaseReceiveReference,
      companyId: user.companyId,
      id: { not: purchaseReceive.id },
    } as any,
  })

  if (foundPurchaseReceive) {
    return {
      errors: {
        purchaseReceiveReference:
          "A purchase receive already exists with this reference",
      },
    }
  }

  try {
    const purchaseReceiveItems = purchaseReceive.purchaseReceiveItems || []

    const receivedQuantity = purchaseReceiveItems.reduce(
      (acc, item) => acc + item.receivedQuantity,
      0
    )

    const purchaseOrderItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: purchaseReceive.purchaseOrderId },
    })

    const orderedQuantity = purchaseOrderItems.reduce(
      (acc, item) => acc + item.quantity,
      0
    )

    let status: IPurchaseOrder["status"] = PURCHASE_ORDER_STATUSES.PENDING

    if (receivedQuantity > 0) {
      status =
        orderedQuantity === receivedQuantity
          ? PURCHASE_ORDER_STATUSES.RECEIVED
          : PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
    }

    await prisma.purchaseReceive.update({
      where: { id: purchaseReceive.id },
      data: {
        purchaseReceiveReference: purchaseReceive.purchaseReceiveReference,
        receivedDate: new Date(purchaseReceive.receivedDate),
        receivedQuantity: purchaseReceive.receivedQuantity,
        status,
        purchaseReceiveItems: {
          deleteMany: {},
          create: (purchaseReceive.purchaseReceiveItems || []).map((item) => ({
            purchaseOrderId: item.purchaseOrderId,
            productId: item.productId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
          })),
        },
      },
    })

    await prisma.purchaseOrder.update({
      where: { id: purchaseReceive.purchaseOrderId },
      data: {
        status:
          status === PURCHASE_ORDER_STATUSES.PENDING
            ? PURCHASE_ORDER_STATUSES.ISSUED
            : status,
      },
    })

    return {
      notification: {
        message: "Purchase receive updated successfully",
        status: "Success",
        redirectTo: "/purchase-receives",
      },
    }
  } catch {
    return {
      notification: {
        message: "Purchase receive could not be updated",
        status: "Error",
      },
    }
  }
}

export async function updatePurchaseReceiveStatus(
  request: Request,
  {
    purchaseReceiveId,
    status,
  }: {
    purchaseReceiveId: IPurchaseReceive["id"]
    status: IPurchaseReceive["status"]
  }
) {
  const user = await requireBetterAuthUser(request, ["update:purchaseReceives"])

  try {
    await prisma.purchaseReceive.update({
      where: { id: purchaseReceiveId },
      data: {
        status,
        purchaseOrder: {
          update: {
            status:
              status === PURCHASE_ORDER_STATUSES.CANCELLED
                ? PURCHASE_ORDER_STATUSES.ISSUED
                : status,
          },
        },
      },
    })

    return {
      notification: {
        message: "Purchase receive status updated successfully",
        status: "Success",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Purchase receive status could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}
