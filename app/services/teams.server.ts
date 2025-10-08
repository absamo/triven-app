import { render } from '@react-email/render'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import { Resend } from 'resend'

import { INVITATION_STATUSES, USER_ROLES, USER_STATUSES } from '~/app/common/constants'
import { type IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import { type ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import type { ITeam } from '~/app/common/validations/teamSchema'
import { type IUser } from '~/app/common/validations/userSchema'
import { InviteUserEmail } from '~/app/components/Email/UserInvite'
import { prisma } from '~/app/db.server'
import { getBetterAuthUser, getUserByEmail } from '~/app/services/better-auth.server'
import { syncOnlineStatusWithSessions } from '~/app/services/session-based-online-status.server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function getTeamMembers(request: Request) {
  const user = await getBetterAuthUser(request)
  if (!user?.id || !user.companyId) {
    return null
  }

  // Sync online status with active sessions first
  await syncOnlineStatusWithSessions()

  // Get ALL team members and their session-based online status
  const now = new Date()

  const members = await prisma.user.findMany({
    where: { companyId: user.companyId },
    include: {
      site: true,
      agency: true,
      profile: true,
      role: true,
      sessions: {
        where: {
          expiresAt: {
            gt: now, // Only get active sessions
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1, // Get the most recent active session
      },
    },
    orderBy: [
      { active: 'desc' }, // Active users first
      { createdAt: 'desc' }, // Then by creation date (stable order)
    ],
  })

  // Map members with accurate online status based on active sessions
  const membersWithOnlineStatus = members.map((member) => ({
    ...member,
    isOnline: member.sessions.length > 0, // User is online if they have active sessions
    lastOnlineAt: member.sessions[0]?.updatedAt || member.lastOnlineAt, // Use session update time or fallback to stored lastOnlineAt
  }))

  // Sort to show online users first, with most recent connection first
  const sortedMembers = membersWithOnlineStatus.sort((a, b) => {
    // First sort by active status (active users first)
    if (a.active !== b.active) {
      return a.active ? -1 : 1
    }

    // Then sort by online status (online users first)
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1
    }

    // Within online users: sort by most recent activity (lastOnlineAt)
    if (a.isOnline && b.isOnline) {
      const aLastOnline = a.lastOnlineAt ? new Date(a.lastOnlineAt).getTime() : 0
      const bLastOnline = b.lastOnlineAt ? new Date(b.lastOnlineAt).getTime() : 0
      return bLastOnline - aLastOnline // Most recent first
    }

    // Within offline users: sort by most recent activity (lastOnlineAt)
    if (!a.isOnline && !b.isOnline) {
      const aLastOnline = a.lastOnlineAt ? new Date(a.lastOnlineAt).getTime() : 0
      const bLastOnline = b.lastOnlineAt ? new Date(b.lastOnlineAt).getTime() : 0
      return bLastOnline - aLastOnline // Most recent first
    }

    // Fallback to creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return sortedMembers || []
}
export async function getTeamMember(teamMemberId: ITeam['id']) {
  const teamMember = await prisma.user.findUnique({
    where: { id: teamMemberId },
    include: {
      profile: {
        select: { firstName: true, lastName: true, avatar: true, phone: true },
      },
    },
  })

  return teamMember
}

export async function createTeamMember(
  request: Request,
  member: Pick<ITeam, 'email' | 'roleId' | 'siteId' | 'profile' | 'agencyId'>
) {
  const user = await getBetterAuthUser(request)
  if (!user?.id || !user.companyId) {
    return null
  }

  const existingUser = await getUserByEmail(member.email)

  if (existingUser) {
    return {
      errors: {
        email: 'A user already exists with this email',
      },
    }
  }

  // Set the validity of the invitation to 7 days from the current date
  const validity = dayjs().add(7, 'day').toDate()

  const token = nanoid()

  const createdUser = await prisma.user.create({
    data: {
      company: {
        connect: { id: user.companyId },
      },
      email: member.email,
      role: { connect: { id: member.roleId } },
      status: USER_STATUSES.PENDING,
      profile: {
        create: {
          firstName: member.profile?.firstName || '',
          lastName: member.profile?.lastName || '',
          avatar: member.profile?.avatar,
          phone: member.profile?.phone,
        },
      },
      site: {
        connect: { id: member.siteId },
      } as any,
      agency: {
        connect: { id: member.agencyId },
      } as any,
      receivedInvitations: {
        create: {
          email: member.email,
          inviterId: user.id,
          token,
          status: INVITATION_STATUSES.INVITED,
          validity,
        },
      },
    },
    include: {
      receivedInvitations: {
        select: {
          email: true,
          inviterId: true,
          status: true,
          validity: true,
          token: true,
        },
      },
      profile: true,
    },
  })

  return createdUser
}

export async function updateTeamMember(
  request: Request,
  {
    id: userIdToUpdate,
    email,
    roleId,
    siteId,
    profile,
    agencyId,
  }: Pick<ITeam, 'id' | 'email' | 'roleId' | 'siteId' | 'profile' | 'agencyId'>
) {
  const connectedUser = await getBetterAuthUser(request)

  if (!connectedUser?.id) {
    return null
  }

  const members = await prisma.user.findMany({
    where: { companyId: connectedUser.companyId },
    include: {
      role: true,
    },
  })

  const currentRole = await prisma.role.findUnique({ where: { id: roleId } })

  if (
    members.filter(({ role, id }) => role?.name === USER_ROLES.ADMIN && id !== userIdToUpdate)
      .length === 0 &&
    currentRole?.name !== USER_ROLES.ADMIN
  ) {
    return {
      errors: {
        roleId: 'At least one registered admin is required in the company',
      },
    }
  }

  const existingUser = await getUserByEmail(email)

  if (existingUser && existingUser.id !== userIdToUpdate) {
    return {
      errors: {
        email: 'A user already exists with this email',
      },
    }
  }

  const user = (await prisma.user.findUnique({
    where: { id: userIdToUpdate },
  })) as unknown as IUser & {
    site: { salesOrders: ISalesOrder[]; purchaseOrders: IPurchaseOrder[] }
  }

  if (!user) {
    const url = new URL(request.url)
    return {
      notification: {
        message: 'Team member not found',
        status: 'Error',
        redirectTo: url,
      },
    }
  }

  if (user.site?.salesOrders?.length > 0 && siteId !== user.siteId) {
    return {
      errors: {
        siteId:
          'User cannot be moved to a different site as they have sales orders in the current site',
      },
    }
  }

  if (user.site?.purchaseOrders?.length > 0 && siteId !== user.siteId) {
    return {
      errors: {
        siteId:
          'User cannot be moved to a different site as they have purchase orders in the current site',
      },
    }
  }

  try {
    await prisma.user.update({
      where: { id: userIdToUpdate },
      data: {
        role: { connect: { id: roleId } },
        site: {
          connect: { id: siteId },
        },
        agency: {
          connect: { id: agencyId },
        },
        profile: {
          update: {
            ...profile,
          },
        },
      },
    })

    return {
      notification: {
        message: 'Team member updated successfully',
        status: 'Success',
        redirectTo: '/teams',
      },
    }
  } catch {
    return {
      notification: {
        message: 'Team member could not be updated',
        status: 'Error',
      },
    }
  }
}

export async function deactivateTeamMember(request: Request, userId: ITeam['id']) {
  const connectedUser = await getBetterAuthUser(request)

  if (!connectedUser?.id) {
    return null
  }

  const members = await prisma.user.findMany({
    where: { companyId: connectedUser.companyId },
    include: {
      role: true,
    },
  })

  // Check if this is the last admin
  const userToDeactivate = members.find((member) => member.id === userId)
  const isCurrentUserAdmin = userToDeactivate?.role?.name === USER_ROLES.ADMIN
  const adminCount = members.filter((member) => member.role?.name === USER_ROLES.ADMIN).length

  if (isCurrentUserAdmin && adminCount <= 1) {
    return {
      errors: {
        general: 'Cannot deactivate the last admin user in the company',
      },
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: false,
      },
    })

    return {
      notification: {
        message: 'Team member deactivated successfully',
        status: 'Success',
        redirectTo: '/teams',
      },
    }
  } catch {
    return {
      notification: {
        message: 'Team member could not be deactivated',
        status: 'Error',
      },
    }
  }
}

export async function activateTeamMember(request: Request, userId: ITeam['id']) {
  const connectedUser = await getBetterAuthUser(request)

  if (!connectedUser?.id) {
    return null
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        active: true,
      },
    })

    return {
      notification: {
        message: 'Team member activated successfully',
        status: 'Success',
        redirectTo: '/teams',
      },
    }
  } catch {
    return {
      notification: {
        message: 'Team member could not be activated',
        status: 'Error',
      },
    }
  }
}

