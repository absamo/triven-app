import { NOTIFICATION_STATUSES } from '~/app/common/constants'
import { type IUser } from '~/app/common/validations/userSchema'
import { prisma } from '~/app/db.server'
import { emitter } from '~/app/utils/emitter.server'

export interface NotificationData {
  message: string
  status: string
  companyId: string
  createdById: string
  productId?: string
  read?: boolean
}

export async function createAndEmitNotification(data: NotificationData) {
  try {
    // Create notification in database
    const notificationData: any = {
      message: data.message,
      status: data.status,
      companyId: data.companyId,
      createdById: data.createdById,
      read: data.read || false,
    }

    if (data.productId) {
      notificationData.productId = data.productId
    }

    const notification = await prisma.notification.create({
      data: notificationData,
      include: {
        createdBy: {
          select: {
            profile: true,
          },
        },
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    })

    // Emit SSE event with the new notification
    emitter.emit('notifications', {
      action: 'notification_created',
      notification,
      timestamp: Date.now(),
    })

    return notification
  } catch (error) {
    throw error
  }
}

export async function createStockAlert(
  user: IUser,
  productId: string,
  productName: string,
  status: string
) {
  let message = ''
  let notificationStatus = ''

  switch (status) {
    case 'LOWSTOCK':
      message = `${productName} is running low on stock`
      notificationStatus = NOTIFICATION_STATUSES.LOWSTOCK
      break
    case 'OUTOFSTOCK':
      message = `${productName} is out of stock`
      notificationStatus = NOTIFICATION_STATUSES.OUTOFSTOCK
      break
    case 'CRITICAL':
      message = `${productName} has reached critical stock level`
      notificationStatus = NOTIFICATION_STATUSES.CRITICAL
      break
    default:
      message = `Stock alert for ${productName}`
      notificationStatus = NOTIFICATION_STATUSES.LOWSTOCK
  }

  return await createAndEmitNotification({
    message,
    status: notificationStatus,
    companyId: user.companyId,
    createdById: user.id || '',
    productId,
  })
}
