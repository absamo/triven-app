// Landing Page Validators
// Generated for Feature: Landing Page Redesign (003-landing-page-redesign)

import { z } from 'zod'

// Demo Request Form Validation Schema
export const demoRequestSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  company: z
    .string()
    .max(100, 'Company name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  teamSize: z
    .string()
    .max(50, 'Team size must be less than 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  preferredDemoTime: z
    .string()
    .max(100, 'Preferred demo time must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
})

// Infer TypeScript type from Zod schema
export type DemoRequestInput = z.infer<typeof demoRequestSchema>

// Testimonial validation schema (for admin operations)
export const testimonialSchema = z.object({
  customerName: z.string().min(2).max(100).trim(),
  role: z.string().min(2).max(100).trim(),
  company: z.string().min(2).max(100).trim(),
  photoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  testimonialText: z.string().min(10).max(500).trim(),
  starRating: z.number().int().min(1).max(5),
  displayOrder: z.number().int().min(0),
  isPlaceholder: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type TestimonialInput = z.infer<typeof testimonialSchema>

// Success Metric validation schema (for admin operations)
export const successMetricSchema = z.object({
  label: z.string().min(2).max(100).trim(),
  value: z.string().min(1).max(50).trim(),
  icon: z.string().min(1).max(50).trim(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean().default(true),
})

export type SuccessMetricInput = z.infer<typeof successMetricSchema>

// Landing Page Config validation schema (for admin operations)
export const landingPageConfigSchema = z.object({
  metaTitle: z.string().min(10).max(60).trim(),
  metaDescription: z.string().min(50).max(160).trim(),
  metaKeywords: z.string().max(255).trim().optional(),
  defaultTheme: z.enum(['dark', 'light']).default('dark'),
  showCompanyLogos: z.boolean().default(false),
})

export type LandingPageConfigInput = z.infer<typeof landingPageConfigSchema>

// CTA Button validation schema (for admin operations)
export const ctaButtonSchema = z.object({
  buttonText: z.string().min(2).max(50).trim(),
  buttonType: z.enum(['primary', 'secondary']),
  destinationUrl: z.string().url().or(z.string().regex(/^\//, 'Must be a valid URL or path')),
  trackingIdentifier: z.string().min(2).max(100).trim(),
  position: z.string().min(2).max(100).trim(),
  active: z.boolean().default(true),
})

export type CTAButtonInput = z.infer<typeof ctaButtonSchema>

// Query parameter validation
export const landingQuerySchema = z.object({
  plan: z.enum(['standard', 'professional', 'premium']).optional(),
  ref: z.string().max(100).optional(), // Referral tracking
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
})

export type LandingQuery = z.infer<typeof landingQuerySchema>
