import { z } from "zod"

export const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  editable: z.boolean().optional(),
  checkedPermission: z.string().optional(),
})

export type IRole = z.infer<typeof roleSchema>
