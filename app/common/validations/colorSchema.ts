import { z } from 'zod'

export const colorSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  value: z.string(),
})

export type IColor = z.infer<typeof colorSchema>
