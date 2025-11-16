import { redirect } from 'react-router'

import {
  PRODUCT_STATUSES,
  PURCHASE_ORDER_STATUSES,
  SALES_ORDERS_STATUSES,
  USER_ROLES,
} from '~/app/common/constants'
import { getStockNotificationMessage, getStockStatus } from '~/app/common/helpers/inventories'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import { prisma } from '~/app/db.server'
import { auditService } from '~/app/services/audit.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import { emitter } from '~/app/utils/emitter.server'

export async function checkProductNameExists(
  request: Request,
  productName: string,
  excludeId?: string
): Promise<boolean> {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return false
  }

  const existingProduct = await prisma.product.findFirst({
    where: {
      companyId: user.companyId,
      name: {
        equals: productName.trim(),
        mode: 'insensitive',
      },
      ...(excludeId && { id: { not: excludeId } }),
    },
  })

  return !!existingProduct
}

export async function getProducts(
  request: Request,
  filter: {
    search?: string
    limit?: number
    offset?: number
    allSites?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {
    search: undefined,
    limit: 30,
    offset: 0,
    allSites: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }
) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return []
  }

  // Build where clause - include all sites if allSites is true or if no specific site
  const whereClause: any = {
    companyId: user.companyId,
    name: { contains: filter.search, mode: 'insensitive' },
  }

  // Filter by user's agency (unless user is admin with access to all agencies)
  if (user.role?.name !== USER_ROLES.ADMIN && user.agencyId) {
    whereClause.agencyId = user.agencyId
  }

  // Only filter by site if allSites is false and user has a specific site
  if (!filter.allSites && user.site?.id) {
    whereClause.siteId = user.site.id
  }

  // Build orderBy clause based on sortBy parameter
  const getOrderBy = () => {
    const sortOrder = filter.sortOrder || 'desc'

    switch (filter.sortBy) {
      case 'name':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      case 'physicalStockOnHand':
        return { physicalStockOnHand: sortOrder }
      case 'sellingPrice':
        return { sellingPrice: sortOrder }
      case 'status':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      case 'site':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      case 'agency':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      default:
        return { createdAt: sortOrder }
    }
  }

  const orderBy = getOrderBy()
  const products = await prisma.product.findMany({
    take: filter.limit,
    skip: filter.offset,
    where: whereClause,
    include: {
      category: true,
      site: true,
      agency: true,
    },
    ...(orderBy && { orderBy }),
  })

  // Apply client-side case-insensitive sorting for text fields to fix PostgreSQL case sensitivity
  if (
    filter.sortBy === 'name' ||
    filter.sortBy === 'status' ||
    filter.sortBy === 'site' ||
    filter.sortBy === 'agency'
  ) {
    const sortedProducts = products.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      if (filter.sortBy === 'name') {
        aValue = a.name?.toLowerCase() || ''
        bValue = b.name?.toLowerCase() || ''
      } else if (filter.sortBy === 'status') {
        aValue = a.status?.toLowerCase() || ''
        bValue = b.status?.toLowerCase() || ''
      } else if (filter.sortBy === 'site') {
        aValue = a.site?.name?.toLowerCase() || ''
        bValue = b.site?.name?.toLowerCase() || ''
      } else if (filter.sortBy === 'agency') {
        aValue = a.agency?.name?.toLowerCase() || ''
        bValue = b.agency?.name?.toLowerCase() || ''
      }

      // Use localeCompare with proper options for case-insensitive, numeric sorting
      const comparison = aValue.localeCompare(bValue, 'en', {
        numeric: true,
        sensitivity: 'base', // Case-insensitive, accent-sensitive
        ignorePunctuation: false,
      })

      return filter.sortOrder === 'asc' ? comparison : -comparison
    })

    return sortedProducts
  }

  return products || []
}

