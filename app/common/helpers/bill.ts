import { BILL_STATUSES, PAYMENT_STATUSES } from '~/app/common/constants'
import type { IBill } from '../validations/billSchema'
import type { IPaymentsReceived } from '../validations/paymentsReceivedSchema'
import { roundMoney } from './money'

export function getBillStatusLabel(status: string | undefined) {
  switch (status) {
    case BILL_STATUSES.UNPAID:
      return { label: 'Unpaid', color: 'blue' }
    case BILL_STATUSES.PAID:
      return { label: 'Paid', color: 'green' }
    case BILL_STATUSES.PARTIALLYPAID:
      return { label: 'Partially Paid', color: 'orange' }
    case BILL_STATUSES.OVERDUE:
      return { label: 'Overdue', color: 'red' }
    case BILL_STATUSES.CANCELLED:
      return { label: 'Cancelled', color: 'red' }
    case BILL_STATUSES.OVERPAID:
      return { label: 'Overpaid', color: 'purple' }

    default:
      return { label: 'Unknown', color: 'gray' }
  }
}

export function getBillStatus(amountPaid: number, amountDue: number) {
  if (amountPaid === 0) {
    return BILL_STATUSES.UNPAID
  }

  if (amountPaid === amountDue) {
    return BILL_STATUSES.PAID
  }

  if (amountPaid < amountDue) {
    return BILL_STATUSES.PARTIALLYPAID
  }

  if (amountPaid > amountDue) {
    return BILL_STATUSES.OVERPAID
  }

  return BILL_STATUSES.UNPAID
}

export function getTotalAmountDueByBill(bill: IBill) {
  const total =
    bill?.purchaseOrder?.purchaseOrderItems?.reduce((acc, item) => acc + (item.amount || 0), 0) || 0
  return roundMoney(total)
}

export function getAmountPaidByBill(
  bill: IBill,
  paymentMadeId: string | undefined,
  amountReceived: number
) {
  const paymentsMade = (bill?.paymentsMade || []).filter(
    (payment) => payment.id !== paymentMadeId && payment.status !== PAYMENT_STATUSES.CANCELLED
  )

  const total =
    paymentsMade.reduce((acc, payment) => acc + payment.amountReceived, 0) + amountReceived || 0
  return roundMoney(total)
}

export function getTotalAmountPaid(bill: IBill) {
  const total = ((bill?.paymentsMade as IPaymentsReceived[]) || []).reduce(
    (acc, item) => acc + (item.amountReceived || 0),
    0
  )
  return roundMoney(total)
}

export function getBalanceDue(amountPaid: number, amountDue: number) {
  const balanceDue = amountDue - amountPaid
  return roundMoney(balanceDue < 0 ? 0 : balanceDue)
}
