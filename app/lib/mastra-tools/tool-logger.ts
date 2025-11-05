/**
 * Tool Execution Logger
 *
 * Implements audit logging for all Mastra tool executions with PII sanitization
 * Based on research.md Section 4: Tool Execution Audit Logging
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '../../db.server'

/**
 * Sensitive fields that should always be redacted
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apikey',
  'secret',
  'creditcard',
  'ssn',
  'taxid',
  'authorization',
  'bearer',
]

/**
 * PII fields that should be masked
 */
const PII_FIELDS = ['email', 'phone', 'address', 'fullname', 'firstname', 'lastname', 'dateofbirth']

/**
 * Mask a string value (show first/last 2 chars)
 */
function maskString(value: string): string {
  if (value.length <= 4) return '***'
  return `${value.slice(0, 2)}***${value.slice(-2)}`
}

/**
 * Recursively sanitize sensitive data in an object
 */
function sanitizeData(data: unknown, options: { maskPII?: boolean } = {}): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, options))
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()

      // Always mask sensitive fields
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***'
        continue
      }

      // Optionally mask PII
      if (options.maskPII && PII_FIELDS.some((field) => lowerKey.includes(field))) {
        sanitized[key] = typeof value === 'string' ? maskString(value) : '***PII***'
        continue
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value, options)
    }

    return sanitized
  }

  return data
}

/**
 * Log tool execution parameters
 */
export interface ToolExecutionParams {
  toolName: string
  userId: string
  companyId: string
  parameters: unknown
  result?: unknown
  error?: string
  startTime: number
  ipAddress?: string
  userAgent?: string
}

/**
 * Log tool execution asynchronously to avoid blocking
 */
export async function logToolExecution(params: ToolExecutionParams): Promise<void> {
  const executionTimeMs = Date.now() - params.startTime

  // Sanitize data before logging
  const sanitizedParams = sanitizeData(params.parameters, { maskPII: true })
  const sanitizedResult = params.result ? sanitizeData(params.result, { maskPII: true }) : null

  // Async background task (doesn't block tool execution)
  setImmediate(async () => {
    try {
      await prisma.toolExecutionLog.create({
        data: {
          toolName: params.toolName,
          userId: params.userId,
          companyId: params.companyId,
          parameters: sanitizedParams as Prisma.InputJsonValue,
          result: sanitizedResult as Prisma.InputJsonValue,
          success: !params.error,
          errorMessage: params.error || null,
          executionTimeMs,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      })
    } catch (error) {
      // Log to console if database write fails (don't fail tool execution)
      console.error('[ToolLogger] Failed to log execution:', error)
    }
  })
}

/**
 * Export sanitization function for use in other modules
 */
export { sanitizeData }
