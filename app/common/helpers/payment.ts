import { PAYMENT_METHODS, PAYMENT_STATUSES } from "~/app/common/constants"

export function getPaymentMethodLabel(paymentMethod: string, t?: (key: string, fallback?: string) => string) {
  switch (paymentMethod) {
    case PAYMENT_METHODS.BANKTRANSFER:
      return { label: t ? t('paymentsReceived:bankTransfer', 'Bank Transfer') : "Bank Transfer" }

    case PAYMENT_METHODS.CASH:
      return { label: t ? t('paymentsReceived:cash', 'Cash') : "Cash" }

    case PAYMENT_METHODS.CREDITCARD:
      return { label: t ? t('paymentsReceived:creditCard', 'Credit Card') : "Credit Card" }

    case PAYMENT_METHODS.DEBITCARD:
      return { label: t ? t('paymentsReceived:debitCard', 'Debit Card') : "Debit Card" }

    case PAYMENT_METHODS.CHEQUE:
      return { label: t ? t('paymentsReceived:cheque', 'Cheque') : "Cheque" }

    default:
      return {}
  }
}

export function getPaymentMadeStatus(
  amountReceived: number,
  amountDue: number
) {
  if (amountReceived === amountDue) {
    return PAYMENT_STATUSES.PAID
  }

  if (amountReceived < amountDue) {
    return PAYMENT_STATUSES.PARTIALLYPAID
  }

  if (amountReceived > amountDue) {
    return PAYMENT_STATUSES.OVERPAID
  }

  return PAYMENT_STATUSES.UNPAID
}

export function getPaymentStatusLabel(status: string | undefined, t?: (key: string, fallback?: string) => string) {
  switch (status) {
    case PAYMENT_STATUSES.UNPAID:
      return { label: t ? t('paymentsReceived:unpaid', 'Unpaid') : "Unpaid", color: "blue" }
    case PAYMENT_STATUSES.PAID:
      return { label: t ? t('paymentsReceived:paid', 'Paid') : "Paid", color: "green" }
    case PAYMENT_STATUSES.PARTIALLYPAID:
      return { label: t ? t('paymentsReceived:partiallyPaid', 'Partially Paid') : "Partially Paid", color: "orange" }
    case PAYMENT_STATUSES.OVERDUE:
      return { label: t ? t('paymentsReceived:overdue', 'Overdue') : "Overdue", color: "red" }
    case PAYMENT_STATUSES.CANCELLED:
      return { label: t ? t('paymentsReceived:cancelled', 'Cancelled') : "Cancelled", color: "red" }
    case PAYMENT_STATUSES.OVERPAID:
      return { label: t ? t('paymentsReceived:overpaid', 'Overpaid') : "Overpaid", color: "purple" }

    default:
      return { label: t ? t('common:unknown', 'Unknown') : "Unknown", color: "gray" }
  }
}
