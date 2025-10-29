import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router'
import { INVITATION_STATUSES, USER_STATUSES } from '~/app/common/constants'
import { prisma } from '~/app/db.server'
import { auth } from '~/app/lib/auth.server'
import JoinTeam from '~/app/pages/JoinTeam'
import { getUserInvitationByToken } from '~/app/services/better-auth.server'

export { JoinTeam as default }

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('invite')

  if (!token) {
    return {
      invitation: null,
      error: 'No invitation token provided',
    }
  }

  try {
    // Get invitation details
    const invitation = (await getUserInvitationByToken(token)) as {
      id: string
      email: string
      inviterId: string
      validity?: Date
      token: string
      status: (typeof INVITATION_STATUSES)[keyof typeof INVITATION_STATUSES]
      invitee: {
        profile: {
          firstName: string
          lastName: string
        }
        company: {
          name: string
        }
      } | null
      inviter: {
        profile: {
          firstName: string
          lastName: string
        }
        company: {
          name: string
        }
      } | null
    }

    if (!invitation) {
      return {
        invitation: null,
        error: 'Invalid or expired invitation',
      }
    }

    if (invitation.status !== INVITATION_STATUSES.INVITED) {
      return {
        invitation: null,
        error: 'This invitation has already been used or cancelled',
      }
    }

    // Check if invitation is still valid (within 7 days)
    const now = new Date()
    if (invitation.validity && invitation.validity < now) {
      return {
        invitation: null,
        error: 'This invitation has expired',
      }
    }

    return {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        inviterName: `${invitation.inviter?.profile?.firstName} ${invitation.inviter?.profile?.lastName}`,
        companyName: invitation.inviter?.company?.name,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error loading invitation:', error)
    return {
      invitation: null,
      error: 'An error occurred while processing your invitation',
    }
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const token = formData.get('token') as string
  const password = formData.get('password') as string

  if (!token || !password) {
    return {
      error: 'Missing required information',
    }
  }

  try {
    // Get invitation details
    const invitation = await getUserInvitationByToken(token)

    if (!invitation || invitation.status !== INVITATION_STATUSES.INVITED) {
      return {
        error: 'Invalid or expired invitation',
      }
    }

    // Check if invitation is still valid
    const now = new Date()
    if (invitation.validity && invitation.validity < now) {
      return {
        error: 'This invitation has expired',
      }
    }

    // Find the existing user by email (should exist from team member creation)
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: {
        profile: true,
      },
    })

    if (!existingUser) {
      return {
        error: 'User not found',
      }
    }

    // Create Account record for better-auth with password
    // Using better-auth's password hashing for compatibility
    const ctx = await auth.$context
    const hashedPassword = await ctx.password.hash(password)

    // Create Account record to link better-auth to business user
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        accountId: existingUser.id,
        providerId: 'credential',
        password: hashedPassword,
        accessToken: null,
        refreshToken: null,
      },
    })

    // Update the user status and mark as email verified
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: true,
        status: USER_STATUSES.REGISTERED,
      },
    })

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: INVITATION_STATUSES.ACCEPTED,
        inviteeId: existingUser.id,
      },
    })

    // Redirect to login page
    return redirect('/login')
  } catch (error) {
    console.error('Error processing join team:', error)
    return {
      error: 'An error occurred while joining the team',
    }
  }
}
