// T031: POST /api/approvals/create - Create approval request endpoint
import type { ActionFunctionArgs } from 'react-router'
import { data as throwData } from 'react-router'
import {
  type CreateApprovalRequestInput,
  createApprovalRequestSchema,
} from '~/app/common/validations/workflow-approvals'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'
import { hasPermission } from '~/app/services/authorization.server'
import {
  createApprovalRequest,
  validateWorkflowAssignees,
} from '~/app/services/workflow-approvals.server'

export async function action({ request }: ActionFunctionArgs) {
  // Authenticate user
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw throwData({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = session.user

  // Verify user has permission to create approval requests
  const canCreateApprovals = await hasPermission(user.id, 'create_workflows')
  if (!canCreateApprovals) {
    throw throwData(
      { error: 'Forbidden: You do not have permission to create approval requests' },
      { status: 403 }
    )
  }

  // Parse and validate request body
  let validatedData: CreateApprovalRequestInput
  try {
    const body = await request.json()
    validatedData = createApprovalRequestSchema.parse(body)
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

  // Validate that assignees have approve_workflows permission
  const assigneeValidation = await validateWorkflowAssignees(
    validatedData.assignedTo,
    validatedData.assignedRole
  )

  if (!assigneeValidation.valid) {
    throw throwData(
      {
        error: 'Invalid assignees',
        details: assigneeValidation.errors,
      },
      { status: 400 }
    )
  }

  // Verify entity exists based on entityType
  const entityExists = await verifyEntityExists(validatedData.entityType, validatedData.entityId)

  if (!entityExists) {
    throw throwData(
      {
        error: `${validatedData.entityType} with ID ${validatedData.entityId} not found`,
      },
      { status: 404 }
    )
  }

  // Get user's company ID
  const userWithCompany = await prisma.user.findUnique({
    where: { id: user.id },
    select: { companyId: true },
  })

  if (!userWithCompany?.companyId) {
    throw throwData({ error: 'User is not associated with a company' }, { status: 400 })
  }

  try {
    // Create the approval request
    const approvalRequest = await createApprovalRequest(
      {
        workflowInstanceId: validatedData.workflowInstanceId,
        stepExecutionId: validatedData.stepExecutionId,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        requestType: validatedData.requestType,
        priority: validatedData.priority,
        assignedTo: validatedData.assignedTo,
        assignedRole: validatedData.assignedRole,
        title: validatedData.title,
        description: validatedData.description,
        data: validatedData.data,
        conditions: validatedData.conditions,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        companyId: userWithCompany.companyId,
      },
      user.id
    )

    return {
      success: true,
      approvalRequest: {
        id: approvalRequest.id,
        entityType: approvalRequest.entityType,
        entityId: approvalRequest.entityId,
        requestType: approvalRequest.requestType,
        status: approvalRequest.status,
        priority: approvalRequest.priority,
        title: approvalRequest.title,
        requestedAt: approvalRequest.requestedAt,
        assignedTo: approvalRequest.assignedTo,
        assignedRole: approvalRequest.assignedRole,
      },
    }
  } catch (error) {
    const err = error as { message?: string }
    console.error('Failed to create approval request:', error)
    throw throwData(
      {
        error: 'Failed to create approval request',
        details: err.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Verify that the entity exists in the database
 */
async function verifyEntityExists(entityType: string, entityId: string): Promise<boolean> {
  try {
    switch (entityType) {
      case 'purchase_order':
        return !!(await prisma.purchaseOrder.findUnique({ where: { id: entityId } }))
      case 'sales_order':
        return !!(await prisma.salesOrder.findUnique({ where: { id: entityId } }))
      case 'stock_adjustment':
        return !!(await prisma.stockAdjustment.findUnique({ where: { id: entityId } }))
      case 'transfer_order':
        return !!(await prisma.transferOrder.findUnique({ where: { id: entityId } }))
      case 'invoice':
        return !!(await prisma.invoice.findUnique({ where: { id: entityId } }))
      case 'bill':
        return !!(await prisma.bill.findUnique({ where: { id: entityId } }))
      case 'customer':
        return !!(await prisma.customer.findUnique({ where: { id: entityId } }))
      case 'supplier':
        return !!(await prisma.supplier.findUnique({ where: { id: entityId } }))
      case 'product':
        return !!(await prisma.product.findUnique({ where: { id: entityId } }))
      case 'payment_made':
        return !!(await prisma.paymentMade.findUnique({ where: { id: entityId } }))
      case 'payment_received':
        return !!(await prisma.paymentReceived.findUnique({ where: { id: entityId } }))
      default:
        return false
    }
  } catch {
    return false
  }
}
