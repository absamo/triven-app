import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'

import { getSitesByAgency } from '~/app/services/sites.server'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  const sites = await getSitesByAgency(request, params.id)
  return { sites }
}
