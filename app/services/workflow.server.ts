import type { WorkflowStep, WorkflowTemplate } from '@prisma/client'
import {
  APPROVAL_PRIORITIES,
  APPROVAL_REQUEST_TYPES,
  APPROVAL_STATUSES,
  TRANSFER_ORDER_STATUSES,
  WORKFLOW_STATUSES,
  WORKFLOW_STEP_STATUSES,
} from '~/app/common/constants'
import { prisma } from '~/app/db.server'

export type WorkflowTriggerData = {
  entityType: string
  entityId: string
  entityData: Record<string, any>
  triggeredBy: string
  companyId: string
  metadata?: Record<string, any>
}

export type ApprovalRequestData = {
  entityType: string
  entityId: string
  requestType: string
  title: string
  description?: string
  data: Record<string, any>
  requestedBy: string
  assignedTo?: string
  assignedRole?: string
  priority?: string
  expiresAt?: Date
  companyId: string
  conditions?: Record<string, any>
  stepExecutionId?: string // Link to the workflow step execution
}

// Workflow Template Management
export async function createWorkflowTemplate(data: {
  name: string
  description?: string
  triggerType: string
  triggerConditions?: Record<string, any>
  companyId: string
  createdById: string
  steps: Array<{
    stepNumber: number
    name: string
    description?: string
    stepType: string
    assigneeType: string
    assigneeRoleId?: string
    assigneeUserId?: string
    conditions?: Record<string, any>
    autoApprove?: boolean
    timeoutHours?: number
    isRequired?: boolean
    allowParallel?: boolean
  }>
}) {
  return await prisma.workflowTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      triggerType: data.triggerType as any,
      triggerConditions: data.triggerConditions,
      companyId: data.companyId,
      createdById: data.createdById,
      steps: {
        create: data.steps.map((step) => ({
          stepNumber: step.stepNumber,
          name: step.name,
          description: step.description,
          stepType: step.stepType as any,
          assigneeType: step.assigneeType as any,
          assigneeRoleId: step.assigneeRoleId,
          assigneeUserId: step.assigneeUserId,
          conditions: step.conditions,
          autoApprove: step.autoApprove || false,
          timeoutHours: step.timeoutHours,
          isRequired: step.isRequired !== false,
          allowParallel: step.allowParallel || false,
        })),
      },
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
        include: {
          assigneeRole: true,
          assigneeUser: true,
        },
      },
      company: true,
      createdBy: true,
    },
  })
}

export async function getWorkflowTemplates(companyId: string, isActive: boolean = true) {
  return await prisma.workflowTemplate.findMany({
    where: {
      companyId,
      isActive,
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
        include: {
          assigneeRole: true,
          assigneeUser: true,
        },
      },
      createdBy: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateWorkflowTemplate(
  id: string,
  data: Partial<{
    name: string
    description: string
    triggerConditions: Record<string, any>
    isActive: boolean
  }>
) {
  return await prisma.workflowTemplate.update({
    where: { id },
    data,
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
        include: {
          assigneeRole: true,
          assigneeUser: true,
        },
      },
    },
  })
}

// Workflow Execution
export async function triggerWorkflow(triggerData: WorkflowTriggerData) {
  // Find applicable workflow templates
  const templates = await prisma.workflowTemplate.findMany({
    where: {
      companyId: triggerData.companyId,
      isActive: true,
      triggerType: triggerData.entityType as any,
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
        include: {
          assigneeRole: true,
          assigneeUser: true,
        },
      },
    },
  })
  const instances = []

  for (const template of templates) {
    // Check if trigger conditions are met
    if (shouldTriggerWorkflow(template, triggerData)) {
      const instance = await createWorkflowInstance(template, triggerData)
      instances.push(instance)
    }
  }
  return instances
}

