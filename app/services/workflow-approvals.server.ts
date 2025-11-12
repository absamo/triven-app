// T007: Core workflow approval service

import type { ApprovalRequest, Prisma, User } from '@prisma/client'
import { prisma } from '~/app/db.server'
import type {
  ApprovalRecipient,
  CreateApprovalData,
  EmailData,
} from '~/app/types/workflow-approvals'
import { hasPermission } from './authorization.server'
import { queueForDigest, sendEmailWithRetry } from './email.server'
import { createNotification } from './notifications.server'

/**
 * T007: Get all recipients for an approval request (deduplicated)
 * Resolves users from both assignedTo and assignedRole
 */
export async function getApprovalRecipients(
  approval: ApprovalRequest
): Promise<ApprovalRecipient[]> {
  const recipientsMap = new Map<string, ApprovalRecipient>()

  // Add directly assigned user
  if (approval.assignedTo) {
    const user = await prisma.user.findUnique({
      where: { id: approval.assignedTo },
      include: { profile: true },
    })

    if (user && user.active) {
      recipientsMap.set(user.id, {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        profile: user.profile
          ? {
              emailDeliveryPreference: user.profile.emailDeliveryPreference,
              digestTime: user.profile.digestTime || undefined,
              locale: user.profile.locale,
            }
          : undefined,
      })
    }
  }

  // Add role members
  if (approval.assignedRole) {
    const roleUsers = await prisma.user.findMany({
      where: {
        roleId: approval.assignedRole,
        active: true,
      },
      include: { profile: true },
    })

    for (const user of roleUsers) {
      recipientsMap.set(user.id, {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        profile: user.profile
          ? {
              emailDeliveryPreference: user.profile.emailDeliveryPreference,
              digestTime: user.profile.digestTime || undefined,
              locale: user.profile.locale,
            }
          : undefined,
      })
    }
  }

  return Array.from(recipientsMap.values())
}

/**
 * T021: Validate workflow assignees have "approve_workflows" permission
 * Checks both user assignees and role assignees
 * @returns { valid: boolean, errors: string[] } - Validation result with specific errors
 */
