import Ean from 'ean-generator'
import { PRODUCT_STATUSES } from '~/app/common/constants'
import { type IProduct } from '../validations/productSchema'

let ean = new Ean(['300', '310', '320', '330', '340', '350', '360', '370'])

export function isEan13(barcode: string): boolean {
  return ean.isValid(barcode)
}

export function createEan13(): string {
  return ean.create()
}

export function getStockStatus(product: IProduct) {
  // Use accountingStockOnHand as the primary stock level
  const stockOnHand = product.accountingStockOnHand || 0

  if (
    stockOnHand > product.reorderPoint &&
    stockOnHand - product.reorderPoint <= product.reorderPoint * 0.6
  ) {
    return PRODUCT_STATUSES.LOWSTOCK
  }

  if (stockOnHand <= product.reorderPoint) {
    return PRODUCT_STATUSES.CRITICAL
  }

  if (stockOnHand === 0) {
    return PRODUCT_STATUSES.OUTOFSTOCK
  }

  if (
    stockOnHand - product.reorderPoint > product.reorderPoint * 0.6 &&
    (product.status === PRODUCT_STATUSES.OUTOFSTOCK ||
      product.status === PRODUCT_STATUSES.CRITICAL ||
      product.status === PRODUCT_STATUSES.LOWSTOCK)
  ) {
    return PRODUCT_STATUSES.AVAILABLE
  }

  return product.status
}

export function getStockNotificationMessage(
  productStatus: IProduct['status'],
  productName: IProduct['name']
) {
  let notificationMsg = ''
  switch (productStatus) {
    case PRODUCT_STATUSES.OUTOFSTOCK:
      notificationMsg = `${productName} is out of stock`
      break
    case PRODUCT_STATUSES.LOWSTOCK:
      notificationMsg = `${productName} is low on stock`
      break
    case PRODUCT_STATUSES.CRITICAL:
      notificationMsg = `${productName} is below the safety stock level`
      break
    default:
      break
  }

  return notificationMsg
}
