import type { FeatureStatus } from '@prisma/client'
import { prisma } from '~/app/db.server'
import type {
  CreateFeatureInput,
  FeatureWithVotes,
  PaginatedFeatures,
  UpdateFeatureInput,
} from '~/app/lib/roadmap/types'

/**
 * Get all features with optional filtering and pagination
 */
export async function getFeatures(options: {
  status?: FeatureStatus
  limit?: number
  cursor?: string
  userId?: string // To check if user has voted
}): Promise<PaginatedFeatures> {
  const limit = options.limit || 30

  const where = options.status ? { status: options.status } : {}

  // Build cursor condition
  const cursorCondition = options.cursor
    ? {
        id: options.cursor,
      }
    : undefined

  const features = await prisma.featureRequest.findMany({
    where,
    take: limit + 1, // Take one extra to check if there are more
    ...(cursorCondition && {
      cursor: cursorCondition,
      skip: 1, // Skip the cursor
    }),
    orderBy: [{ status: 'asc' }, { voteCount: 'desc' }, { createdAt: 'desc' }],
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
      ...(options.userId && {
        votes: {
          where: {
            userId: options.userId,
          },
          select: {
            id: true,
          },
        },
      }),
    },
  })

  // Check if there are more results
  const hasMore = features.length > limit
  const paginatedFeatures = hasMore ? features.slice(0, limit) : features
  const nextCursor = hasMore ? paginatedFeatures[limit - 1]?.id : null

  // Transform to FeatureWithVotes
  const featuresWithVotes: FeatureWithVotes[] = paginatedFeatures.map((feature) => ({
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    voteCount: feature.voteCount,
    commentCount: feature._count?.comments || 0,
    createdById: feature.createdById,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
    userHasVoted: options.userId ? (feature.votes as { id: string }[])?.length > 0 : undefined,
    createdBy: {
      id: feature.createdBy.id,
      email: feature.createdBy.email,
      name: feature.createdBy.profile
        ? `${feature.createdBy.profile.firstName} ${feature.createdBy.profile.lastName}`.trim()
        : null,
    },
  }))

  return {
    features: featuresWithVotes,
    nextCursor,
    hasMore,
  }
}

/**
 * Get a single feature by ID
 */
export async function getFeatureById(
  featureId: string,
  userId?: string
): Promise<FeatureWithVotes | null> {
  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureId },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      ...(userId && {
        votes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
      }),
    },
  })

  if (!feature) {
    return null
  }

  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    voteCount: feature.voteCount,
    createdById: feature.createdById,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
    userHasVoted: userId ? (feature.votes as { id: string }[])?.length > 0 : undefined,
    createdBy: {
      id: feature.createdBy.id,
      email: feature.createdBy.email,
      name: feature.createdBy.profile
        ? `${feature.createdBy.profile.firstName} ${feature.createdBy.profile.lastName}`.trim()
        : null,
    },
  }
}

/**
 * Create a new feature request (admin only)
 */
export async function createFeature(
  input: CreateFeatureInput,
  createdById: string
): Promise<FeatureWithVotes> {
  const feature = await prisma.featureRequest.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status || 'TODO',
      createdById,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  // Log creation
  await prisma.featureAuditLog.create({
    data: {
      featureId: feature.id,
      userId: createdById,
      action: 'CREATED',
      newValue: {
        title: feature.title,
        description: feature.description,
        status: feature.status,
      },
    },
  })

  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    voteCount: feature.voteCount,
    createdById: feature.createdById,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
    createdBy: {
      id: feature.createdBy.id,
      email: feature.createdBy.email,
      name: feature.createdBy.profile
        ? `${feature.createdBy.profile.firstName} ${feature.createdBy.profile.lastName}`.trim()
        : null,
    },
  }
}

/**
 * Update feature details (admin only)
 */
