export const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALESPERSON: 'Salesperson',
  WAREHOUSESTAFF: 'WarehouseStaff',
  STORESTAFF: 'StoreStaff',
  CUSTOMER: 'Customer',
  SUPPLIER: 'Supplier',
} as const

export const USER_STATUSES = {
  PENDING: 'Pending',
  REGISTERED: 'Registered',
  CANCELLED: 'Cancelled',
  PENDING_BUSINESS_SETUP: 'PendingBusinessSetup',
} as const

export const INVITATION_STATUSES = {
  INVITED: 'Invited',
  ACCEPTED: 'Accepted',
  CANCELLED: 'Cancelled',
} as const

export const ATTRIBUTE_TYPES = {
  COLOR: 'Color',
  CONFIRMATION: 'Confirmation',
  SIZE: 'Size',
  WEIGHT: 'Weight',
  LENGTH: 'Length',
  WIDTH: 'Width',
  HEIGHT: 'Height',
  VOLUME: 'Volume',
  BARCODE: 'Barcode',
} as const

export const PRODUCT_UNITS = {
  PIECES: 'Pieces',
  BOX: 'Box',
  CENTIMETER: 'Centimeter',
  METER: 'Meter',
  KILOGRAM: 'Kilogram',
  GRAM: 'Gram',
  LITER: 'Liters',
  MILLILITER: 'Milliliter',
  MILLIGRAM: 'Milligram',
  POUND: 'Pound',
  OUNCE: 'Ounce',
  DOZEN: 'Dozen',
  FOOT: 'Foot',
  Inch: 'Inch',
  PACK: 'Pack',
} as const

export const PRODUCT_STATUSES = {
  AVAILABLE: 'Available',
  ARCHIVED: 'Archived',
  OUTOFSTOCK: 'OutOfStock',
  LOWSTOCK: 'LowStock',
  ONORDER: 'OnOrder',
  RESERVED: 'Reserved',
  DISCONTINUED: 'Discontinued',
  INTRANSIT: 'InTransit',
  DAMAGED: 'Damaged',
  CRITICAL: 'Critical',
} as const

export const ADJUSTMENT_STATUSES = {
  PENDING: 'Pending',
  ARCHIVED: 'Approved',
  COMPLETED: 'Completed',
} as const

export const ADJUSTMENT_REASONS = {
  DAMAGED_ITEMS: 'DamagedItems',
  EXCESS_STOCK: 'ExcessStock',
  QUALITY_CONTROL: 'QualityControl',
  INTERNAL_TRANSFER: 'InternalTransfer',
  RETURN_SUPPLIER: 'ReturnSupplier',
  UNACCOUNTED_INVENTORY: 'UnaccountedInventory',
  DEMO: 'Demo',
  LOST_ITEMS: 'LostItems',
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  RETURN: 'Return',
  REFUND: 'Refund',
} as const

export const NOTIFICATION_STATUSES = {
  AVAILABLE: 'Available',
  LOWSTOCK: 'LowStock',
  OUTOFSTOCK: 'OutOfStock',
  RESTOCKREMINDER: 'RestockReminder',
  // NEWORDER: "NewOrder",
  // NEWSALE: "NewSale",
  // NEWRETURN: "NewReturn",
  // ORDERSHIPPED: "OrderShipped",
  // ORDERDELAYED: "OrderDelayed",
  CRITICAL: 'Critical',
  EXPIREDPRODUCT: 'ExpiredProduct',
  EXPIRINGPRODUCT: 'ExpiringProduct',
  // PRICECHANGE: "PriceChange",
  // WEEKLYSUMMARY: "WeeklySummary",
} as const

export const ROLE_PERMISSIONS = {
  FULL_ACCESS: 'Full access',
  READ: 'Read',
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  // ARCHIVE: "Archive",
  // APPROUVE: "Aprove",
} as const

export const PURCHASE_ORDER_STATUSES = {
  PENDING: 'Pending',
  ISSUED: 'Issued',
  RECEIVED: 'Received',
  PARTIALLY_RECEIVED: 'PartiallyReceived',
  CANCELLED: 'Cancelled',
} as const