export async function resendInvitation(request: Request, userId: ITeam['id']) {
  const connectedUser = await getBetterAuthUser(request)

  if (!connectedUser?.id) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        receivedInvitations: {
          where: {
            status: INVITATION_STATUSES.INVITED,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!user) {
      return {
        notification: {
          message: 'Team member not found',
          status: 'Error',
        },
      }
    }

    // Only allow resending for pending users
    if (user.status !== USER_STATUSES.PENDING) {
      return {
        notification: {
          message: 'Can only resend invitations for pending users',
          status: 'Error',
        },
      }
    }

    const currentInvitation = user.receivedInvitations[0]
    if (!currentInvitation) {
      return {
        notification: {
          message: 'No pending invitation found for this user',
          status: 'Error',
        },
      }
    }

    // Create new invitation with new token and validity
    const validity = dayjs().add(7, 'day').toDate()
    const token = nanoid()

    await prisma.invitation.update({
      where: { id: currentInvitation.id },
      data: {
        token,
        validity,
        status: INVITATION_STATUSES.INVITED,
      },
    })

    // Send invitation email
    try {
      const inviteLink = `${process.env.BASE_URL}/invite?invite=${token}`

      const emailHtml = await render(
        InviteUserEmail({
          inviteLink,
          username: user.profile?.firstName || '',
          invitedByUsername: connectedUser?.profile?.firstName || '',
          invitedByEmail: connectedUser?.email || '',
          teamName: connectedUser?.company?.name || '',
        })
      )

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Triven <onboarding@resend.dev>',
        to: [user.email],
        subject: `${connectedUser?.profile?.firstName} resent your invitation to join ${connectedUser?.company?.name}`,
        html: emailHtml,
      })
    } catch (emailError) {
      // Log the error but don't fail the entire operation
      console.error('Failed to send invitation email:', emailError)
    }

    return {
      notification: {
        message: 'Invitation resent successfully',
        status: 'Success',
        redirectTo: '/teams',
      },
    }
  } catch {
    return {
      notification: {
        message: 'Could not resend invitation',
        status: 'Error',
      },
    }
  }
}
