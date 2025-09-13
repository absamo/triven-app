import {
  SALES_ORDERS_STATUSES,
  SALES_ORDERS_ITEMS_STATUSES,
} from "~/app/common/constants"

export function getSalesOrderStatusLabel(status: string) {
  switch (status) {
    case SALES_ORDERS_STATUSES.PENDING:
      return { label: "Pending", color: "gray" }
    case SALES_ORDERS_STATUSES.ISSUED:
      return { label: "Issued", color: "blue" }
    case SALES_ORDERS_STATUSES.SHIPPED:
      return { label: "Shipped", color: "purple" }
    case SALES_ORDERS_STATUSES.DELIVERED:
      return { label: "Delivered", color: "green" }
    case SALES_ORDERS_STATUSES.PARTIALLY_DELIVERED:
      return { label: "Partially Delivered", color: "orange" }
    case SALES_ORDERS_STATUSES.CANCELLED:
      return { label: "Cancelled", color: "red" }

    default:
      return {}
  }
}

export function getSalesOrderItemsStatusLabel(status: string) {
  switch (status) {
    case SALES_ORDERS_ITEMS_STATUSES.PENDING:
      return { label: "Pending", color: "gray" }
    case SALES_ORDERS_ITEMS_STATUSES.ISSUED:
      return { label: "Issued", color: "blue" }
    case SALES_ORDERS_ITEMS_STATUSES.SHIPPED:
      return { label: "Shipped", color: "purple" }
    case SALES_ORDERS_ITEMS_STATUSES.DELIVERED:
      return { label: "Delivered", color: "green" }
    case SALES_ORDERS_ITEMS_STATUSES.PARTIALLY_DELIVERED:
      return { label: "Partially Delivered", color: "orange" }
    case SALES_ORDERS_ITEMS_STATUSES.CANCELLED:
      return { label: "Cancelled", color: "red" }
    case SALES_ORDERS_ITEMS_STATUSES.RETURNED:
      return { label: "Returned", color: "orange" }

    default:
      return {}
  }
}
