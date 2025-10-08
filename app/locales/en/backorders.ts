export default {
  // Main title and labels
  title: 'Backorders',
  backorders: 'Backorders',
  backorder: 'Backorder',

  // Form fields
  backorderReference: 'Backorder Reference',
  orderDate: 'Order Date',
  originalOrderDate: 'Original Order Date',
  expectedFulfillDate: 'Expected Fulfill Date',
  customerName: 'Customer Name',
  agency: 'Agency',
  orderStatus: 'Order Status',
  amount: 'Amount',
  notes: 'Notes',

  // Status values
  pending: 'Pending',
  partial: 'Partial',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',

  // Sales Order Integration
  salesOrder: 'Sales Order',
  salesOrderDescription: 'Link this backorder to an existing sales order',
  salesOrderReference: 'Sales Order Reference',
  noSalesOrdersAvailable: 'No sales orders available for selected customer',

  // Actions
  fulfillOrder: 'Fulfill Order',
  cancelOrder: 'Cancel Order',
  createBackorder: 'Create Backorder',
  editBackorder: 'Edit Backorder',
  addBackorder: 'Add Backorder',

  // Filters and search
  search: 'Search backorders...',
  filterByOrderStatuses: 'Filter by order status',
  filterByBackorder: 'Filter by backorder',
  filterByOrderDate: 'Filter by order date',

  // Messages
  noBackordersFound: 'No backorders found',
  showingCount: 'Showing {{count}} backorders',
  showingCountSingular: 'Showing {{count}} backorder',
  selectOutOfStockProduct: 'Select out-of-stock product',
  noOutOfStockProductsAvailable: 'No out-of-stock products available',
  backorderCreated: 'Backorder created successfully',
  backorderUpdated: 'Backorder updated successfully',
  backorderFulfilled: 'Backorder fulfilled successfully',
  backorderCancelled: 'Backorder cancelled successfully',

  // Table headers
  dateHeader: 'Date',
  referenceHeader: 'Reference',
  statusHeader: 'Status',
  customerHeader: 'Customer',
  agencyHeader: 'Agency',
  amountHeader: 'Amount',

  // Item details
  items: 'Items',
  orderedQuantity: 'Ordered Quantity',
  fulfilledQuantity: 'Fulfilled Quantity',
  remainingQuantity: 'Remaining Quantity',
  rate: 'Rate',
  itemAmount: 'Item Amount',
  productName: 'Product Name',

  // Status descriptions
  pendingDescription: 'Waiting for stock availability',
  partialDescription: 'Some items have been fulfilled',
  fulfilledDescription: 'All items have been fulfilled',
  cancelledDescription: 'Backorder has been cancelled',

  // Validation messages
  backorderReferenceRequired: 'Backorder reference is required',
  customerRequired: 'Customer is required',
  agencyRequired: 'Agency is required',
  siteRequired: 'Site is required',
  originalOrderDateRequired: 'Original order date is required',
  itemsRequired: 'At least one item is required',
  backorderItemRequired: 'Please add a backorder item before submitting the form',
  noProductSelectedError: 'Please select a product for all backorder items',
  invalidQuantityError: 'Please enter a valid quantity for all backorder items',
  backorderItemErrors: 'Backorder Item Errors:',
  item: 'Item',

  // Fulfillment
  fulfillItem: 'Fulfill Item',
  fulfillQuantity: 'Fulfill Quantity',
  availableStock: 'Available Stock',
  partialFulfillment: 'Partial Fulfillment',
  completeFulfillment: 'Complete Fulfillment',
}