export async function getFilteredProducts(
  request: Request,
  {
    search,
    statuses,
    categories,
    agencies,
    sites,
    reorderAlert,
    deadStock,
    accuracyFilter,
    sortBy,
    sortOrder,
  }: {
    search: string | null
    statuses: string[] | null
    categories: string[] | null
    agencies: string[] | null
    sites: string[] | null
    reorderAlert?: boolean
    deadStock?: boolean
    accuracyFilter?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return []
  }

  const currentSearch = search && search.trim() !== ''

  // Build orderBy clause based on sortBy parameter
  const getOrderBy = () => {
    const order = sortOrder || 'desc'

    switch (sortBy) {
      case 'name':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      case 'physicalStockOnHand':
        return { physicalStockOnHand: order }
      case 'sellingPrice':
        return { sellingPrice: order }
      case 'status':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      case 'site':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      case 'agency':
        // Skip database sorting for text fields - will do client-side case-insensitive
        return undefined
      default:
        return { createdAt: order }
    }
  }

  const orderBy = getOrderBy()

  // First, get all products that match the company
  const baseProducts = await prisma.product.findMany({
    where: {
      companyId: user.companyId,
    },
    include: {
      category: true,
      site: true,
      agency: true,
    },
    ...(orderBy && { orderBy }),
  })

  // Apply reorder alert filter first if needed
  let filteredProducts = baseProducts
  if (reorderAlert) {
    filteredProducts = baseProducts.filter(
      (product) =>
        (product.accountingStockOnHand || 0) <= (product.reorderPoint || 0) && product.active
    )
  }

  // Apply dead stock filter if needed
  if (deadStock) {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // For dead stock, we need to check if products have had no movement
    // This requires a more complex query, so we'll fetch dead stock products separately
    const deadStockProducts = await prisma.product.findMany({
      where: {
        companyId: user.companyId,
        active: true,
        // Products that haven't been in any sales order items in the last 90 days
        salesOrderItems: {
          none: {
            salesOrder: {
              orderDate: {
                gte: ninetyDaysAgo,
              },
            },
          },
        },
        // And haven't been in any purchase order items in the last 90 days
        purchaseOrderItems: {
          none: {
            purchaseOrder: {
              orderDate: {
                gte: ninetyDaysAgo,
              },
            },
          },
        },
        // And haven't been adjusted in the last 90 days
        stockAdjustmentHistories: {
          none: {
            createdAt: {
              gte: ninetyDaysAgo,
            },
          },
        },
      },
      include: {
        category: true,
        site: true,
        agency: true,
      },
    })

    // Filter base products to only include dead stock products
    const deadStockIds = deadStockProducts.map((p) => p.id)
    filteredProducts = baseProducts.filter((product) => deadStockIds.includes(product.id))
  }

  // Apply accuracy filter if needed (products where physical stock != accounting stock)
  if (accuracyFilter) {
    filteredProducts = filteredProducts.filter((product) => {
      const systemQty = product.accountingStockOnHand || 0
      const physicalQty = product.physicalStockOnHand || 0
      return systemQty !== physicalQty // Only show inaccurate items
    })
  }

  // Then apply other filters on top of the previous results
  if (currentSearch) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(search!.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(search!.toLowerCase())) ||
        (product.barcode && product.barcode.toLowerCase().includes(search!.toLowerCase()))
    )
  }

  if (statuses && statuses.length > 0) {
    filteredProducts = filteredProducts.filter((product) => statuses.includes(product.status))
  }

  if (categories && categories.length > 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.categoryId && categories.includes(product.categoryId)
    )
  }

  if (agencies && agencies.length > 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.agencyId && agencies.includes(product.agencyId)
    )
  }

  if (sites && sites.length > 0) {
    filteredProducts = filteredProducts.filter(
      (product) => product.siteId && sites.includes(product.siteId)
    )
  }

  // Apply client-side case-insensitive sorting for text fields to fix PostgreSQL case sensitivity
  if (sortBy === 'name' || sortBy === 'status' || sortBy === 'site' || sortBy === 'agency') {
    const sortedProducts = filteredProducts.sort((a, b) => {
      let aValue = ''
      let bValue = ''

      if (sortBy === 'name') {
        aValue = a.name?.toLowerCase() || ''
        bValue = b.name?.toLowerCase() || ''
      } else if (sortBy === 'status') {
        aValue = a.status?.toLowerCase() || ''
        bValue = b.status?.toLowerCase() || ''
      } else if (sortBy === 'site') {
        aValue = a.site?.name?.toLowerCase() || ''
        bValue = b.site?.name?.toLowerCase() || ''
      } else if (sortBy === 'agency') {
        aValue = a.agency?.name?.toLowerCase() || ''
        bValue = b.agency?.name?.toLowerCase() || ''
      }

      // Use localeCompare with proper options for case-insensitive, numeric sorting
      const comparison = aValue.localeCompare(bValue, 'en', {
        numeric: true,
        sensitivity: 'base', // Case-insensitive, accent-sensitive
        ignorePunctuation: false,
      })
      return sortOrder === 'asc' ? comparison : -comparison
    })
    return sortedProducts
  }

  return filteredProducts || []
}

