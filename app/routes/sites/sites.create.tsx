import type { ActionFunction, ActionFunctionArgs, LoaderFunction } from 'react-router'
import { SITE_TYPES } from '~/app/common/constants'
import type { ISite } from '~/app/common/validations/siteSchema'
import { Notification } from '~/app/components'
import SitesForm from '~/app/pages/Sites/SitesForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { createSite } from '~/app/services/sites.server'
import type { Route } from './+types/sites.create'

export const loader: LoaderFunction = async ({ request }) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['create:sites'])

  const site: Omit<ISite, 'agency'> = {
    name: '',
    location: {
      address: '',
      country: '',
      city: '',
      postalCode: '',
    },
    type: SITE_TYPES.WAREHOUSE,
  }

  return { site }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get('name') as ISite['name']
  const location = JSON.parse(formData.get('location') as string)
  const type = JSON.parse(formData.get('type') as string)

  return await createSite(request, {
    name,
    location,
    type,
  })
}

export default function CreateStoresRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { site } = loaderData as unknown as {
    site: ISite
  }

  return (
    <>
      <SitesForm
        site={site}
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
