// T022: API route to create workflow templates
import { data, type ActionFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { hasPermission } from '~/app/services/authorization.server'
import { validateWorkflowAssignees } from '~/app/services/workflow-approvals.server'
import { createWorkflowTemplateSchema } from '~/app/common/validations/workflow-approvals'
import { getBetterAuthUser } from '~/app/services/better-auth.server'

export async function action({ request }: ActionFunctionArgs) {
  // Authenticate user
  const user = await getBetterAuthUser(request)
  
  if (!user?.id) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const userId = user.id

  // Check if user has create_workflow permission
  const hasCreatePermission = await hasPermission(userId, 'create_workflow')
  
  if (!hasCreatePermission) {
    throw data(
      { error: 'Insufficient permissions. Required: create_workflow' },
      { status: 403 }
    )
  }

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = createWorkflowTemplateSchema.safeParse(body)

    if (!validation.success) {
      throw data(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Validate assignees in each step
    for (const step of validatedData.steps) {
      if (step.stepType === 'approval' || step.stepType === 'parallel_approval' || step.stepType === 'sequential_approval') {
        const assigneeValidation = await validateWorkflowAssignees(
          step.assigneeUserId,
          step.assigneeRoleId
        )

        if (!assigneeValidation.valid) {
          throw data(
            {
              error: 'Invalid assignees',
              details: assigneeValidation.errors,
              step: step.stepNumber,
            },
            { status: 400 }
          )
        }
      }
    }

    // Get user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    })

    // Create workflow template
    const workflowTemplate = await prisma.workflowTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        triggerType: validatedData.triggerType,
        entityType: validatedData.entityType,
        triggerConditions: undefined,
        isActive: validatedData.isActive,
        companyId: currentUser?.companyId!,
        createdById: userId,
        steps: {
          create: validatedData.steps.map((step: any, index: number) => ({
            stepNumber: step.stepNumber || index + 1,
            stepType: step.stepType,
            name: step.name,
            description: step.description,
            assigneeType: step.assigneeType || 'user',
            assigneeUserId: step.assigneeUserId,
            assigneeRoleId: step.assigneeRoleId,
            conditions: step.config || null,
            autoApprove: false,
            timeoutHours: step.timeoutMinutes ? Math.ceil(step.timeoutMinutes / 60) : null,
            isRequired: true,
            allowParallel: step.stepType === 'parallel_approval',
          })),
        },
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return data({ workflowTemplate }, { status: 201 })
  } catch (error) {
    console.error('[API] Failed to create workflow template:', error)
    throw data(
      { error: 'Failed to create workflow template' },
      { status: 500 }
    )
  }
}
