import type { LoaderFunctionArgs } from 'react-router'
import { ErrorBoundary as ErrorBoundaryComponent } from '~/app/components/ErrorBoundary'
import { prisma } from '~/app/db.server'
import ApprovalsPage from '~/app/pages/Approvals'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getApprovalRequests } from '~/app/services/workflow.server'

export { ErrorBoundaryComponent as ErrorBoundary }

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:approvals'])

  // Load approval requests for the current user (their requests + assigned to them)
  const { approvals } = await getApprovalRequests(user.companyId, {
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

  return {
    approvalRequests: approvals,
    currentUser: {
      ...user,
      role: userWithRole?.role || null,
    },
    permissions:
      user?.role?.permissions?.filter(
        (permission) =>
          permission === 'create:approvals' ||
          permission === 'update:approvals' ||
          permission === 'delete:approvals'
      ) || [],
  }
}

export default function ApprovalsRoute() {
  return <ApprovalsPage />
}