function shouldTriggerWorkflow(
  template: WorkflowTemplate & { steps: any[] },
  triggerData: WorkflowTriggerData
): boolean {
  // If no trigger conditions, always trigger
  if (!template.triggerConditions) {
    return true
  }

  const conditions = template.triggerConditions as Record<string, any>

  // Check threshold conditions
  if (conditions.threshold && triggerData.entityData.amount) {
    const threshold = parseFloat(conditions.threshold)
    const amount = parseFloat(triggerData.entityData.amount)

    if (conditions.operator === 'gt' && amount <= threshold) return false
    if (conditions.operator === 'gte' && amount < threshold) return false
    if (conditions.operator === 'lt' && amount >= threshold) return false
    if (conditions.operator === 'lte' && amount > threshold) return false
    if (conditions.operator === 'eq' && amount !== threshold) return false
  }

  // Check field conditions
  if (conditions.fieldConditions) {
    for (const [field, condition] of Object.entries(conditions.fieldConditions)) {
      const fieldValue = triggerData.entityData[field]
      const conditionValue = (condition as any).value
      const operator = (condition as any).operator

      if (operator === 'equals' && fieldValue !== conditionValue) return false
      if (operator === 'contains' && !fieldValue?.includes?.(conditionValue)) return false
      if (operator === 'not_equals' && fieldValue === conditionValue) return false
    }
  }

  return true
}

// Helper function to map trigger types to entity types
function getEntityTypeFromTriggerType(triggerType: string): string {
  const mapping: Record<string, string> = {
    purchase_order_create: 'purchase_order',
    purchase_order_threshold: 'purchase_order',
    sales_order_create: 'sales_order',
    sales_order_threshold: 'sales_order',
    stock_adjustment_create: 'stock_adjustment',
    transfer_order_create: 'transfer_order',
    invoice_create: 'invoice',
    bill_create: 'bill',
    customer_create: 'customer',
    supplier_create: 'supplier',
    product_create: 'product',
    // Add more mappings as needed
  }

  const result = mapping[triggerType] || triggerType
  return result
}
async function createWorkflowInstance(
  template: WorkflowTemplate & { steps: any[] },
  triggerData: WorkflowTriggerData
) {
  const entityType = getEntityTypeFromTriggerType(template.triggerType)
  const instance = await prisma.workflowInstance.create({
    data: {
      workflowTemplateId: template.id,
      entityType: entityType as any,
      entityId: triggerData.entityId,
      status: WORKFLOW_STATUSES.PENDING,
      triggeredBy: triggerData.triggeredBy,
      data: triggerData.entityData,
      metadata: triggerData.metadata,
      currentStepNumber: template.steps.length > 0 ? template.steps[0].stepNumber : null,
    },
    include: {
      workflowTemplate: {
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      },
    },
  })

  // Start first step if workflow has steps
  if (template.steps.length > 0) {
    await executeNextStep(instance.id)
  }

  return instance
}

