import { z } from 'zod'
import { currencySchema } from './currencySchema'
import { locationSchema } from './locationSchema'

export const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Company name is required'),
  location: z.lazy(() => locationSchema).optional(),
  currencies: z.array(z.lazy(() => currencySchema)).optional(),
})

export type ICompany = z.infer<typeof companySchema>
