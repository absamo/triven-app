import { z } from 'zod'
import { SALES_ORDERS_ITEMS_STATUSES } from '../constants'
import { productSchema } from './productSchema'

export const salesOrderItemSchema = z.object({
  id: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  productId: z.preprocess(
    (productId) => (!productId ? '' : productId),
    z.string().min(1, 'Product is required')
  ),
  product: z.lazy(() => productSchema.pick({ name: true, id: true })).optional(),
  quantity: z.coerce
    .number({
      invalid_type_error: 'Quantity is required',
    })
    .min(1, {
      message: 'Quantity cannot be less than 1',
    }),
  rate: z.coerce
    .number({
      invalid_type_error: 'Rate is required',
    })
    .min(1, {
      message: 'Rate cannot be less than 1',
    }),

  tax: z.coerce
    .number({
      invalid_type_error: 'Tax is required',
    })
    .min(0, {
      message: 'Tax cannot be negative',
    })
    .max(100, { message: 'Tax cannot be more than 100' })
    .optional(),

  amount: z.coerce.number().optional(),
  received: z.boolean().optional(),
  status: z.nativeEnum(SALES_ORDERS_ITEMS_STATUSES).optional(),
})

export type ISalesOrderItem = z.infer<typeof salesOrderItemSchema>
