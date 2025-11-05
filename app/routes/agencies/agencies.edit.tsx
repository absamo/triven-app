import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { IStore } from '~/app/common/validations/storeSchema'
import { Notification } from '~/app/components'
import AgencyForm from '~/app/pages/Agencies/AgencyForm'
import { getAgency, updateAgency } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCurrenciesByCompany } from '~/app/services/settings.server'
import { getSites } from '~/app/services/sites.server'
import type { Route } from './+types/agencies.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['update:agencies'])

  const agency = await getAgency(params.id)
  const sites = await getSites(request)
  const defaultCurrencies: ICurrency[] =
    ((await getCurrenciesByCompany(request)) as ICurrency[]) || []

  return {
    agency,
    sites,
    defaultCurrencies,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get('name') as IAgency['name']
  const sites = JSON.parse(formData.get('sites') as string)
  const location = JSON.parse(formData.get('location') as string) as IAgency['location']
  const currency = JSON.parse(formData.get('currency') as string) as IAgency['currency']

  return await updateAgency(request, {
    id: params.id,
    name,
    sites,
    currency,
    location,
  })
}

export default function EditAgencyRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { agency, sites, defaultCurrencies } = loaderData as unknown as {
    agency: IAgency
    sites: ISite[]
    defaultCurrencies: ICurrency[]
  }

  return (
    <>
      <AgencyForm
        agency={agency}
        sites={sites}
        defaultCurrencies={defaultCurrencies}
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
