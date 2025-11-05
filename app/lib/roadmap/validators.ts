import { z } from 'zod'

// Define status enum values directly to avoid CommonJS/ESM issues
const featureStatusValues = ['TODO', 'PLANNED', 'IN_PROGRESS', 'SHIPPED'] as const

/**
 * Schema for creating a new feature request
 */
export const createFeatureSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),
  status: z.enum(featureStatusValues).optional().default('TODO'),
})

/**
 * Validation schema for updating an existing feature request
 */
export const updateFeatureSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim()
    .optional(),
  status: z.enum(featureStatusValues).optional(),
})

/**
 * Validation schema for feature status update (drag-and-drop)
 */
export const updateFeatureStatusSchema = z.object({
  status: z.enum(featureStatusValues),
})

/**
 * Validation schema for GET /api/roadmap/features query parameters
 */
export const getFeaturesQuerySchema = z.object({
  status: z.enum(featureStatusValues).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
  cursor: z.string().optional(),
})

/**
 * Type exports for TypeScript inference
 */
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>
export type UpdateFeatureStatusInput = z.infer<typeof updateFeatureStatusSchema>
export type GetFeaturesQuery = z.infer<typeof getFeaturesQuerySchema>
