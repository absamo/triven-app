import { redirect } from 'react-router'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import { emitter } from '~/app/utils/emitter.server'
import type { INotification } from '../common/validations/notificationSchema'

export async function getNotifications(
  request: Request,
  filter?: { limit?: number; offset?: number; read?: boolean }
) {
  const user = await getBetterAuthUser(request)
  if (!user?.id) {
    return []
  }

  const notifications =
    (await prisma.notification.findMany({
      take: filter?.limit || undefined,
      skip: filter?.offset || undefined,
      where: {
        companyId: user.companyId,
        read: filter?.read === false ? false : undefined,
        // Remove site filter to show all notifications for the company
        // product: { siteId: user.site?.id },
      },
      include: { createdBy: { select: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    })) || []

  return notifications
}

export async function updateNotification(notifications: INotification[], redirectTo?: string) {
  await Promise.all(
    (notifications || []).map(async (notification: INotification) => {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          read: notification.read,
        },
      })
    })
  )

  // Emit notification update with data
  emitter.emit('notifications', {
    action: 'updated',
    count: notifications.length,
    timestamp: Date.now(),
  })

  return redirect(redirectTo || '/')
}
