/**
 * API Request and Response Schemas for Product Audit Timeline
 *
 * These schemas define the contract between frontend and backend using Zod
 * for runtime validation and TypeScript for compile-time type safety.
 */

import { z } from 'zod'

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * Event types supported by the audit system
 */
export const EventTypeSchema = z.enum(['create', 'update', 'delete'])
export type EventType = z.infer<typeof EventTypeSchema>

/**
 * Entity types that can be audited (extensible)
 */
export const EntityTypeSchema = z.enum(['product'])
export type EntityType = z.infer<typeof EntityTypeSchema>

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Query parameters for GET /api/audit/products/:productId
 */
export const GetAuditHistoryQuerySchema = z.object({
  cursor: z
    .string()
    .cuid()
    .optional()
    .describe('Cursor for pagination (ID of last event from previous page)'),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Maximum number of events to return per page'),

  startDate: z.string().datetime().optional().describe('Filter events after this date (ISO 8601)'),

  endDate: z.string().datetime().optional().describe('Filter events before this date (ISO 8601)'),

  userId: z.string().cuid().optional().describe('Filter events by user who performed the action'),

  eventType: EventTypeSchema.optional().describe('Filter by event type (create, update, delete)'),
})

export type GetAuditHistoryQuery = z.infer<typeof GetAuditHistoryQuerySchema>

/**
 * Path parameters for GET /api/audit/products/:productId
 */
export const GetAuditHistoryParamsSchema = z.object({
  productId: z.string().cuid().describe('Unique identifier of the product'),
})

export type GetAuditHistoryParams = z.infer<typeof GetAuditHistoryParamsSchema>

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Single audit event in the timeline
 */
export const AuditEventSchema = z.object({
  id: z.string().cuid().describe('Unique identifier for the audit event'),

  entityType: EntityTypeSchema.describe('Type of entity being tracked'),

  entityId: z.string().cuid().describe('Unique identifier of the tracked entity'),

  eventType: EventTypeSchema.describe('Type of change event'),

  userId: z.string().cuid().describe('Unique identifier of the user who performed the action'),

  userName: z
    .string()
    .describe('Name of the user who performed the action (preserved at time of change)'),

  timestamp: z.string().datetime().describe('When the action occurred (ISO 8601 format)'),

  changedFields: z
    .array(z.string())
    .default([])
    .describe('List of field names that changed (empty for create/delete)'),

  beforeSnapshot: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe('Full entity state before the change (null for create events)'),

  afterSnapshot: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe('Full entity state after the change (null for delete events)'),
})

export type AuditEvent = z.infer<typeof AuditEventSchema>

/**
 * Response for GET /api/audit/products/:productId
 */
export const AuditHistoryResponseSchema = z.object({
  items: z.array(AuditEventSchema).describe('List of audit events in reverse chronological order'),

  nextCursor: z
    .string()
    .cuid()
    .nullable()
    .describe('Cursor to use for fetching the next page (null if no more events)'),

  hasMore: z.boolean().describe('Indicates if more events are available after this page'),

  total: z.number().int().nonnegative().describe('Total number of audit events for this product'),
})

export type AuditHistoryResponse = z.infer<typeof AuditHistoryResponseSchema>

/**
 * Error response for all audit API endpoints
 */
export const ErrorResponseSchema = z.object({
  error: z.string().describe('Error type or category'),

  message: z.string().describe('Human-readable error message'),

  statusCode: z.number().int().min(400).max(599).describe('HTTP status code'),

  details: z.record(z.string(), z.unknown()).optional().describe('Additional error details'),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// ============================================================================
// Internal Service Schemas (not exposed via API)
// ============================================================================

/**
 * Input for creating a new audit event (used by audit service)
 */
export const CreateAuditEventInputSchema = z
  .object({
    entityType: EntityTypeSchema,
    entityId: z.string().cuid(),
    eventType: EventTypeSchema,
    userId: z.string().cuid(),
    userName: z.string(),
    changedFields: z.array(z.string()).default([]),
    beforeSnapshot: z.record(z.string(), z.unknown()).nullable(),
    afterSnapshot: z.record(z.string(), z.unknown()).nullable(),
  })
  .refine(
    (data) => {
      // Validation: create events must have null beforeSnapshot and non-null afterSnapshot
      if (data.eventType === 'create') {
        return data.beforeSnapshot === null && data.afterSnapshot !== null
      }
      // Validation: delete events must have non-null beforeSnapshot and null afterSnapshot
      if (data.eventType === 'delete') {
        return data.beforeSnapshot !== null && data.afterSnapshot === null
      }
      // Validation: update events must have both snapshots and at least one changed field
      if (data.eventType === 'update') {
        return (
          data.beforeSnapshot !== null &&
          data.afterSnapshot !== null &&
          data.changedFields.length > 0
        )
      }
      return true
    },
    {
      message: 'Invalid snapshot configuration for event type',
    }
  )

export type CreateAuditEventInput = z.infer<typeof CreateAuditEventInputSchema>

/**
 * Product field names that are tracked in audit history
 * Used for field name validation and i18n lookup
 */
export const ProductFieldNameSchema = z.enum([
  'name',
  'sku',
  'description',
  'costPrice',
  'sellingPrice',
  'quantity',
  'categoryId',
  'supplierId',
  'status',
  'imageUrl',
  'minStockLevel',
  'maxStockLevel',
  'companyId',
  'createdAt',
  'updatedAt',
  'deletedAt',
])

export type ProductFieldName = z.infer<typeof ProductFieldNameSchema>

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if a value is a valid EventType
 */
export function isEventType(value: unknown): value is EventType {
  return EventTypeSchema.safeParse(value).success
}

/**
 * Type guard to check if a value is a valid EntityType
 */
export function isEntityType(value: unknown): value is EntityType {
  return EntityTypeSchema.safeParse(value).success
}

/**
 * Type guard to check if a value is a valid ProductFieldName
 */
export function isProductFieldName(value: unknown): value is ProductFieldName {
  return ProductFieldNameSchema.safeParse(value).success
}

/**
 * Helper to validate and parse query parameters
 */
export function parseAuditHistoryQuery(query: unknown): GetAuditHistoryQuery {
  return GetAuditHistoryQuerySchema.parse(query)
}

/**
 * Helper to validate and parse path parameters
 */
export function parseAuditHistoryParams(params: unknown): GetAuditHistoryParams {
  return GetAuditHistoryParamsSchema.parse(params)
}
