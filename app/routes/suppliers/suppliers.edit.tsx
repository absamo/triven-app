import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ISupplier } from '~/app/common/validations/supplierSchema'
import { Notification } from '~/app/components'
import SupplierForm from '~/app/pages/Suppliers/SupplierForm'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCurrenciesByCompany } from '~/app/services/settings.server'
import { getSupplier, updateSupplier } from '~/app/services/suppliers.server'
import type { Route } from './+types/suppliers.edit'

export const handle = { hydrate: true }

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  await requireBetterAuthUser(request, ['update:suppliers'])

  const supplier = await getSupplier(params.id)

  const defaultCurrencies: ICurrency[] =
    ((await getCurrenciesByCompany(request)) as ICurrency[]) || []

  return { supplier, defaultCurrencies }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const name = formData.get('name') as ISupplier['name']
  const companyName = formData.get('companyName') as ISupplier['companyName']
  const email = formData.get('email') as ISupplier['email']
  const phone = formData.get('phone') as ISupplier['phone']
  const location = JSON.parse(formData.get('location') as string) as ISupplier['location']

  const currency = JSON.parse(formData.get('currency') as string) as ISupplier['currency']

  return await updateSupplier(request, {
    id: params.id,
    name,
    email,
    phone,
    companyName,
    location,
    currency,
  })
}

export default function EditSuppliersRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { supplier, defaultCurrencies } = loaderData as {
    supplier: ISupplier
    defaultCurrencies: ICurrency[]
  }

  return (
    <>
      <SupplierForm
        supplier={supplier}
        defaultCurrencies={defaultCurrencies}
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
