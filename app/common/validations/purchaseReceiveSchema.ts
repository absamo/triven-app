import { z } from 'zod'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
dayjs.extend(isSameOrAfter)

import { purchaseOrderSchema } from './purchaseOrderSchema'
import { PURCHASE_ORDER_STATUSES } from '../constants'

export const purchaseReceiveSchema = z.object({
  id: z.string().optional(),
  purchaseReceiveReference: z.string().min(1, 'Purchase receive reference is required'),
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  purchaseOrder: z
    .lazy(() =>
      purchaseOrderSchema.pick({
        id: true,
        purchaseOrderReference: true,
        status: true,
        purchaseOrderItems: true,
        supplier: true,
      })
    )
    .optional(),
  status: z.nativeEnum(PURCHASE_ORDER_STATUSES).optional(),
  receivedQuantity: z.number().optional(),
  orderedQuantity: z.number().optional(),
  notes: z.string().optional().nullable(),
  receivedDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: 'Receive date is required',
    }
  ),
  purchaseReceiveItems: z.array(z.any()).optional(),
})

export type IPurchaseReceive = z.infer<typeof purchaseReceiveSchema>
