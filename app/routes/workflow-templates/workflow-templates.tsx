import type { LoaderFunctionArgs } from 'react-router'
import { ErrorBoundary as ErrorBoundaryComponent } from '~/app/components/ErrorBoundary'
import { prisma } from '~/app/db.server'
import WorkflowTemplatesPage from '~/app/pages/WorkflowTemplates/WorkflowTemplates'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export { ErrorBoundaryComponent as ErrorBoundary }

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireBetterAuthUser(request, ['read:workflows'])

    // Load workflow templates for the user's company
    const workflowTemplates = await prisma.workflowTemplate.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        createdBy: {
          include: {
            profile: true,
          },
        },
        steps: {
          orderBy: {
            stepNumber: 'asc',
          },
          include: {
            assigneeUser: {
              include: {
                profile: true,
              },
            },
            assigneeRole: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    })

    // Get current user's role information
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
      },
    })

    // Load all users and roles for step assignment
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
        where: {
          companyId: user.companyId,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ])

    // Transform the data to match our interface
    const transformedTemplates = workflowTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      entityType: template.triggerType.includes('purchase_order')
        ? 'purchase_order'
        : template.triggerType.includes('sales_order')
          ? 'sales_order'
          : template.triggerType.includes('stock_adjustment')
            ? 'stock_adjustment'
            : template.triggerType.includes('transfer_order')
              ? 'transfer_order'
              : template.triggerType.includes('invoice')
                ? 'invoice'
                : template.triggerType.includes('bill')
                  ? 'bill'
                  : template.triggerType.includes('customer')
                    ? 'customer'
                    : template.triggerType.includes('supplier')
                      ? 'supplier'
                      : template.triggerType.includes('product')
                        ? 'product'
                        : 'custom',
      triggerType: template.triggerType,
      triggerConditions: template.triggerConditions
        ? JSON.parse(JSON.stringify(template.triggerConditions))
        : {},
      priority: 'Medium',
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      createdBy: {
        email: template.createdBy.email,
        profile: template.createdBy.profile
          ? {
              firstName: template.createdBy.profile.firstName,
              lastName: template.createdBy.profile.lastName,
            }
          : undefined,
      },
      steps: template.steps.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description || '',
        type: step.stepType,
        assigneeType: step.assigneeUserId ? ('user' as const) : ('role' as const),
        assigneeId: step.assigneeUserId || step.assigneeRoleId || '',
        assigneeName: step.assigneeUserId
          ? `${step.assigneeUser?.profile?.firstName || step.assigneeUser?.email} ${step.assigneeUser?.profile?.lastName || ''}`.trim()
          : step.assigneeRole?.name || '',
        order: step.stepNumber,
        isOptional: !step.isRequired,
        timeoutDays: step.timeoutHours ? Math.ceil(step.timeoutHours / 24) : null,
      })),
      usageCount: 0,
    }))

    const result = {
      workflowTemplates: transformedTemplates,
      currentUser: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        roleId: user.roleId,
        role: userWithRole?.role || null,
      },
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.profile?.firstName
          ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim()
          : u.email,
        firstName: u.profile?.firstName || '',
        lastName: u.profile?.lastName || '',
      })),
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description || '',
      })),
      permissions: (userWithRole?.role?.permissions as string[]) || [],
    }

    return result
  } catch (error) {
    console.error('[Workflow Templates Loader] Error:', error)
    throw error
  }
}

export default function WorkflowTemplatesRoute() {
  return <WorkflowTemplatesPage />
}
