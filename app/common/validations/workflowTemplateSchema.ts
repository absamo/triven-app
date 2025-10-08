import { z } from 'zod'

// Trigger condition validation schemas
const operatorSchema = z.enum([
  'gt',
  'gte',
  'lt',
  'lte',
  'eq',
  'ne',
  'contains',
  'not_contains',
  'in',
  'not_in',
])

const fieldConditionSchema = z.object({
  field: z.string().min(1, 'Field name is required'),
  operator: operatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
  description: z.string().optional(),
})

const thresholdConditionSchema = z.object({
  field: z.string().default('amount'),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
  value: z.number().min(0, 'Threshold value must be non-negative'),
  currency: z.string().optional().default('EUR'),
})

const triggerConditionsSchema = z
  .object({
    // Threshold-based conditions (e.g., amount > €5,000)
    threshold: thresholdConditionSchema.optional(),

    // Field-based conditions (e.g., status = "pending", priority = "high")
    fieldConditions: z.array(fieldConditionSchema).optional(),

    // Time-based conditions
    timeConditions: z
      .object({
        dayOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
        timeRange: z
          .object({
            start: z.string().optional(), // "09:00"
            end: z.string().optional(), // "17:00"
          })
          .optional(),
        excludeHolidays: z.boolean().optional(),
      })
      .optional(),

    // Legacy fields for backward compatibility
    entityType: z.string().optional(),
    priority: z.string().optional(),
  })
  .optional()

// Workflow step validation schema
export const workflowStepSchema = z
  .object({
    id: z.string().min(1, 'Step ID is required'),
    name: z
      .string()
      .min(1, 'Step name is required')
      .max(100, 'Step name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    type: z.enum([
      'approval',
      'notification',
      'data_validation',
      'automatic_action',
      'conditional_logic',
      'parallel_approval',
      'sequential_approval',
      'escalation',
      'integration',
    ]),
    assigneeType: z.enum(['user', 'role', 'creator', 'manager', 'department_head']),
    assigneeId: z.string(),
    assigneeName: z.string(),
    order: z.number().int().min(1, 'Order must be at least 1'),
    isRequired: z.boolean(),
    timeoutDays: z
      .number()
      .int()
      .min(1, 'Timeout must be at least 1 day')
      .max(365, 'Timeout cannot exceed 365 days')
      .optional(),
    autoApprove: z.boolean().optional(),
    allowParallel: z.boolean().optional(),
    conditions: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      // Conditional logic steps must have conditions
      if (data.type === 'conditional_logic') {
        return data.conditions && Object.keys(data.conditions).length > 0
      }
      return true
    },
    {
      message: 'Conditional logic steps must have conditions defined',
      path: ['conditions'],
    }
  )
  .refine(
    (data) => {
      // Assignee ID required for user and role types
      if (data.assigneeType === 'user' || data.assigneeType === 'role') {
        return data.assigneeId && data.assigneeId.length > 0
      }
      return true
    },
    {
      message: 'Assignee is required for user and role types',
      path: ['assigneeId'],
    }
  )

// Main workflow template validation schema
export const workflowTemplateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Template name is required')
      .max(100, 'Template name must be less than 100 characters')
      .regex(
        /^[a-zA-Z0-9\s\-_]+$/,
        'Template name can only contain letters, numbers, spaces, hyphens, and underscores'
      ),

    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),

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
      'custom',
    ]),

    triggerType: z
      .enum([
        'manual',
        'purchase_order_create',
        'purchase_order_threshold',
        'sales_order_create',
        'sales_order_threshold',
        'stock_adjustment_create',
        'transfer_order_create',
        'invoice_create',
        'bill_create',
        'customer_create',
        'supplier_create',
        'product_create',
        'low_stock_alert',
        'high_value_transaction',
        'bulk_operation',
        'scheduled',
        'custom_condition',
      ])
      .default('manual'),

    triggerConditions: triggerConditionsSchema,

    priority: z.enum(['Low', 'Medium', 'High']),

    isActive: z.boolean(),

    steps: z
      .array(workflowStepSchema)
      .min(1, 'At least one workflow step is required')
      .max(20, 'Cannot exceed 20 workflow steps')
      .refine(
        (steps) => {
          // Check for unique step orders
          const orders = steps.map((step) => step.order)
          const uniqueOrders = new Set(orders)
          return orders.length === uniqueOrders.size
        },
        {
          message: 'Step orders must be unique',
        }
      )
      .refine(
        (steps) => {
          // Check for unique step names
          const names = steps.map((step) => step.name.trim().toLowerCase())
          const uniqueNames = new Set(names)
          return names.length === uniqueNames.size
        },
        {
          message: 'Step names must be unique',
        }
      ),
  })
  .refine(
    (data) => {
      // If triggerType requires conditions, validate they exist
      const requiresConditions = [
        'purchase_order_threshold',
        'sales_order_threshold',
        'high_value_transaction',
        'custom_condition',
      ]

      if (requiresConditions.includes(data.triggerType)) {
        return (
          data.triggerConditions &&
          (data.triggerConditions.threshold ||
            (data.triggerConditions.fieldConditions &&
              data.triggerConditions.fieldConditions.length > 0))
        )
      }
      return true
    },
    {
      message: 'Threshold and conditional triggers require trigger conditions to be defined',
      path: ['triggerConditions'],
    }
  )

// Type inference for TypeScript
export type IWorkflowTemplate = z.infer<typeof workflowTemplateSchema>
export type IWorkflowStep = z.infer<typeof workflowStepSchema>
export type ITriggerConditions = z.infer<typeof triggerConditionsSchema>
export type IFieldCondition = z.infer<typeof fieldConditionSchema>
export type IThresholdCondition = z.infer<typeof thresholdConditionSchema>