export async function getProductsByAgencyId(
  request: Request,
  agencyId: IAgency['id'],
  dateRange?: { gte: Date; lte: Date } | null
) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return null
  }

  // Build where clause with optional date filtering
  const whereClause: any = {
    companyId: user.companyId,
    agencyId: agencyId === 'All' ? undefined : agencyId,
  }

  // Add date filtering if provided - filter by product creation/update date
  if (dateRange) {
    whereClause.OR = [
      // Products created within the date range
      {
        createdAt: {
          gte: dateRange.gte,
          lte: dateRange.lte,
        },
      },
      // Products updated within the date range
      {
        updatedAt: {
          gte: dateRange.gte,
          lte: dateRange.lte,
        },
      },
    ]
  }

  const products =
    (await prisma.product.findMany({
      where: whereClause,
    })) || []

  const productsInStock = products.filter(
    (product) => product.status !== PRODUCT_STATUSES.OUTOFSTOCK && product.active
  )

  const productsOutOfStock = products.filter(
    (product) => product.status === PRODUCT_STATUSES.OUTOFSTOCK && product.active
  )

  const productsInLowStock = products.filter(
    (product) => product.status === PRODUCT_STATUSES.LOWSTOCK && product.active
  )

  const productsInCriticalStock = products.filter(
    (product) => product.status === PRODUCT_STATUSES.CRITICAL && product.active
  ) // Calculate products at or below reorder point
  const productsAtReorderPoint = products.filter(
    (product) =>
      (product.accountingStockOnHand || 0) <= (product.reorderPoint || 0) && product.active
  )

  // Calculate dead stock (products with no movement in last 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const deadStockProducts = await prisma.product.findMany({
    where: {
      ...whereClause,
      active: true,
      // Products that haven't been in any sales order items in the last 90 days
      salesOrderItems: {
        none: {
          salesOrder: {
            orderDate: {
              gte: ninetyDaysAgo,
            },
          },
        },
      },
      // And haven't been in any purchase order items in the last 90 days
      purchaseOrderItems: {
        none: {
          purchaseOrder: {
            orderDate: {
              gte: ninetyDaysAgo,
            },
          },
        },
      },
      // And haven't been adjusted in the last 90 days
      stockAdjustmentHistories: {
        none: {
          createdAt: {
            gte: ninetyDaysAgo,
          },
        },
      },
    },
  })

  // Calculate dead stock value
  const deadStockValue = deadStockProducts.reduce(
    (acc: number, product) => acc + product.sellingPrice * (product.physicalStockOnHand || 0),
    0
  )

  // Calculate current period values
  const currentTotalStock = productsInStock.reduce(
    (acc: number, product) => acc + (product.physicalStockOnHand || 0),
    0
  )
  const currentStockValue = productsInStock.reduce(
    (acc: number, product) => acc + product.sellingPrice * (product.physicalStockOnHand || 0),
    0
  ) // Calculate comparison period values for percentage calculation
  let totalProductsInStockDiff = 0
  let productsInStockValueDiff = 0

  if (dateRange) {
    // Calculate the previous period with the same duration
    const currentStart = dateRange.gte
    const currentEnd = dateRange.lte
    const periodDuration = currentEnd.getTime() - currentStart.getTime()

    const previousStart = new Date(currentStart.getTime() - periodDuration)
    const previousEnd = new Date(currentStart.getTime() - 1) // End just before current period starts

    // Get products for the previous period
    const previousWhereClause: any = {
      companyId: user.companyId,
      agencyId: agencyId === 'All' ? undefined : agencyId,
      OR: [
        {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
        {
          updatedAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      ],
    }

    const previousProducts =
      (await prisma.product.findMany({
        where: previousWhereClause,
      })) || []

    const previousProductsInStock = previousProducts.filter(
      (product) => product.status !== PRODUCT_STATUSES.OUTOFSTOCK && product.active
    )

    const previousTotalStock = previousProductsInStock.reduce(
      (acc: number, product) => acc + (product.physicalStockOnHand || 0),
      0
    )
    const previousStockValue = previousProductsInStock.reduce(
      (acc: number, product) => acc + product.sellingPrice * (product.physicalStockOnHand || 0),
      0
    )

    // Calculate percentage differences
    totalProductsInStockDiff =
      previousTotalStock > 0
        ? Math.round(((currentTotalStock - previousTotalStock) / previousTotalStock) * 100)
        : 0

    productsInStockValueDiff =
      previousStockValue > 0
        ? Math.round(((currentStockValue - previousStockValue) / previousStockValue) * 100)
        : 0
  }

  // Calculate inventory accuracy (Physical vs System)
  const accuracyAnalysis = products.map((product) => {
    const systemQty = product.accountingStockOnHand || 0
    const physicalQty = product.physicalStockOnHand || 0
    return {
      productId: product.id,
      productName: product.name,
      systemQuantity: systemQty,
      physicalQuantity: physicalQty,
      variance: physicalQty - systemQty,
      isAccurate: systemQty === physicalQty,
    }
  })

  const accurateItems = accuracyAnalysis.filter((item) => item.isAccurate).length
  const totalItems = products.length
  const accuracyPercentage = totalItems > 0 ? Math.round((accurateItems / totalItems) * 100) : 100

  // Calculate total physical and accounting stock values
  const totalPhysicalStock = products.reduce(
    (acc, product) => acc + (product.physicalStockOnHand || 0),
    0
  )
  const totalAccountingStock = products.reduce(
    (acc, product) => acc + (product.accountingStockOnHand || 0),
    0
  )

  const stats = {
    inventory: {
      totalProductsInStock: currentTotalStock,
      productsInStockValue: currentStockValue,
      totalProductsInStockDiff,
      productsInStockValueDiff,
      // Add inventory accuracy metrics
      accuracyPercentage,
      accurateItems,
      inaccurateItems: totalItems - accurateItems,
      totalItemsTracked: totalItems,
      // Add physical and accounting stock totals
      totalPhysicalStock,
      totalAccountingStock,
      // Add reorder point alerts
      reorderPointAlerts: productsAtReorderPoint.length,
      // Add dead stock metrics
      deadStockValue,
      deadStockItems: deadStockProducts.length,
    },
    stockStatus: {
      inStock: productsInStock.filter((product) => product.status === PRODUCT_STATUSES.AVAILABLE)
        .length,
      lowStock: productsInLowStock.length,
      outOfStock: productsOutOfStock.length,
      critical: productsInCriticalStock.length,
    },
  }

  return stats
}

export async function getProductsForAgency(request: Request, agencyId: IAgency['id']) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return []
  }

  const products = await prisma.product.findMany({
    where: {
      companyId: user.companyId,
      agencyId: agencyId === 'All' ? undefined : agencyId,
      active: true, // Only show active products
    },
    include: {
      category: true,
      site: true,
      agency: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return products || []
}

export async function getProduct(request: Request, productId: IProduct['id']) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return null
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      site: true,
      agency: true,
      images: true, // Include product images
      salesOrderItems: {
        where: { salesOrder: { status: SALES_ORDERS_STATUSES.ISSUED } },
        include: {
          salesOrder: {
            include: { invoices: true },
          },
        },
      },
      purchaseOrderItems: {
        where: {
          NOT: {
            purchaseOrder: {
              status: PURCHASE_ORDER_STATUSES.PENDING,
            },
          },
        },
        include: {
          purchaseOrder: {
            include: {
              bills: {
                include: {
                  purchaseOrder: { include: { purchaseOrderItems: true } },
                },
              },
              purchaseReceives: { include: { purchaseReceiveItems: true } },
            },
          },
        },
      },
    },
  })

  return product
}

