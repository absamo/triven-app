import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'

import Agencies from '~/app/pages/Agencies'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/agencies'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['read:agencies'])

  const agencies = await getAgencies(request)
  return {
    agencies,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:agencies' ||
        permission === 'update:agencies' ||
        permission === 'delete:agencies'
    ),
  }
}

export default function AgenciesRoute({ loaderData }: Route.ComponentProps) {
  const { agencies, permissions } = loaderData as {
    agencies: IAgency[]
    permissions: string[]
  }

  return <Agencies agencies={agencies} permissions={permissions} />
}
