import { z } from 'zod'
import { locationSchema } from './locationSchema'

export const customerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  companyId: z.string().optional(),
  siteId: z.string().min(1, 'Site is required'),
  agencyId: z.string().min(1, 'Agency is required'),
  billingAddress: z.lazy(() => locationSchema).optional(),
  shippingAddress: z.lazy(() => locationSchema)?.optional(),
  companyName: z.string().nullable().optional(),
  useBillingAddressAsShippingAddress: z.boolean().optional(),
  hasPortalAccess: z.boolean().optional(),
  invoices: z.array(z.object({})).optional(),
})

export type ICustomer = z.infer<typeof customerSchema>
