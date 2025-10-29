// Success Metrics API Route
// GET /api/landing/success-metrics
// Constitutional Principle VI: API-First Development

import { getActiveSuccessMetrics } from '~/app/services/success-metrics.server'

/**
 * GET /api/landing/success-metrics
 * Retrieve all active success metrics for landing page
 */
export async function loader() {
  try {
    const metrics = await getActiveSuccessMetrics()

    return new Response(
      JSON.stringify({
        success: true,
        data: metrics,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Failed to fetch success metrics:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch success metrics',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
