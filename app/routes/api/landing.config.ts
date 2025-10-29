// Landing Page Config API Route
// GET /api/landing/config
// Constitutional Principle VI: API-First Development

import { getLandingPageConfig } from '~/app/services/landing-config.server'

/**
 * GET /api/landing/config
 * Retrieve landing page configuration
 */
export async function loader() {
  try {
    const config = await getLandingPageConfig()

    return new Response(
      JSON.stringify({
        success: true,
        data: config,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Failed to fetch landing page config:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to fetch landing page configuration',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
