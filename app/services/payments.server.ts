import type { PaymentStatus } from "@prisma/client"
import {
  BILL_STATUSES,
  INVOICE_STATUSES,
  PAYMENT_STATUSES,
} from "~/app/common/constants"
import {
  getAmountPaidByInvoice,
  getInvoiceStatus,
  getTotalAmountDueByInvoice,
} from "~/app/common/helpers/invoice"
import { type IPaymentsMade } from "~/app/common/validations/paymentsMadeSchema"
import { type IPaymentsReceived } from "~/app/common/validations/paymentsReceivedSchema"
import { type IUser } from "~/app/common/validations/userSchema"
import { prisma } from "~/app/db.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import {
  getAmountPaidByBill,
  getBalanceDue,
  getBillStatus,
  getTotalAmountDueByBill,
} from "../common/helpers/bill"
import { getPaymentMadeStatus } from "../common/helpers/payment"
import type { IBill } from "../common/validations/billSchema"
import type { IInvoice } from "../common/validations/invoiceSchema"

/**
 * Payments Received
 */

export async function getPaymentsReceived(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const paymentsReceived = await prisma.paymentReceived.findMany({
    where: { companyId: user.companyId },
    include: {
      customer: { include: { billingAddress: true } },
      company: { select: { currencies: true } },
      invoice: { include: { salesOrder: true } },
    },
    orderBy: [
      {
        id: "desc",
      },
    ],
  })

  return paymentsReceived || ([] as IPaymentsReceived[])
}

export async function getPaymentReceived(invoiceId: IPaymentsReceived["id"]) {
  const paymentReceived = await prisma.paymentReceived.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      company: { select: { currencies: true } },
    },
  })

  return paymentReceived
}

export async function getMaxPaymentReceivedNumber(
  request: Request
): Promise<string> {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const paymentReceivedNumber = await prisma.paymentReceived.aggregate({
    where: { companyId: user.companyId },
    _max: {
      paymentNumber: true,
    },
  })

  const paymentNumber =
    parseInt(paymentReceivedNumber?._max.paymentNumber || "00000") + 1

  return paymentNumber.toString().padStart(5, "0")
}

