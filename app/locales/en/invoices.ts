export default {
  // Main page title and navigation
  title: 'Invoices',
  addInvoice: 'Add Invoice',
  editInvoice: 'Edit Invoice',
  viewInvoice: 'View Invoice',

  // Invoice form fields
  invoiceReference: 'Invoice Reference',
  invoiceReferenceLabel: 'Invoice Reference',
  invoiceDate: 'Invoice Date',
  dueDate: 'Due Date',
  salesOrder: 'Sales Order',
  salesOrderReference: 'Sales Order Reference',
  notes: 'Notes',

  // Invoice status
  unpaid: 'Unpaid',
  paid: 'Paid',
  partiallyPaid: 'Partially Paid',
  cancelled: 'Cancelled',
  overdue: 'Overdue',
  pending: 'Pending',
  overpaid: 'Overpaid',

  // Invoice table headers
  date: 'Date',
  amountDue: 'Amount Due',
  amountPaid: 'Amount Paid',
  salesOrderItem: 'Sales Order Item',
  quantity: 'Quantity',
  rate: 'Rate',
  tax: 'Tax',
  amount: 'Amount',
  total: 'Total',

  // Placeholders and search
  search: 'Search invoices by reference or customer...',
  selectSalesOrder: 'Select a sales order',

  // Filter options
  filterByStatus: 'Filter by status',
  filterBySalesOrders: 'Filter by sales orders',
  filterByCreatedDate: 'Filter by created date',

  // Messages
  noInvoicesFound: 'No invoices found',
  noSalesOrdersFound: 'No sales orders found',
  noSalesItemsFound: 'No sales items found',

  // Actions
  generatePDF: 'Generate PDF',
  viewPurchaseOrder: 'View Purchase Order',
  viewPaymentsReceived: 'View Payments Received',
  cancelInvoice: 'Cancel Invoice',

  // Form validation messages
  invoiceReferenceRequired: 'Invoice reference is required',
  salesOrderRequired: 'Sales order is required',
  invoiceDateRequired: 'Invoice date is required',
  dueDateRequired: 'Due date is required',

  // Success/Error messages
  invoiceCreated: 'Invoice created successfully',
  invoiceUpdated: 'Invoice updated successfully',
  invoiceCancelled: 'Invoice cancelled successfully',
  invoiceDeleted: 'Invoice deleted successfully',
  pdfGenerated: 'PDF generated successfully',

  // Confirmation messages
  confirmCancelInvoice: 'Are you sure you want to cancel this invoice?',
  confirmDeleteInvoice: 'Are you sure you want to delete this invoice?',

  // Status translations for helper function
  status: {
    pending: 'Pending',
    unpaid: 'Unpaid',
    paid: 'Paid',
    partiallyPaid: 'Partially Paid',
    cancelled: 'Cancelled',
    overdue: 'Overdue',
    overpaid: 'Overpaid',
  },
}
