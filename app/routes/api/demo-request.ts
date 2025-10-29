// Demo Request API Route
// POST /api/demo-request
// Constitutional Principle VI: API-First Development

import type { ActionFunctionArgs } from 'react-router'
import { demoRequestSchema } from '~/app/lib/landing/validators'
import {
  createDemoRequest,
  incrementRateLimit,
  isRateLimited,
  markNotificationSent,
} from '~/app/services/demo-request.server'
import { sendDemoRequestNotification } from '~/app/services/email.server'

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * POST /api/demo-request
 * Create a new demo request with rate limiting
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limit
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many demo requests. Please try again later.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate with Zod schema
    const validationResult = demoRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Increment rate limit counter
    incrementRateLimit(clientIP)

    // Create demo request
    const demoRequest = await createDemoRequest(validationResult.data)

    // Send email notification to sales team
    try {
      await sendDemoRequestNotification(demoRequest)
      await markNotificationSent(demoRequest.id)
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send demo request notification:', emailError)
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo request submitted successfully',
        data: {
          id: demoRequest.id,
          email: demoRequest.email,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Demo request creation failed:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to process demo request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
