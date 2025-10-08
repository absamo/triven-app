export default {
  // Page titles and descriptions
  title: 'Workflow Templates',
  subtitle: 'Manage workflow templates for process automation',
  description: 'Create and manage reusable approval workflow templates',

  // Messages
  messages: {
    created: 'created',
    updated: 'updated',
    cloned: 'cloned',
    processed: 'processed',
    templateActionSuccess: 'Template {{action}} successfully!',
    actionFailed: 'Failed to process the template action. Please try again.',
    confirmDelete: 'Are you sure you want to delete this workflow template?',
    templateDeleted: 'Template deleted successfully!',
    deleteFailed: 'Failed to delete the template. Please try again.',
    statusUpdated: 'Template status updated successfully!',
    statusUpdateFailed: 'Failed to update template status. Please try again.',
    noTemplates: 'No Workflow Templates',
    noTemplatesDescription: 'Create your first workflow template to streamline approval processes.',
    noMatchingTemplates:
      'No templates match the current filters. Try adjusting your search criteria.',
  },

  // Actions
  actions: {
    createTemplate: 'Create Template',
    createFirstTemplate: 'Create First Template',
    editTemplate: 'Edit Template',
    cloneTemplate: 'Clone Template',
    deleteTemplate: 'Delete Template',
    activate: 'Activate',
    deactivate: 'Deactivate',
    addStep: 'Add Step',
    removeStep: 'Remove Step',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    save: 'Save',
    cancel: 'Cancel',
  },

  // Summary/Statistics
  summary: {
    totalTemplates: 'Total Templates',
    activeTemplates: 'Active Templates',
    inactiveTemplates: 'Inactive Templates',
    totalUsage: 'Total Usage',
  },

  // Filters
  filters: {
    title: 'Filter Templates',
    clearFilters: 'Clear Filters',
    searchTemplates: 'Search templates...',
    filterByTrigger: 'Filter by trigger type',
    filterByStatus: 'Filter by status',
  },

  // Statuses
  statuses: {
    active: 'Active',
    inactive: 'Inactive',
    draft: 'Draft',
    published: 'Published',
  },

  // Template details
  template: {
    workflowSteps: 'Workflow Steps',
    moreSteps: 'more steps',
    createdBy: 'Created by',
    usageCount: 'Times used',
    lastUpdated: 'Last updated',
  },

  // Modal
  modal: {
    createTemplate: 'Create Workflow Template',
    editTemplate: 'Edit Workflow Template',
    cloneTemplate: 'Clone Workflow Template',
    workflowTemplate: 'Workflow Template',
    basicInformation: 'Basic Information',
    workflowSteps: 'Workflow Steps',
    stepDetails: 'Step Details',
    addFirstStep: 'Add First Step',
    addAnotherStep: 'Add Another Step',
  },

  // Form fields
  fields: {
    templateName: 'Template Name',
    description: 'Description',
    entityType: 'Entity Type',
    triggerType: 'Trigger Type',
    priority: 'Priority',
    stepName: 'Step Name',
    stepDescription: 'Step Description',
    stepType: 'Step Type',
    assigneeType: 'Assignee Type',
    assignToUser: 'Assign to User',
    assignToRole: 'Assign to Role',
    selectUser: 'Select User',
    selectRole: 'Select Role',
    timeoutDays: 'Timeout (Days)',
    makeOptional: 'Make Optional',
    isRequired: 'Is Required',
  },

  // Placeholders
  placeholders: {
    templateName: 'Enter template name...',
    description: 'Enter template description...',
    entityType: 'Select entity type...',
    triggerType: 'Select trigger type...',
    stepName: 'Enter step name...',
    stepDescription: 'Enter step description...',
    selectUser: 'Select a user...',
    selectRole: 'Select a role...',
  },

  // Validation
  validation: {
    nameRequired: 'Template name is required',
    descriptionRequired: 'Template description is required',
    entityTypeRequired: 'Entity type is required',
    triggerTypeRequired: 'Trigger type is required',
    stepsRequired: 'At least one workflow step is required',
    stepNameRequired: 'All steps must have a name',
    stepAssigneeRequired: 'All steps must have an assignee',
    assigneeRequired: 'Assignee is required',
  },

  // Entity Types (for backward compatibility)
  entityTypes: {
    purchase_order: 'Purchase Order',
    stock_adjustment: 'Stock Adjustment',
    customer: 'Customer',
    transfer_order: 'Transfer Order',
    sales_order: 'Sales Order',
    invoice: 'Invoice',
    bill: 'Bill',
    supplier: 'Supplier',
    product: 'Product',
  },

  // Priorities (for backward compatibility)
  priorities: {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },

  // Step Types
  stepTypes: {
    approval: 'Approval',
    notification: 'Notification',
    review: 'Review',
    data_validation: 'Data Validation',
    automatic_action: 'Automatic Action',
    conditional_logic: 'Conditional Logic',
    parallel_approval: 'Parallel Approval',
    sequential_approval: 'Sequential Approval',
    escalation: 'Escalation',
    integration: 'Integration',
  },

  // Assignee Types
  assigneeTypes: {
    user: 'User',
    role: 'Role',
    creator: 'Creator',
    manager: 'Manager',
    department_head: 'Department Head',
  },

  // Trigger Types
  triggerTypes: {
    manual: 'Manual',
    purchase_order_create: 'Purchase Order Create',
    purchase_order_threshold: 'Purchase Order Threshold',
    sales_order_create: 'Sales Order Create',
    sales_order_threshold: 'Sales Order Threshold',
    stock_adjustment_create: 'Stock Adjustment Create',
    transfer_order_create: 'Transfer Order Create',
    invoice_create: 'Invoice Create',
    bill_create: 'Bill Create',
    customer_create: 'Customer Create',
    supplier_create: 'Supplier Create',
    product_create: 'Product Create',
    low_stock_alert: 'Low Stock Alert',
    high_value_transaction: 'High Value Transaction',
    bulk_operation: 'Bulk Operation',
    scheduled: 'Scheduled',
    custom_condition: 'Custom Condition',
  },

  // Common terms
  workflow: 'Workflow',
  workflows: 'Workflows',
  process: 'Process',
  processes: 'Processes',
  automation: 'Automation',
  approval: 'Approval',
  approvals: 'Approvals',
  steps: 'Steps',
  step: 'Step',
}
