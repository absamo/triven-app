import {
  TRANSFER_ORDER_REASONS,
  TRANSFER_ORDER_STATUSES,
} from "~/app/common/constants"

export function getTransferOrderReasonLabel(reason: string, t?: (key: string) => string) {
  if (t) {
    // Return translated labels when translation function is provided
    switch (reason) {
      case TRANSFER_ORDER_REASONS.DAMAGED_ITEMS:
        return t('damagedItems')
      case TRANSFER_ORDER_REASONS.EXCESS_STOCK:
        return t('excessStock')
      case TRANSFER_ORDER_REASONS.QUALITY_CONTROL:
        return t('qualityControl')
      case TRANSFER_ORDER_REASONS.INTERNAL_TRANSFER:
        return t('internalTransfer')
      case TRANSFER_ORDER_REASONS.RETURN_SUPPLIER:
        return t('returnSupplier')
      case TRANSFER_ORDER_REASONS.UNACCOUNTED_INVENTORY:
        return t('unaccountedInventory')
      case TRANSFER_ORDER_REASONS.DEMO:
        return t('demo')
      case TRANSFER_ORDER_REASONS.LOST_ITEMS:
        return t('lostItems')
      case TRANSFER_ORDER_REASONS.PURCHASE:
        return t('purchase')
      case TRANSFER_ORDER_REASONS.SALE:
        return t('sale')
      case TRANSFER_ORDER_REASONS.RETURN:
        return t('return')
      case TRANSFER_ORDER_REASONS.REFUND:
        return t('refund')
      case TRANSFER_ORDER_REASONS.OTHER:
        return t('other')
      default:
        return t('unknown')
    }
  }

  // Return English labels when no translation function is provided
  switch (reason) {
    case TRANSFER_ORDER_REASONS.DAMAGED_ITEMS:
      return { label: "Damaged items" }
    case TRANSFER_ORDER_REASONS.EXCESS_STOCK:
      return { label: "Excess stock" }
    case TRANSFER_ORDER_REASONS.QUALITY_CONTROL:
      return { label: "Quality control" }
    case TRANSFER_ORDER_REASONS.INTERNAL_TRANSFER:
      return { label: "Internal transfer" }
    case TRANSFER_ORDER_REASONS.RETURN_SUPPLIER:
      return { label: "Return supplier" }
    case TRANSFER_ORDER_REASONS.UNACCOUNTED_INVENTORY:
      return { label: "Unaccounted inventory" }
    case TRANSFER_ORDER_REASONS.DEMO:
      return { label: "Demo" }
    case TRANSFER_ORDER_REASONS.LOST_ITEMS:
      return { label: "Lost items" }
    case TRANSFER_ORDER_REASONS.PURCHASE:
      return { label: "Purchase" }
    case TRANSFER_ORDER_REASONS.SALE:
      return { label: "Sale" }
    case TRANSFER_ORDER_REASONS.RETURN:
      return { label: "Return" }
    case TRANSFER_ORDER_REASONS.REFUND:
      return { label: "Refund" }
    case TRANSFER_ORDER_REASONS.OTHER:
      return { label: "Other" }
    default:
      return { label: "Unknown" }
  }
}

export function getTransferOrderStatusLabel(status: string | undefined, t?: (key: string) => string) {
  const getColor = () => {
    switch (status) {
      case TRANSFER_ORDER_STATUSES.PENDING:
        return "yellow"
      case TRANSFER_ORDER_STATUSES.CONFIRMED:
        return "blue"
      case TRANSFER_ORDER_STATUSES.DELIVERED:
        return "green"
      case TRANSFER_ORDER_STATUSES.INTRANSIT:
        return "violet"
      case TRANSFER_ORDER_STATUSES.RETURNED:
        return "orange"
      case TRANSFER_ORDER_STATUSES.CANCELLED:
        return "red"
      default:
        return "gray"
    }
  }

  if (t) {
    // Return translated labels when translation function is provided
    switch (status) {
      case TRANSFER_ORDER_STATUSES.PENDING:
        return { label: t('pending'), color: getColor() }
      case TRANSFER_ORDER_STATUSES.CONFIRMED:
        return { label: t('confirmed'), color: getColor() }
      case TRANSFER_ORDER_STATUSES.DELIVERED:
        return { label: t('delivered'), color: getColor() }
      case TRANSFER_ORDER_STATUSES.INTRANSIT:
        return { label: t('inTransit'), color: getColor() }
      case TRANSFER_ORDER_STATUSES.RETURNED:
        return { label: t('returned'), color: getColor() }
      case TRANSFER_ORDER_STATUSES.CANCELLED:
        return { label: t('cancelled'), color: getColor() }
      default:
        return { label: t('unknown'), color: getColor() }
    }
  }

  // Return English labels when no translation function is provided
  switch (status) {
    case TRANSFER_ORDER_STATUSES.PENDING:
      return { label: "Pending", color: getColor() }
    case TRANSFER_ORDER_STATUSES.CONFIRMED:
      return { label: "Confirmed", color: getColor() }
    case TRANSFER_ORDER_STATUSES.DELIVERED:
      return { label: "Delivered", color: getColor() }
    case TRANSFER_ORDER_STATUSES.INTRANSIT:
      return { label: "In transit", color: getColor() }
    case TRANSFER_ORDER_STATUSES.RETURNED:
      return { label: "Returned", color: getColor() }
    case TRANSFER_ORDER_STATUSES.CANCELLED:
      return { label: "Cancelled", color: getColor() }
    default:
      return { label: "Unknown", color: getColor() }
  }
}
