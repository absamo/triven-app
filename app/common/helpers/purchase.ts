import { PURCHASE_ORDER_STATUSES } from "~/app/common/constants"
import type { IPurchaseOrder } from "../validations/purchaseOrderSchema"

export function getPurchaseOrderItemsStatusLabel(
  orderedQuantity: number,
  receivedQuantity: number,
  cancelled?: boolean
) {
  if (cancelled) {
    return { label: "Cancelled", color: "red" }
  }

  if (orderedQuantity === receivedQuantity) {
    return { label: "Received", color: "green" }
  }

  if (receivedQuantity > 0 && receivedQuantity < orderedQuantity) {
    return { label: "Partially Received", color: "orange" }
  }

  return { label: "Pending", color: "gray" }
}

export function getPurchaseOrderStatusLabel(status: IPurchaseOrder["status"]) {
  switch (status) {
    case PURCHASE_ORDER_STATUSES.ISSUED:
      return { label: "Issued", color: "blue" }
    case PURCHASE_ORDER_STATUSES.PENDING:
      return { label: "Pending", color: "gray" }
    case PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED:
      return { label: "Partially Received", color: "orange" }
    case PURCHASE_ORDER_STATUSES.RECEIVED:
      return { label: "Received", color: "green" }
    case PURCHASE_ORDER_STATUSES.CANCELLED:
      return { label: "Cancelled", color: "red" }
    default:
      return { label: "Unknown", color: "red" }
  }
}

export function getPurchaseOrderStatus(purchaseOrder: IPurchaseOrder): string {
  if (purchaseOrder?.purchaseReceives?.length === 0) {
    return PURCHASE_ORDER_STATUSES.ISSUED
  }

  if (
    purchaseOrder?.purchaseReceives?.length ===
    purchaseOrder?.purchaseOrderItems?.length
  ) {
    return PURCHASE_ORDER_STATUSES.RECEIVED
  }

  if (
    (purchaseOrder?.purchaseReceives || []).length <
    (purchaseOrder?.purchaseOrderItems || []).length
  ) {
    return PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
  }

  return PURCHASE_ORDER_STATUSES.PENDING
}
