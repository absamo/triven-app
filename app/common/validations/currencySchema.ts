import { z } from "zod"

export const currencySchema = z.object({
  id: z.string().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  currencyName: z.string().optional(),
  countryName: z.string().optional(),
  symbol: z.string().optional().nullable(),
  base: z.boolean().optional(),
  isoCode: z.string().optional(),
  order: z.number().optional(),
})

export type ICurrency = z.infer<typeof currencySchema>
