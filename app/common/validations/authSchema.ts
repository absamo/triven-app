import { z } from "zod"

import { profileSchema } from "./profileSchema"
import { companySchema } from "./companySchema"

export const loginSchema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
})

export const passwordSchema = z.object({
  hash: z.string(),
})

export const signupSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  company: companySchema.pick({ name: true, location: true }).optional(),
  profile: profileSchema
    .pick({ firstName: true, lastName: true, phone: true })
    .optional(),
  userPlan: z.string().optional(),
})

export type ILogin = z.infer<typeof loginSchema>
export type IPassword = z.infer<typeof passwordSchema>
export type ISignup = z.infer<typeof signupSchema>
