import { type LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth'
import ApprovalsPage from '~/app/pages/Approvals'
import { getApprovalRequests } from '~/app/services/workflow.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:approvals'])

  // Load approval requests for the current user (their requests + assigned to them)
  const approvalRequests = await getApprovalRequests(user.companyId, {
    currentUserId: user.id,
    currentUserRoleId: user.roleId || undefined,
  })

  // Get current user's role information
  const userWithRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: true,
    },
  })

  return new Response(
    JSON.stringify({
      approvalRequests: approvalRequests,
      currentUser: {
        ...user,
        role: userWithRole?.role || null,
      },
      permissions: user?.role?.permissions?.filter(
        (permission) =>
          permission === 'create:approvals' ||
          permission === 'update:approvals' ||
          permission === 'delete:approvals'
      ) || [],
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
