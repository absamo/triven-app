import { z } from "zod"

import { userSchema } from "~/app/common/validations/userSchema"

export const teamSchema = z.lazy(() =>
  userSchema.pick({
    id: true,
    active: true,
    profile: true,
    email: true,
    role: true,
    siteId: true,
    agencyId: true,
    status: true,
    roleId: true,
    site: true,
    agency: true,
    receivedInvitations: true,
    isOnline: true,
    lastOnlineAt: true,
  })
)

export type ITeam = z.infer<typeof teamSchema>
