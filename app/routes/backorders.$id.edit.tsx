import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from 'react-router'
import { USER_ROLES } from '~/app/common/constants'
import type { IAgency } from '~/app/common/validations/agencySchema'
import { Notification } from '~/app/components'
import BackorderEdit from '~/app/pages/Backorders/BackorderEdit'
import { getAgencies } from '~/app/services/agencies.server'
import { getBackorder, updateBackorder } from '~/app/services/backorders.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCustomers } from '~/app/services/customers.server'
import { getProducts, getProductsForAgency } from '~/app/services/products.server'
import { getSites } from '~/app/services/sites.server'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireBetterAuthUser(request, ['update:backorders'])
  const backorderId = params.id as string

  const [backorder, customers, agencies] = await Promise.all([
    getBackorder(request, backorderId),
    getCustomers(request),
    getAgencies(request) as Promise<IAgency[]>,
  ])

  // For admin users, get all products and sites from all agencies
  // For non-admin users, get products and sites filtered by their agency
  const [products, sites] = await Promise.all([
    user.role?.name === USER_ROLES.ADMIN
      ? getProductsForAgency(request, 'All')
      : getProducts(request, { allSites: true, limit: 1000 }), // Get products from all sites for backorders
    user.role?.name === USER_ROLES.ADMIN
      ? getSites(request) // Get all sites for admin
      : agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || [], // Get only user's agency sites
  ])

  return {
    backorder,
    customers,
    agencies,
    products,
    sites,
    permissions: user?.role?.permissions || [],
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const backorderData = JSON.parse(formData.get('backorderData') as string)
  const backorderId = params.id as string

  return await updateBackorder(request, { backorderId, ...backorderData })
}

export default function BackorderEditRoute({ loaderData, actionData }: any) {
  const { backorder, customers, agencies, products, sites, permissions } = loaderData

  return (
    <>
      <BackorderEdit
        backorder={backorder}
        customers={customers}
        agencies={agencies}
        products={products}
        sites={sites}
        errors={actionData?.errors || {}}
      />
      {actionData && (
        <Notification
          notification={
            (
              actionData as {
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
