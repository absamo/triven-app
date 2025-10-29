// Testimonials Service
// Service-Oriented Architecture (Constitutional Principle I)
// Standalone functions for testimonial operations

import { prisma } from '~/app/db.server'
import type { Testimonial } from '~/app/lib/landing/types'

/**
 * Get all active testimonials ordered by display order
 * @returns Array of active testimonials
 */
export async function getActiveTestimonials(): Promise<Testimonial[]> {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  })

  return testimonials
}

/**
 * Get testimonial by ID
 * @param id - Testimonial ID
 * @returns Testimonial or null
 */
export async function getTestimonialById(id: string): Promise<Testimonial | null> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id },
  })

  return testimonial
}

/**
 * Create a new testimonial
 * @param data - Testimonial data
 * @returns Created testimonial
 */
export async function createTestimonial(data: {
  customerName: string
  role: string
  company: string
  photoUrl?: string | null
  testimonialText: string
  starRating: number
  displayOrder: number
  isPlaceholder?: boolean
  isActive?: boolean
}): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.create({
    data: {
      customerName: data.customerName,
      role: data.role,
      company: data.company,
      photoUrl: data.photoUrl || null,
      testimonialText: data.testimonialText,
      starRating: data.starRating,
      displayOrder: data.displayOrder,
      isPlaceholder: data.isPlaceholder ?? false,
      isActive: data.isActive ?? true,
    },
  })

  return testimonial
}

/**
 * Update testimonial
 * @param id - Testimonial ID
 * @param data - Partial testimonial data to update
 * @returns Updated testimonial
 */
export async function updateTestimonial(
  id: string,
  data: Partial<{
    customerName: string
    role: string
    company: string
    photoUrl: string | null
    testimonialText: string
    starRating: number
    displayOrder: number
    isPlaceholder: boolean
    isActive: boolean
  }>
): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.update({
    where: { id },
    data,
  })

  return testimonial
}

/**
 * Delete testimonial
 * @param id - Testimonial ID
 * @returns Deleted testimonial
 */
export async function deleteTestimonial(id: string): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.delete({
    where: { id },
  })

  return testimonial
}

/**
 * Toggle testimonial active status
 * @param id - Testimonial ID
 * @param active - New active status
 * @returns Updated testimonial
 */
export async function toggleTestimonialActive(id: string, active: boolean): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { isActive: active },
  })

  return testimonial
}
