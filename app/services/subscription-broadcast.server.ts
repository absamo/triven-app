/**
 * Subscription SSE broadcast utilities
 * Separated to avoid circular dependencies with webhook handlers
 */

type SubscriptionUpdate = {
  userId: string
  status: string
  planId: string
  trialEnd: number
  confirmed?: boolean
}

// Store SSE clients
const clients = new Map<string, Set<ReadableStreamDefaultController>>()

/**
 * Register a new SSE client for subscription updates
 */
export function registerSubscriptionClient(
  userId: string,
  controller: ReadableStreamDefaultController
): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set())
  }
  clients.get(userId)?.add(controller)
  console.log(
    `[SSE] Registered client for user ${userId}. Total clients: ${clients.get(userId)?.size}`
  )
}

/**
 * Unregister an SSE client
 */
export function unregisterSubscriptionClient(
  userId: string,
  controller: ReadableStreamDefaultController
): void {
  const userClients = clients.get(userId)
  if (userClients) {
    userClients.delete(controller)
    if (userClients.size === 0) {
      clients.delete(userId)
    }
    console.log(`[SSE] Unregistered client for user ${userId}. Remaining: ${userClients.size}`)
  }
}

/**
 * Broadcast subscription update to all connected clients for a user
 */
export function broadcastSubscriptionUpdate(update: SubscriptionUpdate): void {
  const userClients = clients.get(update.userId)

  if (!userClients || userClients.size === 0) {
    console.log(`[SSE] No clients connected for user ${update.userId}`)
    return
  }

  const message = `event: subscription\ndata: ${JSON.stringify({
    type: 'subscription',
    status: update.status,
    planId: update.planId,
    trialEnd: update.trialEnd,
    confirmed: update.confirmed || false,
  })}\n\n`

  console.log(`[SSE] Broadcasting to ${userClients.size} client(s) for user ${update.userId}:`, {
    status: update.status,
    planId: update.planId,
    trialEnd: update.trialEnd,
    confirmed: update.confirmed,
  })

  for (const controller of userClients) {
    try {
      controller.enqueue(message)
    } catch (error) {
      console.error('[SSE] Error broadcasting to client:', error)
      // Remove failed client
      userClients.delete(controller)
    }
  }
}
