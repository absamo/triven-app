import { redirect } from 'react-router'

import { PRODUCT_STATUSES } from '~/app/common/constants'
import { getStockNotificationMessage, getStockStatus } from '~/app/common/helpers/inventories'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { IStockAdjustment } from '~/app/common/validations/stockAdjustmentsSchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { createAndEmitNotification } from '~/app/services/notificationHelper.server'
import { emitter } from '~/app/utils/emitter.server'

export async function getStockAdjustments(
  request: Request,
  limit: number = 30,
  offset: number = 0
) {
  const user = await requireBetterAuthUser(request, ['read:stockAdjustments'])

  const stockAdjustments = await prisma.stockAdjustment.findMany({
    take: limit,
    skip: offset,
    where: { companyId: user.companyId! },
    include: { site: true },
  })

  return stockAdjustments || []
}

export async function getFilteredStockAdjustments(
  request: Request,
  filters: {
    search?: string | null
    reasons?: string[] | null
    sites?: string[] | null
    dateFrom?: string | null
    dateTo?: string | null
  }
) {
  const user = await requireBetterAuthUser(request, ['read:stockAdjustments'])

  const where: any = {
    companyId: user.companyId!,
  }

  // Filter by reference (search)
  if (filters.search) {
    where.reference = {
      contains: filters.search,
      mode: 'insensitive',
    }
  }

  // Filter by reasons
  if (filters.reasons && filters.reasons.length > 0) {
    where.reason = {
      in: filters.reasons,
    }
  }

  // Filter by sites
  if (filters.sites && filters.sites.length > 0) {
    where.siteId = {
      in: filters.sites,
    }
  }

  // Filter by date range
  if (filters.dateFrom && filters.dateTo) {
    where.date = {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    }
  } else if (filters.dateFrom) {
    where.date = {
      gte: new Date(filters.dateFrom),
    }
  } else if (filters.dateTo) {
    where.date = {
      lte: new Date(filters.dateTo),
    }
  }

  const stockAdjustments = await prisma.stockAdjustment.findMany({
    where,
    include: { site: true },
    orderBy: { date: 'desc' },
  })

  return stockAdjustments || []
}

