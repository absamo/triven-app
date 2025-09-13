import type { InvoiceStatus } from "@prisma/client"
import { type IInvoice } from "~/app/common/validations/invoiceSchema"
import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import { INVOICE_STATUSES } from "../common/constants"

export async function getInvoices(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  const invoices = await prisma.invoice.findMany({
    where: { companyId: user.companyId },
    include: {
      company: { select: { currencies: true } },
      salesOrder: {
        include: {
          salesOrderItems: { include: { product: { select: { name: true } } } },
        },
      },
      paymentsReceived: true,
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return invoices || []
}

export async function getInvoiceToPay(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: user.companyId,
      status: { notIn: [INVOICE_STATUSES.CANCELLED] },
      paymentsReceived: {
        none: {
          status: {
            in: [
              INVOICE_STATUSES.UNPAID,
              INVOICE_STATUSES.PARTIALLYPAID,
              INVOICE_STATUSES.PAID,
              INVOICE_STATUSES.OVERPAID,
            ],
          },
        },
      },
    },
    include: {
      company: { select: { currencies: true } },
      salesOrder: {
        include: {
          salesOrderItems: { include: { product: { select: { name: true } } } },
        },
      },
      paymentsReceived: {
        where: {
          status: {
            not: INVOICE_STATUSES.CANCELLED,
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

  return invoices || []
}

export async function getInvoice(invoiceId: IInvoice["id"]) {
  const salesOrder = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: { select: { currencies: true } },
      salesOrder: {
        include: {
          salesOrderItems: { include: { product: { select: { name: true } } } },
        },
      },
    },
  })

  return salesOrder
}

export async function getFilteredInvoices(
  request: Request,
  {
    search,
    statuses,
    salesOrders,
    invoices,
    invoiceDate,
  }: {
    search: string | null
    statuses: string[]
    salesOrders: string[]
    invoices: string[]
    invoiceDate: Date | null
  }
) {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  const currentSearch = !!search || search === ""

  return (
    (await prisma.invoice.findMany({
      where: {
        companyId: user.companyId,
        OR: currentSearch
          ? [
            {
              salesOrder: {
                salesOrderReference: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              invoiceReference: {
                contains: search,
                mode: "insensitive",
              },
            },
          ]
          : undefined,
        AND: [
          {
            status:
              statuses.length > 0
                ? {
                  in: statuses as InvoiceStatus[],
                }
                : undefined,
          },
          {
            invoiceDate: invoiceDate
              ? {
                gte: invoiceDate,
              }
              : undefined,
          },
          {
            salesOrder:
              salesOrders.length > 0
                ? { salesOrderReference: { in: salesOrders } }
                : undefined,
          },
          {
            invoiceReference:
              invoices.length > 0
                ? {
                  in: invoices,
                }
                : undefined,
          },
        ],
      },
      include: {
        salesOrder: {
          include: {
            customer: true,
            agency: true,
            salesOrderItems: true,
          },
        },
        paymentsReceived: {
          where: {
            status: {
              not: INVOICE_STATUSES.CANCELLED,
            },
          },
        },
      },
      orderBy: [
        {
          id: "desc",
        },
      ],
    })) || []
  )
}

export async function getMaxInvoiceNumber(request: Request): Promise<string> {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  const aggregateInvoiceNumber = await prisma.invoice.aggregate({
    where: { companyId: user.companyId },
    _max: {
      invoiceNumber: true,
    },
  })

  const invoiceNumber =
    parseInt(aggregateInvoiceNumber?._max.invoiceNumber || "00000") + 1

  return invoiceNumber.toString().padStart(5, "0")
}

export async function createInvoice(request: Request, invoice: IInvoice) {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  const foundInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceReference: invoice?.invoiceReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundInvoice) {
    return {
      errors: {
        invoiceReference: "An invoice already exists with this reference",
      },
    }
  }
  try {
    const invoiceNumber = await getMaxInvoiceNumber(request)

    await prisma.invoice.create({
      data: {
        invoiceReference: invoice?.invoiceReference,
        invoiceNumber,
        companyId: user.companyId,
        status: invoice.status,
        dueDate: invoice.dueDate,
        invoiceDate: invoice.invoiceDate,
        salesOrderId: invoice.salesOrderId,
        notes: invoice.notes,
      },
    })

    return {
      notification: {
        message: "Invoice created successfully",
        status: "Success",
        redirectTo: "/invoices",
      },
    }
  } catch {
    return {
      notification: {
        message: "Invoice could not be created",
        status: "Error",
      },
    }
  }
}

export async function updateInvoice(request: Request, invoice: IInvoice) {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  const foundInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceReference: invoice?.invoiceReference,
      id: { not: invoice.id },
      companyId: user.companyId,
    },
  })

  if (foundInvoice) {
    return {
      errors: {
        salesOrderReference: "An invoice already exists with this reference",
      },
    }
  }

  try {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        invoiceReference: invoice.invoiceReference,
        status: invoice.status,
        dueDate: invoice.dueDate,
        invoiceDate: invoice.invoiceDate,
        notes: invoice.notes,
      },
    })

    return {
      notification: {
        message: "Invoice updated successfully",
        status: "Success",
        redirectTo: "/invoices",
      },
    }
  } catch {
    return {
      notification: {
        message: "Invoice could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function updateInvoiceStatus(
  request: Request,
  {
    invoiceId,
    status,
  }: {
    invoiceId: IInvoice["id"]
    status: IInvoice["status"]
  }
) {
  const user = await requireBetterAuthUser(request, ["read:invoices"])

  try {
    const paymentsReceived =
      (await prisma.paymentReceived.findMany({
        where: {
          invoiceId,
          status: {
            not: INVOICE_STATUSES.CANCELLED,
          },
        },
      })) || []

    if (paymentsReceived.length > 0) {
      return {
        notification: {
          message:
            "Invoice status could not be cancelled because a payment has been received on this invoice",
          status: "Error",
          autoClose: false,
        },
      }
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
      },
    })

    return {
      notification: {
        message: "Invoice status updated successfully",
        status: "Success",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Invoice status could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}