export async function executeNextStep(workflowInstanceId: string) {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: workflowInstanceId },
    include: {
      workflowTemplate: {
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
            include: {
              assigneeRole: true,
              assigneeUser: true,
            },
          },
        },
      },
      stepExecutions: true,
    },
  })

  if (
    !instance ||
    (instance.status !== WORKFLOW_STATUSES.PENDING &&
      instance.status !== WORKFLOW_STATUSES.IN_PROGRESS)
  ) {
    return null
  }

  const currentStep = instance.workflowTemplate.steps.find(
    (step: WorkflowStep) => step.stepNumber === instance.currentStepNumber
  )

  if (!currentStep) {
    // No more steps, complete workflow
    await prisma.workflowInstance.update({
      where: { id: workflowInstanceId },
      data: {
        status: WORKFLOW_STATUSES.COMPLETED,
        completedAt: new Date(),
      },
    })
    return null
  }

  // Determine assignee
  let assignedTo: string | null = null
  if (currentStep.assigneeType === 'user' && currentStep.assigneeUserId) {
    assignedTo = currentStep.assigneeUserId
  } else if (currentStep.assigneeType === 'role' && currentStep.assigneeRoleId) {
    // Find a user with this role in the same company
    const user = await prisma.user.findFirst({
      where: {
        roleId: currentStep.assigneeRoleId,
        companyId: instance.workflowTemplate.companyId,
        active: true,
      },
    })
    assignedTo = user?.id || null
  }

  // Create step execution
  const stepExecution = await prisma.workflowStepExecution.create({
    data: {
      workflowInstanceId: instance.id,
      workflowStepId: currentStep.id,
      status: WORKFLOW_STEP_STATUSES.ASSIGNED,
      assignedTo: assignedTo || undefined,
      timeoutAt: currentStep.timeoutHours
        ? new Date(Date.now() + currentStep.timeoutHours * 60 * 60 * 1000)
        : null,
    },
  })

  // Update workflow instance status
  await prisma.workflowInstance.update({
    where: { id: workflowInstanceId },
    data: {
      status: WORKFLOW_STATUSES.IN_PROGRESS,
    },
  })

  // If it's an approval step, update existing approval request or create new one
  if (currentStep.stepType === 'approval') {
    // Check if there's already an approval request for this workflow instance
    const existingApprovalRequest = await prisma.approvalRequest.findFirst({
      where: {
        workflowInstanceId: instance.id,
        entityType: instance.entityType,
        entityId: instance.entityId,
      },
    })

    if (existingApprovalRequest) {
      // Update existing approval request to point to the new step execution
      await prisma.approvalRequest.update({
        where: { id: existingApprovalRequest.id },
        data: {
          stepExecutionId: stepExecution.id,
          assignedTo: assignedTo || undefined,
          assignedRole: currentStep.assigneeRoleId,
          status: APPROVAL_STATUSES.PENDING, // Reset to pending for new step
          reviewedAt: null,
          completedAt: null,
          // Update title to reflect current step
          title:
            currentStep.stepNumber > 1
              ? existingApprovalRequest.title
              : existingApprovalRequest.title,
          description: `${currentStep.name} - ${currentStep.description || ''}`,
        },
      })
    } else {
      // Create new approval request (for the first step)
      await createApprovalRequestFromStep(instance, currentStep, stepExecution.id, assignedTo)
    }
  }

  // If auto-approve is enabled, automatically approve
  if (currentStep.autoApprove) {
    await completeWorkflowStep(stepExecution.id, {
      decision: 'approved',
      notes: 'Auto-approved',
    })
  }

  return stepExecution
}

async function createApprovalRequestFromStep(
  instance: any,
  step: any,
  stepExecutionId: string,
  assignedTo: string | null
) {
  // Enhanced title and description for transfer orders
  let title = `${step.name} - ${instance.entityType} ${instance.entityId}`
  let description = step.description || ''

  // Special formatting for transfer orders
  if (instance.entityType === 'transfer_order' && instance.data) {
    const data = instance.data
    if (data.transferOrderReference && data.fromSite && data.toSite) {
      title = `Transfert ${data.transferOrderReference}`
      description = `Transfert de stock entre ${data.fromSite} et ${data.toSite}`
    }
  }
  return await createApprovalRequest({
    entityType: instance.entityType,
    entityId: instance.entityId,
    requestType: APPROVAL_REQUEST_TYPES.APPROVE,
    title: title,
    description: description,
    data: instance.data,
    requestedBy: instance.triggeredBy,
    assignedTo: assignedTo || undefined,
    assignedRole: step.assigneeRoleId,
    priority: APPROVAL_PRIORITIES.MEDIUM,
    companyId: instance.workflowTemplate.companyId,
    conditions: step.conditions,
    stepExecutionId: stepExecutionId,
  })
}

