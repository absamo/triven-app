import { z } from "zod"
import { agencySchema } from "./agencySchema"
import { locationSchema } from "./locationSchema"

export const storeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Store name is required"),
  agency: z.lazy(() => agencySchema)?.optional(),
  users: z.array(z.object({})).optional(),
  location: z.lazy(() => locationSchema)?.optional(),
  products: z.array(z.object({})).optional(),
})

export type IStore = z.infer<typeof storeSchema>
