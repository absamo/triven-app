// T036: Server-Sent Events endpoint for real-time approval updates
import type { LoaderFunctionArgs } from 'react-router'
import { clients } from '~/app/services/approval-sse.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the authenticated user
  const user = await getBetterAuthUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Limit connections per user to prevent leaks
      const MAX_CONNECTIONS_PER_USER = 10

      // Add client to user-specific set
      if (!clients.has(user.id)) {
        clients.set(user.id, new Set())
      }
      const userClients = clients.get(user.id)

      if (userClients) {
        // If too many connections, close oldest ones
        if (userClients.size >= MAX_CONNECTIONS_PER_USER) {
          console.warn(
            `⚠️ User ${user.id} has ${userClients.size} approval SSE connections. Closing oldest connections.`
          )
          const controllersToClose = Array.from(userClients).slice(
            0,
            userClients.size - MAX_CONNECTIONS_PER_USER + 1
          )
          controllersToClose.forEach((ctrl) => {
            try {
              ctrl.close()
              userClients.delete(ctrl)
            } catch {
              // Already closed
            }
          })
        }

        userClients.add(controller)
      }

      // Send initial connection message
      controller.enqueue(`event: connected\ndata: ${JSON.stringify({ type: 'connected' })}\n\n`)

      console.log(
        `📡 Approval SSE client connected for user ${user.id}. Total clients: ${userClients?.size || 0}`
      )

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
        const userClients = clients.get(user.id)
        if (userClients) {
          userClients.delete(controller)
          if (userClients.size === 0) {
            clients.delete(user.id)
          }
        }
        console.log(
          `📡 Approval SSE client disconnected for user ${user.id}. Remaining clients: ${userClients?.size || 0}`
        )
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
