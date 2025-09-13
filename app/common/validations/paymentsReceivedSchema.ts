import { PAYMENT_METHODS, PAYMENT_STATUSES } from "~/app/common/constants"

import { z } from "zod"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import { customerSchema } from "./customerSchema"
import { invoiceSchema } from "./invoiceSchema"

dayjs.extend(isSameOrAfter)

export const paymentsReceivedSchema = z.object({
  id: z.string().optional(),
  paymentReference: z.string().min(1, "Payment reference is required"),
  customerId: z.string().min(1, "Customer is required"),
  customer: z.lazy(() => customerSchema).optional(),
  notes: z.string().optional().nullable(),
  paymentDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: "Payment date is required",
    }
  ),
  paymentMethod: z.nativeEnum(PAYMENT_METHODS, {
    errorMap: () => ({
      message: "Payment method is required",
    }),
  }),

  amountReceived: z.coerce
    .number({
      invalid_type_error: "Amount received is required",
    })

    .positive({
      message: "Amount received should be greater than 0",
    }),
  amountPaid: z.number().optional(),
  balanceDue: z.number().optional(),
  invoiceId: z.string().min(1, "Invoice is required"),
  invoice: z
    .lazy(() =>
      invoiceSchema.pick({
        status: true,
        salesOrder: true,
        invoiceReference: true,
        id: true,
      })
    )
    .optional(),
  status: z.nativeEnum(PAYMENT_STATUSES).optional(),
})

export type IPaymentsReceived = z.infer<typeof paymentsReceivedSchema>
