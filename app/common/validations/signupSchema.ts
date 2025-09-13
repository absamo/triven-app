import { z } from "zod"

import { profileSchema } from "./profileSchema"
import { companySchema } from "./companySchema"

export const signupSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  company: z.lazy(() => companySchema).optional(),
  profile: z.lazy(() => profileSchema).optional(),
})

export type ISignup = z.infer<typeof signupSchema>
