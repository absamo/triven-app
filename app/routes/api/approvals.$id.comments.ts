import { type ActionFunctionArgs, data } from 'react-router'
import { z } from 'zod'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'
import { broadcastApprovalUpdate } from '~/app/services/approval-sse.server'

const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
  isInternal: z.boolean().optional().default(false),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw data({ message: 'Unauthorized' }, { status: 401 })
  }
  const user = session.user

  const { id: approvalId } = params
  if (!approvalId) {
    throw data({ message: 'Approval ID is required' }, { status: 400 })
  }

  // Verify approval exists and user has access
  const approval = await prisma.approvalRequest.findFirst({
    where: {
      id: approvalId,
      companyId: user.companyId || '',
    },
    select: {
      id: true,
      companyId: true,
      requestedBy: true,
      assignedTo: true,
      assignedRole: true,
    },
  })

  if (!approval) {
    throw data({ message: 'Approval request not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const commentData = {
    comment: formData.get('comment'),
    isInternal: formData.get('isInternal') === 'true',
  }

  const validation = createCommentSchema.safeParse(commentData)
  if (!validation.success) {
    throw data(
      { message: 'Validation failed', errors: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { comment: commentText, isInternal } = validation.data

  // Create the comment
  const comment = await prisma.approvalComment.create({
    data: {
      approvalRequestId: approvalId,
      authorId: user.id,
      comment: commentText,
      isInternal,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  // Broadcast SSE update to relevant users
  const targetUserIds = [approval.requestedBy]
  if (approval.assignedTo) {
    targetUserIds.push(approval.assignedTo)
  }

  // Don't notify the comment author
  const notifyUserIds = targetUserIds.filter((userId) => userId !== user.id)

  if (notifyUserIds.length > 0) {
    broadcastApprovalUpdate(
      {
        type: 'approval_commented',
        approvalId,
        data: {
          commentId: comment.id,
          comment: commentText,
          author: comment.author.name || comment.author.email,
          isInternal,
        },
      },
      approval.companyId,
      notifyUserIds
    )
  }

  return data({ comment }, { status: 201 })
}

// GET endpoint to fetch comments for an approval
export async function loader({ request, params }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw data({ message: 'Unauthorized' }, { status: 401 })
  }
  const user = session.user

  const { id: approvalId } = params
  if (!approvalId) {
    throw data({ message: 'Approval ID is required' }, { status: 400 })
  }

  // Verify approval exists and user has access
  const approval = await prisma.approvalRequest.findFirst({
    where: {
      id: approvalId,
      companyId: user.companyId || '',
    },
    select: {
      id: true,
    },
  })

  if (!approval) {
    throw data({ message: 'Approval request not found' }, { status: 404 })
  }

  const comments = await prisma.approvalComment.findMany({
    where: {
      approvalRequestId: approvalId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return data({ comments })
}
