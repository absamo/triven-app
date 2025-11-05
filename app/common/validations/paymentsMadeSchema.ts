import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { z } from 'zod'
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '~/app/common/constants'
import { billSchema } from './billSchema'

dayjs.extend(isSameOrAfter)

export const paymentsMadeSchema = z.object({
  id: z.string().optional(),
  paymentReference: z.string().min(1, 'Payment reference is required'),
  notes: z.string().optional().nullable(),
  paymentDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: 'Payment date is required',
    }
  ),
  paymentMethod: z.nativeEnum(PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Payment method is required',
    }),
  }),

  amountReceived: z.coerce
    .number({
      invalid_type_error: 'Amount received is required',
    })

    .positive({
      message: 'Amount received should be greater than 0',
    }),
  amountPaid: z.number().optional(),
  balanceDue: z.number().optional(),
  billId: z.string().min(1, 'Bill is required'),
  bill: z.lazy(() => billSchema.pick({ status: true, billReference: true })).optional(),
  status: z.nativeEnum(PAYMENT_STATUSES).optional(),
})

export type IPaymentsMade = z.infer<typeof paymentsMadeSchema>
