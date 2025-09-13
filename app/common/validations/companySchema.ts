import { z } from "zod"

import { locationSchema } from "./locationSchema"
import { currencySchema } from "./currencySchema"

export const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Company name is required"),
  location: z.lazy(() => locationSchema).optional(),
  currencies: z.array(z.lazy(() => currencySchema)).optional(),
})

export type ICompany = z.infer<typeof companySchema>