export async function getProductByBarcode(barcode?: IProduct['barcode']) {
  const product = await prisma.product.findFirst({
    where: { barcode: barcode },
    include: {
      category: true,
      // subcategory: true,
      // attributes: {
      //   select: {
      //     type: true,
      //     fields: true,
      //     id: true,
      //   },
      // },
      suppliers: true,
      site: true,
    },
  })

  return product
}

export async function createProduct(
  request: Request,
  product: Omit<IProduct, 'category' | 'subcategory | site'> & {
    images?: Array<{ name: string; path: string; type: string; primary?: boolean }>
  },
  returnProduct = false
) {
  try {
    const user = await getBetterAuthUser(request)
    if (!user?.id) {
      return null
    }

    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        barcode: product.barcode,
        reorderPoint: product.reorderPoint,
        safetyStockLevel: product.safetyStockLevel,
        unit: product.unit,
        openingStock: product.openingStock,
        openingValue: product.openingValue,
        category: {
          connect: { id: product.categoryId },
        },
        site: {
          connect: { id: product.siteId },
        },
        agency: {
          connect: { id: product.agencyId },
        },
        company: {
          connect: { id: user.companyId },
        },
        status: PRODUCT_STATUSES.AVAILABLE,
        physicalStockOnHand: product.openingStock,
        accountingStockOnHand: product.openingStock,
        availableQuantity: product.openingStock,
        adjustedQuantity: 0,
        productCreatedBy: {
          connect: { id: user.id },
        },
        // Create associated images
        ...(product.images &&
          product.images.length > 0 && {
            images: {
              create: product.images.map((image) => ({
                name: image.name,
                path: image.path,
                imagekitId: (image as any).imagekitId || null, // ImageKit's file ID
                type: image.type,
                primary: image.primary || false,
              })),
            },
          }),
      } as any,
    })

    // Emit dashboard update event for real-time updates
    emitter.emit('dashboard-updates', {
      action: 'product_created',
      product: {
        id: createdProduct.id,
        name: createdProduct.name,
        openingStock: createdProduct.openingStock,
        sellingPrice: createdProduct.sellingPrice,
        status: createdProduct.status,
        agencyId: createdProduct.agencyId,
        siteId: createdProduct.siteId,
      },
      timestamp: Date.now(),
      companyId: user.companyId,
    })

    // Log audit event (don't block on failure)
    try {
      await auditService.logCreate({
        entityType: 'product',
        entityId: createdProduct.id,
        userId: user.id,
        userName: `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email,
        afterSnapshot: createdProduct,
      })
    } catch (error) {
      console.error('[createProduct] Failed to log audit event:', error)
    }

    if (returnProduct) {
      return createdProduct
    }

    return {
      notification: {
        message: 'Product created successfully.',
        status: 'Success',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while updating the product.',
        status: 'Error',
      },
    }
  }
}

export async function updateProduct(
  request: Request,
  product: Omit<IProduct, 'category' | 'subcategory' | 'attributeTypes'> & {
    images?: Array<{ id?: string; name: string; path: string; type: string; primary?: boolean }>
  }
) {
  try {
    const user = await getBetterAuthUser(request)
    if (!user?.id) {
      return null
    }

    const foundProduct = await prisma.product.findFirst({
      where: { companyId: user.companyId, id: product.id },
      include: {
        category: { select: { name: true } },
        agency: { select: { name: true } },
        site: { select: { name: true } },
      },
    })

    if (!foundProduct) {
      return {
        errors: {
          productId: 'Product not found',
        },
      }
    }

    // Capture before state for audit log with related entity names
    const beforeSnapshot = { ...foundProduct }

    const status = getStockStatus(product)

    const notificationMsg = getStockNotificationMessage(status, product.name)

    // Simple image handling: replace all images with the ones from frontend
    if (product.images !== undefined) {
      // Delete all existing images for this product
      await prisma.asset.deleteMany({
        where: {
          productId: product.id!,
        },
      })

      // Create new images if any provided
      if (product.images.length > 0) {
        await prisma.asset.createMany({
          data: product.images.map((image) => ({
            name: image.name,
            path: image.path,
            type: image.type,
            productId: product.id!,
            primary: image.primary || false,
          })),
        })
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        barcode: product.barcode,
        reorderPoint: product.reorderPoint,
        safetyStockLevel: product.safetyStockLevel,
        status,
        unit: product.unit,
        category: {
          connect: { id: product.categoryId },
        },

        site: {
          connect: { id: product.siteId },
        },

        agency: {
          connect: { id: product.agencyId },
        },
        notifications:
          status === PRODUCT_STATUSES.LOWSTOCK ||
          status === PRODUCT_STATUSES.OUTOFSTOCK ||
          status === PRODUCT_STATUSES.CRITICAL
            ? {
                create: {
                  message: notificationMsg,
                  read: false,
                  companyId: user.companyId,
                  createdById: user.id,
                  status,
                },
              }
            : undefined,
      },
    })

    // Fetch the updated product with all fields and related entity names for audit log
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: { select: { name: true } },
        agency: { select: { name: true } },
        site: { select: { name: true } },
      },
    })

    // Emit notification with stock alert data
    if (
      status === PRODUCT_STATUSES.LOWSTOCK ||
      status === PRODUCT_STATUSES.OUTOFSTOCK ||
      status === PRODUCT_STATUSES.CRITICAL
    ) {
      emitter.emit('notifications', {
        action: 'stock_alert',
        product: { id: product.id, name: product.name, status },
        message: notificationMsg,
        timestamp: Date.now(),
      })
    }

    // Emit dashboard update event for real-time updates
    emitter.emit('dashboard-updates', {
      action: 'product_updated',
      product: {
        id: product.id,
        name: product.name,
        status,
        agencyId: product.agencyId,
        siteId: product.siteId,
      },
      timestamp: Date.now(),
      companyId: user.companyId,
    })

    // Log audit event (don't block on failure)
    try {
      if (updatedProduct) {
        await auditService.logUpdate(
          'product',
          updatedProduct.id,
          user.id,
          `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email,
          beforeSnapshot,
          updatedProduct
        )
      }
    } catch (error) {
      console.error('[updateProduct] Failed to log audit event:', error)
    }

    return {
      notification: {
        message: 'Product updated successfully.',
        status: 'Success',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while updating the product.',
        status: 'Error',
      },
    }
  }
}

