import { INVOICE_STATUSES } from "~/app/common/constants"

import { z } from "zod"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import { salesOrderSchema } from "./salesOrderSchema"

dayjs.extend(isSameOrAfter)

export const invoiceSchema = z.object({
  id: z.string().optional(),
  invoiceReference: z.string().min(1, "Invoice reference is required"),
  salesOrderId: z.string().min(1, "Sales order is required"),
  salesOrder: z
    .lazy(() =>
      salesOrderSchema.pick({
        salesOrderItems: true,
        salesOrderReference: true,
      })
    )
    .optional(),
  status: z.nativeEnum(INVOICE_STATUSES, {
    errorMap: () => ({
      message: "Invoice status is required",
    }),
  }),
  // paymentTerms: z.nativeEnum(PURCHASE_ORDER_PAYMENT_TERMS, {
  //   errorMap: () => ({
  //     message: "Payment terms is required",
  //   }),
  // }),
  reference: z.string().optional(),
  notes: z.string().optional().nullable(),
  invoiceDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: "Invoice date is required",
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
      message: "Due date is required",
    }
  ),
  paymentsReceived: z.array(z.any()).optional(),
})

export type IInvoice = z.infer<typeof invoiceSchema>
