import { z } from "zod"

// Workflow step validation schema
export const workflowStepSchema = z.object({
    id: z.string().min(1, "Step ID is required"),
    name: z.string().min(1, "Step name is required").max(100, "Step name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    type: z.enum([
        'approval',
        'review',
        'notification',
        'data_validation',
        'automatic_action',
        'conditional_logic',
        'parallel_approval',
        'sequential_approval',
        'escalation',
        'integration'
    ]).describe("Please select a valid step type"),
    assigneeType: z.enum([
        'user',
        'role',
        'creator',
        'manager',
        'department_head'
    ]).describe("Please select a valid assignee type"),
    assigneeId: z.string(),
    assigneeName: z.string(),
    order: z.number().int().min(1, "Order must be at least 1"),
    isRequired: z.boolean(),
    timeoutDays: z.number().int().min(1, "Timeout must be at least 1 day").max(365, "Timeout cannot exceed 365 days").optional(),
    autoApprove: z.boolean().optional(),
    allowParallel: z.boolean().optional(),
    conditions: z.record(z.string(), z.any()).optional()
}).refine((data) => {
    // Conditional logic steps must have conditions
    if (data.type === 'conditional_logic') {
        return data.conditions && Object.keys(data.conditions).length > 0
    }
    return true
}, {
    message: "Conditional logic steps must have conditions defined",
    path: ["conditions"]
})

// Main workflow template validation schema
export const workflowTemplateSchema = z.object({
    name: z.string()
        .min(1, "Template name is required")
        .max(100, "Template name must be less than 100 characters")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "Template name can only contain letters, numbers, spaces, hyphens, and underscores"),

    description: z.string()
        .max(1000, "Description must be less than 1000 characters")
        .optional(),

    entityType: z.enum([
        'purchase_order',
        'sales_order',
        'invoice',
        'bill',
        'stock_adjustment',
        'transfer_order',
        'customer',
        'supplier',
        'product',
        'custom'
    ]).describe("Please select a valid entity type"),

    priority: z.enum(['Low', 'Medium', 'High']).describe("Please select a valid priority"),

    isActive: z.boolean(),

    steps: z.array(workflowStepSchema)
        .min(1, "At least one workflow step is required")
        .max(20, "Cannot exceed 20 workflow steps")
        .refine((steps) => {
            // Check for unique step orders
            const orders = steps.map(step => step.order)
            const uniqueOrders = new Set(orders)
            return orders.length === uniqueOrders.size
        }, {
            message: "Step orders must be unique"
        })
        .refine((steps) => {
            // Check for unique step names
            const names = steps.map(step => step.name.trim().toLowerCase())
            const uniqueNames = new Set(names)
            return names.length === uniqueNames.size
        }, {
            message: "Step names must be unique"
        })
})

// Type inference for TypeScript
export type WorkflowTemplateFormData = z.infer<typeof workflowTemplateSchema>
export type WorkflowStepFormData = z.infer<typeof workflowStepSchema>

// Validation helper functions
export const validateWorkflowTemplate = (data: unknown) => {
    return workflowTemplateSchema.safeParse(data)
}

export const validateWorkflowStep = (data: unknown) => {
    return workflowStepSchema.safeParse(data)
}

// Field-specific validation functions
export const validateTemplateName = (name: string) => {
    return z.string()
        .min(1, "Template name is required")
        .max(100, "Template name must be less than 100 characters")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "Template name can only contain letters, numbers, spaces, hyphens, and underscores")
        .safeParse(name)
}

export const validateStepName = (name: string) => {
    return z.string()
        .min(1, "Step name is required")
        .max(100, "Step name must be less than 100 characters")
        .safeParse(name)
}

export const validateTimeout = (days: number) => {
    return z.number()
        .int()
        .min(1, "Timeout must be at least 1 day")
        .max(365, "Timeout cannot exceed 365 days")
        .safeParse(days)
}

// Custom validation for assignee requirements
export const validateAssigneeRequirements = (step: Partial<WorkflowStepFormData>) => {
    if (step.assigneeType === 'user' || step.assigneeType === 'role') {
        if (!step.assigneeId || step.assigneeId.length === 0) {
            return {
                success: false,
                error: { message: "Assignee is required for user and role types" }
            }
        }
    }
    return { success: true }
}

// Custom validation for conditional logic
export const validateConditionalLogic = (step: Partial<WorkflowStepFormData>) => {
    if (step.type === 'conditional_logic') {
        if (!step.conditions || Object.keys(step.conditions).length === 0) {
            return {
                success: false,
                error: { message: "Conditional logic steps must have conditions defined" }
            }
        }
    }
    return { success: true }
}