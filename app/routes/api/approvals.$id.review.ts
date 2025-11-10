// T032: POST /api/approvals/:id/review - Review approval request endpoint
import type { ActionFunctionArgs } from 'react-router'
import { data as throwData } from 'react-router'
import {
  type ReviewApprovalRequestInput,
  reviewApprovalRequestSchema,
} from '~/app/common/validations/workflow-approvals'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'
import { broadcastApprovalUpdate } from '~/app/services/approval-sse.server'
import { hasPermission } from '~/app/services/authorization.server'
import { reviewApprovalRequest } from '~/app/services/workflow-approvals.server'

export async function action({ request, params }: ActionFunctionArgs) {
  const approvalId = params.id
  if (!approvalId) {
    throw throwData({ error: 'Approval ID is required' }, { status: 400 })
  }

  // Authenticate user
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw throwData({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = session.user

  // Verify user has permission to review approvals
  const canApprove = await hasPermission(user.id, 'approve_workflows')
  if (!canApprove) {
    throw throwData(
      { error: 'Forbidden: You do not have permission to review approval requests' },
      { status: 403 }
    )
  }

  // Parse and validate request body
  let validatedData: ReviewApprovalRequestInput
  try {
    const body = await request.json()
    validatedData = reviewApprovalRequestSchema.parse(body)
  } catch (error) {
    const err = error as { errors?: unknown; message?: string }
    throw throwData(
      {
        error: 'Validation failed',
        details: err.errors || err.message,
      },
      { status: 400 }
    )
  }

  // Verify approval request exists
  const existingApproval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      assignedToRole: {
        include: { users: true },
      },
    },
  })

  if (!existingApproval) {
    throw throwData({ error: 'Approval request not found' }, { status: 404 })
  }

  // Verify user is authorized to review this approval
  const isDirectlyAssigned = existingApproval.assignedTo === user.id
  const isRoleMember = existingApproval.assignedToRole?.users.some((u) => u.id === user.id)

  if (!isDirectlyAssigned && !isRoleMember) {
    throw throwData(
      { error: 'Forbidden: You are not assigned to this approval request' },
      { status: 403 }
    )
  }

  // Verify approval is in a reviewable state
  if (!['pending', 'in_review', 'more_info_required'].includes(existingApproval.status)) {
    throw throwData(
      {
        error: 'Approval request cannot be reviewed',
        details: `Current status: ${existingApproval.status}`,
      },
      { status: 400 }
    )
  }

  try {
    // Review the approval request
    const updatedApproval = await reviewApprovalRequest(
      approvalId,
      user.id,
      validatedData.decision as 'approved' | 'rejected' | 'more_info_required',
      validatedData.decisionReason
    )

    // Broadcast SSE update to relevant users
    const targetUserIds = [updatedApproval.requestedBy, updatedApproval.assignedTo].filter(
      Boolean
    ) as string[]

    broadcastApprovalUpdate(
      {
        type: 'approval_status_changed',
        approvalId: updatedApproval.id,
        data: {
          status: updatedApproval.status,
          decision: updatedApproval.decision,
          reviewedBy: user.id,
        },
      },
      existingApproval.companyId,
      targetUserIds
    )

    return {
      success: true,
      approval: {
        id: updatedApproval.id,
        status: updatedApproval.status,
        decision: updatedApproval.decision,
        decisionReason: updatedApproval.decisionReason,
        reviewedAt: updatedApproval.reviewedAt,
        completedAt: updatedApproval.completedAt,
      },
    }
  } catch (error) {
    const err = error as { message?: string }
    console.error('Failed to review approval request:', error)
    throw throwData(
      {
        error: 'Failed to review approval request',
        details: err.message,
      },
      { status: 500 }
    )
  }
}
