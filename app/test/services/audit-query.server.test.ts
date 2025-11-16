import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../db.server'
import { auditQueryService } from '../../services/audit-query.server'

describe('auditQueryService', () => {
  const mockProductId = 'prod123'
  const mockUserId = 'user123'

  beforeEach(async () => {
    await prisma.auditEvent.deleteMany({})

    // Create test audit events
    for (let i = 0; i < 25; i++) {
      await prisma.auditEvent.create({
        data: {
          entityType: 'product',
          entityId: mockProductId,
          eventType: 'update',
          userId: `user${i}`,
          userName: `User ${i}`,
          changedFields: ['name'],
          beforeSnapshot: { name: `Old ${i}` },
          afterSnapshot: { name: `New ${i}` },
        },
      })
    }
  })

  afterEach(async () => {
    await prisma.auditEvent.deleteMany({})
  })

  describe('getAuditHistory', () => {
    it('should return paginated results', async () => {
      const result = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 10,
      })

      expect(result.items).toHaveLength(10)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBeTruthy()
      expect(result.total).toBe(25)
    })

    it('should support cursor pagination', async () => {
      const firstPage = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 10,
      })

      const secondPage = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 10,
        cursor: firstPage.nextCursor!,
      })

      expect(secondPage.items).toHaveLength(10)
      expect(firstPage.items[0].id).not.toBe(secondPage.items[0].id)
    })

    it('should indicate when there are no more results', async () => {
      const result = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 30, // More than the 25 we created
      })

      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('should filter by userId', async () => {
      const result = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        userId: 'user5',
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].userId).toBe('user5')
    })

    it('should filter by eventType', async () => {
      // Create a delete event
      await prisma.auditEvent.create({
        data: {
          entityType: 'product',
          entityId: mockProductId,
          eventType: 'delete',
          userId: mockUserId,
          userName: 'Test User',
          changedFields: [],
          beforeSnapshot: { name: 'Deleted Product' },
          afterSnapshot: null,
        },
      })

      const result = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        eventType: 'delete',
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].eventType).toBe('delete')
    })

    it('should filter by date range', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const result = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        startDate: yesterday,
        endDate: tomorrow,
      })

      expect(result.items.length).toBeGreaterThan(0)
      expect(result.total).toBeGreaterThan(0)
    })
  })
})
