import type { Prisma } from '@prisma/client'
import type { ISupplier } from '~/app/common/validations/supplierSchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { PURCHASE_ORDER_STATUSES } from '../common/constants'
import type { IPurchaseOrder } from '../common/validations/purchaseOrderSchema'

export async function getFilteredSuppliers(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:suppliers'])

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined

  const suppliers = await prisma.supplier.findMany({
    where: {
      companyId: user.companyId,
      OR: search
        ? [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            { companyName: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    orderBy: { createdAt: 'desc' },
  })

  return suppliers || []
}

export async function getSuppliers(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:suppliers'])

  const suppliers = await prisma.supplier.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
  })

  return suppliers || []
}

export async function getSupplier(supplierId: ISupplier['id']) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      currency: {
        select: {
          id: true,
          isoCode: true,
          currencyCode: true,
          currencyName: true,
          symbol: true,
        },
      },
      location: {
        select: {
          id: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
        },
      },
    },
  })

  return supplier
}

export async function createSupplier(request: Request, supplier: ISupplier) {
  const user = await requireBetterAuthUser(request, ['create:suppliers'])

  const foundSupplier = await prisma.supplier.findFirst({
    where: {
      email: supplier.email,
    },
  })

  if (foundSupplier) {
    return {
      errors: {
        email: 'A supplier already exists with this email',
      },
    }
  }

  if (!supplier.location?.city || !supplier.location?.country || !supplier.currency?.id) {
    //log error
    throw new Response('Bad request', {
      status: 404,
    })
  }

  try {
    const supplierToCreate: Prisma.SupplierCreateInput = {
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      companyName: supplier.companyName,
      currency: {
        connect: {
          id: supplier.currency.id,
        },
      },
      company: {
        connect: {
          id: user.companyId,
        },
      },
      location: {
        create: {
          address: supplier.location?.address,
          city: supplier.location?.city,
          country: supplier.location?.country,
          postalCode: supplier.location?.postalCode,
        },
      },
    }

    await prisma.supplier.create({ data: supplierToCreate })

    return {
      notification: {
        message: 'Supplier created successfully',
        status: 'Success',
        redirectTo: '/suppliers',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while creating the supplier',
        status: 'Error',
      },
    }
  }
}

export async function updateSupplier(request: Request, supplier: ISupplier) {
  const user = await requireBetterAuthUser(request, ['update:suppliers'])

  const foundSupplier = await prisma.supplier.findFirst({
    where: { email: supplier.email, id: { not: supplier.id } },
  })

  if (foundSupplier) {
    return {
      errors: {
        email: 'A supplier already exists with this email',
      },
    }
  }

  if (!supplier.location?.city || !supplier.location?.country || !supplier.currency?.id) {
    //log error
    throw new Response('Bad request', {
      status: 400,
    })
  }

  try {
    const supplierToUpdate: Prisma.SupplierUpdateInput = {
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      companyName: supplier.companyName,
      currency: {
        connect: {
          id: supplier.currency.id,
        },
      },
      company: {
        connect: {
          id: user.companyId,
        },
      },
      location: {
        update: {
          address: supplier.location?.address,
          city: supplier.location?.city,
          country: supplier.location?.country,
          postalCode: supplier.location?.postalCode,
        },
      },
    }

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: supplierToUpdate,
    })

    return {
      notification: {
        message: 'Supplier updated successfully',
        status: 'Success',
        redirectTo: '/suppliers',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while updating the supplier',
        status: 'Error',
      },
    }
  }
}

export async function getPurchaseOrdersBySupplier(
  request: Request,
  supplierId: ISupplier['id'],
  purchaseOrderId?: IPurchaseOrder['id']
) {
  const user = await requireBetterAuthUser(request, ['read:suppliers'])

  const supplier = await prisma.supplier.findFirst({
    where: { companyId: user.companyId, id: supplierId },
    include: {
      purchaseOrders: {
        where: {
          OR: [
            {
              status: PURCHASE_ORDER_STATUSES.ISSUED,
            },
            {
              status: PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
            },
            {
              status: purchaseOrderId ? PURCHASE_ORDER_STATUSES.RECEIVED : undefined,
            },
          ],
        },

        include: {
          purchaseOrderItems: {
            where: {
              received: false,
            },
            include: { product: true },
          },
          purchaseReceives: {
            include: {
              purchaseReceiveItems: true,
            },
          },
        },
      },
    },
  })

  return supplier?.purchaseOrders || []
}
