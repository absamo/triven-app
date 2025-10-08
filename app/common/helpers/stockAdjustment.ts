import { ADJUSTMENT_REASONS } from '~/app/common/constants'

export function getStockAdjustmentReasonLabel(reason: string, t?: (key: string) => string) {
  if (t) {
    // Return translated labels when translation function is provided
    switch (reason) {
      case ADJUSTMENT_REASONS.DAMAGED_ITEMS:
        return t('damagedItems')
      case ADJUSTMENT_REASONS.EXCESS_STOCK:
        return t('excessStock')
      case ADJUSTMENT_REASONS.QUALITY_CONTROL:
        return t('qualityControl')
      case ADJUSTMENT_REASONS.INTERNAL_TRANSFER:
        return t('internalTransfer')
      case ADJUSTMENT_REASONS.RETURN_SUPPLIER:
        return t('returnSupplier')
      case ADJUSTMENT_REASONS.UNACCOUNTED_INVENTORY:
        return t('unaccountedInventory')
      case ADJUSTMENT_REASONS.DEMO:
        return t('demo')
      case ADJUSTMENT_REASONS.LOST_ITEMS:
        return t('lostItems')
      case ADJUSTMENT_REASONS.PURCHASE:
        return t('purchase')
      case ADJUSTMENT_REASONS.SALE:
        return t('sale')
      case ADJUSTMENT_REASONS.RETURN:
        return t('return')
      case ADJUSTMENT_REASONS.REFUND:
        return t('refund')
      default:
        return t('unknown')
    }
  }

  // Return English labels when no translation function is provided
  switch (reason) {
    case ADJUSTMENT_REASONS.DAMAGED_ITEMS:
      return 'Damaged Items'
    case ADJUSTMENT_REASONS.EXCESS_STOCK:
      return 'Excess Stock'
    case ADJUSTMENT_REASONS.QUALITY_CONTROL:
      return 'Quality Control'
    case ADJUSTMENT_REASONS.INTERNAL_TRANSFER:
      return 'Internal Transfer'
    case ADJUSTMENT_REASONS.RETURN_SUPPLIER:
      return 'Return Supplier'
    case ADJUSTMENT_REASONS.UNACCOUNTED_INVENTORY:
      return 'Unaccounted Inventory'
    case ADJUSTMENT_REASONS.DEMO:
      return 'Demo'
    case ADJUSTMENT_REASONS.LOST_ITEMS:
      return 'Lost Items'
    case ADJUSTMENT_REASONS.PURCHASE:
      return 'Purchase'
    case ADJUSTMENT_REASONS.SALE:
      return 'Sale'
    case ADJUSTMENT_REASONS.RETURN:
      return 'Return'
    case ADJUSTMENT_REASONS.REFUND:
      return 'Refund'
    default:
      return 'Unknown'
  }
}
