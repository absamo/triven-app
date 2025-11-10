import { getBetterAuthUser } from '~/app/services/better-auth.server'
import {
  registerSubscriptionClient,
  unregisterSubscriptionClient,
} from '~/app/services/subscription-broadcast.server'
import type { Route } from './+types/api.subscription-stream'

export async function loader({ request }: Route.LoaderArgs) {
  // Get the authenticated user
  const user = await getBetterAuthUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Register client with centralized manager
      registerSubscriptionClient(user.id, controller)

      // Send initial connection message
      controller.enqueue(`event: connected\ndata: ${JSON.stringify({ type: 'connected' })}\n\n`)

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`:heartbeat\n\n`)
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unregisterSubscriptionClient(user.id, controller)
        try {
          controller.close()
        } catch {
          // Controller already closed
        }
      })
    },
    cancel() {
      // Client disconnected
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
