import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../db.server'
import { auditService } from '../../services/audit.server'

describe('auditService', () => {
  const mockUserId = 'user123'
  const mockUserName = 'Test User'
  const mockProductId = 'prod123'

  beforeEach(async () => {
    // Clean up audit events before each test
    await prisma.auditEvent.deleteMany({})
  })

  describe('logCreate', () => {
    it('should create audit event for product creation', async () => {
      const productData = { name: 'Test Product', sku: 'TEST-001' }

      const event = await auditService.logCreate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        productData
      )

      expect(event.eventType).toBe('create')
      expect(event.beforeSnapshot).toBeNull()
      expect(event.afterSnapshot).toEqual(productData)
      expect(event.changedFields).toEqual([])
      expect(event.userId).toBe(mockUserId)
      expect(event.userName).toBe(mockUserName)
    })
  })

  describe('logUpdate', () => {
    it('should detect and log field changes', async () => {
      const before = { name: 'Old Name', price: 10, sku: 'TEST-001' }
      const after = { name: 'New Name', price: 15, sku: 'TEST-001' }

      const event = await auditService.logUpdate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        before,
        after
      )

      expect(event?.eventType).toBe('update')
      expect(event?.changedFields).toEqual(expect.arrayContaining(['name', 'price']))
      expect(event?.changedFields).not.toContain('sku')
      expect(event?.beforeSnapshot).toEqual(before)
      expect(event?.afterSnapshot).toEqual(after)
    })

    it('should return null when no fields changed', async () => {
      const data = { name: 'Same', price: 10 }

      const event = await auditService.logUpdate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        data,
        data
      )

      expect(event).toBeNull()
    })

    it('should skip system fields like createdAt and updatedAt', async () => {
      const before = {
        name: 'Product',
        price: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      const after = {
        name: 'Product',
        price: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02', // Changed but should be ignored
      }

      const event = await auditService.logUpdate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        before,
        after
      )

      expect(event).toBeNull() // No changes to track
    })
  })

  describe('logDelete', () => {
    it('should create audit event for product deletion', async () => {
      const productData = { name: 'Deleted Product', sku: 'DEL-001' }

      const event = await auditService.logDelete(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        productData
      )

      expect(event.eventType).toBe('delete')
      expect(event.beforeSnapshot).toEqual(productData)
      expect(event.afterSnapshot).toBeNull()
      expect(event.changedFields).toEqual([])
    })
  })

  describe('detectChangedFields', () => {
    it('should detect simple value changes', () => {
      const before = { name: 'Old', price: 10 }
      const after = { name: 'New', price: 10 }

      const changed = auditService.detectChangedFields(before, after)

      expect(changed).toEqual(['name'])
    })

    it('should detect added fields', () => {
      const before = { name: 'Product' }
      const after = { name: 'Product', price: 10 }

      const changed = auditService.detectChangedFields(before, after)

      expect(changed).toContain('price')
    })

    it('should detect removed fields', () => {
      const before = { name: 'Product', price: 10 }
      const after = { name: 'Product' }

      const changed = auditService.detectChangedFields(before, after)

      expect(changed).toContain('price')
    })
  })
})
