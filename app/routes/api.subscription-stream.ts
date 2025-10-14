import type { Route } from './+types/api.subscription-stream'

const clients = new Set<ReadableStreamDefaultController>()

export async function loader({ request }: Route.LoaderArgs) {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller)

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
        clients.delete(controller)
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

/**
 * Broadcast subscription update to all connected clients
 */
export function broadcastSubscriptionUpdate(data: {
  userId: string
  status: string
  planId: string
  trialEnd: number
}) {
  const message = `event: subscription\ndata: ${JSON.stringify({ type: 'subscription', ...data })}\n\n`

  clients.forEach((controller) => {
    try {
      controller.enqueue(message)
    } catch {
      // Client disconnected, will be cleaned up
      clients.delete(controller)
    }
  })

  console.log(`📡 Broadcasted subscription update to ${clients.size} clients:`, data)
}
