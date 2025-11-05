import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'

import { getFilteredSuppliers } from '~/app/services/suppliers.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const suppliers = await getFilteredSuppliers(request)
  return { suppliers }
}
