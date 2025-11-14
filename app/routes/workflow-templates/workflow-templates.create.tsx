import type { LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import WorkflowTemplateFormPage from '~/app/pages/WorkflowTemplateForm/WorkflowTemplateForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['create:workflows'])

  try {
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
        workflowTemplate: null, // No existing template for create mode
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
    console.error('Error loading workflow template create data:', error)
    throw new Response('Failed to load workflow template data', { status: 500 })
  }
}

export default function WorkflowTemplateCreate() {
  return <WorkflowTemplateFormPage />
}
