import {
  INVOICE_STATUSES,
  PURCHASE_ORDER_PAYMENT_TERMS,
  SALES_ORDERS_STATUSES,
} from "~/app/common/constants"
import { agencySchema } from "./agencySchema"
import { salesOrderItemSchema } from "./salesOrderItemSchema"

import { z } from "zod"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import { customerSchema } from "./customerSchema"
import { companySchema } from "./companySchema"
dayjs.extend(isSameOrAfter)

export const salesOrderSchema = z.object({
  id: z.string().optional(),
  salesOrderReference: z.string().min(1, "Sales order reference is required"),
  siteId: z.string().min(1, "Site is required"),
  customerId: z.string().min(1, "Customer is required"),
  agencyId: z.string().min(1, "Agency is required"),
  agency: z.lazy(() => agencySchema).optional(),
  customer: z.lazy(() => customerSchema).optional(),
  status: z.nativeEnum(SALES_ORDERS_STATUSES).optional(),
  paymentTerms: z.nativeEnum(PURCHASE_ORDER_PAYMENT_TERMS, {
    errorMap: () => ({
      message: "Payment terms is required",
    }),
  }),
  reference: z.string().optional(),
  notes: z.string().optional().nullable(),
  orderDate: z.coerce.date().refine(
    (input) => {
      return (
        dayjs(dayjs(input).date()).isSameOrAfter(dayjs().date()) ||
        dayjs(dayjs(input).date()).isBefore(dayjs().date())
      )
    },
    {
      message: "Sales order date is required",
    }
  ),
  expectedShipmentDate: z.coerce.date().optional().nullable(),
  salesOrderItems: z.array(z.lazy(() => salesOrderItemSchema)).optional(),
  company: z.lazy(() => companySchema).optional(),
  invoices: z
    .array(z.object({ status: z.nativeEnum(INVOICE_STATUSES) }))
    .optional(),
})

export type ISalesOrder = z.infer<typeof salesOrderSchema>
