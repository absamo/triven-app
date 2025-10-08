import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'

import type { ISite } from '~/app/common/validations/siteSchema'
import type { IStockAdjustment } from '~/app/common/validations/stockAdjustmentsSchema'
import StockAdjustments from '~/app/pages/StockAdjustments'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getSites } from '~/app/services/sites.server'
import { getStockAdjustments } from '~/app/services/stockAdjustment.server'
import type { Route } from './+types/stockAdjustments'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireBetterAuthUser(request, ['read:stockAdjustments'])

  const adjustments = await getStockAdjustments(request)
  const sites = await getSites(request)

  return {
    adjustments,
    sites,
    permissions: user?.role.permissions.filter(
      (permission) =>
        permission === 'create:stockAdjustments' ||
        permission === 'update:stockAdjustments' ||
        permission === 'delete:stockAdjustments'
    ),
  }
}

export default function StockAdjustmentsRoute({ loaderData }: Route.ComponentProps) {
  const { adjustments, sites, permissions } = loaderData as unknown as {
    adjustments: IStockAdjustment[]
    sites: ISite[]
    permissions: string[]
  }

  return <StockAdjustments adjustments={adjustments} sites={sites} permissions={permissions} />
}
