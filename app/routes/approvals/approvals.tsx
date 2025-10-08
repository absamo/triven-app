import { type LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth'
import ApprovalsPage from '~/app/pages/Approvals'
import { getApprovalRequests } from '~/app/services/workflow.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }

  if (!session.user.companyId) {
    throw new Response('No company found', { status: 400 })
  }

  // Load approval requests for the current user (their requests + assigned to them)
  const approvalRequests = await getApprovalRequests(session.user.companyId, {
    currentUserId: session.user.id,
    currentUserRoleId: session.user.roleId || undefined,
  })

  // Get current user's role information
  const userWithRole = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: true,
    },
  })

  return new Response(
    JSON.stringify({
      approvalRequests: approvalRequests,
      currentUser: {
        ...session.user,
        role: userWithRole?.role || null,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

export default function ApprovalsRoute() {
  return <ApprovalsPage />
}