export const PURCHASE_ORDER_PAYMENT_TERMS = {
  NET15: 'Net15',
  NET30: 'Net30',
  NET45: 'Net45',
  NET60: 'Net60',
  DUEONRECEIPT: 'DueOnReceipt',
  DUEENDOFMONTH: 'DueEndOfMonth',
  DUEENDOFNEXTMONTH: 'DueEndOfNextMonth',
  PAYMENTINADVANCE: 'PaymentInAdvance',
  DUEONDATE: 'DueOnDate',
} as const

export const SALES_ORDERS_STATUSES = {
  PENDING: 'Pending',
  ISSUED: 'Issued',
  SHIPPED: 'Shipped',
  PARTIALLY_SHIPPED: 'PartiallyShipped',
  DELIVERED: 'Delivered',
  PARTIALLY_DELIVERED: 'PartiallyDelivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
} as const

export const SALES_ORDERS_ITEMS_STATUSES = {
  PENDING: 'Pending',
  ISSUED: 'Issued',
  SHIPPED: 'Shipped',
  PARTIALLY_SHIPPED: 'PartiallyShipped',
  DELIVERED: 'Delivered',
  PARTIALLY_DELIVERED: 'PartiallyDelivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
} as const

export const INVOICE_STATUSES = {
  PENDING: 'Pending',
  SENT: 'Sent',
  PAID: 'Paid',
  PARTIALLYPAID: 'PartiallyPaid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  UNPAID: 'Unpaid',
  REFUNDED: 'Refunded',
  CUSTOMERVIEWED: 'CustomerViewed',
  //PAYMENTINITIATED: "PaymentInitiated",
  LOCKED: 'Locked',
  OVERPAID: 'Overpaid',
} as const

export const BILL_STATUSES = {
  PAID: 'Paid',
  PARTIALLYPAID: 'PartiallyPaid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  UNPAID: 'Unpaid',
  REFUNDED: 'Refunded',
  CUSTOMERVIEWED: 'CustomerViewed',
  LOCKED: 'Locked',
  SENT: 'Sent',
  OVERPAID: 'Overpaid',
  UNBILLED: 'Unbilled',
} as const

export const PAYMENT_STATUSES = {
  PAID: 'Paid',
  PARTIALLYPAID: 'PartiallyPaid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  UNPAID: 'Unpaid',
  REFUNDED: 'Refunded',
  LOCKED: 'Locked',
  OVERPAID: 'Overpaid',
} as const

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CREDITCARD: 'CreditCard',
  DEBITCARD: 'DebitCard',
  BANKTRANSFER: 'BankTransfer',
  CHEQUE: 'Cheque',
  // PAYPAL: "Paypal",
  // STRIPE: "Stripe",
  // SQUARE: "Square",
  // APPLEPAY: "ApplePay",
  // GOOGLEPAY: "GooglePay",
} as const

export const SITE_TYPES = {
  WAREHOUSE: 'Warehouse',
  STORE: 'Store',
} as const

export const TRANSFER_ORDER_REASONS = {
  DAMAGED_ITEMS: 'DamagedItems',
  EXCESS_STOCK: 'ExcessStock',
  QUALITY_CONTROL: 'QualityControl',
  INTERNAL_TRANSFER: 'InternalTransfer',
  RETURN_SUPPLIER: 'ReturnSupplier',
  UNACCOUNTED_INVENTORY: 'UnaccountedInventory',
  DEMO: 'Demo',
  LOST_ITEMS: 'LostItems',
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  RETURN: 'Return',
  REFUND: 'Refund',
  OTHER: 'Other',
} as const

export const TRANSFER_ORDER_STATUSES = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  INTRANSIT: 'InTransit',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
} as const

export const BACKORDER_STATUSES = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
} as const

export const BACKORDER_ITEM_STATUSES = {
  PENDING: 'Pending',
  PARTIALLY_FULFILLED: 'PartiallyFulfilled',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
} as const

