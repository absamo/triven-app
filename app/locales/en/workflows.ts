export default {
    // Basic Workflow Templates
    title: "Workflow Templates",
    description: "Create and manage reusable approval workflow templates",

    // Messages
    messages: {
        created: "created",
        updated: "updated",
        cloned: "cloned",
        processed: "processed",
        templateActionSuccess: "Template {{action}} successfully!",
        actionFailed: "Failed to process the template action. Please try again.",
        confirmDelete: "Are you sure you want to delete this workflow template?",
        templateDeleted: "Template deleted successfully!",
        deleteFailed: "Failed to delete the template. Please try again.",
        statusUpdated: "Template status updated successfully!",
        statusUpdateFailed: "Failed to update template status. Please try again.",
    },

    // Actions
    actions: {
        createTemplate: "Create Template",
        addStep: "Add Step",
        updateTemplate: "Update Template",
    },

    // Modal section
    modal: {
        createTemplate: "Create Workflow Template",
        editTemplate: "Edit Workflow Template",
        cloneTemplate: "Clone Workflow Template",
        workflowTemplate: "Workflow Template",
        basicInformation: "Basic Information",
        workflowSteps: "Workflow Steps",
        noSteps: "No workflow steps defined. Click \"Add Step\" to get started.",
    },

    // Fields
    fields: {
        templateName: "Template Name",
        description: "Description",
        entityType: "Entity Type",
        triggerType: "Trigger Type",
        priority: "Priority",
        stepName: "Step Name",
        stepType: "Step Type",
        assigneeType: "Assignee Type",
        timeoutDays: "Timeout (Days)",
    },

    // Placeholders
    placeholders: {
        templateName: "Enter template name...",
        description: "Enter template description...",
        entityType: "Select entity type...",
        triggerType: "Select trigger type...",
        stepName: "Enter step name...",
    },

    // Validation messages
    validation: {
        nameRequired: "Template name is required",
        entityTypeRequired: "Entity type is required",
        stepsRequired: "At least one workflow step is required",
        stepNameRequired: "All steps must have a name",
        stepAssigneeRequired: "All steps must have an assignee",
    },

    // Step section
    step: {
        stepNumber: "Step {{number}}",
    },

    // Priorities (additional case variations)
    priorities: {
        Low: "Low",
        low: "Low",
        Medium: "Medium",
        medium: "Medium",
        High: "High",
        high: "High",
        Critical: "Critical",
        critical: "Critical",
        Urgent: "Urgent",
        urgent: "Urgent",
    },

    // Summary section
    summary: {
        totalTemplates: "Total Templates",
        activeTemplates: "Active Templates",
        inactiveTemplates: "Inactive Templates",
        totalUsage: "Total Usage",
    },

    // Filter section
    filters: {
        title: "Filter Templates",
        clearFilters: "Clear Filters",
        searchTemplates: "Search templates...",
    },

    // Workflow Statuses
    workflowStatuses: {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        failed: "Failed",
        timeout: "Timeout",
        escalated: "Escalated"
    },

    // Workflow Step Types
    stepTypes: {
        pending: "Pending",
        assigned: "Assigned",
        in_progress: "In Progress",
        completed: "Completed",
        skipped: "Skipped",
        failed: "Failed",
        timeout: "Timeout",
        escalated: "Escalated",
        approval: "Approval",
        review: "Review",
        notification: "Notification",
        data_validation: "Data Validation",
        automatic_action: "Automatic Action",
        conditional_logic: "Conditional Logic",
        parallel_approval: "Parallel Approval",
        sequential_approval: "Sequential Approval",
        escalation: "Escalation",
        integration: "Integration",
        custom: "Custom"
    },

    // Workflow Trigger Types
    triggerTypes: {
        manual: "Manual",
        purchase_order_create: "Purchase Order Created",
        purchase_order_threshold: "Purchase Order Threshold",
        sales_order_create: "Sales Order Created",
        sales_order_threshold: "Sales Order Threshold",
        stock_adjustment_create: "Stock Adjustment Created",
        transfer_order_create: "Transfer Order Created",
        invoice_create: "Invoice Created",
        bill_create: "Bill Created",
        customer_create: "Customer Created",
        supplier_create: "Supplier Created",
        product_create: "Product Created",
        low_stock_alert: "Low Stock Alert",
        high_value_transaction: "High Value Transaction",
        bulk_operation: "Bulk Operation",
        scheduled: "Scheduled",
        custom_condition: "Custom Condition"
    },

    // Entity Types
    entityTypes: {
        purchase_order: "Purchase Order",
        sales_order: "Sales Order",
        stock_adjustment: "Stock Adjustment",
        transfer_order: "Transfer Order",
        invoice: "Invoice",
        bill: "Bill",
        customer: "Customer",
        supplier: "Supplier",
        product: "Product",
        payment_made: "Payment Made",
        payment_received: "Payment Received",
        backorder: "Backorder",
        budget_change: "Budget Change",
        price_change: "Price Change",
        discount_approval: "Discount Approval",
        refund_request: "Refund Request",
        return_authorization: "Return Authorization",
        custom: "Custom"
    },

    // Approval Assignee Types
    assigneeTypes: {
        user: "User",
        role: "Role",
        creator: "Creator",
        manager: "Manager",
        department_head: "Department Head",
        custom_logic: "Custom Logic"
    },

    // Request Types
    requestTypes: {
        create: "Create",
        update: "Update",
        delete: "Delete",
        approve: "Approve",
        reject: "Reject",
        threshold_breach: "Threshold Breach",
        exception_handling: "Exception Handling",
        custom: "Custom"
    },

    // Approval Statuses
    approvalStatuses: {
        pending: "Pending",
        in_review: "In Review",
        approved: "Approved",
        rejected: "Rejected",
        escalated: "Escalated",
        expired: "Expired",
        cancelled: "Cancelled",
        more_info_required: "More Info Required"
    },

    // Decisions
    decisions: {
        approved: "Approved",
        rejected: "Rejected",
        escalated: "Escalated",
        delegated: "Delegated",
        more_info_required: "More Info Required",
        conditional_approval: "Conditional Approval"
    },

    // Trigger Conditions
    triggerConditions: {
        title: "Trigger Conditions",
        description: "Define when this workflow should be triggered automatically",
        threshold: "Amount Threshold",
        fieldConditions: "Field Conditions",
        operator: "Operator",
        amount: "Amount",
        currency: "Currency",
        field: "Field",
        value: "Value",
        addCondition: "Add Condition",
        noConditions: "No field conditions defined"
    },

    // Operators
    operators: {
        gt: "Greater than",
        gte: "Greater than or equal",
        lt: "Less than",
        lte: "Less than or equal",
        eq: "Equal to",
        ne: "Not equal to",
        contains: "Contains",
        not_contains: "Does not contain"
    }
}