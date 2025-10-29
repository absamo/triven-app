import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { auth } from '~/app/lib/auth.server'
import {
  addApprovalComment,
  approveRequest,
  getApprovalRequests,
} from '~/app/services/workflow.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.companyId) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const assignedTo = url.searchParams.get('assignedTo')
  const assignedRole = url.searchParams.get('assignedRole')
  const entityType = url.searchParams.get('entityType')
  const priority = url.searchParams.get('priority')

  const filters = {
    ...(status && { status }),
    ...(assignedTo && { assignedTo }),
    ...(assignedRole && { assignedRole }),
    ...(entityType && { entityType }),
    ...(priority && { priority }),
    currentUserId: session.user.id,
    ...(session.user.roleId && { currentUserRoleId: session.user.roleId }),
  }

  const approvalRequests = await getApprovalRequests(session.user.companyId, filters)

  return new Response(JSON.stringify({ approvalRequests }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session?.user?.id) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const action = formData.get('action')

  switch (action) {
    case 'approve': {
      const requestId = formData.get('requestId') as string
      const status = formData.get('status') as string
      const decisionReason = formData.get('decisionReason') as string
      const notes = formData.get('notes') as string

      if (!requestId || !status) {
        throw new Response('Missing required fields', { status: 400 })
      }

      // Only allow simplified statuses: approved, rejected, reopen
      if (!['approved', 'rejected', 'reopen'].includes(status)) {
        throw new Response('Invalid status', { status: 400 })
      }

      const approvedRequest = await approveRequest(requestId, session.user.id, {
        status,
        decisionReason: decisionReason || undefined,
        notes: notes || undefined,
      })

      return new Response(JSON.stringify({ success: true, approvalRequest: approvedRequest }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    case 'add_comment': {
      const requestId = formData.get('requestId') as string
      const comment = formData.get('comment') as string
      const isInternal = formData.get('isInternal') === 'true'

      if (!requestId || !comment) {
        throw new Response('Missing required fields', { status: 400 })
      }

      const newComment = await addApprovalComment(requestId, session.user.id, comment, isInternal)

      return new Response(JSON.stringify({ success: true, comment: newComment }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    default:
      throw new Response('Invalid action', { status: 400 })
  }
}