export async function updateFeature(
  featureId: string,
  input: UpdateFeatureInput,
  userId: string
): Promise<FeatureWithVotes> {
  const existingFeature = await prisma.featureRequest.findUnique({
    where: { id: featureId },
  })

  if (!existingFeature) {
    throw new Error('Feature not found')
  }

  const feature = await prisma.featureRequest.update({
    where: { id: featureId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.status && { status: input.status }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  // Log update
  await prisma.featureAuditLog.create({
    data: {
      featureId: feature.id,
      userId,
      action: 'UPDATED',
      oldValue: {
        title: existingFeature.title,
        description: existingFeature.description,
        status: existingFeature.status,
      },
      newValue: {
        title: feature.title,
        description: feature.description,
        status: feature.status,
      },
    },
  })

  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    voteCount: feature.voteCount,
    createdById: feature.createdById,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
    createdBy: {
      id: feature.createdBy.id,
      email: feature.createdBy.email,
      name: feature.createdBy.profile
        ? `${feature.createdBy.profile.firstName} ${feature.createdBy.profile.lastName}`.trim()
        : null,
    },
  }
}

/**
 * Update feature status (for drag-and-drop)
 */
export async function updateFeatureStatus(
  featureId: string,
  status: FeatureStatus,
  userId: string
): Promise<FeatureWithVotes> {
  const existingFeature = await prisma.featureRequest.findUnique({
    where: { id: featureId },
  })

  if (!existingFeature) {
    throw new Error('Feature not found')
  }

  const feature = await prisma.featureRequest.update({
    where: { id: featureId },
    data: { status },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  // Log status change
  await prisma.featureAuditLog.create({
    data: {
      featureId: feature.id,
      userId,
      action: 'STATUS_CHANGED',
      oldValue: {
        status: existingFeature.status,
      },
      newValue: {
        status: feature.status,
      },
    },
  })

  return {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    status: feature.status,
    voteCount: feature.voteCount,
    createdById: feature.createdById,
    createdAt: feature.createdAt,
    updatedAt: feature.updatedAt,
    createdBy: {
      id: feature.createdBy.id,
      email: feature.createdBy.email,
      name: feature.createdBy.profile
        ? `${feature.createdBy.profile.firstName} ${feature.createdBy.profile.lastName}`.trim()
        : null,
    },
  }
}

/**
 * Delete a feature (admin only)
 */
export async function deleteFeature(featureId: string, userId: string): Promise<void> {
  const feature = await prisma.featureRequest.findUnique({
    where: { id: featureId },
  })

  if (!feature) {
    throw new Error('Feature not found')
  }

  // Log deletion before deleting
  await prisma.featureAuditLog.create({
    data: {
      featureId: feature.id,
      userId,
      action: 'DELETED',
      oldValue: {
        title: feature.title,
        description: feature.description,
        status: feature.status,
        voteCount: feature.voteCount,
      },
    },
  })

  // Delete feature (cascade will delete votes and audit logs)
  await prisma.featureRequest.delete({
    where: { id: featureId },
  })
}

/**
 * Get comments for a feature
 */
export async function getFeatureComments(featureId: string) {
  const comments = await prisma.featureComment.findMany({
    where: { featureId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  return comments.map((comment) => ({
    id: comment.id,
    featureId: comment.featureId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: {
      id: comment.user.id,
      email: comment.user.email,
      name: comment.user.profile
        ? `${comment.user.profile.firstName} ${comment.user.profile.lastName}`.trim()
        : null,
    },
  }))
}

/**
 * Create a comment on a feature
 */
export async function createFeatureComment(featureId: string, userId: string, content: string) {
  const comment = await prisma.featureComment.create({
    data: {
      featureId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  // Log comment creation in audit log
  await prisma.featureAuditLog.create({
    data: {
      featureId,
      userId,
      action: 'COMMENT_ADDED',
      newValue: {
        commentId: comment.id,
        content: comment.content,
      },
    },
  })

  return {
    id: comment.id,
    featureId: comment.featureId,
    userId: comment.userId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: {
      id: comment.user.id,
      email: comment.user.email,
      name: comment.user.profile
        ? `${comment.user.profile.firstName} ${comment.user.profile.lastName}`.trim()
        : null,
    },
  }
}
