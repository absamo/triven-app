import { data } from 'react-router'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import {
  getOnlineUsersCountBySession,
  getUsersWithActiveSessions,
} from '~/app/services/session-based-online-status.server'

export async function loader({ request }: { request: Request }) {
  try {
    const user = await getBetterAuthUser(request)

    if (!user?.id || !user.companyId) {
      return data({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team members with session-based online status
    const teamMembers = await getUsersWithActiveSessions(user.companyId)
    const onlineCount = await getOnlineUsersCountBySession(user.companyId)

    return data({
      teamMembers,
      onlineCount,
      totalCount: teamMembers.length,
    })
  } catch (error) {
    console.error('Error fetching session-based team online status:', error)
    return data({ error: 'Internal server error' }, { status: 500 })
  }
}
