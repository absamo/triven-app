export default {
  // Page title and headers
  title: 'Approval Requests',
  subtitle: 'Manage pending approval requests',

  // Status labels
  statuses: {
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    escalated: 'Escalated',
    expired: 'Expired',
  },

  // Priority labels
  priorities: {
    critical: 'Critical',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },

  // Entity types
  entityTypes: {
    purchase_order: 'Purchase Order',
    sales_order: 'Sales Order',
    stock_adjustment: 'Stock Adjustment',
    transfer_order: 'Transfer Order',
    customer: 'Customer',
    supplier: 'Supplier',
    product: 'Product',
  },

  // Summary cards
  summary: {
    pending: 'Pending',
    inReview: 'In Review',
    total: 'Total',
    pendingRequests: 'Pending requests',
    inReviewRequests: 'In review requests',
    approvedRequests: 'Approved requests',
    rejectedRequests: 'Rejected requests',
  },

  // Step progress
  stepProgress: 'Step {{current}} of {{total}}',

  // Filters
  filters: {
    title: 'Filter Requests',
    filterByStatus: 'Filter by status',
    filterByType: 'Filter by type',
    filterByPriority: 'Filter by priority',
    clearFilters: 'Clear All',
  },

  // Request details
  request: {
    requestedDate: 'Requested date',
    requestedBy: 'Requested by',
    assignedTo: 'Assigned to',
    expiresOn: 'Expires on',
    unassigned: 'Unassigned',
    expiresIn: 'Expires in',
    day: 'day',
    days: 'days',
    expired: 'Request expired',
    comments: 'comment',
    commentsPlural: 'comments',
  },

  // Actions
  actions: {
    approve: 'Approve',
    reject: 'Reject',
    review: 'Review',
    viewDetails: 'View details',
    addComment: 'Add Comment',
    refresh: 'Refresh',
    reopenRequest: 'Reopen Request',
  },

  // Request details modal
  modal: {
    requestDetails: 'Request Details',
    details: 'Details',
    comments: 'Comments',
    action: 'Action',

    // Action titles
    approveRequest: 'Approve Request',
    rejectRequest: 'Reject Request',
    reviewRequest: 'Review Request',
    reopenRequest: 'Reopen Request',
    approvalRequest: 'Approval Request',

    // Section headers
    requestInformation: 'Request Information',
    requestDetailsSection: 'Request Details',
    items: 'Items',
    products: 'Products',
    approvalReason: 'Approval Reason (Optional)',
    rejectionReason: 'Rejection Reason',
    reasonForReopening: 'Reason for Reopening',

    // Fields
    requestedBy: 'Requested by',
    requested: 'Requested',
    expires: 'Expires',
    amount: 'Amount',
    supplier: 'Supplier',
    company: 'Company',
    from: 'From',
    to: 'To',
    quantity: 'Qty',
    price: 'Price',
    adjustment: 'Adjustment',
    reason: 'Reason',

    // Item counts
    itemsCount: '{{count}} items',
    productsCount: '{{count}} products',
    moreItems: '... and {{count}} more items',
    moreProducts: '... and {{count}} more products',

    // Comments section
    noComments: 'No comments yet',
    internal: 'Internal',

    // Form labels
    rejectionReasonRequired: 'Rejection Reason *',
    reasonForReopeningRequired: 'Reason for Reopening *',
    decisionReason: 'Decision Reason',
    additionalNotes: 'Additional Notes',
    comment: 'Comment',
    reviewCommentRequired: 'Review Comment *',
    commentVisibility: 'Comment Visibility',

    // Form placeholders
    approvalReasonPlaceholder: 'Please explain why you are approving this request...',
    rejectionReasonPlaceholder: 'Please explain why you are rejecting this request...',
    reopeningReasonPlaceholder: 'Please explain why this request needs to be reopened...',
    decisionReasonPlaceholder: 'Optional: Explain your decision...',
    additionalNotesPlaceholder: 'Add any additional comments or instructions...',
    commentPlaceholder: 'Add your comment...',
    reviewCommentPlaceholder: 'Add your review comments...',

    // Visibility options
    publicComment: 'Public - Visible to all parties',
    internalComment: 'Internal - Only visible to team members',

    // Alerts
    approveAlert: 'You are about to approve this request. This action cannot be undone.',
    rejectAlert:
      'You are about to reject this request. Please provide a clear reason for the rejection.',
    reviewAlert:
      'Add your review comments. This will mark the request as "In Review" and notify relevant parties.',
    reopenAlert:
      'You are about to reopen this request for further review. Please provide a reason for reopening.',

    // Buttons
    cancel: 'Cancel',
    approveRequestButton: 'Approve Request',
    rejectRequestButton: 'Reject Request',
    addReviewComment: 'Add Review Comment',
    reopenRequestButton: 'Reopen Request',

    // Validation messages
    rejectionReasonRequiredError: 'Rejection reason is required',
    reopeningReasonRequiredError: 'Reason for reopening is required',
    commentRequiredError: 'Comment is required when reviewing',

    // Priority and status
    priority: 'Priority',
    status: 'Status',
  },

  // Messages and notifications
  messages: {
    noRequests: 'No approval requests found',
    noRequestsDescription: 'There are no approval requests to display at this time.',
    noMatchingRequests:
      'No requests match the current filters. Try adjusting your search criteria.',
    noPermission: 'You do not have permission to act on this approval request.',
    actionFailed: 'Failed to process the approval action. Please try again.',
    genericError: 'An error occurred while processing your request.',
    requestActionSuccess: 'Request {{action}} successfully!',
    commentedOn: 'commented on',
    approved: 'approved',
    rejected: 'rejected',
    reopened: 'reopened',
    processed: 'processed',
    requestApproved: 'Request Approved',
    requestApprovedMessage: 'The approval request has been approved successfully.',
    requestRejected: 'Request Rejected',
    requestRejectedMessage: 'The approval request has been rejected.',
    commentAdded: 'Comment Added',
    commentAddedMessage: 'Your comment has been added successfully.',
    brokenScreen: 'Broken screen',
    batteryDefect: 'Battery defect',
  },

  // Additional fields
  entityDetails: '{{entityType}} Details',
  itemsCount: '{{count}} products',
  productsCount: '{{count}} items',

  // Comment visibility
  commentVisibility: {
    public: 'Public',
    internal: 'Internal',
  },

  // Demo data - example requests
  demo: {
    purchaseOrderTitle: 'Purchase Order Approval PO-00001 - €8,500',
    purchaseOrderDescription: 'Purchase order exceeding automatic approval threshold (€5,000)',
    stockAdjustmentTitle: 'Stock Adjustment ADJ-000001',
    stockAdjustmentDescription: 'Stock adjustment for damaged items',
    customerTitle: 'New Customer - Durand & Fils Company',
    customerDescription: 'Request to create a new customer account',
    transferOrderTitle: 'Transfer TO-000001 - Lyon to Marseille',
    transferOrderDescription: 'Stock transfer between Lyon warehouse and Marseille store',

    // Sample comments
    managerReviewComment:
      'I am reviewing this order. The amount is high but justified by our current equipment needs.',
    salesRecommendationComment:
      'Customer recommended by a trusted partner. Excellent payment history.',
    managerApprovalComment:
      'Thank you for this information. I approve the customer account creation.',
  },
} satisfies Record<string, any>
