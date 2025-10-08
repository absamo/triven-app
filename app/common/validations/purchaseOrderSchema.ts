import { PURCHASE_ORDER_PAYMENT_TERMS, PURCHASE_ORDER_STATUSES } from '~/app/common/constants'
import { agencySchema } from './agencySchema'
import { supplierSchema } from './supplierSchema'
import { z } from 'zod'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { companySchema } from './companySchema'

dayjs.extend(isSameOrAfter)

export const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  purchaseOrderReference: z.string().min(1, 'Purchase order reference is required'),
  siteId: z.string().min(1, 'Site is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  agencyId: z.string().min(1, 'Agency is required'),
  agency: z.lazy(() => agencySchema).optional(),
  supplier: z.lazy(() => supplierSchema).optional(),
  status: z.nativeEnum(PURCHASE_ORDER_STATUSES).optional(),
  paymentTerms: z.nativeEnum(PURCHASE_ORDER_PAYMENT_TERMS, {
    errorMap: () => ({
      message: 'Payment terms is required',
    }),
  }),
  reference: z.string().optional(),
  notes: z.string().optional().nullable(),
  orderDate: z.coerce.date().transform((value, ctx): Date => {
    const passedDate = !dayjs(dayjs(value).date()).isSameOrAfter(dayjs().date())
    const emptyDate = !value
    //FIXME: Add a check for the order date to be null
    if (passedDate || emptyDate)
      ctx.addIssue({
        code: 'custom',
        message: emptyDate ? 'Order date is required' : 'Order date cannot be in the past',
      })
    return value
  }),
  company: z.lazy(() => companySchema).optional(),
  expectedDeliveryDate: z.coerce.date().optional().nullable(),
  purchaseOrderItems: z.array(z.any()).optional(),
  purchaseReceives: z.array(z.any()).optional(),
  bills: z.array(z.any()).optional(),
})

export type IPurchaseOrder = z.infer<typeof purchaseOrderSchema>
