import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunction,
  type ActionFunctionArgs,
} from 'react-router'

import TeamsForm from '~/app/pages/Teams/TeamsForm'
import { getTeamMember, updateTeamMember } from '~/app/services/teams.server'
import type { ITeam } from '~/app/common/validations/teamSchema'
import { getAgencies } from '~/app/services/agencies.server'
import { getRoles } from '~/app/services/roles.server'
import { Notification } from '~/app/components'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/teams.edit'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { IRole } from '~/app/common/validations/roleSchema'
import type { ISite } from '~/app/common/validations/siteSchema'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['update:users'])

  const team = await getTeamMember(params.id)
  const agencies = (await getAgencies(request)) as IAgency[]
  const sites = agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []
  const roles = await getRoles(request)

  return {
    team,
    agencies,
    sites,
    roles,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const profile = JSON.parse(formData.get('profile') as string) as ITeam['profile']

  const roleId = formData.get('roleId') as ITeam['roleId']
  const email = formData.get('email') as ITeam['email']
  const siteId = formData.get('siteId') as ITeam['siteId']
  const agencyId = formData.get('agencyId') as ITeam['agencyId']

  return await updateTeamMember(request, {
    id: params.id,
    profile,
    email,
    roleId,
    siteId,
    agencyId,
  })
}

export default function EditTeamsRoute({ loaderData, actionData }: Route.ComponentProps) {
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
