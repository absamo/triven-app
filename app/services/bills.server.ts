import type { BillStatus, Prisma } from '@prisma/client'
import { type IBill } from '~/app/common/validations/billSchema'
import { prisma } from '~/app/db.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { BILL_STATUSES, PAYMENT_STATUSES } from '../common/constants'

export async function getBills(
  request: Request,
  { purchaseOrderId, paymentMadeId }: { purchaseOrderId?: string; paymentMadeId?: string } = {}
) {
  const user = await requireBetterAuthUser(request, ['read:bills'])

  const bills = await prisma.bill.findMany({
    where: {
      companyId: user.companyId,
      purchaseOrderId,
      paymentsMade:
        paymentMadeId &&
        ({
          some: {
            id: paymentMadeId,
          },
        } as any),
    },
    include: {
      company: { select: { currencies: true } },
      purchaseOrder: {
        include: {
          purchaseOrderItems: {
            include: { product: { select: { name: true } } },
          },
          supplier: { select: { name: true } },
          agency: { select: { name: true } },
        },
      },
      paymentsMade: {
        where: {
          status: {
            not: PAYMENT_STATUSES.CANCELLED,
          },
        },
      },
    },
    orderBy: [
      {
        id: 'desc',
      },
    ],
  })

  return bills || []
}

export async function getBillsToPay(request: Request) {
  const user = await requireBetterAuthUser(request, ['read:bills'])

  const bills = await prisma.bill.findMany({
    where: {
      companyId: user.companyId,
      status: { notIn: [BILL_STATUSES.CANCELLED] },
      paymentsMade: {
        none: {
          status: {
            in: [
              PAYMENT_STATUSES.UNPAID,
              PAYMENT_STATUSES.PARTIALLYPAID,
              PAYMENT_STATUSES.PAID,
              PAYMENT_STATUSES.OVERPAID,
            ],
          },
        },
      },
    },
    include: {
      company: { select: { currencies: true } },
      purchaseOrder: {
        include: {
          purchaseOrderItems: {
            include: { product: { select: { name: true } } },
          },
          supplier: { select: { name: true } },
          agency: { select: { name: true } },
        },
      },
      paymentsMade: {
        where: {
          status: {
            not: PAYMENT_STATUSES.CANCELLED,
          },
        },
      },
    },
    orderBy: [
      {
        id: 'desc',
      },
    ],
  })

  return bills || []
}

export async function getBill(billId: IBill['id']) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      company: { select: { currencies: true } },
      purchaseOrder: {
        include: {
          purchaseOrderItems: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
  })

  return bill
}

export async function getFilteredBills(
  request: Request,
  {
    search,
    statuses,
    purchaseOrders,
    bills,
    billDate,
  }: {
    search: string | null
    statuses: string[]
    purchaseOrders: string[]
    bills: string[]
    billDate: Date | null
  }
) {
  const user = await requireBetterAuthUser(request, ['read:bills'])

  const currentSearch = !!search || search === ''

  return (
    (await prisma.bill.findMany({
      where: {
        companyId: user.companyId,
        OR: currentSearch
          ? [
              {
                purchaseOrder: {
                  supplier: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                  agency: {
                    name: { contains: search, mode: 'insensitive' },
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
                    in: statuses as BillStatus[],
                  }
                : undefined,
          },
          {
            billDate: billDate
              ? {
                  gte: billDate,
                }
              : undefined,
          },
          {
            purchaseOrder:
              purchaseOrders.length > 0
                ? { purchaseOrderReference: { in: purchaseOrders } }
                : undefined,
          },
          {
            billReference:
              bills.length > 0
                ? {
                    in: bills,
                  }
                : undefined,
          },
        ],
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            agency: true,
            purchaseOrderItems: true,
          },
        },
        paymentsMade: {
          where: {
            status: {
              not: PAYMENT_STATUSES.CANCELLED,
            },
          },
        },
      },
      orderBy: [
        {
          id: 'desc',
        },
      ],
    })) || []
  )
}

export async function getMaxBillNumber(request: Request): Promise<string> {
  const user = await requireBetterAuthUser(request, ['read:bills'])

  const aggregateBillNumber = await prisma.bill.aggregate({
    where: { companyId: user.companyId },
    _max: {
      billNumber: true,
    },
  })

  const billNumber = parseInt(aggregateBillNumber?._max.billNumber || '00000') + 1

  return billNumber.toString().padStart(5, '0')
}

export async function createBill(request: Request, bill: IBill) {
  const user = await requireBetterAuthUser(request, ['read:bills'])

  const foundBill = await prisma.bill.findFirst({
    where: {
      billReference: bill?.billReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundBill) {
    return {
      errors: {
        billReference: 'A bill already exists with this reference',
      },
    }
  }
  try {
    const billNumber = await getMaxBillNumber(request)

    await prisma.bill.create({
      data: {
        billReference: bill?.billReference,
        billNumber,
        companyId: user.companyId,
        status: BILL_STATUSES.UNPAID,
        dueDate: bill.dueDate,
        billDate: bill.billDate,
        purchaseOrderId: bill.purchaseOrderId,
        notes: bill.notes,
      },
    })

    return {
      notification: {
        message: 'Bill created successfully',
        status: 'Success',
        redirectTo: '/bills',
      },
    }
  } catch {
    return {
      notification: {
        message: 'Bill could not be created',
        status: 'Error',
      },
    }
  }
}

export async function updateBill(request: Request, bill: IBill) {
  const user = await requireBetterAuthUser(request, ['read:bills'])
  if (!user?.id || !user?.companyId) {
    return null
  }

  const foundBill = await prisma.bill.findFirst({
    where: {
      billReference: bill?.billReference,
      id: { not: bill.id },
      companyId: user.companyId,
    },
  })

  if (foundBill) {
    return {
      errors: {
        billReference: 'A bill already exists with this reference',
      },
    }
  }

  try {
    const billToUpdate: Prisma.BillUpdateInput = {
      billReference: bill.billReference,
      status: bill.status,
      dueDate: bill.dueDate,
      billDate: bill.billDate,
      notes: bill.notes,
    }

    await prisma.bill.update({
      data: billToUpdate,
      where: { id: bill.id },
    })

    return {
      notification: {
        message: 'Bill updated successfully',
        status: 'Success',
        redirectTo: '/bills',
      },
    }
  } catch {
    return {
      notification: {
        message: 'An error occured while updating the bill',
        status: 'Error',
      },
    }
  }
}

export async function updateBillStatus(
  request: Request,
  {
    billId,
    status,
  }: {
    billId: IBill['id']
    status: IBill['status']
  }
) {
  const user = await requireBetterAuthUser(request, ['read:bills'])

  try {
    const paymentsMade =
      (await prisma.paymentMade.findMany({
        where: {
          billId,
          status: {
            not: PAYMENT_STATUSES.CANCELLED,
          },
        },
      })) || []

    if (paymentsMade.length > 0) {
      return {
        notification: {
          message: 'Bill status could not be updated because a payment has been made on this bill',
          status: 'Error',
          autoClose: false,
        },
      }
    }

    await prisma.bill.update({
      where: { id: billId },
      data: {
        status,
      },
    })

    return {
      notification: {
        message: 'Bill status updated successfully',
        status: 'Success',
      },
    }
  } catch (error) {
    return {
      notification: {
        message: 'Bill status could not be updated',
        status: 'Error',
        autoClose: false,
      },
    }
  }
}
