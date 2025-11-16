import type { AuditEvent, Prisma } from '@prisma/client'
import { prisma } from '../db.server'

export type EventType = 'create' | 'update' | 'delete'
export type EntityType = 'product' // Extend with 'order', 'customer', etc.

interface CreateAuditOptions {
  entityType: EntityType
  entityId: string
  userId: string
  userName: string
  eventType: EventType
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
  changedFields?: string[]
  timestamp?: Date
}

/**
 * Core audit logging service
 *
 * Usage:
 *   await auditService.logCreate('product', productId, userId, userName, productData);
 *   await auditService.logUpdate('product', productId, userId, userName, oldData, newData);
 *   await auditService.logDelete('product', productId, userId, userName, productData);
 */
export const auditService = {
  /**
   * Log a creation event
   */
  async logCreate(
    entityType: EntityType,
    entityId: string,
    userId: string,
    userName: string,
    afterSnapshot: Record<string, unknown>
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      entityType,
      entityId,
      userId,
      userName,
      eventType: 'create',
      beforeSnapshot: null,
      afterSnapshot,
      changedFields: [],
    })
  },

  /**
   * Log an update event with field-level change detection
   */
  async logUpdate(
    entityType: EntityType,
    entityId: string,
    userId: string,
    userName: string,
    beforeSnapshot: Record<string, unknown>,
    afterSnapshot: Record<string, unknown>
  ): Promise<AuditEvent | null> {
    const changedFields = this.detectChangedFields(beforeSnapshot, afterSnapshot)

    // Skip logging if no fields actually changed
    if (changedFields.length === 0) {
      return null
    }

    return this.createAuditEvent({
      entityType,
      entityId,
      userId,
      userName,
      eventType: 'update',
      beforeSnapshot,
      afterSnapshot,
      changedFields,
    })
  },

  /**
   * Log a deletion event
   */
  async logDelete(
    entityType: EntityType,
    entityId: string,
    userId: string,
    userName: string,
    beforeSnapshot: Record<string, unknown>
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      entityType,
      entityId,
      userId,
      userName,
      eventType: 'delete',
      beforeSnapshot,
      afterSnapshot: null,
      changedFields: [],
    })
  },

  /**
   * Internal: Create audit event with error handling
   */
  async createAuditEvent(options: CreateAuditOptions): Promise<AuditEvent> {
    try {
      return await prisma.auditEvent.create({
        data: {
          entityType: options.entityType,
          entityId: options.entityId,
          userId: options.userId,
          userName: options.userName,
          eventType: options.eventType,
          timestamp: options.timestamp,
          beforeSnapshot:
            options.beforeSnapshot !== null
              ? (options.beforeSnapshot as Prisma.InputJsonValue)
              : undefined,
          afterSnapshot:
            options.afterSnapshot !== null
              ? (options.afterSnapshot as Prisma.InputJsonValue)
              : undefined,
          changedFields: options.changedFields ?? [],
        },
      })
    } catch (error) {
      // Log error but don't throw - audit failures shouldn't block operations
      console.error('[Audit Service] Failed to create audit event:', error)
      throw error // Re-throw for now, will be caught at service layer
    }
  },

  /**
   * Detect which fields changed between two snapshots
   */
  detectChangedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
    const changedFields: string[] = []
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
      // Skip system fields
      if (['createdAt', 'updatedAt'].includes(key)) continue

      const beforeValue = before[key]
      const afterValue = after[key]

      // Deep equality check (handles nested objects, dates, etc.)
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changedFields.push(key)
      }
    }

    return changedFields
  },
}