export async function completeWorkflowStep(
  stepExecutionId: string,
  data: {
    decision: string
    notes?: string
    metadata?: Record<string, any>
  }
) {
  const stepExecution = await prisma.workflowStepExecution.update({
    where: { id: stepExecutionId },
    data: {
      status: WORKFLOW_STEP_STATUSES.COMPLETED,
      completedAt: new Date(),
      decision: data.decision as any,
      notes: data.notes,
      metadata: data.metadata,
    },
    include: {
      workflowInstance: {
        include: {
          workflowTemplate: {
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' },
              },
            },
          },
        },
      },
      workflowStep: true,
    },
  })

  const instance = stepExecution.workflowInstance
  const currentStepNumber = stepExecution.workflowStep.stepNumber

  if (data.decision === 'rejected') {
    // Workflow rejected, cancel it
    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: WORKFLOW_STATUSES.CANCELLED,
        cancelledAt: new Date(),
      },
    })

    // Update entity status to cancelled/rejected
    await updateEntityStatusOnWorkflowCancellation(instance)
    return stepExecution
  }

  // Find next step
  const nextStep = instance.workflowTemplate.steps.find(
    (step: WorkflowStep) => step.stepNumber > currentStepNumber
  )

  if (nextStep) {
    // Move to next step
    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        currentStepNumber: nextStep.stepNumber,
      },
    })
    await executeNextStep(instance.id)
  } else {
    // No more steps, complete workflow
    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: WORKFLOW_STATUSES.COMPLETED,
        completedAt: new Date(),
        currentStepNumber: null,
      },
    })

    // Update entity status based on workflow completion
    await updateEntityStatusOnWorkflowCompletion(instance)
  }

  return stepExecution
}

// Reopen a workflow step - reset it back to assigned status and handle workflow state
export async function reopenWorkflowStep(workflowInstanceId: string, stepExecutionId: string) {
  // Get the step execution and workflow instance details
  const stepExecution = await prisma.workflowStepExecution.findUnique({
    where: { id: stepExecutionId },
    include: {
      workflowInstance: {
        include: {
          workflowTemplate: {
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' },
              },
            },
          },
          stepExecutions: {
            orderBy: { startedAt: 'asc' },
            include: {
              workflowStep: true,
            },
          },
        },
      },
      workflowStep: true,
    },
  })

  if (!stepExecution) {
    throw new Error('Step execution not found')
  }

  const instance = stepExecution.workflowInstance
  const currentStepNumber = stepExecution.workflowStep.stepNumber

  // Reset the current step execution back to assigned status
  await prisma.workflowStepExecution.update({
    where: { id: stepExecutionId },
    data: {
      status: WORKFLOW_STEP_STATUSES.ASSIGNED,
      completedAt: null,
      decision: null,
      notes: null,
    },
  })

  // Find any subsequent step executions that were created after this step was completed
  const subsequentStepExecutions = instance.stepExecutions.filter(
    (execution) => execution.workflowStep.stepNumber > currentStepNumber
  )

  // Remove any subsequent step executions and their approval requests
  for (const subsequentExecution of subsequentStepExecutions) {
    // Remove approval requests for this step execution
    await prisma.approvalRequest.deleteMany({
      where: { stepExecutionId: subsequentExecution.id },
    })

    // Remove the step execution
    await prisma.workflowStepExecution.delete({
      where: { id: subsequentExecution.id },
    })
  }

  // Update the workflow instance to set current step back to the reopened step
  await prisma.workflowInstance.update({
    where: { id: workflowInstanceId },
    data: {
      currentStepNumber: currentStepNumber,
      status: WORKFLOW_STATUSES.IN_PROGRESS,
      completedAt: null,
    },
  })

  return stepExecution
}

// Approval Request Management
export async function createApprovalRequest(data: ApprovalRequestData) {
  return await prisma.approvalRequest.create({
    data: {
      entityType: data.entityType as any,
      entityId: data.entityId,
      requestType: data.requestType as any,
      title: data.title,
      description: data.description,
      data: data.data,
      requestedBy: data.requestedBy,
      assignedTo: data.assignedTo,
      assignedRole: data.assignedRole,
      priority: (data.priority || APPROVAL_PRIORITIES.MEDIUM) as any,
      status: APPROVAL_STATUSES.PENDING,
      companyId: data.companyId,
      conditions: data.conditions,
      expiresAt: data.expiresAt,
      stepExecutionId: data.stepExecutionId, // Now storing the link to workflow step execution
    },
    include: {
      requestedByUser: {
        include: {
          profile: true,
        },
      },
      assignedToUser: {
        include: {
          profile: true,
        },
      },
      assignedToRole: true,
    },
  })
}

