import { data } from "react-router"
import { prisma } from "~/app/db.server"
import { getBetterAuthUser } from "~/app/services/better-auth.server"

export async function action({ request }: { request: Request }) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
        const user = await getBetterAuthUser(request)

        if (!user?.id) {
            return data({ error: 'Unauthorized' }, { status: 401 })
        }

        const { isOnline } = await request.json()

        // Update user's online status
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isOnline: isOnline,
                lastOnlineAt: new Date()
            }
        })

        return data({ success: true })
    } catch (error) {
        console.error('Error updating online status:', error)
        return data({ error: 'Internal server error' }, { status: 500 })
    }
}
