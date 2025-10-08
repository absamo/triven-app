import { z } from 'zod'
import { BACKORDER_ITEM_STATUSES } from '~/app/common/constants'

export const backorderItemSchema = z.object({
  id: z.string().optional(),
  backorderId: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  orderedQuantity: z.number().min(1, 'Ordered quantity must be greater than 0'),
  fulfilledQuantity: z.number().min(0, 'Fulfilled quantity cannot be negative').default(0),
  remainingQuantity: z.number().min(0, 'Remaining quantity cannot be negative'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  status: z.nativeEnum(BACKORDER_ITEM_STATUSES).optional(),
})

export type IBackorderItem = z.infer<typeof backorderItemSchema>