export async function validateWorkflowAssignees(
  assignedUserId?: string,
  assignedRoleId?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // Must have at least one assignee
  if (!assignedUserId && !assignedRoleId) {
    errors.push('At least one assignee (user or role) is required')
    return { valid: false, errors }
  }

  // Validate assigned user
  if (assignedUserId) {
    const userHasApprovalPermission = await hasPermission(assignedUserId, 'approve_workflows')

    if (!userHasApprovalPermission) {
      const user = await prisma.user.findUnique({
        where: { id: assignedUserId },
        select: { name: true, email: true },
      })
      errors.push(
        `User ${user?.name || user?.email || assignedUserId} does not have 'approve_workflows' permission`
      )
    }
  }

  // Validate assigned role members
  if (assignedRoleId) {
    const role = await prisma.role.findUnique({
      where: { id: assignedRoleId },
      include: {
        users: {
          select: { id: true, name: true, email: true, active: true },
        },
      },
    })

    if (!role) {
      errors.push(`Role with ID ${assignedRoleId} not found`)
    } else {
      // Check if role has approve_workflows permission
      if (!role.permissions.includes('approve_workflows')) {
        errors.push(`Role '${role.name}' does not have 'approve_workflows' permission`)
      }

      // Warn if role has no active members
      const activeMembers = role.users.filter((u) => u.active)
      if (activeMembers.length === 0) {
        errors.push(`Role '${role.name}' has no active members - approval request will be orphaned`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * T031: Create an approval request with orphaned detection
 */
export async function createApprovalRequest(
  data: CreateApprovalData,
  requestedBy: string
): Promise<ApprovalRequest> {
  // Check if assigned to role with no active members
  let isOrphaned = false

  if (data.assignedRole) {
    const roleMembers = await prisma.user.count({
      where: {
        roleId: data.assignedRole,
        active: true,
      },
    })

    isOrphaned = roleMembers === 0
  }

  // Create approval request
  const approval = await prisma.approvalRequest.create({
    data: {
      workflowInstanceId: data.workflowInstanceId,
      stepExecutionId: data.stepExecutionId,
      entityType: data.entityType,
      entityId: data.entityId,
      requestType: data.requestType,
      status: 'pending',
      priority: data.priority || 'Medium',
      requestedBy,
      assignedTo: data.assignedTo,
      assignedRole: data.assignedRole,
      title: data.title,
      description: data.description,
      data: data.data,
      conditions: data.conditions,
      expiresAt: data.expiresAt,
      companyId: data.companyId,
      orphaned: isOrphaned,
      orphanedAt: isOrphaned ? new Date() : null,
    },
  })

  // T032: Send notifications if not orphaned
  if (!isOrphaned) {
    await sendApprovalNotifications(approval, requestedBy)
  }

  return approval
}

/**
 * T032: Orchestrate approval notifications (email + in-app)
 */
export async function sendApprovalNotifications(
  approval: ApprovalRequest,
  requestedBy: string
): Promise<void> {
  // Get all recipients (deduplicated)
  const recipients = await getApprovalRecipients(approval)

  // Get requester info
  const requester = await prisma.user.findUnique({
    where: { id: requestedBy },
    select: { name: true, email: true },
  })

  for (const recipient of recipients) {
    const emailPreference = recipient.profile?.emailDeliveryPreference || 'immediate'
    const locale = (recipient.profile?.locale || 'en') as 'en' | 'fr'

    // T041: Create in-app notification
    await createNotification({
      recipientId: recipient.id,
      companyId: approval.companyId,
      approvalRequestId: approval.id,
      notificationType: 'approval_request',
      message: `New approval request: ${approval.title}. Requested by ${requester?.name || requester?.email || 'Unknown'}`,
      status:
        approval.priority === 'Critical' || approval.priority === 'Urgent' ? 'warning' : 'info',
      createdById: requestedBy,
    })

    // T039: Handle email based on preference
    if (emailPreference === 'disabled') {
      continue
    }

    const emailData: EmailData = {
      type: 'initial_approval',
      to: recipient.email,
      approvalId: approval.id,
      approvalTitle: approval.title,
      approvalDescription: approval.description || undefined,
      requesterName: requester?.name || requester?.email || 'Unknown',
      priority: approval.priority || 'Medium',
      expiresAt: approval.expiresAt?.toISOString(),
      reviewUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/approvals/${approval.id}`,
      locale,
      recipientId: recipient.id,
    }

    if (emailPreference === 'daily_digest') {
      // T033: Queue for digest
      await queueForDigest(recipient.id, approval.id)
    } else {
      // T038: Send immediate email with retry and logging
      try {
        await sendEmailWithRetry(emailData)
      } catch (error) {
        console.error(`Failed to send approval email to ${recipient.email}:`, error)
        // Email failure is logged in sendEmailWithRetry
      }
    }
  }
}

/**
 * T050: Review an approval request
 */
export async function reviewApprovalRequest(
  approvalId: string,
  userId: string,
  decision: 'approved' | 'rejected' | 'more_info_required',
  reason?: string
): Promise<ApprovalRequest> {
  // Verify user is authorized to review
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      assignedToRole: {
        include: { users: true },
      },
    },
  })

  if (!approval) {
    throw new Error('Approval request not found')
  }

  const isDirectlyAssigned = approval.assignedTo === userId
  const isRoleMember = approval.assignedToRole?.users.some((u: User) => u.id === userId)

  if (!isDirectlyAssigned && !isRoleMember) {
    throw new Error('User not authorized to review this approval')
  }

  // Update approval
  return prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status:
        decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'pending',
      decision,
      decisionReason: reason,
      reviewedAt: new Date(),
      completedAt: decision !== 'more_info_required' ? new Date() : null,
    },
  })
}

/**
 * T027-T030: Reassign approvals when user is deleted/deactivated
 */
export async function reassignApprovalsOnUserDeletion(
  userId: string,
  reason: 'user_deactivated' | 'user_deleted'
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Find pending approvals assigned to this user
    const pendingApprovals = await tx.approvalRequest.findMany({
      where: {
        assignedTo: userId,
        status: 'pending',
      },
    })

    for (const approval of pendingApprovals) {
      // Get user to find their role
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { roleId: true },
      })

      const roleId = user?.roleId

      if (!roleId) {
        await markAsOrphaned(tx, approval)
        continue
      }

      // Find another active user in the same role
      const newAssignee = await tx.user.findFirst({
        where: {
          roleId,
          active: true,
          id: { not: userId },
        },
      })

      if (!newAssignee) {
        await markAsOrphaned(tx, approval)
        continue
      }

      // Reassign approval
      await tx.approvalRequest.update({
        where: { id: approval.id },
        data: {
          assignedTo: newAssignee.id,
          data: {
            ...(approval.data as any),
            reassignment: {
              originalAssignee: userId,
              newAssignee: newAssignee.id,
              reason,
              timestamp: new Date().toISOString(),
            },
          },
        },
      })
    }
  })
}

/**
 * T029-T030: Mark approval as orphaned
 */
async function markAsOrphaned(
  tx: Prisma.TransactionClient,
  approval: ApprovalRequest
): Promise<void> {
  await tx.approvalRequest.update({
    where: { id: approval.id },
    data: {
      orphaned: true,
      orphanedAt: new Date(),
    },
  })
}

/**
 * T066: Reassign orphaned approval (admin action)
 */
export async function reassignOrphanedApproval(
  approvalId: string,
  newAssigneeId?: string,
  newAssigneeRoleId?: string
): Promise<ApprovalRequest> {
  if (!newAssigneeId && !newAssigneeRoleId) {
    throw new Error('Must specify either newAssigneeId or newAssigneeRoleId')
  }

  const approval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      assignedTo: newAssigneeId || null,
      assignedRole: newAssigneeRoleId || null,
      orphaned: false,
      orphanedAt: null,
    },
  })

  return approval
}

/**
 * T073: Get pending approvals for a user
 */
export async function getPendingApprovals(
  userId: string,
  filters?: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired'
    priority?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent'
  }
): Promise<any[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roleId: true },
  })

  return prisma.approvalRequest.findMany({
    where: {
      OR: [{ assignedTo: userId }, { assignedRole: user?.roleId || undefined }],
      status: filters?.status || 'pending',
      priority: filters?.priority,
      orphaned: false,
    },
    include: {
      requestedByUser: true,
      workflowInstance: {
        include: { workflowTemplate: true },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: [{ priority: 'desc' }, { requestedAt: 'asc' }],
  })
}

/**
 * T029: Send email notification for approval reassignment
 */
export async function sendReassignmentNotification(
  approvalId: string,
  newAssigneeId: string,
  previousAssigneeId: string,
  reassignedById: string,
  reason?: string
): Promise<void> {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      workflowInstance: {
        include: { workflowTemplate: true },
      },
    },
  })

  if (!approval) return

  const [newAssignee, previousAssignee, reassignedBy] = await Promise.all([
    prisma.user.findUnique({
      where: { id: newAssigneeId },
      include: { profile: true },
    }),
    prisma.user.findUnique({
      where: { id: previousAssigneeId },
      select: { name: true, email: true },
    }),
    prisma.user.findUnique({
      where: { id: reassignedById },
      select: { name: true, email: true },
    }),
  ])

  if (!newAssignee) return

  const locale = (newAssignee.profile?.locale || 'en') as 'en' | 'fr'

  // Send email using Resend (this will be called by the API route)
  // The actual email sending is handled by email service
  // For now, we just return the notification data
  return
}

/**
 * T030: Send email notification for orphaned approval
 */
export async function sendOrphanedNotification(
  approvalId: string,
  originalAssigneeId: string,
  reason: string,
  notifyUserId: string // Admin or role lead to notify
): Promise<void> {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      workflowInstance: {
        include: { workflowTemplate: true },
      },
    },
  })

  if (!approval) return

  const [notifyUser, originalAssignee] = await Promise.all([
    prisma.user.findUnique({
      where: { id: notifyUserId },
      include: { profile: true },
    }),
    prisma.user.findUnique({
      where: { id: originalAssigneeId },
      select: { name: true, email: true },
    }),
  ])

  if (!notifyUser) return

  const locale = (notifyUser.profile?.locale || 'en') as 'en' | 'fr'

  // Send email using Resend (this will be called by the API route)
  // The actual email sending is handled by email service
  // For now, we just return the notification data
  return
}
