import type { LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import WorkflowTemplateFormPage from '~/app/pages/WorkflowTemplateForm/WorkflowTemplateForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['update:workflows'])

  const templateId = params.id
  if (!templateId) {
    throw new Response('Template ID is required', { status: 400 })
  }

  try {
    // Load the workflow template with steps and related data
    const workflowTemplate = await prisma.workflowTemplate.findUnique({
      where: {
        id: templateId,
        companyId: user.companyId, // Ensure user can only edit templates from their company
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            assigneeUser: {
              include: {
                profile: true,
              },
            },
            assigneeRole: true,
          },
        },
        createdBy: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!workflowTemplate) {
      throw new Response('Workflow template not found', { status: 404 })
    }

    // Load users and roles for the assignee dropdowns
    const [users, roles] = await Promise.all([
      prisma.user.findMany({
        where: {
          companyId: user.companyId,
        },
        include: {
          profile: true,
        },
        orderBy: [{ profile: { firstName: 'asc' } }, { email: 'asc' }],
      }),
      prisma.role.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: 'asc' },
      }),
    ])

    // Get current user's role information
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
      },
    })

    // Transform the template data to match our interface
    const transformedTemplate = {
      ...workflowTemplate,
      // Map triggerType to entityType for backward compatibility
      entityType: workflowTemplate.triggerType.includes('purchase_order')
        ? 'purchase_order'
        : workflowTemplate.triggerType.includes('sales_order')
          ? 'sales_order'
          : workflowTemplate.triggerType.includes('stock_adjustment')
            ? 'stock_adjustment'
            : workflowTemplate.triggerType.includes('transfer_order')
              ? 'transfer_order'
              : workflowTemplate.triggerType.includes('invoice')
                ? 'invoice'
                : workflowTemplate.triggerType.includes('bill')
                  ? 'bill'
                  : workflowTemplate.triggerType.includes('customer')
                    ? 'customer'
                    : workflowTemplate.triggerType.includes('supplier')
                      ? 'supplier'
                      : workflowTemplate.triggerType.includes('product')
                        ? 'product'
                        : 'custom',
      // Pass through the actual triggerType and triggerConditions
      triggerType: workflowTemplate.triggerType,
      triggerConditions: workflowTemplate.triggerConditions,
      // Default priority for existing templates
      priority: 'Medium',
      // Ensure description is never null
      description: workflowTemplate.description || '',
      steps: workflowTemplate.steps.map((step: any) => ({
        id: step.id,
        name: step.name,
        description: step.description || '',
        type: step.stepType,
        assigneeType: step.assigneeUserId ? 'user' : 'role',
        assigneeId: step.assigneeUserId || step.assigneeRoleId || '',
        assigneeName: step.assigneeUserId
          ? `${step.assigneeUser?.profile?.firstName || step.assigneeUser?.email} ${step.assigneeUser?.profile?.lastName || ''}`.trim()
          : step.assigneeRole?.name || '',
        order: step.stepNumber,
        isRequired: step.isRequired,
        timeoutDays: step.timeoutHours ? Math.ceil(step.timeoutHours / 24) : undefined,
        autoApprove: false,
        allowParallel: false,
        conditions: step.conditions || {},
      })),
      usageCount: 0, // This would come from actual usage tracking
    }

    // Transform users for easier consumption in the UI
    const userOptions = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.profile?.firstName
        ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
        : user.email,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
    }))

    // Transform roles for easier consumption in the UI
    const roleOptions = roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
    }))

    return new Response(
      JSON.stringify({
        workflowTemplate: transformedTemplate,
        currentUser: {
          ...user,
          role: userWithRole?.role || null,
        },
        users: userOptions,
        roles: roleOptions,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error loading workflow template:', error)
    throw new Response('Failed to load workflow template', { status: 500 })
  }
}

export default function WorkflowTemplateEdit() {
  return <WorkflowTemplateFormPage />
}
