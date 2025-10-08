import { z } from 'zod'
import { productSchema } from './productSchema'
import { userSchema } from './userSchema'
import { NOTIFICATION_STATUSES } from '~/app/common/constants'

export const notificationSchema = z.object({
  id: z.string().optional(),
  message: z.string().optional(),
  status: z.nativeEnum(NOTIFICATION_STATUSES).optional(),
  productId: z.string().optional(),
  createdBy: z.lazy(() => userSchema).optional(),
  product: productSchema?.optional(),
  createdAt: z.date().optional(),
  read: z.boolean().optional(),
})

export type INotification = z.infer<typeof notificationSchema>
