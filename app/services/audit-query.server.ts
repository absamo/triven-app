import type { AuditEvent } from '@prisma/client'
import { prisma } from '../db.server'

interface GetAuditHistoryOptions {
  entityType: string
  entityId: string
  cursor?: string
  limit?: number
  startDate?: Date
  endDate?: Date
  userId?: string
  eventType?: 'create' | 'update' | 'delete' | 'duplicate'
}

interface AuditHistoryResult {
  items: AuditEvent[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

export const auditQueryService = {
  /**
   * Get paginated audit history for an entity
   */
  async getAuditHistory(options: GetAuditHistoryOptions): Promise<AuditHistoryResult> {
    const limit = options.limit ?? 20

    // Build where clause
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic where clause construction
    const where: any = {
      entityType: options.entityType,
      entityId: options.entityId,
    }

    if (options.startDate || options.endDate) {
      where.timestamp = {}
      if (options.startDate) where.timestamp.gte = options.startDate
      if (options.endDate) where.timestamp.lte = options.endDate
    }

    if (options.userId) {
      where.userId = options.userId
    }

    if (options.eventType) {
      where.eventType = options.eventType
    }

    // Get total count (for UI display)
    const total = await prisma.auditEvent.count({ where })

    // Fetch events with cursor pagination
    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit + 1, // Fetch one extra to check if more exist
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1, // Skip the cursor itself
      }),
    })

    const hasMore = events.length > limit
    const items = hasMore ? events.slice(0, limit) : events
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return {
      items,
      nextCursor,
      hasMore,
      total,
    }
  },
}