export async function getApprovalRequests(
  companyId: string,
  filters: {
    status?: string
    assignedTo?: string
    assignedRole?: string
    entityType?: string
    priority?: string
    currentUserId?: string
    currentUserRoleId?: string
  } = {}
) {
  const where: any = { companyId }

  // User-specific filtering: show requests they created OR are assigned to
  if (filters.currentUserId || filters.currentUserRoleId) {
    const userConditions = []

    // Requests created by the user (they requested the approval)
    if (filters.currentUserId) {
      userConditions.push({ requestedBy: filters.currentUserId })
    }

    // Requests assigned directly to the user
    if (filters.currentUserId) {
      userConditions.push({ assignedTo: filters.currentUserId })
    }

    // Requests assigned to the user's role (when no specific user is assigned)
    if (filters.currentUserRoleId) {
      userConditions.push({
        AND: [
          { assignedRole: filters.currentUserRoleId },
          { assignedTo: null }, // Only when no specific user is assigned
        ],
      })
    }

    if (userConditions.length > 0) {
      where.OR = userConditions
    }
  }

  // Apply additional filters only if they don't conflict with user-specific filtering
  if (filters.status) {
    if (where.OR) {
      // Combine user filtering with status filter
      where.AND = [{ OR: where.OR }, { status: filters.status }]
      delete where.OR
    } else {
      where.status = filters.status
    }
  }

  // Only apply other filters if no user-specific filtering is active
  if (!filters.currentUserId && !filters.currentUserRoleId) {
    if (filters.assignedTo) where.assignedTo = filters.assignedTo
    if (filters.assignedRole) where.assignedRole = filters.assignedRole
  }

  if (filters.entityType) {
    if (where.AND) {
      where.AND.push({ entityType: filters.entityType })
    } else if (where.OR) {
      where.AND = [{ OR: where.OR }, { entityType: filters.entityType }]
      delete where.OR
    } else {
      where.entityType = filters.entityType
    }
  }

  if (filters.priority) {
    if (where.AND) {
      where.AND.push({ priority: filters.priority })
    } else if (where.OR) {
      where.AND = [{ OR: where.OR }, { priority: filters.priority }]
      delete where.OR
    } else {
      where.priority = filters.priority
    }
  }

  return await prisma.approvalRequest.findMany({
    where,
    include: {
      requestedByUser: {
        include: {
          profile: true,
        },
      },
      assignedToUser: {
        include: {
          profile: true,
        },
      },
      assignedToRole: true,
      comments: {
        include: {
          author: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      workflowInstance: {
        include: {
          workflowTemplate: {
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' },
              },
            },
          },
        },
      },
      stepExecution: {
        include: {
          workflowStep: true,
        },
      },
    },
    orderBy: [{ priority: 'desc' }, { requestedAt: 'desc' }],
  })
}

