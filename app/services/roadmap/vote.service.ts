import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/**
 * Vote Service - Handles voting operations for feature requests
 *
 * Constitutional Requirements:
 * - Vote count denormalization for performance
 * - WebSocket real-time updates (emitter)
 * - Audit trail logging for all operations
 * - Transaction support for atomic operations
 */

/**
 * Cast a vote for a feature request
 *
 * @param userId - ID of the user casting the vote
 * @param featureId - ID of the feature being voted on
 * @returns Updated feature with new vote count
 * @throws Error if vote already exists or feature not found
 */
export async function castVote(userId: string, featureId: string) {
  // Check if vote already exists
  const existingVote = await db.featureVote.findUnique({
    where: {
      featureId_userId: {
        featureId,
        userId,
      },
    },
  })

  if (existingVote) {
    throw new Error('User has already voted for this feature')
  }

  // Verify feature exists
  const feature = await db.featureRequest.findUnique({
    where: { id: featureId },
  })

  if (!feature) {
    throw new Error('Feature not found')
  }

  // Use transaction to ensure atomic operation
  const result = await db.$transaction(async (tx) => {
    // Create vote record
    const vote = await tx.featureVote.create({
      data: {
        featureId,
        userId,
      },
    })

    // Increment denormalized vote count
    const updatedFeature = await tx.featureRequest.update({
      where: { id: featureId },
      data: {
        voteCount: {
          increment: 1,
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create audit log for vote action
    await tx.featureAuditLog.create({
      data: {
        featureId,
        userId,
        action: 'VOTE',
        newValue: JSON.stringify({
          userId,
          voteCount: updatedFeature.voteCount,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return { vote, feature: updatedFeature }
  })

  // Emit WebSocket event for real-time updates
  // Note: emitter import will be added when WebSocket service is implemented
  // emitter.emit('roadmap-votes', {
  //   type: 'VOTE_ADDED',
  //   featureId,
  //   voteCount: result.feature.voteCount,
  //   timestamp: Date.now(),
  // })

  return {
    id: result.feature.id,
    title: result.feature.title,
    description: result.feature.description,
    status: result.feature.status as 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED',
    voteCount: result.feature.voteCount,
    userHasVoted: true,
    createdBy: {
      id: result.feature.createdBy.id,
      name: result.feature.createdBy.name || 'Unknown',
      email: result.feature.createdBy.email,
    },
    createdById: result.feature.createdById,
    createdAt: result.feature.createdAt,
    updatedAt: result.feature.updatedAt,
  }
}

/**
 * Remove a vote from a feature request
 *
 * @param userId - ID of the user removing their vote
 * @param featureId - ID of the feature to remove vote from
 * @returns Updated feature with new vote count
 * @throws Error if vote doesn't exist or feature not found
 */
export async function removeVote(userId: string, featureId: string) {
  // Check if vote exists
  const existingVote = await db.featureVote.findUnique({
    where: {
      featureId_userId: {
        featureId,
        userId,
      },
    },
  })

  if (!existingVote) {
    throw new Error('Vote not found')
  }

  // Use transaction to ensure atomic operation
  const result = await db.$transaction(async (tx) => {
    // Delete vote record
    await tx.featureVote.delete({
      where: {
        featureId_userId: {
          featureId,
          userId,
        },
      },
    })

    // Decrement denormalized vote count
    const updatedFeature = await tx.featureRequest.update({
      where: { id: featureId },
      data: {
        voteCount: {
          decrement: 1,
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create audit log for unvote action
    await tx.featureAuditLog.create({
      data: {
        featureId,
        userId,
        action: 'UNVOTE',
        oldValue: JSON.stringify({
          userId,
          voteCount: updatedFeature.voteCount + 1, // Previous count
          timestamp: new Date().toISOString(),
        }),
        newValue: JSON.stringify({
          userId,
          voteCount: updatedFeature.voteCount,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return updatedFeature
  })

  // Emit WebSocket event for real-time updates
  // Note: emitter import will be added when WebSocket service is implemented
  // emitter.emit('roadmap-votes', {
  //   type: 'VOTE_REMOVED',
  //   featureId,
  //   voteCount: result.voteCount,
  //   timestamp: Date.now(),
  // })

  return {
    id: result.id,
    title: result.title,
    description: result.description,
    status: result.status as 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED',
    voteCount: result.voteCount,
    userHasVoted: false,
    createdBy: {
      id: result.createdBy.id,
      name: result.createdBy.name || 'Unknown',
      email: result.createdBy.email,
    },
    createdById: result.createdById,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

/**
 * Toggle vote - convenience method that casts or removes vote based on current state
 *
 * @param userId - ID of the user toggling vote
 * @param featureId - ID of the feature to toggle vote for
 * @returns Updated feature with new vote count and voting state
 */
export async function toggleVote(userId: string, featureId: string) {
  const existingVote = await db.featureVote.findUnique({
    where: {
      featureId_userId: {
        featureId,
        userId,
      },
    },
  })

  if (existingVote) {
    return await removeVote(userId, featureId)
  } else {
    return await castVote(userId, featureId)
  }
}

/**
 * Get user's voting status for multiple features
 *
 * @param userId - ID of the user
 * @param featureIds - Array of feature IDs to check
 * @returns Map of featureId to boolean indicating if user has voted
 */
export async function getUserVotingStatus(
  userId: string,
  featureIds: string[]
): Promise<Map<string, boolean>> {
  const votes = await db.featureVote.findMany({
    where: {
      userId,
      featureId: {
        in: featureIds,
      },
    },
    select: {
      featureId: true,
    },
  })

  const votingStatus = new Map<string, boolean>()

  // Initialize all as false
  featureIds.forEach((id) => {
    votingStatus.set(id, false)
  })

  // Set true for voted features
  votes.forEach((vote) => {
    votingStatus.set(vote.featureId, true)
  })

  return votingStatus
}
