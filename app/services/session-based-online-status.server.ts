import { prisma } from '~/app/db.server'

/**
 * Online status service using Better Auth sessions
 * This provides more reliable online tracking by leveraging session management
 */

/**
 * Get all team members with their online status based on active sessions
 * This returns ALL users in the company, with accurate online status
 */
export async function getAllTeamMembersWithSessionStatus(companyId: string) {
  try {
    const now = new Date()

    const allUsers = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
      },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: now,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
        profile: true,
        role: true,
        agency: true,
        site: true,
      },
    })

    return allUsers.map((user) => ({
      ...user,
      isOnline: user.sessions.length > 0,
      lastOnlineAt: user.sessions[0]?.updatedAt || user.lastOnlineAt,
    }))
  } catch (error) {
    console.error('Error getting all team members with session status:', error)
    throw error
  }
}

/**
 * Get users who should be considered online based on active sessions
 * This checks the Better Auth session table for active sessions
 */
export async function getUsersWithActiveSessions(companyId: string) {
  try {
    // Get users with active sessions that haven't expired
    const now = new Date()

    const usersWithSessions = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
        // Check if user has any active sessions
        sessions: {
          some: {
            expiresAt: {
              gt: now, // Session hasn't expired
            },
          },
        },
      },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: now,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1, // Get the most recent active session
        },
        profile: true,
        role: true,
        agency: true,
        site: true,
      },
    })

    return usersWithSessions.map((user) => ({
      ...user,
      isOnline: user.sessions.length > 0,
      lastOnlineAt: user.sessions[0]?.updatedAt || user.lastOnlineAt,
    }))
  } catch (error) {
    console.error('Error getting users with active sessions:', error)
    throw error
  }
}

/**
 * Update online status based on session activity
 * This should be called periodically to clean up stale online status
 */
export async function syncOnlineStatusWithSessions() {
  try {
    const now = new Date()

    // Mark users as offline if they don't have any active sessions
    const offlineUsers = await prisma.user.updateMany({
      where: {
        isOnline: true,
        sessions: {
          none: {
            expiresAt: {
              gt: now,
            },
          },
        },
      },
      data: {
        isOnline: false,
      },
    })

    // Mark users as online if they have active sessions but are marked offline
    const onlineUsers = await prisma.user.updateMany({
      where: {
        isOnline: false,
        sessions: {
          some: {
            expiresAt: {
              gt: now,
            },
          },
        },
      },
      data: {
        isOnline: true,
        lastOnlineAt: now,
      },
    })

    return {
      onlineCount: onlineUsers.count,
      offlineCount: offlineUsers.count,
    }
  } catch (error) {
    console.error('Error syncing online status with sessions:', error)
    throw error
  }
}

/**
 * Get online users count for a specific company using session data
 */
export async function getOnlineUsersCountBySession(companyId: string) {
  try {
    const now = new Date()

    const count = await prisma.user.count({
      where: {
        companyId,
        active: true,
        sessions: {
          some: {
            expiresAt: {
              gt: now,
            },
          },
        },
      },
    })

    return count
  } catch (error) {
    console.error('Error getting online users count by session:', error)
    throw error
  }
}

/**
 * Get user's last activity based on their most recent session update
 */
export async function getUserLastActivity(userId: string) {
  try {
    const now = new Date()

    const latestSession = await prisma.session.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return {
      isOnline: !!latestSession,
      lastActivity: latestSession?.updatedAt || null,
    }
  } catch (error) {
    console.error('Error getting user last activity:', error)
    throw error
  }
}
