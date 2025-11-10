// T019: Zod validation schemas for workflow approvals
import { z } from 'zod'

export const createApprovalRequestSchema = z.object({
  workflowInstanceId: z.string().optional(),
  stepExecutionId: z.string().optional(),
  entityType: z.enum([
    'purchase_order',
    'sales_order',
    'stock_adjustment',
    'transfer_order',
    'invoice',
    'bill',
    'customer',
    'supplier',
    'product',
    'payment_made',
    'payment_received',
  ]),
  entityId: z.string().min(1),
  requestType: z.enum([
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'threshold_breach',
    'exception_handling',
    'custom',
  ]),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical', 'Urgent']).default('Medium'),
  assignedTo: z.string().optional(),
  assignedRole: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  data: z.record(z.string(), z.any()),
  conditions: z.record(z.string(), z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
})
  .refine((data) => data.assignedTo || data.assignedRole, {
    message: 'Must specify either assignedTo or assignedRole',
  })

export const reviewApprovalRequestSchema = z.object({
  decision: z.enum([
    'approved',
    'rejected',
    'escalated',
    'delegated',
    'more_info_required',
    'conditional_approval',
  ]),
  decisionReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})
  .refine((data) => {
    if (data.decision !== 'approved') {
      return !!data.decisionReason
    }
    return true
  }, {
    message: 'decisionReason required for non-approval decisions',
  })

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  triggerType: z.enum([
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
  ]),
  entityType: z.enum([
    'purchase_order',
    'sales_order',
    'stock_adjustment',
    'transfer_order',
    'invoice',
    'bill',
    'customer',
    'supplier',
    'product',
    'payment_made',
    'payment_received',
    'backorder',
    'custom',
  ]),
  isActive: z.boolean().default(true),
  steps: z.array(z.object({
    stepNumber: z.number().int().positive(),
    stepType: z.enum([
      'approval',
      'notification',
      'data_validation',
      'automatic_action',
      'conditional_logic',
      'parallel_approval',
      'sequential_approval',
      'escalation',
      'integration',
      'custom',
    ]),
    name: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    assigneeType: z.enum(['user', 'role']).optional(),
    assigneeUserId: z.string().optional(),
    assigneeRoleId: z.string().optional(),
    config: z.record(z.string(), z.any()).optional(),
    timeoutMinutes: z.number().int().positive().optional(),
  })).min(1),
})

export const reassignApprovalSchema = z.object({
  newAssigneeId: z.string().optional(),
  newAssigneeRoleId: z.string().optional(),
})
  .refine((data) => data.newAssigneeId || data.newAssigneeRoleId, {
    message: 'Must specify either newAssigneeId or newAssigneeRoleId',
  })

export const approvalFiltersSchema = z.object({
  status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'escalated', 'expired', 'cancelled', 'more_info_required']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical', 'Urgent']).optional(),
  entityType: z.enum([
    'purchase_order',
    'sales_order',
    'stock_adjustment',
    'transfer_order',
    'invoice',
    'bill',
    'customer',
    'supplier',
    'product',
    'payment_made',
    'payment_received',
  ]).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export const emailDeliveryPreferenceSchema = z.object({
  emailDeliveryPreference: z.enum(['immediate', 'daily_digest', 'disabled']),
  digestTime: z.string().regex(/^([0-1][0-9]|2[0-3]):00$/).optional(),
  locale: z.enum(['en', 'fr']).default('en'),
})
  .refine((data) => {
    if (data.emailDeliveryPreference === 'daily_digest') {
      return !!data.digestTime
    }
    return true
  }, {
    message: 'digestTime required when emailDeliveryPreference is daily_digest',
  })

export type CreateApprovalRequestInput = z.infer<typeof createApprovalRequestSchema>
export type ReviewApprovalRequestInput = z.infer<typeof reviewApprovalRequestSchema>
export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateSchema>
export type ReassignApprovalInput = z.infer<typeof reassignApprovalSchema>
export type ApprovalFiltersInput = z.infer<typeof approvalFiltersSchema>
export type EmailDeliveryPreferenceInput = z.infer<typeof emailDeliveryPreferenceSchema>