export async function duplicateProduct(request: Request, id?: string) {
  const user = await getBetterAuthUser(request)
  if (!user?.id || !id) {
    throw new Error('Unauthorized or missing product id')
  }
  const product = await prisma.product.findUnique({
    where: {
      id: id,
      companyId: user.companyId,
    },
  })
  if (!product) {
    throw new Error('Product not found')
  }
  // Remove id and set a new name (e.g., 'Copy of ...')
  await prisma.product.create({
    data: {
      ...product,
      id: undefined,
      name: `Copy of ${product.name}`,
      createdAt: new Date(),
    },
  })
  return redirect(`/products`)
}
export async function deleteProduct(request: Request, id?: string) {
  const user = await getBetterAuthUser(request)
  if (!user?.id || !id) {
    return {
      notification: {
        message: 'Unauthorized or missing product id',
        status: 'Error',
        autoClose: false,
      },
    }
  }
  try {
    // First, get the full product data for audit log
    const product = await prisma.product.findUnique({
      where: {
        id: id,
        companyId: user.companyId,
      },
    })

    if (!product) {
      return {
        notification: {
          message: 'Product not found.',
          status: 'Error',
          autoClose: false,
        },
      }
    }

    // Capture before state for audit log
    const beforeSnapshot = { ...product }

    // Delete the product
    await prisma.product.delete({
      where: {
        id: id,
        companyId: user.companyId,
      },
    })

    // Log audit event (don't block on failure)
    try {
      await auditService.logDelete({
        entityType: 'product',
        entityId: id,
        userId: user.id,
        userName: `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email,
        beforeSnapshot,
      })
    } catch (error) {
      console.error('[deleteProduct] Failed to log audit event:', error)
    }

    return {
      notification: {
        message: `Product "${product.name}" has been deleted successfully.`,
        status: 'Success',
        // Don't redirect - let the component handle the state update
      },
    }
  } catch (error) {
    return {
      notification: {
        message: 'Failed to delete product.',
        status: 'Error',
      },
    }
  }
}
