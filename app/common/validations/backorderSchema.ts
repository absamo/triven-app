import { BACKORDER_STATUSES } from '~/app/common/constants'
import { agencySchema } from './agencySchema'
import { backorderItemSchema } from './backorderItemSchema'

import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { z } from 'zod'
import { companySchema } from './companySchema'
import { customerSchema } from './customerSchema'
dayjs.extend(isSameOrAfter)

export const backorderSchema = z.object({
  id: z.string().optional(),
  backorderReference: z.string().min(1, 'Backorder reference is required'),
  siteId: z.string().min(1, 'Site is required'),
  customerId: z.string().min(1, 'Customer is required'),
  agencyId: z.string().min(1, 'Agency is required'),
  agency: z.lazy(() => agencySchema).optional(),
  customer: z.lazy(() => customerSchema).optional(),
  status: z.nativeEnum(BACKORDER_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  originalOrderDate: z.preprocess(
    (val) => {
      // If value is null, undefined, or empty string, return undefined to trigger required error
      if (val === null || val === undefined || val === '') {
        return undefined
      }
      return val
    },
    z.coerce.date({
      required_error: 'Original order date is required',
      invalid_type_error: 'Please enter a valid date',
    })
  ),
  expectedFulfillDate: z.coerce.date().optional().nullable(),
  backorderItems: z.array(z.lazy(() => backorderItemSchema)).optional(),
  company: z.lazy(() => companySchema).optional(),
})

export type IBackorder = z.infer<typeof backorderSchema>