export async function getStockAdjustment(stockAdjustmentId: string) {
  const stockAdjustment = await prisma.stockAdjustment.findUnique({
    where: { id: stockAdjustmentId },
    include: {
      products: {
        include: {
          stockAdjustmentHistories: {
            select: {
              id: true,
              openingStock: true,
              physicalStockOnHand: true,
              accountingStockOnHand: true,
              adjustedQuantity: true,
              createdAt: true,
              reference: true,
              createdBy: {
                include: {
                  profile: true,
                },
              },
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return stockAdjustment
}

export async function getStockAdjustmentsByProductId(request: Request, productId: IProduct['id']) {
  const user = await requireBetterAuthUser(request, ['read:stockAdjustments'])

  const stockAdjustments = await prisma.stockAdjustment.findMany({
    where: { companyId: user.companyId!, products: { some: { id: productId } } },
    include: { site: true, products: true },
  })

  return stockAdjustments || []
}

export async function createAdjustment(
  request: Request,
  { products, ...adjustment }: Omit<IStockAdjustment, 'site'>
) {
  const user = await requireBetterAuthUser(request, ['create:stockAdjustments'])

  await Promise.all(
    (products || []).map(async (product: IProduct) => {
      // Calculate new stock levels
      const newAccountingStock = product.accountingStockOnHand! + product.adjustedQuantity!
      const newPhysicalStock = product.physicalStockOnHand! + product.adjustedQuantity!

      // Update product with new stock levels
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          accountingStockOnHand: newAccountingStock,
          physicalStockOnHand: newPhysicalStock,
          adjustedQuantity: product.adjustedQuantity,
          openingStock: product.openingStock,
        } as any,
      }) // Check status with the new stock levels
      const status = getStockStatus({
        ...product,
        accountingStockOnHand: newAccountingStock,
      })

      const notificationMsg = getStockNotificationMessage(status, product.name)

      // Create notification using helper if stock is low after adjustment
      if (newAccountingStock <= product.reorderPoint && notificationMsg) {
        await createAndEmitNotification({
          message: notificationMsg,
          status: status || '',
          companyId: user.companyId || '',
          createdById: user.id || '',
          productId: product.id,
          read: false,
        })
      }

      await prisma.stockAdjustmentHistory.create({
        data: {
          openingStock: updatedProduct.openingStock,
          physicalStockOnHand: updatedProduct.physicalStockOnHand,
          accountingStockOnHand:
            updatedProduct.accountingStockOnHand + updatedProduct.adjustedQuantity,
          adjustedQuantity: updatedProduct.adjustedQuantity,
          createdById: user.id!,
          productId: updatedProduct.id,
          reference: adjustment.reference,
        },
      })
    })
  )

  await prisma.stockAdjustment.create({
    data: {
      ...adjustment,
      products: {
        connect: (products || []).map((product: IProduct) => ({
          id: product.id,
        })),
      },
      companyId: user.companyId!,
      createdById: user.id,
    },
  })

  // Emit dashboard update event for real-time updates
  emitter.emit('dashboard-updates', {
    action: 'stock_adjustment_created',
    adjustmentId: adjustment.id,
    productCount: (products || []).length,
    products: (products || []).map((product) => ({
      id: product.id,
      name: product.name,
      adjustedQuantity: product.adjustedQuantity,
      newStock: product.accountingStockOnHand! + product.adjustedQuantity!,
    })),
    timestamp: Date.now(),
    companyId: user.companyId!,
  })

  return redirect('/stock-adjustments')
}

export async function updateAdjustment(
  request: Request,
  { products, ...adjustment }: Omit<IStockAdjustment, 'site'>
) {
  const user = await requireBetterAuthUser(request, ['update:stockAdjustments'])

  await Promise.all(
    (products || []).map(async (product: IProduct) => {
      const stockOnHand = (product.openingStock || 0) + (product.adjustedQuantity || 0)

      const status = getStockStatus({
        ...product,
        physicalStockOnHand: stockOnHand,
        accountingStockOnHand: stockOnHand,
      })

      const notificationMsg = getStockNotificationMessage(status, product.name)

      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          physicalStockOnHand: stockOnHand,
          accountingStockOnHand: stockOnHand,
          adjustedQuantity: product.adjustedQuantity,
          openingStock: product.openingStock,
          status,
        } as any,
      })

      // Create notification using helper if stock is low
      if (
        (status === PRODUCT_STATUSES.LOWSTOCK ||
          status === PRODUCT_STATUSES.OUTOFSTOCK ||
          status === PRODUCT_STATUSES.CRITICAL) &&
        notificationMsg
      ) {
        await createAndEmitNotification({
          message: notificationMsg,
          status: status || '',
          companyId: user.companyId || '',
          createdById: user.id || '',
          productId: product.id,
          read: false,
        })
      }

      await prisma.stockAdjustmentHistory.create({
        data: {
          openingStock: updatedProduct.openingStock,
          physicalStockOnHand: updatedProduct.physicalStockOnHand,
          accountingStockOnHand: updatedProduct.physicalStockOnHand,
          adjustedQuantity: updatedProduct.adjustedQuantity,
          createdById: user.id!,
          productId: updatedProduct.id,
          reference: adjustment.reference,
        } as any,
      })
    })
  )

  await prisma.stockAdjustment.update({
    where: { id: adjustment.id },
    data: {
      ...adjustment,
      products: {
        set: [],
        connect: (products || []).map((product: IProduct) => ({
          id: product.id,
        })),
      },
      companyId: user.companyId!,
      createdById: user.id,
    },
  })

  // Emit notification with stock adjustment data
  emitter.emit('notifications', {
    action: 'stock_adjustment_updated',
    adjustmentId: adjustment.id,
    productCount: (products || []).length,
    timestamp: Date.now(),
  })

  // Emit dashboard update event for real-time updates
  emitter.emit('dashboard-updates', {
    action: 'stock_adjustment_updated',
    adjustmentId: adjustment.id,
    productCount: (products || []).length,
    products: (products || []).map((product) => ({
      id: product.id,
      name: product.name,
      adjustedQuantity: product.adjustedQuantity,
      newStock: (product.openingStock || 0) + (product.adjustedQuantity || 0),
    })),
    timestamp: Date.now(),
    companyId: user.companyId!,
  })

  return redirect('/stock-adjustments')
}

export async function deleteAdjustment(request: Request, adjustmentId: IStockAdjustment['id']) {
  const user = await requireBetterAuthUser(request, ['delete:stockAdjustments'])

  await prisma.stockAdjustment.delete({
    where: { id: adjustmentId },
  })

  return redirect('/stock-adjustments')
}
