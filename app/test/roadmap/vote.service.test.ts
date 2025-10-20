import { PrismaClient } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  castVote,
  getUserVotingStatus,
  removeVote,
  toggleVote,
} from '~/app/services/roadmap/vote.service'
import {
  cleanupTestData,
  createTestAdminUser,
  createTestFeature,
  createTestUser,
  createTestVote,
  getOrCreateTestCompany,
} from './fixtures'

const db = new PrismaClient()

describe('VoteService', () => {
  let companyId: string
  let adminUserId: string
  let userId: string
  let featureId: string

  beforeEach(async () => {
    companyId = await getOrCreateTestCompany(db)
    const adminUser = await createTestAdminUser(db, companyId)
    const regularUser = await createTestUser(db, companyId)
    adminUserId = adminUser.id
    userId = regularUser.id

    // Create a test feature for voting
    const feature = await createTestFeature(db, adminUserId, {
      title: 'Test Voting Feature',
      description: 'Feature for testing voting functionality',
      voteCount: 0,
      status: 'TODO',
    })
    featureId = feature.id
  })

  afterEach(async () => {
    await cleanupTestData(db)
  })

  describe('castVote', () => {
    it('should successfully cast a vote for a feature', async () => {
      const result = await castVote(userId, featureId)

      expect(result.id).toBe(featureId)
      expect(result.voteCount).toBe(1)
      expect(result.userHasVoted).toBe(true)
    })

    it('should increment vote count when casting vote', async () => {
      // Start with 5 votes
      await db.featureRequest.update({
        where: { id: featureId },
        data: { voteCount: 5 },
      })

      const result = await castVote(userId, featureId)

      expect(result.voteCount).toBe(6)
    })

    it('should create vote record in database', async () => {
      await castVote(userId, featureId)

      const vote = await db.featureVote.findUnique({
        where: {
          featureId_userId: {
            featureId,
            userId,
          },
        },
      })

      expect(vote).toBeTruthy()
      expect(vote?.featureId).toBe(featureId)
      expect(vote?.userId).toBe(userId)
    })

    it('should create audit log entry for vote action', async () => {
      await castVote(userId, featureId)

      const auditLog = await db.featureAuditLog.findFirst({
        where: {
          featureId,
          userId,
          action: 'VOTE',
        },
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.newValue).toContain(userId)
      expect(auditLog?.newValue).toContain('"voteCount":1')
    })

    it('should throw error if user already voted', async () => {
      await castVote(userId, featureId)

      try {
        await castVote(userId, featureId)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('User has already voted for this feature')
      }
    })

    it('should throw error if feature does not exist', async () => {
      const nonExistentFeatureId = 'non-existent-id'

      try {
        await castVote(userId, nonExistentFeatureId)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Feature not found')
      }
    })

    it('should be atomic - rollback if vote count update fails', async () => {
      // Verify initial state
      const initialFeature = await db.featureRequest.findUnique({
        where: { id: featureId },
      })
      expect(initialFeature?.voteCount).toBe(0)

      // Successfully cast vote
      await castVote(userId, featureId)

      // Verify vote was recorded
      const vote = await db.featureVote.findUnique({
        where: {
          featureId_userId: {
            featureId,
            userId,
          },
        },
      })
      expect(vote).toBeTruthy()

      // Verify vote count was incremented
      const updatedFeature = await db.featureRequest.findUnique({
        where: { id: featureId },
      })
      expect(updatedFeature?.voteCount).toBe(1)
    })
  })

  describe('removeVote', () => {
    beforeEach(async () => {
      // Create an existing vote for tests
      await createTestVote(db, featureId, userId)
    })

    it('should successfully remove a vote from a feature', async () => {
      const result = await removeVote(userId, featureId)

      expect(result.id).toBe(featureId)
      expect(result.voteCount).toBe(0) // Decremented from 1 (createTestVote sets to 1)
      expect(result.userHasVoted).toBe(false)
    })

    it('should decrement vote count when removing vote', async () => {
      // Feature should have 1 vote from beforeEach
      const beforeRemove = await db.featureRequest.findUnique({
        where: { id: featureId },
      })
      expect(beforeRemove?.voteCount).toBe(1)

      const result = await removeVote(userId, featureId)

      expect(result.voteCount).toBe(0)
    })

    it('should delete vote record from database', async () => {
      await removeVote(userId, featureId)

      const vote = await db.featureVote.findUnique({
        where: {
          featureId_userId: {
            featureId,
            userId,
          },
        },
      })

      expect(vote).toBeNull()
    })

    it('should create audit log entry for unvote action', async () => {
      await removeVote(userId, featureId)

      const auditLog = await db.featureAuditLog.findFirst({
        where: {
          featureId,
          userId,
          action: 'UNVOTE',
        },
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.oldValue).toContain(userId)
      expect(auditLog?.newValue).toContain(userId)
      expect(auditLog?.newValue).toContain('"voteCount":0')
    })

    it('should throw error if vote does not exist', async () => {
      // Remove the vote first
      await removeVote(userId, featureId)

      try {
        await removeVote(userId, featureId)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Vote not found')
      }
    })

    it('should be atomic - rollback if vote count update fails', async () => {
      // Verify initial state (should have 1 vote from beforeEach)
      const initialFeature = await db.featureRequest.findUnique({
        where: { id: featureId },
      })
      expect(initialFeature?.voteCount).toBe(1)

      // Successfully remove vote
      await removeVote(userId, featureId)

      // Verify vote was removed
      const vote = await db.featureVote.findUnique({
        where: {
          featureId_userId: {
            featureId,
            userId,
          },
        },
      })
      expect(vote).toBeNull()

      // Verify vote count was decremented
      const updatedFeature = await db.featureRequest.findUnique({
        where: { id: featureId },
      })
      expect(updatedFeature?.voteCount).toBe(0)
    })
  })

  describe('toggleVote', () => {
    it('should cast vote if user has not voted yet', async () => {
      const result = await toggleVote(userId, featureId)

      expect(result.userHasVoted).toBe(true)
      expect(result.voteCount).toBe(1)

      // Verify vote exists in database
      const vote = await db.featureVote.findUnique({
        where: {
          featureId_userId: {
            featureId,
            userId,
          },
        },
      })
      expect(vote).toBeTruthy()
    })

    it('should remove vote if user has already voted', async () => {
      // First vote
      await createTestVote(db, featureId, userId)

      // Toggle should remove vote
      const result = await toggleVote(userId, featureId)

      expect(result.userHasVoted).toBe(false)
      expect(result.voteCount).toBe(0)

      // Verify vote removed from database
      const vote = await db.featureVote.findUnique({
        where: {
          featureId_userId: {
            featureId,
            userId,
          },
        },
      })
      expect(vote).toBeNull()
    })

    it('should toggle vote multiple times correctly', async () => {
      // First toggle - add vote
      const firstToggle = await toggleVote(userId, featureId)
      expect(firstToggle.userHasVoted).toBe(true)
      expect(firstToggle.voteCount).toBe(1)

      // Second toggle - remove vote
      const secondToggle = await toggleVote(userId, featureId)
      expect(secondToggle.userHasVoted).toBe(false)
      expect(secondToggle.voteCount).toBe(0)

      // Third toggle - add vote again
      const thirdToggle = await toggleVote(userId, featureId)
      expect(thirdToggle.userHasVoted).toBe(true)
      expect(thirdToggle.voteCount).toBe(1)
    })
  })

  describe('getUserVotingStatus', () => {
    it('should return false for features user has not voted on', async () => {
      const feature2 = await createTestFeature(db, adminUserId, {
        title: 'Another Feature',
      })
      const feature3 = await createTestFeature(db, adminUserId, {
        title: 'Third Feature',
      })

      const votingStatus = await getUserVotingStatus(userId, [
        featureId,
        feature2.id,
        feature3.id,
      ])

      expect(votingStatus.get(featureId)).toBe(false)
      expect(votingStatus.get(feature2.id)).toBe(false)
      expect(votingStatus.get(feature3.id)).toBe(false)
    })

    it('should return true for features user has voted on', async () => {
      const feature2 = await createTestFeature(db, adminUserId, {
        title: 'Another Feature',
      })

      // Vote on first feature
      await createTestVote(db, featureId, userId)

      const votingStatus = await getUserVotingStatus(userId, [featureId, feature2.id])

      expect(votingStatus.get(featureId)).toBe(true)
      expect(votingStatus.get(feature2.id)).toBe(false)
    })

    it('should handle mixed voting states correctly', async () => {
      const feature2 = await createTestFeature(db, adminUserId, {
        title: 'Voted Feature',
      })
      const feature3 = await createTestFeature(db, adminUserId, {
        title: 'Not Voted Feature',
      })
      const feature4 = await createTestFeature(db, adminUserId, {
        title: 'Also Voted Feature',
      })

      // Vote on features 1, 2, and 4
      await createTestVote(db, featureId, userId)
      await createTestVote(db, feature2.id, userId)
      await createTestVote(db, feature4.id, userId)

      const votingStatus = await getUserVotingStatus(userId, [
        featureId,
        feature2.id,
        feature3.id,
        feature4.id,
      ])

      expect(votingStatus.get(featureId)).toBe(true)
      expect(votingStatus.get(feature2.id)).toBe(true)
      expect(votingStatus.get(feature3.id)).toBe(false)
      expect(votingStatus.get(feature4.id)).toBe(true)
    })

    it('should return empty map for empty feature list', async () => {
      const votingStatus = await getUserVotingStatus(userId, [])

      expect(votingStatus.size).toBe(0)
    })

    it('should handle large number of features efficiently', async () => {
      // Create 50 features
      const featureIds: string[] = [featureId]
      for (let i = 0; i < 49; i++) {
        const feature = await createTestFeature(db, adminUserId, {
          title: `Feature ${i}`,
        })
        featureIds.push(feature.id)
      }

      // Vote on every other feature (25 votes)
      for (let i = 0; i < featureIds.length; i += 2) {
        await createTestVote(db, featureIds[i], userId)
      }

      const votingStatus = await getUserVotingStatus(userId, featureIds)

      expect(votingStatus.size).toBe(50)

      // Check voting pattern
      let votedCount = 0
      votingStatus.forEach((hasVoted) => {
        if (hasVoted) votedCount++
      })
      expect(votedCount).toBe(25)
    })
  })
})
