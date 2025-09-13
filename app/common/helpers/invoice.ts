import { INVOICE_STATUSES } from "~/app/common/constants";
import type { IInvoice } from "../validations/invoiceSchema";
import type { IPaymentsReceived } from "../validations/paymentsReceivedSchema";
import { roundMoney } from "./money";

export function getInvoiceStatusLabel(status: string | null, t?: (key: string, fallback?: string) => string) {
  const translations = t || ((key: string, fallback?: string) => fallback || key.split(':')[1] || key);

  switch (status) {
    case INVOICE_STATUSES.PENDING:
      return { label: translations("invoices:status.pending", "Pending"), color: "gray" }
    case INVOICE_STATUSES.UNPAID:
      return { label: translations("invoices:status.unpaid", "Unpaid"), color: "blue" }
    case INVOICE_STATUSES.PAID:
      return { label: translations("invoices:status.paid", "Paid"), color: "green" }
    case INVOICE_STATUSES.PARTIALLYPAID:
      return { label: translations("invoices:status.partiallyPaid", "Partially Paid"), color: "orange" }
    case INVOICE_STATUSES.OVERDUE:
      return { label: translations("invoices:status.overdue", "Overdue"), color: "red" }
    case INVOICE_STATUSES.CANCELLED:
      return { label: translations("invoices:status.cancelled", "Cancelled"), color: "red" }
    case INVOICE_STATUSES.OVERPAID:
      return { label: translations("invoices:status.overpaid", "Overpaid"), color: "green" }

    default:
      return {}
  }
}

export function getInvoiceStatus(amountPaid: number, amountDue: number) {
  if (amountPaid === 0) {
    return INVOICE_STATUSES.UNPAID
  }

  if (amountPaid === amountDue) {
    return INVOICE_STATUSES.PAID
  }

  if (amountPaid < amountDue) {
    return INVOICE_STATUSES.PARTIALLYPAID
  }

  if (amountPaid > amountDue) {
    return INVOICE_STATUSES.OVERPAID
  }

  return INVOICE_STATUSES.UNPAID
}

export function getTotalAmountDueByInvoice(invoice: IInvoice) {
  const total = (invoice?.salesOrder?.salesOrderItems || []).reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  ) || 0
  return roundMoney(total)
}

export function getAmountPaidByInvoice(
  invoice: IInvoice,
  paymentReceivedId: string | undefined,
  amountReceived: number
) {
  const paymentsReceived = (invoice?.paymentsReceived || []).filter(
    (payment) =>
      payment.id !== paymentReceivedId &&
      payment.status !== INVOICE_STATUSES.CANCELLED
  ) as IPaymentsReceived[]

  const total = paymentsReceived.reduce((acc, payment) => acc + payment.amountReceived, 0) +
    amountReceived || 0
  return roundMoney(total)
}