export async function approveRequest(
  requestId: string,
  approvedBy: string,
  data: {
    status: string
    decisionReason?: string
    notes?: string
  }
) {
  // Simple 3-step workflow: pending > in_review > approved/rejected
  // For reopening, we set status back to pending
  let completedAt: Date | null = null
  let actualStatus = data.status

  // Handle reopen by setting status to pending
  if (data.status === 'reopen') {
    actualStatus = 'pending'
    completedAt = null // Clear completion date
  } else if (data.status === 'approved' || data.status === 'rejected') {
    completedAt = new Date()
  }

  const request = await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: actualStatus as any,
      decisionReason: data.decisionReason,
      reviewedAt: new Date(),
      completedAt,
    },
    include: {
      workflowInstance: {
        include: {
          stepExecutions: {
            where: {
              status: WORKFLOW_STEP_STATUSES.ASSIGNED,
            },
          },
        },
      },
    },
  })

  // Add comment if notes provided
  if (data.notes) {
    await prisma.approvalComment.create({
      data: {
        approvalRequestId: requestId,
        authorId: approvedBy,
        comment: data.notes,
        isInternal: false,
      },
    })
  }

  // Handle entity status updates based on approval decision
  // Only update entity status immediately if this is NOT part of a workflow
  // For workflow-managed approvals, the status will be updated when the workflow completes
  if (!request.workflowInstance) {
    await updateEntityStatusOnApprovalDecision(request, data.status)
  }

  // If this is part of a workflow, handle workflow step completion or reopening
  if (request.workflowInstance) {
    // Try to resolve the exact step execution associated with this approval request.
    // Prefer the `stepExecutionId` stored on the approval request. Fallback to
    // finding a step execution in the workflow instance that references this
    // approval request (this covers cases where the include/filtering above
    // didn't return the expected execution).
    let activeStepExecution: any | null = null

    if ((request as any).stepExecutionId) {
      activeStepExecution = await prisma.workflowStepExecution.findUnique({
        where: { id: (request as any).stepExecutionId },
      })
    }

    if (!activeStepExecution) {
      // Look for an assigned step execution that references this approval request
      activeStepExecution = await prisma.workflowStepExecution.findFirst({
        where: {
          workflowInstanceId: request.workflowInstance.id,
          approvalRequests: { some: { id: requestId } },
        },
      })
    }

    if (data.status === 'reopen') {
      // For reopen we need to find a (previous) step execution that contains this approval
      const completedStepExecution = await prisma.workflowStepExecution.findFirst({
        where: {
          workflowInstanceId: request.workflowInstance.id,
          approvalRequests: { some: { id: requestId } },
        },
      })

      if (completedStepExecution) {
        await reopenWorkflowStep(request.workflowInstance.id, completedStepExecution.id)
      }
    } else {
      if (activeStepExecution) {
        // Complete the workflow step normally
        await completeWorkflowStep(activeStepExecution.id, {
          decision: data.status,
          notes: data.notes,
        })
      } else {
        // No step execution found - log for debugging
        console.warn(
          `No workflow step execution found for approval request ${requestId} (workflowInstance: ${request.workflowInstance.id})`
        )
      }
    }
  }

  return request
}

export async function addApprovalComment(
  requestId: string,
  authorId: string,
  comment: string,
  isInternal: boolean = false
) {
  // Start a transaction to handle both comment creation and status update
  return await prisma.$transaction(async (tx) => {
    // Create the comment
    const newComment = await tx.approvalComment.create({
      data: {
        approvalRequestId: requestId,
        authorId,
        comment,
        isInternal,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    })

    // Update the approval request status to "in_review" if it's currently "pending"
    const approvalRequest = await tx.approvalRequest.findUnique({
      where: { id: requestId },
      select: { status: true },
    })

    if (approvalRequest?.status === APPROVAL_STATUSES.PENDING) {
      await tx.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: APPROVAL_STATUSES.IN_REVIEW,
          reviewedAt: new Date(),
        },
      })
    }

    return newComment
  })
}

