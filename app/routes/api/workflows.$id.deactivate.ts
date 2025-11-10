// T023: API route to deactivate workflow templates
import { data, type ActionFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { hasPermission } from '~/app/services/authorization.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'

export async function action({ request, params }: ActionFunctionArgs) {
  // Authenticate user
  const user = await getBetterAuthUser(request)
  
  if (!user?.id) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const userId = user.id
  const workflowId = params.id

  if (!workflowId) {
    throw data({ error: 'Workflow ID is required' }, { status: 400 })
  }

  // Check if user has create_workflow permission (required to deactivate)
  const hasCreatePermission = await hasPermission(userId, 'create_workflow')
  
  if (!hasCreatePermission) {
    throw data(
      { error: 'Insufficient permissions. Required: create_workflow' },
      { status: 403 }
    )
  }

  try {
    // Verify workflow exists and user has access
    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        createdById: true,
        companyId: true,
        isActive: true,
      },
    })

    if (!workflow) {
      throw data({ error: 'Workflow template not found' }, { status: 404 })
    }

    // Get user's company to verify access
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    })

    // Check if user owns the workflow or is in the same company
    const hasAccess =
      workflow.createdById === userId ||
      (workflow.companyId && workflow.companyId === currentUser?.companyId)

    if (!hasAccess) {
      throw data(
        { error: 'You do not have permission to deactivate this workflow' },
        { status: 403 }
      )
    }

    // Deactivate workflow
    const updatedWorkflow = await prisma.workflowTemplate.update({
      where: { id: workflowId },
      data: {
        isActive: false,
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    return data({ workflowTemplate: updatedWorkflow })
  } catch (error) {
    console.error('[API] Failed to deactivate workflow template:', error)
    throw data(
      { error: 'Failed to deactivate workflow template' },
      { status: 500 }
    )
  }
}
