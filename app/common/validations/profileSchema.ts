import { z } from "zod"

export const profileSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
})

export type IProfile = z.infer<typeof profileSchema>
