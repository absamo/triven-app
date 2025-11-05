import { z } from 'zod'
import { SITE_TYPES } from '../constants'
import { agencySchema } from './agencySchema'
import { locationSchema } from './locationSchema'

export const siteSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Site name is required'),
  agency: z.lazy(() => agencySchema)?.optional(),
  type: z.nativeEnum(SITE_TYPES).optional(),
  users: z.array(z.object({})).optional(),
  location: z.lazy(() => locationSchema)?.optional(),
  products: z.array(z.object({})).optional(),
})

export type ISite = z.infer<typeof siteSchema>
