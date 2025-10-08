import { z } from 'zod'
import { productSchema } from './productSchema'
import { transferOrderSchema } from './transferOrderSchema'

export const transferOrderItemSchema = z.object({
  id: z.string().optional(),
  transferOrderId: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  product: z.lazy(() => productSchema.pick({ name: true, id: true })).optional(),
  transferOrder: transferOrderSchema.optional(),
  quantity: z.coerce
    .number({
      invalid_type_error: 'Quantity is required',
    })
    .min(1, {
      message: 'Quantity cannot be less than 1',
    }),
})

export type ITransferOrderItem = z.infer<typeof transferOrderItemSchema>
