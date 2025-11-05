import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import { USER_ROLES } from '~/app/common/constants'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ICustomer } from '~/app/common/validations/customerSchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import { Notification } from '~/app/components'
import SalesOrdersForm from '~/app/pages/SalesOrders/SalesOrdersForm'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCustomers } from '~/app/services/customers.server'
import { getProducts, getProductsForAgency } from '~/app/services/products.server'
import { getSalesOrder, updateSalesOrder } from '~/app/services/sales.server'
import type { Route } from './+types/salesOrders.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['update:salesOrders'])

  const salesOrder = await getSalesOrder(params.id)
  const agencies = (await getAgencies(request)) as IAgency[]

  // For admin users, include all sites from all agencies
  // For non-admin users, only include sites from their agency
  const sites =
    user.role?.name === USER_ROLES.ADMIN
      ? agencies?.flatMap((agency: IAgency) => agency.sites || []) || []
      : agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []

  const customers = await getCustomers(request)

  // For admin users, get all products from all agencies using getProductsForAgency with "All"
  // For non-admin users, get products using the regular getProducts function with allSites
  const products =
    user.role?.name === USER_ROLES.ADMIN
      ? await getProductsForAgency(request, 'All')
      : await getProducts(request, { allSites: true, limit: 1000 }) // Load products from all sites

  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    salesOrder,
    customers,
    agencies,
    sites,
    products,
    currency: baseCurrency,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const salesOrderReference = formData.get(
    'salesOrderReference'
  ) as ISalesOrder['salesOrderReference']
  const paymentTerms = JSON.parse(
    formData.get('paymentTerms') as string
  ) as ISalesOrder['paymentTerms']
  const orderDate = JSON.parse(formData.get('orderDate') as string) as ISalesOrder['orderDate']
  const customerId = formData.get('customerId') as ISalesOrder['customerId']
  const siteId = formData.get('siteId') as ISalesOrder['siteId']
  const agencyId = formData.get('agencyId') as ISalesOrder['agencyId']
  const expectedShipmentDate = JSON.parse(
    formData.get('expectedShipmentDate') as string
  ) as ISalesOrder['expectedShipmentDate']

  const salesOrderItems = JSON.parse(
    formData.get('salesOrderItems') as string
  ) as ISalesOrder['salesOrderItems']

  return await updateSalesOrder(request, {
    id: params.id,
    salesOrderReference,
    paymentTerms,
    orderDate,
    customerId,
    agencyId,
    siteId,
    expectedShipmentDate,
    salesOrderItems,
  })
}

export default function SalesOrdersEditRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { salesOrder, agencies, customers, currency, sites, products } = loaderData as unknown as {
    salesOrder: ISalesOrder
    agencies: IAgency[]
    customers: ICustomer[]
    currency: ICurrency
    sites: ISite[]
    products: IProduct[]
  }

  return (
    <>
      <SalesOrdersForm
        salesOrder={salesOrder}
        agencies={agencies}
        sites={sites}
        customers={customers}
        products={products}
        currency={currency}
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
