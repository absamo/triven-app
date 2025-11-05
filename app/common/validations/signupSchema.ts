import { z } from 'zod'
import { companySchema } from './companySchema'
import { profileSchema } from './profileSchema'

export const signupSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  company: z.lazy(() => companySchema).optional(),
  profile: z.lazy(() => profileSchema).optional(),
})

export type ISignup = z.infer<typeof signupSchema>
