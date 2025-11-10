// T036: Server-Sent Events manager for real-time approval updates
interface ApprovalUpdate {
  type: 'approval_status_changed' | 'approval_assigned' | 'approval_commented'
  approvalId: string
  data: unknown
}

const clients = new Map<string, Set<ReadableStreamDefaultController>>()

/**
 * Broadcast approval update to all relevant clients
 */
export function broadcastApprovalUpdate(
  update: ApprovalUpdate,
  companyId: string,
  targetUserIds?: string[]
) {
  const message = `event: approval\ndata: ${JSON.stringify(update)}\n\n`
  let successCount = 0
  let totalClientsChecked = 0

  clients.forEach((userClients, userId) => {
    // Only send to target users if specified
    if (targetUserIds && !targetUserIds.includes(userId)) {
      return
    }

    totalClientsChecked += userClients.size
    userClients.forEach((controller) => {
      try {
        controller.enqueue(message)
        successCount++
      } catch {
        // Client disconnected, will be cleaned up
        userClients.delete(controller)
      }
    })
  })

  console.log(
    `📡 Broadcasted approval update to ${successCount}/${totalClientsChecked} clients (Company: ${companyId}):`,
    update
  )
}

/**
 * Send approval update to specific user
 */
export function sendToUser(userId: string, update: ApprovalUpdate) {
  const message = `event: approval\ndata: ${JSON.stringify(update)}\n\n`
  const userClients = clients.get(userId)

  if (!userClients) {
    console.log(`📡 No clients connected for user ${userId}`)
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
    `📡 Sent approval update to ${successCount}/${userClients.size} clients for user ${userId}`
  )
}

/**
 * Get count of connected clients for a company
 */
export function getCompanyClientCount(_companyId: string): number {
  let count = 0
  clients.forEach((userClients) => {
    count += userClients.size
  })
  return count
}

// Export the clients map for use in SSE endpoint
export { clients }