export async function createPaymentReceived(
  request: Request,
  paymentReceived: IPaymentsReceived
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const foundPaymentReceived = await prisma.paymentReceived.findFirst({
    where: {
      paymentReference: paymentReceived?.paymentReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundPaymentReceived) {
    return {
      errors: {
        paymentReceivedReference:
          "A payment already exists with this reference",
      },
    }
  }
  try {
    const paymentReceivedNumber = await getMaxPaymentReceivedNumber(request)

    const invoice = (await prisma.invoice.findUnique({
      where: { id: paymentReceived.invoiceId },
      include: {
        salesOrder: {
          include: {
            salesOrderItems: true,
          },
        },
        paymentsReceived: true,
      },
    })) as IInvoice

    const amountDue = getTotalAmountDueByInvoice(invoice)

    const amountPaid = getAmountPaidByInvoice(
      invoice,
      paymentReceived.id,
      paymentReceived.amountReceived
    )

    const balanceDue = amountDue - amountPaid

    await prisma.paymentReceived.create({
      data: {
        paymentReference: paymentReceived?.paymentReference,
        paymentNumber: paymentReceivedNumber,
        companyId: user.companyId,
        customerId: paymentReceived.customerId,
        paymentDate: paymentReceived.paymentDate,
        paymentMethod: paymentReceived.paymentMethod,
        amountReceived: paymentReceived.amountReceived,
        invoiceId: paymentReceived.invoiceId,
        balanceDue,
        notes: paymentReceived.notes,
        status: getInvoiceStatus(amountPaid, amountDue),
      },
    })

    await prisma.invoice.update({
      where: { id: paymentReceived.invoiceId },
      data: {
        status: getInvoiceStatus(amountPaid, amountDue),
      },
    })

    return {
      notification: {
        message: "Payment received successfully created",
        status: "Success",
        redirectTo: "/payments-received",
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

export async function updatePaymentReceived(
  request: Request,
  paymentReceived: IPaymentsReceived
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const foundPaymentReiceived = await prisma.paymentReceived.findFirst({
    where: {
      paymentReference: paymentReceived?.paymentReference,
      id: { not: paymentReceived.id },
      companyId: user.companyId,
    },
  })

  if (foundPaymentReiceived) {
    return {
      errors: {
        paymentReference: "A payment already exists with this reference",
      },
    }
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: paymentReceived.invoiceId },
      include: {
        salesOrder: {
          include: {
            salesOrderItems: true,
          },
        },
        paymentsReceived: true,
      },
    })

    const amountDue = (invoice?.salesOrder?.salesOrderItems || []).reduce(
      (acc, item) => acc + item.amount,
      0
    )

    const paymentsReceived = (invoice?.paymentsReceived || []).filter(
      (payment) => payment.id !== paymentReceived.id
    )

    const amontPaid =
      paymentsReceived.reduce(
        (acc, payment) => acc + payment.amountReceived,
        0
      ) + paymentReceived.amountReceived

    await prisma.paymentReceived.update({
      where: { id: paymentReceived.id },
      data: {
        paymentReference: paymentReceived.paymentReference,
        customerId: paymentReceived.customerId,
        paymentMethod: paymentReceived.paymentMethod,
        paymentDate: paymentReceived.paymentDate,
        amountReceived: paymentReceived.amountReceived,
        invoiceId: paymentReceived.invoiceId,
        balanceDue: amountDue - amontPaid,
        notes: paymentReceived.notes,
      },
    })

    await prisma.invoice.update({
      where: { id: paymentReceived.invoiceId },
      data: {
        status: getInvoiceStatus(amontPaid, amountDue),
      },
    })

    return {
      notification: {
        message: "Payment received successfully updated",
        status: "Success",
        redirectTo: "/payments-received",
      },
    }
  } catch {
    return {
      notification: {
        message: "Payment received could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function updatePaymentReceivedStatus(
  request: Request,
  {
    paymentReceivedId,
    status,
  }: {
    paymentReceivedId: IPaymentsReceived["id"]
    status: IPaymentsReceived["status"]
  }
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  try {
    const paymentReceived = await prisma.paymentReceived.update({
      where: { id: paymentReceivedId },
      data: {
        status,
      },
      include: {
        invoice: true,
      },
    })

    await prisma.invoice.update({
      where: { id: paymentReceived.invoice?.id },
      data: {
        status: INVOICE_STATUSES.UNPAID,
      },
    })

    return {
      notification: {
        message: "Payment received status updated successfully",
        status: "Success",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Payment received status could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function getFilteredPaymentsReceived(
  request: Request,
  {
    search,
    statuses,
    invoices,
    paymentDate,
  }: {
    search: string | null
    statuses: string[]
    invoices: string[]
    paymentDate: Date | null
  }
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const currentSearch = !!search || search === ""

  const paymentsReceived = await prisma.paymentReceived.findMany({
    where: {
      companyId: user.companyId,
      OR: currentSearch
        ? [
          {
            invoice: {
              invoiceReference: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            paymentReference: {
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
                in: statuses as PaymentStatus[],
              }
              : undefined,
        },
        {
          paymentDate: paymentDate
            ? {
              gte: paymentDate,
            }
            : undefined,
        },
        {
          invoice:
            invoices.length > 0
              ? { invoiceReference: { in: invoices } }
              : undefined,
        },
      ],
    },
    include: {
      invoice: {
        include: {
          salesOrder: {
            include: {
              salesOrderItems: true,
            },
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

  return paymentsReceived || []
}

/***
 * Payments Made
 */

export async function getPaymentsMade(request: Request) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const paymentsMade = await prisma.paymentMade.findMany({
    where: { companyId: user.companyId },
    include: {
      company: { select: { currencies: true } },
      bill: {
        include: {
          purchaseOrder: {
            include: {
              purchaseOrderItems: true,
            },
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

  return paymentsMade || ([] as IPaymentsMade[])
}

export async function getFilteredPaymentsMade(
  request: Request,
  {
    search,
    statuses,
    bills,
    paymentDate,
  }: {
    search: string | null
    statuses: string[]
    bills: string[]
    paymentDate: Date | null
  }
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const currentSearch = !!search || search === ""

  const paymentsMade = await prisma.paymentMade.findMany({
    where: {
      companyId: user.companyId,
      OR: currentSearch
        ? [
          {
            bill: {
              billReference: {
                contains: search,
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
                in: statuses as PaymentStatus[],
              }
              : undefined,
        },
        {
          paymentDate: paymentDate
            ? {
              gte: paymentDate,
            }
            : undefined,
        },
        {
          bill: bills.length > 0 ? { billReference: { in: bills } } : undefined,
        },
      ],
    },
    include: {
      bill: {
        include: {
          purchaseOrder: {
            include: {
              purchaseOrderItems: true,
            },
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

  return paymentsMade || []
}

export async function getPaymentMade(paymentId: IPaymentsMade["id"]) {
  const paymentMade = await prisma.paymentMade.findUnique({
    where: { id: paymentId },
    include: {
      company: { select: { currencies: true } },
      bill: {
        include: {
          purchaseOrder: {
            include: {
              purchaseOrderItems: true,
            },
          },
        },
      },
    },
  })

  return paymentMade
}

export async function getMaxPaymentMadeNumber(
  request: Request
): Promise<string> {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const paymentMadeNumber = await prisma.paymentMade.aggregate({
    where: { companyId: user.companyId },
    _max: {
      paymentNumber: true,
    },
  })

  const paymentNumber =
    parseInt(paymentMadeNumber?._max.paymentNumber || "00000") + 1

  return paymentNumber.toString().padStart(5, "0")
}

export async function createPaymentMade(
  request: Request,
  paymentMade: IPaymentsMade
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const foundPaymentMade = await prisma.paymentMade.findFirst({
    where: {
      paymentReference: paymentMade?.paymentReference,
      companyId: user.companyId,
    } as any,
  })

  if (foundPaymentMade) {
    return {
      errors: {
        paymentReference: "A payment already exists with this reference",
      },
    }
  }
  try {
    const paymentMadeNumber = await getMaxPaymentReceivedNumber(request)

    const bill = (await prisma.bill.findUnique({
      where: { id: paymentMade.billId },
      include: {
        purchaseOrder: {
          include: {
            purchaseOrderItems: true,
          },
        },
        paymentsMade: true,
      },
    })) as IBill

    const amountDue = getTotalAmountDueByBill(bill)

    const amountPaid = getAmountPaidByBill(
      bill,
      paymentMade.id,
      paymentMade.amountReceived
    )

    const balanceDue = getBalanceDue(amountPaid, amountDue)

    await prisma.paymentMade.create({
      data: {
        paymentReference: paymentMade?.paymentReference,
        paymentNumber: paymentMadeNumber,
        companyId: user.companyId,
        paymentDate: paymentMade.paymentDate,
        paymentMethod: paymentMade.paymentMethod,
        amountReceived: paymentMade.amountReceived,
        billId: paymentMade.billId,
        balanceDue,
        notes: paymentMade.notes,
        status: getPaymentMadeStatus(paymentMade.amountReceived, amountDue),
      },
    })

    await prisma.bill.update({
      where: { id: paymentMade.billId },
      data: {
        status: getBillStatus(amountPaid, amountDue),
      },
    })

    return {
      notification: {
        message: "Payment made successfully created",
        status: "Success",
        redirectTo: "/payments-made",
      },
    }
  } catch {
    return {
      notification: {
        message: "Bill could not be created",
        status: "Error",
      },
    }
  }
}

export async function updatePaymentMade(
  request: Request,
  paymentMade: IPaymentsMade
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  const foundPaymentMade = await prisma.paymentMade.findFirst({
    where: {
      paymentReference: paymentMade?.paymentReference,
      id: { not: paymentMade.id },
      companyId: user.companyId,
    },
  })

  if (foundPaymentMade) {
    return {
      errors: {
        paymentReference: "A payment already exists with this reference",
      },
    }
  }

  try {
    const bill = (await prisma.bill.findUnique({
      where: {
        id: paymentMade.billId,
      },
      include: {
        purchaseOrder: {
          include: {
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
    })) as IBill

    const amountDue = getTotalAmountDueByBill(bill)

    const amountPaid = getAmountPaidByBill(
      bill,
      paymentMade.id,
      paymentMade.amountReceived
    )

    const balanceDue = getBalanceDue(amountPaid, amountDue)

    await prisma.paymentMade.update({
      where: { id: paymentMade.id },
      data: {
        paymentReference: paymentMade.paymentReference,
        paymentMethod: paymentMade.paymentMethod,
        paymentDate: paymentMade.paymentDate,
        amountReceived: paymentMade.amountReceived,
        billId: paymentMade.billId,
        balanceDue,
        notes: paymentMade.notes,
        status: getPaymentMadeStatus(paymentMade.amountReceived, amountDue),
      },
    })

    await prisma.bill.update({
      where: { id: paymentMade.billId },
      data: {
        status: getBillStatus(amountPaid, amountDue),
      },
    })

    return {
      notification: {
        message: "Payment made successfully updated",
        status: "Success",
        redirectTo: "/payments-made",
      },
    }
  } catch {
    return {
      notification: {
        message: "Payment made could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}

export async function updatePaymentMadeStatus(
  request: Request,
  {
    paymentMadeId,
    status,
  }: {
    paymentMadeId: IPaymentsMade["id"]
    status: IPaymentsMade["status"]
  }
) {
  const user = await requireBetterAuthUser(request, ["read:paymentsReceived"])

  try {
    const paymentmade = await prisma.paymentMade.update({
      where: { id: paymentMadeId },
      data: {
        status,
      },
      include: {
        bill: true,
      },
    })

    await prisma.bill.update({
      where: { id: paymentmade.bill?.id },
      data: {
        status: BILL_STATUSES.UNPAID,
      },
    })

    return {
      notification: {
        message: "Payment made status updated successfully",
        status: "Success",
      },
    }
  } catch (error) {
    return {
      notification: {
        message: "Payment made status could not be updated",
        status: "Error",
        autoClose: false,
      },
    }
  }
}
