import { data, type LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw data({ message: 'Unauthorized' }, { status: 401 })
  }
  const user = session.user

  if (!user.companyId) {
    throw data({ message: 'Company not found' }, { status: 400 })
  }

  // Get all approvals for the company
  const allApprovals = await prisma.approvalRequest.findMany({
    where: {
      companyId: user.companyId,
    },
    select: {
      id: true,
      status: true,
      priority: true,
      requestedAt: true,
      reviewedAt: true,
      completedAt: true,
      decision: true,
    },
  })

  // Calculate metrics
  const totalApprovals = allApprovals.length
  const pendingApprovals = allApprovals.filter((a) => a.status === 'pending').length
  const approvedCount = allApprovals.filter((a) => a.decision === 'approved').length
  const rejectedCount = allApprovals.filter((a) => a.decision === 'rejected').length

  // Calculate average resolution time (in hours) for completed approvals
  const completedApprovals = allApprovals.filter((a) => a.completedAt && a.requestedAt)
  const totalResolutionTimeMs = completedApprovals.reduce((sum, approval) => {
    if (!approval.completedAt) return sum
    const requested = new Date(approval.requestedAt).getTime()
    const completed = new Date(approval.completedAt).getTime()
    return sum + (completed - requested)
  }, 0)

  const avgResolutionTimeHours =
    completedApprovals.length > 0
      ? totalResolutionTimeMs / completedApprovals.length / (1000 * 60 * 60)
      : 0

  // Calculate completion rate (approved + rejected) / total
  const completionRate =
    totalApprovals > 0 ? ((approvedCount + rejectedCount) / totalApprovals) * 100 : 0

  // Get approvals by priority
  const byPriority = {
    Critical: allApprovals.filter((a) => a.priority === 'Critical' && a.status === 'pending')
      .length,
    Urgent: allApprovals.filter((a) => a.priority === 'Urgent' && a.status === 'pending').length,
    High: allApprovals.filter((a) => a.priority === 'High' && a.status === 'pending').length,
    Medium: allApprovals.filter((a) => a.priority === 'Medium' && a.status === 'pending').length,
    Low: allApprovals.filter((a) => a.priority === 'Low' && a.status === 'pending').length,
  }

  // Get approvals by status
  const byStatus = {
    pending: pendingApprovals,
    approved: approvedCount,
    rejected: rejectedCount,
    expired: allApprovals.filter((a) => a.status === 'expired').length,
  }

  // Get recent trend (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentApprovals = allApprovals.filter((a) => new Date(a.requestedAt) >= thirtyDaysAgo)

  const recentCompleted = recentApprovals.filter((a) => a.completedAt).length
  const recentPending = recentApprovals.filter((a) => a.status === 'pending').length

  return data({
    metrics: {
      totalApprovals,
      pendingApprovals,
      approvedCount,
      rejectedCount,
      avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10, // Round to 1 decimal
      completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
      byPriority,
      byStatus,
      recent: {
        total: recentApprovals.length,
        completed: recentCompleted,
        pending: recentPending,
      },
    },
  })
}