// Helper function to get workflow status
export async function getWorkflowInstances(
  companyId: string,
  filters: {
    status?: string
    entityType?: string
    entityId?: string
  } = {}
) {
  const where: any = {
    workflowTemplate: {
      companyId,
    },
  }

  if (filters.status) where.status = filters.status
  if (filters.entityType) where.entityType = filters.entityType
  if (filters.entityId) where.entityId = filters.entityId

  return await prisma.workflowInstance.findMany({
    where,
    include: {
      workflowTemplate: true,
      triggeredByUser: {
        include: {
          profile: true,
        },
      },
      stepExecutions: {
        include: {
          workflowStep: true,
          assignedToUser: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { startedAt: 'asc' },
      },
      approvalRequests: {
        include: {
          assignedToUser: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  })
}

// Helper function to update entity status when workflow completes
async function updateEntityStatusOnWorkflowCompletion(instance: any) {
  try {
    // Handle transfer order completion
    if (instance.entityType === 'transfer_order') {
      // First check if the transfer order exists
      const existingTransferOrder = await prisma.transferOrder.findUnique({
        where: { id: instance.entityId },
        select: { id: true, status: true, transferOrderReference: true },
      })

      if (!existingTransferOrder) {
        console.error(`❌ Transfer order not found with ID: ${instance.entityId}`)
        console.error(`   Workflow instance ID: ${instance.id}`)
        return
      }

      await prisma.transferOrder.update({
        where: { id: instance.entityId },
        data: { status: TRANSFER_ORDER_STATUSES.CONFIRMED as any },
      })
    }
  } catch (error) {
    console.error('❌ Failed to update entity status:', error)
    console.error(`   Entity Type: ${instance.entityType}`)
    console.error(`   Entity ID: ${instance.entityId}`)
    // Don't throw error - workflow completion should not fail due to status update issues
  }
}

// Helper function to update entity status when workflow is cancelled/rejected
async function updateEntityStatusOnWorkflowCancellation(instance: any) {
  try {
    if (instance.entityType === 'transfer_order') {
      // First check if the transfer order exists
      const existingTransferOrder = await prisma.transferOrder.findUnique({
        where: { id: instance.entityId },
        select: { id: true, status: true, transferOrderReference: true },
      })

      if (!existingTransferOrder) {
        console.error(`❌ Transfer order not found with ID: ${instance.entityId}`)
        console.error(`   Workflow instance ID: ${instance.id}`)
        return
      }

      await prisma.transferOrder.update({
        where: { id: instance.entityId },
        data: { status: TRANSFER_ORDER_STATUSES.CANCELLED as any },
      })
    }
  } catch (error) {
    console.error('❌ Failed to update entity status on workflow cancellation:', error)
    console.error(`   Entity Type: ${instance.entityType}`)
    console.error(`   Entity ID: ${instance.entityId}`)
    // Don't throw error - workflow cancellation should not fail due to status update issues
  }
}

// Helper function to update entity status based on individual approval decisions
async function updateEntityStatusOnApprovalDecision(approvalRequest: any, decision: string) {
  try {
    // Handle transfer order approval decisions
    if (approvalRequest.entityType === 'transfer_order') {
      let newStatus: string

      switch (decision) {
        case 'approved':
          newStatus = TRANSFER_ORDER_STATUSES.CONFIRMED
          break
        case 'rejected':
          newStatus = TRANSFER_ORDER_STATUSES.CANCELLED
          break
        case 'reopen':
          newStatus = TRANSFER_ORDER_STATUSES.PENDING
          break
        default:
          // For 'in_review' or other statuses, keep current status
          return
      }

      // First check if the transfer order exists
      const existingTransferOrder = await prisma.transferOrder.findUnique({
        where: { id: approvalRequest.entityId },
        select: { id: true, status: true, transferOrderReference: true },
      })

      if (!existingTransferOrder) {
        console.error(`❌ Transfer order not found with ID: ${approvalRequest.entityId}`)
        console.error(`   Approval request ID: ${approvalRequest.id}`)
        console.error(`   Approval request title: ${approvalRequest.title}`)
        return
      }

      await prisma.transferOrder.update({
        where: { id: approvalRequest.entityId },
        data: { status: newStatus as any },
      })
    }
  } catch (error) {
    console.error('❌ Failed to update entity status on approval decision:', error)
    console.error(`   Entity Type: ${approvalRequest.entityType}`)
    console.error(`   Entity ID: ${approvalRequest.entityId}`)
    console.error(`   Decision: ${decision}`)
    // Don't throw error - approval should not fail due to status update issues
  }
}