// Workflow & Approval Constants
export const WORKFLOW_TRIGGER_TYPES = {
  MANUAL: 'manual',
  PURCHASE_ORDER_CREATE: 'purchase_order_create',
  PURCHASE_ORDER_THRESHOLD: 'purchase_order_threshold',
  SALES_ORDER_CREATE: 'sales_order_create',
  SALES_ORDER_THRESHOLD: 'sales_order_threshold',
  STOCK_ADJUSTMENT_CREATE: 'stock_adjustment_create',
  TRANSFER_ORDER_CREATE: 'transfer_order_create',
  INVOICE_CREATE: 'invoice_create',
  BILL_CREATE: 'bill_create',
  CUSTOMER_CREATE: 'customer_create',
  SUPPLIER_CREATE: 'supplier_create',
  PRODUCT_CREATE: 'product_create',
  LOW_STOCK_ALERT: 'low_stock_alert',
  HIGH_VALUE_TRANSACTION: 'high_value_transaction',
  BULK_OPERATION: 'bulk_operation',
  SCHEDULED: 'scheduled',
  CUSTOM_CONDITION: 'custom_condition',
} as const

export const WORKFLOW_STEP_TYPES = {
  APPROVAL: 'approval',
  NOTIFICATION: 'notification',
  DATA_VALIDATION: 'data_validation',
  AUTOMATIC_ACTION: 'automatic_action',
  CONDITIONAL_LOGIC: 'conditional_logic',
  PARALLEL_APPROVAL: 'parallel_approval',
  SEQUENTIAL_APPROVAL: 'sequential_approval',
  ESCALATION: 'escalation',
  INTEGRATION: 'integration',
  CUSTOM: 'custom',
} as const

export const WORKFLOW_ENTITY_TYPES = {
  PURCHASE_ORDER: 'purchase_order',
  SALES_ORDER: 'sales_order',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  TRANSFER_ORDER: 'transfer_order',
  INVOICE: 'invoice',
  BILL: 'bill',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  PRODUCT: 'product',
  PAYMENT_MADE: 'payment_made',
  PAYMENT_RECEIVED: 'payment_received',
  BACKORDER: 'backorder',
  CUSTOM: 'custom',
} as const

export const WORKFLOW_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  ESCALATED: 'escalated',
} as const

export const WORKFLOW_STEP_STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  ESCALATED: 'escalated',
} as const

export const WORKFLOW_DECISIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
  DELEGATED: 'delegated',
  MORE_INFO_REQUIRED: 'more_info_required',
} as const

export const APPROVAL_ASSIGNEE_TYPES = {
  USER: 'user',
  ROLE: 'role',
  CREATOR: 'creator',
  MANAGER: 'manager',
  DEPARTMENT_HEAD: 'department_head',
  CUSTOM_LOGIC: 'custom_logic',
} as const

export const APPROVAL_ENTITY_TYPES = {
  PURCHASE_ORDER: 'purchase_order',
  SALES_ORDER: 'sales_order',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  TRANSFER_ORDER: 'transfer_order',
  INVOICE: 'invoice',
  BILL: 'bill',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  PRODUCT: 'product',
  PAYMENT_MADE: 'payment_made',
  PAYMENT_RECEIVED: 'payment_received',
  BACKORDER: 'backorder',
  BUDGET_CHANGE: 'budget_change',
  PRICE_CHANGE: 'price_change',
  DISCOUNT_APPROVAL: 'discount_approval',
  REFUND_REQUEST: 'refund_request',
  RETURN_AUTHORIZATION: 'return_authorization',
  CUSTOM: 'custom',
} as const

export const APPROVAL_REQUEST_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  THRESHOLD_BREACH: 'threshold_breach',
  EXCEPTION_HANDLING: 'exception_handling',
  CUSTOM: 'custom',
} as const

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  MORE_INFO_REQUIRED: 'more_info_required',
} as const

export const APPROVAL_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
  URGENT: 'Urgent',
} as const

export const APPROVAL_DECISIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
  DELEGATED: 'delegated',
  MORE_INFO_REQUIRED: 'more_info_required',
  CONDITIONAL_APPROVAL: 'conditional_approval',
} as const
