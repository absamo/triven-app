import {
  type ActionFunction,
  type ActionFunctionArgs,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from 'react-router'

import {
  PURCHASE_ORDER_PAYMENT_TERMS,
  PURCHASE_ORDER_STATUSES,
  USER_ROLES,
} from '~/app/common/constants'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import { Notification } from '~/app/components'
import PurchaseOrdersForm from '~/app/pages/PurchaseOrders/PurchaseOrdersForm'
import { getAgencies } from '~/app/services/agencies.server'
import { getProducts, getProductsForAgency } from '~/app/services/products.server'
import { createPurchaseOrder, getMaxPurchaseOrderNumber } from '~/app/services/purchases.server'
import { getSuppliers } from '~/app/services/suppliers.server'

import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISupplier } from '~/app/common/validations/supplierSchema'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/purchaseOrders.create'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['create:purchaseOrders'])

  const purchaseOrderReference = await getMaxPurchaseOrderNumber(request)

  const purchaseOrder = {
    purchaseOrderReference: `PO-${purchaseOrderReference}`,
    supplierId: '',
    siteId: user.siteId,
    agencyId: user.agencyId,
    orderDate: new Date(),
    paymentTerms: PURCHASE_ORDER_PAYMENT_TERMS.DUEONRECEIPT,
    status: PURCHASE_ORDER_STATUSES.PENDING,
    purchaseItems: [],
    bills: [],
    notes: '',
  }

  const agencies = (await getAgencies(request)) as IAgency[]
  const suppliers = await getSuppliers(request)

  // For admin users, get all products from all agencies using getProductsForAgency with "All"
  // For non-admin users, get products using the regular getProducts function
  const products =
    user.role?.name === USER_ROLES.ADMIN
      ? await getProductsForAgency(request, 'All')
      : await getProducts(request)

  // For admin users, include all sites from all agencies
  // For non-admin users, only include sites from their agency
  const sites =
    user.role?.name === USER_ROLES.ADMIN
      ? agencies?.flatMap((agency: IAgency) => agency.sites || []) || []
      : agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []

  const baseCurrency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    purchaseOrder,
    agencies,
    sites,
    suppliers,
    products,
    currency: baseCurrency,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const purchaseOrderReference = formData.get(
    'purchaseOrderReference'
  ) as IPurchaseOrder['purchaseOrderReference']
  const paymentTerms = JSON.parse(
    formData.get('paymentTerms') as string
  ) as IPurchaseOrder['paymentTerms']
  const orderDate = JSON.parse(formData.get('orderDate') as string) as IPurchaseOrder['orderDate']
  const supplierId = formData.get('supplierId') as IPurchaseOrder['supplierId']
  const siteId = formData.get('siteId') as IPurchaseOrder['siteId']
  const agencyId = formData.get('agencyId') as IPurchaseOrder['agencyId']
  const expectedDeliveryDate = JSON.parse(
    formData.get('orderDate') as string
  ) as IPurchaseOrder['expectedDeliveryDate']

  const purchaseOrderItems = JSON.parse(
    formData.get('purchaseOrderItems') as string
  ) as IPurchaseOrder['purchaseOrderItems']

  return await createPurchaseOrder(request, {
    purchaseOrderReference,
    paymentTerms,
    orderDate,
    supplierId,
    agencyId,
    siteId,
    expectedDeliveryDate,
    purchaseOrderItems,
  })
}

export default function PurchaseOrdersCreateRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { purchaseOrder, agencies, sites, suppliers, products, currency } =
    loaderData as unknown as {
      purchaseOrder: IPurchaseOrder
      agencies: IAgency[]
      sites: []
      suppliers: ISupplier[]
      products: IProduct[]
      currency: ICurrency
    }

  return (
    <>
      <PurchaseOrdersForm
        purchaseOrder={purchaseOrder}
        agencies={agencies}
        sites={sites}
        suppliers={suppliers}
        products={products}
        currency={currency}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
      />
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
    </>
  )
}
