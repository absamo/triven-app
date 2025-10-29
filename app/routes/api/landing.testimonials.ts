// Testimonials API Route
// GET /api/landing/testimonials
// Constitutional Principle VI: API-First Development

import { getActiveTestimonials } from '~/app/services/testimonials.server'

/**
 * GET /api/landing/testimonials
 * Retrieve all active testimonials for landing page
 */
export async function loader() {
  try {
    const testimonials = await getActiveTestimonials()

    return new Response(
      JSON.stringify({
        success: true,
        data: testimonials,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Failed to fetch testimonials:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch testimonials',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
