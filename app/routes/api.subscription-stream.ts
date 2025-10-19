import { getBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/api.subscription-stream'

const clients = new Map<string, Set<ReadableStreamDefaultController>>()

export async function loader({ request }: Route.LoaderArgs) {
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
            `⚠️ User ${user.id} has ${userClients.size} connections. Closing oldest connections.`
          )
          const controllersToClose = Array.from(userClients).slice(0, userClients.size - MAX_CONNECTIONS_PER_USER + 1)
          controllersToClose.forEach(ctrl => {
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
        `📡 Client connected for user ${user.id}. Total clients: ${userClients?.size || 0}`
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
          `📡 Client disconnected for user ${user.id}. Remaining clients: ${userClients?.size || 0}`
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

/**
 * Broadcast subscription update to all connected clients for a specific user
 */
export function broadcastSubscriptionUpdate(data: {
  userId: string
  status: string
  planId: string
  trialEnd: number
  confirmed?: boolean // Optional flag to indicate this is the final confirmed update
}) {
  const message = `event: subscription\ndata: ${JSON.stringify({ type: 'subscription', ...data })}\n\n`

  const userClients = clients.get(data.userId)
  if (!userClients) {
    console.log(`📡 No clients connected for user ${data.userId}`)
    return
  }

  let successCount = 0
  userClients.forEach((controller) => {
    try {
      controller.enqueue(message)
      successCount++
    } catch {
      // Client disconnected, will be cleaned up
      userClients.delete(controller)
    }
  })

  console.log(
    `📡 Broadcasted subscription update to ${successCount}/${userClients.size} clients for user ${data.userId}:`,
    data
  )
}
