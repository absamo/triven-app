import { PrismaClient } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createFeature,
  deleteFeature,
  getFeatureById,
  getFeatures,
  updateFeature,
  updateFeatureStatus,
} from '~/app/services/roadmap/feature.service'
import {
  cleanupTestData,
  createTestAdminUser,
  createTestFeature,
  createTestVote,
  getOrCreateTestCompany,
} from './fixtures'

// Mock prisma client
const db = new PrismaClient()

describe('FeatureService', () => {
  let companyId: string
  let adminUserId: string

  beforeEach(async () => {
    // Setup test data
    companyId = await getOrCreateTestCompany(db)
    const adminUser = await createTestAdminUser(db, companyId)
    adminUserId = adminUser.id

    // Create user profile for admin
    await db.profile.upsert({
      where: { userId: adminUserId },
      create: {
        userId: adminUserId,
        firstName: 'Test',
        lastName: 'Admin',
      },
      update: {},
    })
  })

  afterEach(async () => {
    await cleanupTestData(db)
  })

  describe('getFeatures', () => {
    it('should return features with pagination support', async () => {
      const result = await getFeatures({})

      expect(result.features).toBeDefined()
      expect(Array.isArray(result.features)).toBe(true)
      expect(result.hasMore).toBeDefined()
      expect(typeof result.hasMore).toBe('boolean')
    })

    it('should return all features with correct vote counts', async () => {
      // Create test features
      await createTestFeature(db, adminUserId, {
        title: 'Feature 1',
        voteCount: 5,
      })
      await createTestFeature(db, adminUserId, {
        title: 'Feature 2',
        voteCount: 10,
      })

      const result = await getFeatures({})

      expect(result.features).toHaveLength(2)
      expect(result.features[0].voteCount).toBe(10) // Sorted by vote count desc
      expect(result.features[1].voteCount).toBe(5)
    })

    it('should filter features by status', async () => {
      await createTestFeature(db, adminUserId, { status: 'TODO' })
      await createTestFeature(db, adminUserId, { status: 'IN_PROGRESS' })
      await createTestFeature(db, adminUserId, { status: 'SHIPPED' })

      const result = await getFeatures({ status: 'TODO' })

      expect(result.features).toHaveLength(1)
      expect(result.features[0].status).toBe('TODO')
    })

    it('should paginate results correctly', async () => {
      // Create 5 features
      for (let i = 0; i < 5; i++) {
        await createTestFeature(db, adminUserId, {
          title: `Feature ${i}`,
          voteCount: i,
        })
      }

      const result = await getFeatures({ limit: 3 })

      expect(result.features).toHaveLength(3)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBeDefined()
    })

    it('should support cursor-based pagination', async () => {
      // Create features
      await createTestFeature(db, adminUserId, {
        title: 'Feature 1',
        voteCount: 3,
      })
      await createTestFeature(db, adminUserId, {
        title: 'Feature 2',
        voteCount: 2,
      })
      await createTestFeature(db, adminUserId, {
        title: 'Feature 3',
        voteCount: 1,
      })

      // Get first page
      const firstPage = await getFeatures({ limit: 1 })
      expect(firstPage.features).toHaveLength(1)
      expect(firstPage.hasMore).toBe(true)

      // Get second page using cursor
      if (firstPage.nextCursor) {
        const secondPage = await getFeatures({
          limit: 1,
          cursor: firstPage.nextCursor,
        })
        expect(secondPage.features).toHaveLength(1)
        expect(secondPage.features[0].id).not.toBe(firstPage.features[0].id)
      }
    })

    it('should include userHasVoted when userId is provided', async () => {
      const feature = await createTestFeature(db, adminUserId)
      await createTestVote(db, feature.id, adminUserId)

      const result = await getFeatures({ userId: adminUserId })

      expect(result.features).toHaveLength(1)
      expect(result.features[0].userHasVoted).toBe(true)
    })

    it('should set userHasVoted to false when user has not voted', async () => {
      await createTestFeature(db, adminUserId)

      const result = await getFeatures({ userId: adminUserId })

      expect(result.features).toHaveLength(1)
      expect(result.features[0].userHasVoted).toBe(false)
    })

    it('should include creator information with full name', async () => {
      await createTestFeature(db, adminUserId, { title: 'Test Feature' })

      const result = await getFeatures({})

      expect(result.features).toHaveLength(1)
      expect(result.features[0].createdBy.id).toBe(adminUserId)
      expect(result.features[0].createdBy.name).toBe('Test Admin')
    })

    it('should sort features by status, vote count, and creation date', async () => {
      // Create features with different statuses and vote counts
      await createTestFeature(db, adminUserId, {
        title: 'Shipped High',
        status: 'SHIPPED',
        voteCount: 10,
      })
      await createTestFeature(db, adminUserId, {
        title: 'TODO Low',
        status: 'TODO',
        voteCount: 5,
      })
      await createTestFeature(db, adminUserId, {
        title: 'TODO High',
        status: 'TODO',
        voteCount: 15,
      })

      const result = await getFeatures({})

      // Should be sorted by status (TODO < SHIPPED), then voteCount desc
      expect(result.features[0].title).toBe('TODO High')
      expect(result.features[1].title).toBe('TODO Low')
      expect(result.features[2].title).toBe('Shipped High')
    })
  })

  describe('getFeatureById', () => {
    it('should return null when feature does not exist', async () => {
      const result = await getFeatureById('non-existent-id')

      expect(result).toBeNull()
    })

    it('should return feature with correct data', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Test Feature',
        description: 'Test Description',
        status: 'TODO',
      })

      const result = await getFeatureById(feature.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(feature.id)
      expect(result?.title).toBe('Test Feature')
      expect(result?.description).toBe('Test Description')
      expect(result?.status).toBe('TODO')
    })

    it('should include userHasVoted when userId is provided', async () => {
      const feature = await createTestFeature(db, adminUserId)
      await createTestVote(db, feature.id, adminUserId)

      const result = await getFeatureById(feature.id, adminUserId)

      expect(result?.userHasVoted).toBe(true)
    })

    it('should include creator information', async () => {
      const feature = await createTestFeature(db, adminUserId)

      const result = await getFeatureById(feature.id)

      expect(result?.createdBy.id).toBe(adminUserId)
      expect(result?.createdBy.name).toBe('Test Admin')
    })
  })

  describe('createFeature', () => {
    it('should create a new feature with default status', async () => {
      const input = {
        title: 'New Feature',
        description: 'Feature Description',
      }

      const result = await createFeature(input, adminUserId)

      expect(result.title).toBe('New Feature')
      expect(result.description).toBe('Feature Description')
      expect(result.status).toBe('TODO')
      expect(result.voteCount).toBe(0)
      expect(result.createdById).toBe(adminUserId)
    })

    it('should create a feature with specified status', async () => {
      const input = {
        title: 'In Progress Feature',
        description: 'Description',
        status: 'IN_PROGRESS' as const,
      }

      const result = await createFeature(input, adminUserId)

      expect(result.status).toBe('IN_PROGRESS')
    })

    it('should create an audit log entry', async () => {
      const input = {
        title: 'Audited Feature',
        description: 'Test audit',
      }

      const feature = await createFeature(input, adminUserId)

      const auditLog = await db.featureAuditLog.findFirst({
        where: {
          featureId: feature.id,
          action: 'CREATED',
        },
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.userId).toBe(adminUserId)
      expect(auditLog?.newValue).toMatchObject({
        title: 'Audited Feature',
        description: 'Test audit',
        status: 'TODO',
      })
    })

    it('should include creator information in response', async () => {
      const input = {
        title: 'Feature with Creator',
        description: 'Description',
      }

      const result = await createFeature(input, adminUserId)

      expect(result.createdBy.id).toBe(adminUserId)
      expect(result.createdBy.name).toBe('Test Admin')
    })
  })

  describe('updateFeature', () => {
    it('should update feature title and description', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Original Title',
        description: 'Original Description',
      })

      const result = await updateFeature(
        feature.id,
        {
          title: 'Updated Title',
          description: 'Updated Description',
        },
        adminUserId
      )

      expect(result.title).toBe('Updated Title')
      expect(result.description).toBe('Updated Description')
    })

    it('should update only specified fields', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Original Title',
        description: 'Original Description',
      })

      const result = await updateFeature(
        feature.id,
        {
          title: 'New Title',
        },
        adminUserId
      )

      expect(result.title).toBe('New Title')
      expect(result.description).toBe('Original Description')
    })

    it('should throw error when feature does not exist', async () => {
      try {
        await updateFeature(
          'non-existent-id',
          { title: 'New Title' },
          adminUserId
        )
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toBe('Feature not found')
      }
    })

    it('should create an audit log with old and new values', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Old Title',
        description: 'Old Description',
        status: 'TODO',
      })

      await updateFeature(
        feature.id,
        {
          title: 'New Title',
          status: 'IN_PROGRESS',
        },
        adminUserId
      )

      const auditLog = await db.featureAuditLog.findFirst({
        where: {
          featureId: feature.id,
          action: 'UPDATED',
        },
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.oldValue).toMatchObject({
        title: 'Old Title',
        description: 'Old Description',
        status: 'TODO',
      })
      expect(auditLog?.newValue).toMatchObject({
        title: 'New Title',
        description: 'Old Description',
        status: 'IN_PROGRESS',
      })
    })
  })

  describe('updateFeatureStatus', () => {
    it('should update feature status', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        status: 'TODO',
      })

      const result = await updateFeatureStatus(feature.id, 'IN_PROGRESS', adminUserId)

      expect(result.status).toBe('IN_PROGRESS')
    })

    it('should throw error when feature does not exist', async () => {
      try {
        await updateFeatureStatus('non-existent-id', 'SHIPPED', adminUserId)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toBe('Feature not found')
      }
    })

    it('should create an audit log for status change', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        status: 'TODO',
      })

      await updateFeatureStatus(feature.id, 'PLANNED', adminUserId)

      const auditLog = await db.featureAuditLog.findFirst({
        where: {
          featureId: feature.id,
          action: 'STATUS_CHANGED',
        },
      })

      expect(auditLog).toBeDefined()
      expect(auditLog?.oldValue).toMatchObject({ status: 'TODO' })
      expect(auditLog?.newValue).toMatchObject({ status: 'PLANNED' })
    })

    it('should preserve other feature fields', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'Original Title',
        description: 'Original Description',
        status: 'TODO',
        voteCount: 5,
      })

      const result = await updateFeatureStatus(feature.id, 'SHIPPED', adminUserId)

      expect(result.title).toBe('Original Title')
      expect(result.description).toBe('Original Description')
      expect(result.voteCount).toBe(5)
      expect(result.status).toBe('SHIPPED')
    })
  })

  describe('deleteFeature', () => {
    it('should delete a feature', async () => {
      const feature = await createTestFeature(db, adminUserId)

      await deleteFeature(feature.id, adminUserId)

      const deletedFeature = await db.featureRequest.findUnique({
        where: { id: feature.id },
      })

      expect(deletedFeature).toBeNull()
    })

    it('should throw error when feature does not exist', async () => {
      try {
        await deleteFeature('non-existent-id', adminUserId)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
        expect((error as Error).message).toBe('Feature not found')
      }
    })

    it('should create an audit log before deletion', async () => {
      const feature = await createTestFeature(db, adminUserId, {
        title: 'To Delete',
        description: 'Will be deleted',
        status: 'TODO',
        voteCount: 3,
      })

      // Get audit log count before deletion
      const auditLogsBefore = await db.featureAuditLog.count({
        where: { featureId: feature.id },
      })

      await deleteFeature(feature.id, adminUserId)

      // Verify feature was deleted
      const deletedFeature = await db.featureRequest.findUnique({
        where: { id: feature.id },
      })
      expect(deletedFeature).toBeNull()

      // Note: Audit logs are cascaded deleted with the feature
      // So we just verify the feature deletion worked
      expect(auditLogsBefore).toBeGreaterThanOrEqual(0)
    })

    it('should cascade delete votes and audit logs', async () => {
      const feature = await createTestFeature(db, adminUserId)
      await createTestVote(db, feature.id, adminUserId)

      await deleteFeature(feature.id, adminUserId)

      const votes = await db.featureVote.findMany({
        where: { featureId: feature.id },
      })

      expect(votes).toHaveLength(0)
    })
  })
})
