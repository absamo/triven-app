import type { LoaderFunctionArgs } from 'react-router'
import { stripe } from '~/app/modules/stripe/stripe.server'

/**
 * Health check endpoint for Stripe API connectivity
 * Returns 200 if Stripe API is accessible
 * Returns 503 if Stripe API is unavailable
 */
// biome-ignore lint/correctness/noEmptyPattern: LoaderFunctionArgs required by route signature
export async function loader({}: LoaderFunctionArgs) {
  try {
    // Verify Stripe API is accessible
    await stripe.balance.retrieve()

    return Response.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Stripe health check failed:', error)

    return Response.json(
      {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
