import { z } from "zod"

import { locationSchema } from "./locationSchema"
import { currencySchema } from "./currencySchema"

export const agencySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Agency name is required"),
  location: z.lazy(() => locationSchema).optional(),
  currency: z.lazy(() => currencySchema).optional(),
  sites: z.array(z.object({ name: z.string(), id: z.string() })).optional(),
})

export type IAgency = z.infer<typeof agencySchema>
