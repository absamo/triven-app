import { z } from "zod"
import { currencySchema } from "./currencySchema"
import { locationSchema } from "./locationSchema"

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string(),
  companyName: z.string().min(1, "Company name is required"),
  currency: z.lazy(() => currencySchema).optional(),
  location: z.lazy(() => locationSchema),
})

export type ISupplier = z.infer<typeof supplierSchema>
