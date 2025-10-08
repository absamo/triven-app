import { z } from 'zod'

export const permissionSchema = z.object({
  id: z.string().optional(),
  access: z.array(z.string()).optional(),
  productsAccess: z.array(z.string()).optional(),
  stocksAccess: z.array(z.string()).optional(),
})

export type IPermission = z.infer<typeof permissionSchema>
