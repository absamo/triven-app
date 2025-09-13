import { USER_ROLES, USER_STATUSES } from "~/app/common/constants"

export function getUserStatusLabel(status: string) {
  switch (status) {
    case USER_STATUSES.PENDING:
      return { label: "Pending", color: "orange" }
    case USER_STATUSES.REGISTERED:
      return { label: "Registered", color: "blue" }
    case USER_STATUSES.CANCELLED:
      return { label: "Cancelled", color: "red" }

    default:
      return {}
  }
}

export function getUserRoleLabel(role: string) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "Admin"
    case USER_ROLES.MANAGER:
      return "Manager"
    case USER_ROLES.SALESPERSON:
      return "Salesperson"
    case USER_ROLES.SUPPLIER:
      return "Supplier"
    case USER_ROLES.WAREHOUSESTAFF:
      return "Warehouse Staff"

    default:
      return role.charAt(0).toUpperCase() + role.slice(1)
  }
}

export type Permission =
  | "read:products"
  | "create:products"
  | "update:products"
  | "delete:products"
  | "read:stockAdjustments"
  | "create:stockAdjustments"
  | "update:stockAdjustments"
  | "delete:stockAdjustments"
  | "read:categories"
  | "create:categories"
  | "update:categories"
  | "delete:categories"
  | "read:suppliers"
  | "create:suppliers"
  | "update:suppliers"
  | "delete:suppliers"
  | "read:purchaseOrders"
  | "create:purchaseOrders"
  | "update:purchaseOrders"
  | "delete:purchaseOrders"
  | "read:purchaseReceives"
  | "create:purchaseReceives"
  | "update:purchaseReceives"
  | "delete:purchaseReceives"
  | "read:bills"
  | "create:bills"
  | "update:bills"
  | "delete:bills"
  | "read:paymentsMade"
  | "create:paymentsMade"
  | "update:paymentsMade"
  | "delete:paymentsMade"
  | "read:customers"
  | "create:customers"
  | "update:customers"
  | "delete:customers"
  | "read:salesOrders"
  | "create:salesOrders"
  | "update:salesOrders"
  | "delete:salesOrders"
  | "read:invoices"
  | "create:invoices"
  | "update:invoices"
  | "delete:invoices"
  | "read:paymentsReceived"
  | "create:paymentsReceived"
  | "update:paymentsReceived"
  | "delete:paymentsReceived"
  | "read:backorders"
  | "create:backorders"
  | "update:backorders"
  | "delete:backorders"
  | "read:warehouses"
  | "create:warehouses"
  | "update:warehouses"
  | "delete:warehouses"
  | "read:agencies"
  | "create:agencies"
  | "update:agencies"
  | "delete:agencies"
  | "read:roles"
  | "create:roles"
  | "update:roles"
  | "delete:roles"
  | "read:users"
  | "create:users"
  | "update:users"
  | "delete:users"
  | "read:settings"
  | "create:settings"
  | "update:settings"
  | "delete:settings"
  | "read:stores"
  | "create:stores"
  | "update:stores"
  | "delete:stores"
  | "read:sites"
  | "create:sites"
  | "update:sites"
  | "delete:sites"
  | "read:transferOrders"
  | "create:transferOrders"
  | "update:transferOrders"
  | "delete:transferOrders"
  | "read:inventory"
  | "create:inventory"
  | "update:inventory"
  | "delete:inventory"
  | "read:analytics"
  | "create:analytics"
  | "update:analytics"
  | "delete:analytics"
