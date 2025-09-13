import { prisma } from "~/app/db.server"

/**
 * Clean up offline users who haven't been active in the last 5 minutes
 * This should be run periodically (e.g., every minute) to ensure accurate online status
 */
export async function cleanupOfflineUsers() {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

        const result = await prisma.user.updateMany({
            where: {
                isOnline: true,
                OR: [
                    { lastOnlineAt: { lt: fiveMinutesAgo } },
                    { lastOnlineAt: null }
                ]
            },
            data: {
                isOnline: false
            }
        })
        return result.count
    } catch (error) {
        console.error('Error cleaning up offline users:', error)
        throw error
    }
}

/**
 * Get online users count for a specific company
 */
export async function getOnlineUsersCount(companyId: string) {
    try {
        const count = await prisma.user.count({
            where: {
                companyId,
                isOnline: true,
                active: true
            }
        })

        return count
    } catch (error) {
        console.error('Error getting online users count:', error)
        throw error
    }
}
