import { z } from 'zod'

import { USER_STATUSES } from '~/app/common/constants'
import { agencySchema } from './agencySchema'
import { companySchema } from './companySchema'
import { profileSchema } from './profileSchema'
import { roleSchema } from './roleSchema'
import { siteSchema } from './siteSchema'

export const userSchema = z.object({
  id: z.string().optional(),
  active: z.boolean().optional(),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  // role: z.nativeEnum(USER_ROLES, {
  //   errorMap: () => ({
  //     message: "Role is required",
  //   }),
  // }),
  password: z.string().min(1, 'Password is required'),
  status: z.nativeEnum(USER_STATUSES).optional(),
  company: z.lazy(() => companySchema).optional(),
  profile: z.lazy(() => profileSchema).optional(),
  companyId: z.string(),
  siteId: z.string().min(1, 'Site is required'),
  agencyId: z.string().min(1, 'Agency is required'),
  role: z.lazy(() => roleSchema).optional(),
  agency: z.lazy(() => agencySchema).optional(),
  site: z.lazy(() => siteSchema).optional(),
  roleId: z.string().min(1, 'Role is required'),
  receivedInvitations: z.array(z.object({ token: z.string() }).optional()).optional(),
  isOnline: z.boolean().optional(),
  lastOnlineAt: z.coerce.date().optional(),
  customerId: z.string().optional(),
  currentPlan: z.string().optional(),
  planStatus: z.string().optional(),
  trialPeriodDays: z.number().optional(),
})

export type IUser = z.infer<typeof userSchema>
