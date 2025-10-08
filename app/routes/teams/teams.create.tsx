import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from 'react-router'

import { render } from '@react-email/components'
import { Resend } from 'resend'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { IProfile } from '~/app/common/validations/profileSchema'
import type { IRole } from '~/app/common/validations/roleSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { ITeam } from '~/app/common/validations/teamSchema'
import { Notification } from '~/app/components'
import { InviteUserEmail } from '~/app/components/Email/UserInvite'
import TeamsForm from '~/app/pages/Teams/TeamsForm'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getRoles } from '~/app/services/roles.server'
import { createTeamMember } from '~/app/services/teams.server'
import type { Route } from './+types/teams.create'

const resend = new Resend(process.env.VITE_RESEND_API_KEY)

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['create:users'])

  const team: Omit<ITeam, 'status'> = {
    profile: { firstName: '', lastName: '', phone: '' },
    email: '',
    siteId: '',
    agencyId: '',
    roleId: '',
  }

  const agencies = (await getAgencies(request)) as IAgency[]
  const sites = agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []
  const roles = await getRoles(request)

  return { team, agencies, sites, roles }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData()
    const profile = JSON.parse(formData.get('profile') as string) as IProfile
    const email = formData.get('email') as ITeam['email']
    const roleId = formData.get('roleId') as ITeam['roleId']
    const siteId = formData.get('siteId') as ITeam['siteId']
    const agencyId = formData.get('agencyId') as ITeam['agencyId']

    const memberToInvite = (await createTeamMember(request, {
      email,
      profile,
      roleId,
      siteId,
      agencyId,
    })) as ITeam

    // Create invitation link that directs to signup with invitation context
    const inviteLink = `${process.env.BASE_URL}/invite?invite=${memberToInvite?.receivedInvitations?.[0]?.token}`

    const loggedInUser = await requireBetterAuthUser(request, ['create:sites'])

    const emailHtml = await render(
      <InviteUserEmail
        inviteLink={inviteLink}
        username={memberToInvite?.profile?.firstName || ''}
        invitedByUsername={loggedInUser?.profile?.firstName || ''}
        invitedByEmail={loggedInUser?.email}
        teamName={loggedInUser?.company?.name}
      />
    )

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <onboarding@resend.dev>',
      to: [memberToInvite.email],
      subject: `${loggedInUser?.profile?.firstName || 'Someone'} invited you to join ${loggedInUser?.company?.name || 'TRIVEN'}`,
      html: emailHtml,
    })

    return {
      notification: {
        message: 'Team member successfully invited',
        status: 'Success',
        redirectTo: '/teams',
      },
    }
  } catch (error) {
    return {
      notification: {
        message: 'Team member could not be created',
        status: 'Error',
      },
    }
  }
}

export default function CreateTeamsRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { team, sites, agencies, roles } = loaderData as unknown as {
    team: ITeam
    sites: ISite[]
    agencies: IAgency[]
    roles: IRole[]
  }

  return (
    <>
      <TeamsForm
        team={team}
        sites={sites}
        agencies={agencies}
        roles={roles}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
      />
      {actionData && (
        <Notification
          notification={
            (
              actionData as unknown as {
                notification: {
                  message: string | null
                  status: 'Success' | 'Warning' | 'Error' | null
                  redirectTo?: string | null
                  autoClose?: boolean
                }
              }
            )?.notification
          }
        />
      )}
    </>
  )
}
