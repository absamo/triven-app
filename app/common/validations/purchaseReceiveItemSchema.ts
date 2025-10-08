import { z } from 'zod'
import { productSchema } from './productSchema'

export const purchaseReceiveItemSchema = z.object({
  id: z.string().optional(),
  purchaseReceivedId: z.string().optional(),
  purchaseOrderId: z.string().min(1, {
    message: 'Purchase order is required',
  }),
  receivedQuantity: z.coerce.number(),
  orderedQuantity: z.coerce.number(),
  productId: z.string().min(1, {
    message: 'Product is required',
  }),
  product: z.lazy(() => productSchema.pick({ name: true, id: true })).optional(),
})

export type IPurchaseReceiveItem = z.infer<typeof purchaseReceiveItemSchema>
