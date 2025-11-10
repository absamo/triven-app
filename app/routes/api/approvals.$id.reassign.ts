import { type ActionFunctionArgs, data } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'
import { broadcastApprovalUpdate } from '~/app/services/approval-sse.server'

const reassignSchema = z
  .object({
    assignedTo: z.string().optional(),
    assignedRole: z.string().optional(),
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason is too long'),
  })
  .refine((data) => data.assignedTo || data.assignedRole, {
    message: 'Either assignedTo or assignedRole must be provided',
  })

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw data({ message: 'Unauthorized' }, { status: 401 })
  }
  const user = session.user

  const { id: approvalId } = params
  if (!approvalId) {
    throw data({ message: 'Approval ID is required' }, { status: 400 })
  }

  // Verify approval exists and user has access
  const approval = await prisma.approvalRequest.findFirst({
    where: {
      id: approvalId,
      companyId: user.companyId || '',
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToRole: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!approval) {
    throw data({ message: 'Approval request not found' }, { status: 404 })
  }

  // Only allow reassignment for pending approvals
  if (approval.status !== 'pending') {
    throw data({ message: 'Only pending approvals can be reassigned' }, { status: 400 })
  }

  const formData = await request.formData()
  const reassignData = {
    assignedTo: formData.get('assignedTo') || undefined,
    assignedRole: formData.get('assignedRole') || undefined,
    reason: formData.get('reason'),
  }

  const validation = reassignSchema.safeParse(reassignData)
  if (!validation.success) {
    throw data(
      { message: 'Validation failed', errors: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { assignedTo, assignedRole, reason } = validation.data

  // Get old assignee info for notification
  const oldAssignedTo = approval.assignedTo

  // Update approval with new assignee
  const updatedApproval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      assignedTo: assignedTo || null,
      assignedRole: assignedRole || null,
      updatedAt: new Date(),
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedToRole: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Create a comment documenting the reassignment
  await prisma.approvalComment.create({
    data: {
      approvalRequestId: approvalId,
      authorId: user.id,
      comment: `Reassigned approval from ${
        oldAssignedTo
          ? approval.assignedToUser?.name || approval.assignedToUser?.email || 'Unknown User'
          : approval.assignedToRole?.name || 'Unknown Role'
      } to ${
        assignedTo
          ? updatedApproval.assignedToUser?.name ||
            updatedApproval.assignedToUser?.email ||
            'Unknown User'
          : updatedApproval.assignedToRole?.name || 'Unknown Role'
      }. Reason: ${reason}`,
      isInternal: true,
    },
  })

  // Broadcast SSE update to relevant users
  const targetUserIds: string[] = [approval.requestedBy]

  // Notify old assignee
  if (oldAssignedTo) {
    targetUserIds.push(oldAssignedTo)
  }

  // Notify new assignee
  if (assignedTo) {
    targetUserIds.push(assignedTo)
  }

  // Remove duplicates and don't notify the user who performed the reassignment
  const uniqueUserIds = [...new Set(targetUserIds)].filter((id) => id !== user.id)

  if (uniqueUserIds.length > 0) {
    broadcastApprovalUpdate(
      {
        type: 'approval_assigned',
        approvalId,
        data: {
          oldAssignee: oldAssignedTo
            ? approval.assignedToUser?.name || approval.assignedToUser?.email
            : approval.assignedToRole?.name,
          newAssignee: assignedTo
            ? updatedApproval.assignedToUser?.name || updatedApproval.assignedToUser?.email
            : updatedApproval.assignedToRole?.name,
          reason,
          reassignedBy: user.name || user.email,
        },
      },
      approval.companyId,
      uniqueUserIds
    )
  }

  return data(
    {
      approval: updatedApproval,
      message: 'Approval reassigned successfully',
    },
    { status: 200 }
  )
}
