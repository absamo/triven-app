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

// ========== T009: Workflow Approvals Notification Functions ==========

interface CreateNotificationData {
  recipientId: string
  companyId: string
  approvalRequestId?: string
  notificationType?: string
  message: string
  status: 'info' | 'warning' | 'error' | 'success'
  createdById: string
}

/**
 * T009: Create an in-app notification
 */
export async function createNotification(data: CreateNotificationData) {
  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      companyId: data.companyId,
      approvalRequestId: data.approvalRequestId,
      notificationType: data.notificationType,
      message: data.message,
      status: data.status,
      createdById: data.createdById,
      read: false,
    },
  })
}

/**
 * T009: Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * T048: Update notification status when approval changes
 */
export async function updateNotificationStatus(
  approvalRequestId: string,
  newMessage: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      approvalRequestId,
      read: false,
    },
    data: {
      message: newMessage,
    },
  })
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string, limit: number = 50) {
  return prisma.notification.findMany({
    where: {
      recipientId: userId,
      read: false,
    },
    include: {
      approvalRequest: true,
      product: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
