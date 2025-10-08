export default {
  // Main page title and navigation
  title: 'Payments Received',
  addPaymentReceived: 'Add Payment Received',
  editPaymentReceived: 'Edit Payment Received',
  viewPaymentReceived: 'View Payment Received',

  // Payment form fields
  paymentReference: 'Payment Reference',
  paymentDate: 'Payment Date',
  paymentMethod: 'Payment Method',
  customer: 'Customer',
  invoice: 'Invoice',
  invoiceReference: 'Invoice Reference',
  amountReceived: 'Amount Received',
  amountDue: 'Amount Due',
  amountPaid: 'Amount Paid',
  balanceDue: 'Balance Due',
  notes: 'Notes',

  // Payment statuses
  status: 'Status',
  unpaid: 'Unpaid',
  paid: 'Paid',
  partiallyPaid: 'Partially Paid',
  cancelled: 'Cancelled',
  overdue: 'Overdue',
  overpaid: 'Overpaid',

  // Payment methods
  bankTransfer: 'Bank Transfer',
  cash: 'Cash',
  creditCard: 'Credit Card',
  debitCard: 'Debit Card',
  cheque: 'Cheque',

  // Placeholders and search
  search: 'Search payments by reference or customer...',
  selectCustomer: 'Select a customer',
  selectInvoice: 'Select an invoice',
  selectPaymentMethod: 'Select a payment method',

  // Filter options
  filterByStatus: 'Filter by status',
  filterByInvoices: 'Filter by invoices',
  filterByDate: 'Filter by payment date',
  filterByCustomer: 'Filter by customer',

  // Messages
  noPaymentsFound: 'No payments found',
  noInvoicesFound: 'No invoices found',
  noCustomersFound: 'No customers found',

  // Actions
  generatePDF: 'Generate PDF',
  viewInvoice: 'View Invoice',
  cancelPaymentReceived: 'Cancel Payment Received',

  // Form validation messages
  paymentReferenceRequired: 'Payment reference is required',
  paymentDateRequired: 'Payment date is required',
  customerRequired: 'Customer is required',
  invoiceRequired: 'Invoice is required',
  amountReceivedRequired: 'Amount received is required',
  paymentMethodRequired: 'Payment method is required',
  invalidAmount: 'Please enter a valid amount',
  amountExceedsBalance: 'Amount received cannot exceed the balance due',

  // Success/Error messages
  paymentCreated: 'Payment received created successfully',
  paymentUpdated: 'Payment received updated successfully',
  paymentCancelled: 'Payment received cancelled successfully',
  paymentDeleted: 'Payment received deleted successfully',
  pdfGenerated: 'PDF generated successfully',

  // Confirmation messages
  confirmCancelPayment: 'Are you sure you want to cancel this payment received?',
  confirmDeletePayment: 'Are you sure you want to delete this payment received?',

  // Additional fields
  transactionId: 'Transaction ID',
  bankDetails: 'Bank Details',
  chequeNumber: 'Cheque Number',
  cardLastFour: 'Card Last Four Digits',
}
