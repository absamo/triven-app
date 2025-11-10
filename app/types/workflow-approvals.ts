// T005: TypeScript types for workflow approval system

export interface CreateApprovalData {
  workflowInstanceId?: string
  stepExecutionId?: string
  entityType:
    | 'purchase_order'
    | 'sales_order'
    | 'stock_adjustment'
    | 'transfer_order'
    | 'invoice'
    | 'bill'
    | 'customer'
    | 'supplier'
    | 'product'
    | 'payment_made'
    | 'payment_received'
  entityId: string
  requestType:
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'reject'
    | 'threshold_breach'
    | 'exception_handling'
    | 'custom'
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent'
  assignedTo?: string
  assignedRole?: string
  title: string
  description?: string
  data: Record<string, any>
  conditions?: Record<string, any>
  expiresAt?: Date
  companyId: string
}

export interface ReviewApprovalData {
  decision:
    | 'approved'
    | 'rejected'
    | 'escalated'
    | 'delegated'
    | 'more_info_required'
    | 'conditional_approval'
  decisionReason?: string
  notes?: string
}

export interface EmailData {
  to: string
  approvalId: string
  approvalTitle: string
  approvalDescription?: string
  requesterName?: string
  priority?: string
  expiresAt?: string
  reviewUrl?: string
  type: EmailType
  locale?: 'en' | 'fr'
  recipientId?: string
}

export type EmailType =
  | 'initial_approval'
  | 'approval_reminder_24h'
  | 'approval_reminder_48h'
  | 'approval_reassigned'
  | 'approval_orphaned'
  | 'approval_completed'
  | 'approval_expired'

export type EmailDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'queued_for_digest'

export type EmailDeliveryPreference = 'immediate' | 'daily_digest' | 'disabled'

export interface ApprovalRecipient {
  id: string
  email: string
  name?: string
  profile?: {
    emailDeliveryPreference?: EmailDeliveryPreference
    digestTime?: string
    locale?: string
  }
}

export interface ApprovalRequestData {
  [key: string]: any
  reassignment?: {
    originalAssignee: string
    newAssignee: string
    reason: 'user_deactivated' | 'user_deleted' | 'manual_reassign'
    timestamp: string
    reassignedBy?: string
  }
}

export type NotificationType =
  | 'approval_request'
  | 'approval_reminder'
  | 'approval_urgent'
  | 'approval_reassigned'
  | 'approval_orphaned'
  | 'approval_approved'
  | 'approval_rejected'

export interface ApprovalCommentData {
  id: string
  approvalRequestId: string
  authorId: string
  comment: string
  isInternal: boolean
  createdAt: string
  updatedAt?: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}
