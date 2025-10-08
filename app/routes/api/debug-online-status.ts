import { data } from 'react-router'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ request }: { request: Request }) {
  try {
    const user = await getBetterAuthUser(request)

    if (!user?.id || !user.companyId) {
      return data({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Get all users in the company
    const allUsers = await prisma.user.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        email: true,
        isOnline: true,
        lastOnlineAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Get all active sessions for users in this company
    const activeSessions = await prisma.session.findMany({
      where: {
        expiresAt: { gt: now },
        user: {
          companyId: user.companyId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Get users with sessions
    const usersWithSessions = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        sessions: {
          some: {
            expiresAt: { gt: now },
          },
        },
      },
      include: {
        sessions: {
          where: {
            expiresAt: { gt: now },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        profile: true,
      },
    })

    return data({
      debug: {
        allUsers,
        activeSessions,
        usersWithSessions,
        currentTime: now.toISOString(),
        currentUserId: user.id,
      },
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return data(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
