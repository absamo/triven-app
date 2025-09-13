import { type LoaderFunctionArgs } from "react-router"
import { prisma } from "~/app/db.server"
import { auth } from "~/app/lib/auth"
import WorkflowTemplatesPage from "~/app/pages/WorkflowTemplates/WorkflowTemplates"

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({
        headers: request.headers,
    })

    if (!session) {
        throw new Response("Unauthorized", { status: 401 })
    }

    if (!session.user.companyId) {
        throw new Response("No company found", { status: 400 })
    }

    // Load workflow templates for the user's company
    const workflowTemplates = await prisma.workflowTemplate.findMany({
        where: {
            companyId: session.user.companyId,
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
        orderBy: [
            { isActive: 'desc' },
            { updatedAt: 'desc' },
        ],
    })

    // Get current user's role information
    const userWithRole = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            role: true,
        },
    })

    // Load all users and roles for step assignment
    const [users, roles] = await Promise.all([
        prisma.user.findMany({
            where: {
                companyId: session.user.companyId,
            },
            include: {
                profile: true,
            },
            orderBy: [
                { profile: { firstName: 'asc' } },
                { email: 'asc' }
            ],
        }),
        prisma.role.findMany({
            where: {
                companyId: session.user.companyId,
            },
            orderBy: {
                name: 'asc',
            },
        }),
    ])

    // Transform the data to match our interface
    const transformedTemplates = workflowTemplates.map(template => ({
        ...template,
        // Map triggerType to entityType for backward compatibility
        entityType: template.triggerType.includes('purchase_order') ? 'purchase_order' :
            template.triggerType.includes('sales_order') ? 'sales_order' :
                template.triggerType.includes('stock_adjustment') ? 'stock_adjustment' :
                    template.triggerType.includes('transfer_order') ? 'transfer_order' :
                        template.triggerType.includes('invoice') ? 'invoice' :
                            template.triggerType.includes('bill') ? 'bill' :
                                template.triggerType.includes('customer') ? 'customer' :
                                    template.triggerType.includes('supplier') ? 'supplier' :
                                        template.triggerType.includes('product') ? 'product' :
                                            'custom',
        // Default priority for existing templates
        priority: 'Medium',
        // Ensure description is never null
        description: template.description || '',
        steps: template.steps.map((step) => ({
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
            isOptional: !step.isRequired,
            timeoutDays: step.timeoutHours ? Math.ceil(step.timeoutHours / 24) : null,
        })),
        usageCount: 0, // This would come from actual usage tracking
    }))

    return new Response(JSON.stringify({
        workflowTemplates: transformedTemplates,
        currentUser: {
            ...session.user,
            role: userWithRole?.role || null,
        },
        users: users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.profile?.firstName
                ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
                : user.email,
            firstName: user.profile?.firstName || '',
            lastName: user.profile?.lastName || '',
        })),
        roles: roles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
        })),
    }), {
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export default function WorkflowTemplatesRoute() {
    return <WorkflowTemplatesPage />
}