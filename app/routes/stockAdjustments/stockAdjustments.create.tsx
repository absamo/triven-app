import dayjs from 'dayjs'
import randomize from 'randomatic'
import type { ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from 'react-router'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { IStockAdjustment } from '~/app/common/validations/stockAdjustmentsSchema'
import { Notification } from '~/app/components'
import StockAdjustmentForm from '~/app/pages/StockAdjustments/StockAdjustmentForm'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getProducts } from '~/app/services/products.server'
import { createAdjustment } from '~/app/services/stockAdjustment.server'
import type { Route } from './+types/stockAdjustments.create'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['update:stockAdjustments'])

  const adjustment = {
    id: '',
    notes: '',
    reason: '',
    reference: randomize('A0', 8),
    date: dayjs().toDate(),
    siteId: '',
  }

  const agencies = (await getAgencies(request)) as IAgency[]
  const sites = agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []
  const products = await getProducts(request)

  return { adjustment, sites, products }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const reason = formData.get('reason') as IStockAdjustment['reason']
  const siteId = formData.get('siteId') as IStockAdjustment['siteId']
  const reference = formData.get('reference') as IStockAdjustment['reference']
  const notes = formData.get('notes') as IStockAdjustment['notes']
  const date = JSON.parse(formData.get('date') as string) as IStockAdjustment['date']

  const products = JSON.parse(formData.get('products') as string) as IStockAdjustment['products']

  return await createAdjustment(request, {
    reason,
    siteId,
    reference,
    notes,
    date,
    products,
  })
}

export default function CreateAdjustmentsRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { adjustment, sites, products } = loaderData as unknown as {
    adjustment: IStockAdjustment
    sites: ISite[]
    products: Omit<IProduct, 'stockAdjustmentHistories'>[]
  }

  return (
    <>
      <StockAdjustmentForm
        adjustment={adjustment}
        sites={sites}
        products={products}
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
