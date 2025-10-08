import { BILL_STATUSES } from '~/app/common/constants'

import { z } from 'zod'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { purchaseOrderSchema } from './purchaseOrderSchema'

dayjs.extend(isSameOrAfter)

export const billSchema = z.object({
  id: z.string().optional(),
  billReference: z.string().min(1, 'Bill reference is required'),
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  purchaseOrder: z
    .lazy(() =>
      purchaseOrderSchema.pick({
        supplier: true,
        agency: true,
        purchaseOrderItems: true,
        purchaseOrderReference: true,
      })
    )

    .optional(),
  status: z.nativeEnum(BILL_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  billDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: 'Bill date is required',
    }
  ),
  dueDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: 'Due date is required',
    }
  ),
  paymentsMade: z.array(z.any()).optional(),
})

export type IBill = z.infer<typeof billSchema>
