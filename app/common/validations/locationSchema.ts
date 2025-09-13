import { z } from "zod"

export const locationSchema = z.object({
  id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
})

export type ILocation = z.infer<typeof locationSchema>
