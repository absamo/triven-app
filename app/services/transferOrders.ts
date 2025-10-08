import type { Prisma } from '@prisma/client'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { triggerWorkflow } from '~/app/services/workflow.server'
import { TRANSFER_ORDER_STATUSES, WORKFLOW_TRIGGER_TYPES } from '../common/constants'
import type { ISite } from '../common/validations/siteSchema'
import type { ITransferOrder } from '../common/validations/transferOrderSchema'

export async function getTransferOrders(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:transferOrders'])

  const transferOrders = await prisma.transferOrder.findMany({
    where: { companyId: user.companyId! },
    include: {
      siteFrom: { include: { location: true } },
      siteTo: { include: { location: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return transferOrders || []
}

export async function getTransferOrder(transferOrderId: ITransferOrder['id']) {
  const transferOrder = await prisma.transferOrder.findUnique({
    where: { id: transferOrderId },
    include: {
      siteFrom: { include: { location: true } },
      siteTo: { include: { location: true } },
      transferOrderItems: {
        include: {
          product: true,
        },
      },
    },
  })

  return transferOrder
}

export async function getTransferOrdersBySite(request: Request, siteId: ISite['id']) {
  const user = await requireBetterAuthUser(request, ['read:transferOrders'])

  const transferOrders = await prisma.transferOrder.findMany({
    where: { companyId: user.companyId!, siteFromId: siteId },
    orderBy: { createdAt: 'desc' },
  })

  return transferOrders || []
}

export async function getMaxTransferOrderNumber(request: Request): Promise<string> {
  const user = await requireBetterAuthUser(request, ['read:transferOrders'])

  const aggregateTransferOrderNumber = await prisma.transferOrder.aggregate({
    where: { companyId: user.companyId! },
    _max: {
      transferOrderNumber: true,
    },
  })

  const transferOrderNumber =
    parseInt(aggregateTransferOrderNumber?._max?.transferOrderNumber || '00000') + 1

  return transferOrderNumber.toString().padStart(5, '0')
}

// Helper function to format transfer order details for display
function formatTransferOrderDetails(transferOrder: any): string {
  const itemCount = transferOrder.transferOrderItems?.length || 0
  const fromSite = transferOrder.siteFrom?.name || 'Unknown'
  const toSite = transferOrder.siteTo?.name || 'Unknown'

  return `
📦 Products

${itemCount} items

📍 From

${fromSite}

📍 To

${toSite}
`.trim()
}

export async function createTransferOrder(request: Request, transferOrder: ITransferOrder) {
  const user = await requireBetterAuthUser(request, ['create:transferOrders'])

  const foundTransferOrder = await prisma.transferOrder.findFirst({
    where: {
      id: transferOrder.id,
      transferOrderReference: transferOrder.transferOrderReference,
    },
  })

  if (foundTransferOrder) {
    return {
      errors: {
        name: 'A transfer order already exists with this reference',
      },
    }
  }

  const transferOrderNumber = await getMaxTransferOrderNumber(request)

  const createdTransferOrder = await prisma.transferOrder.create({
    data: {
      transferOrderReference: transferOrder.transferOrderReference,
      transferOrderNumber,
      siteFrom: {
        connect: {
          id: transferOrder.siteFromId,
        },
      },
      siteTo: {
        connect: {
          id: transferOrder.siteToId,
        },
      },
      reason: transferOrder.reason,
      otherReason: transferOrder.otherReason,
      transferOrderDate: transferOrder.transferOrderDate,
      company: {
        connect: {
          id: user.companyId!,
        },
      },
      transferOrderItems: {
        createMany: {
          data: (transferOrder.transferOrderItems || []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      status: TRANSFER_ORDER_STATUSES.PENDING,
    } as Prisma.TransferOrderCreateInput,
    include: {
      siteFrom: {
        include: { location: true },
      },
      siteTo: {
        include: { location: true },
      },
      transferOrderItems: {
        include: {
          product: true,
        },
      },
    },
  })

  // Trigger workflow for approval
  try {
    await triggerWorkflow({
      entityType: WORKFLOW_TRIGGER_TYPES.TRANSFER_ORDER_CREATE,
      entityId: createdTransferOrder.id,
      entityData: {
        transferOrderReference: createdTransferOrder.transferOrderReference,
        fromSite: createdTransferOrder.siteFrom.name,
        toSite: createdTransferOrder.siteTo.name,
        products: (transferOrder.transferOrderItems || []).map((item) => {
          const product = createdTransferOrder.transferOrderItems.find(
            (p) => p.productId === item.productId
          )
          return {
            sku: product?.product?.sku || `PROD-${item.productId.slice(-6)}`,
            name: product?.product?.name || 'Unknown Product',
            quantity: item.quantity,
          }
        }),
        urgency: 'Standard',
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 7 days from now
      },
      triggeredBy: user.id,
      companyId: user.companyId!,
    })
  } catch (error) {
    console.error('❌ Failed to trigger transfer order workflow:', error)
    // Don't fail the creation if workflow fails
  }

  return {
    notification: {
      message: 'Transfer order created successfully',
      status: 'Success',
      redirectTo: '/transfer-orders',
    },
  }
}

export async function updateTransferOrder(request: Request, transferOrder: ITransferOrder) {
  const user = await requireBetterAuthUser(request, ['update:transferOrders'])

  const foundTransferOrder = await prisma.transferOrder.findFirst({
    where: {
      transferOrderReference: transferOrder.transferOrderReference,
      id: { not: transferOrder.id },
    },
  })

  if (foundTransferOrder) {
    return {
      errors: {
        name: 'A transfer order already exists with this reference',
      },
    }
  }

  await prisma.transferOrder.update({
    where: { id: transferOrder.id },
    data: {
      transferOrderReference: transferOrder.transferOrderReference,
      siteFrom: {
        connect: {
          id: transferOrder.siteFromId,
        },
      },
      siteTo: {
        connect: {
          id: transferOrder.siteToId,
        },
      },
      reason: transferOrder.reason,
      otherReason: transferOrder.otherReason,
      transferOrderDate: transferOrder.transferOrderDate,
      company: {
        connect: {
          id: user.companyId!,
        },
      },
      transferOrderItems: {
        deleteMany: {},
        createMany: {
          data: (transferOrder.transferOrderItems || []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    },
  })

  return {
    notification: {
      message: 'Transfer order updated successfully',
      status: 'Success',
      redirectTo: '/transfer-orders',
    },
  }
}
