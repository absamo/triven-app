import type { ActionFunctionArgs } from 'react-router'
import { handleTrialExpiringEmailsRequest } from '~/app/services/email-scheduler.server'

export const ROUTE_PATH = '/api/cron/trial-expiring-emails' as const

/**
 * API endpoint for sending trial expiring emails
 * This should be called by a cron job service (like GitHub Actions, Vercel Cron, etc.)
 *
 * Security: In production, add authentication or IP allowlisting
 */
export async function action({ request }: ActionFunctionArgs) {
  // Verify it's a POST request
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Optional: Add authentication for production
  // const authHeader = request.headers.get('Authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 })
  // }

  return await handleTrialExpiringEmailsRequest()
}

export async function loader() {
  return new Response('This endpoint only accepts POST requests', { status: 405 })
}
