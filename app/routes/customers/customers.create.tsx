import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type ActionFunction,
} from 'react-router'
import { getAgencies } from '~/app/services/agencies.server'
import { Notification } from '~/app/components'
import CustomerForm from '~/app/pages/Customers/CustomerForm'
import { createCustomer } from '~/app/services/customers.server'
import { type ICustomer } from '~/app/common/validations/customerSchema'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import type { Route } from './+types/customers.create'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ISite } from '~/app/common/validations/siteSchema'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  // Checks if the user has the required permissions otherwise requireUser throws an error
  const user = await requireBetterAuthUser(request, ['create:customers'])

  const agencies = (await getAgencies(request)) as IAgency[]
  const sites = agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []

  const customer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    siteId: user.siteId,
    agencyId: user.agencyId,
    shippingAddress: {
      address: '',
      country: '',
      city: '',
      postalCode: '',
    },
    billingAddress: {
      address: '',
      country: '',
      city: '',
      postalCode: '',
    },
    useBillingAddressAsShippingAddress: false,
  }

  return {
    customer,
    agencies,
    sites,
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const firstName = formData.get('firstName') as ICustomer['firstName']
  const lastName = formData.get('lastName') as ICustomer['lastName']
  const agencyId = formData.get('agencyId') as ICustomer['agencyId']
  const siteId = formData.get('siteId') as ICustomer['siteId']
  const phone = formData.get('phone') as ICustomer['phone']
  const email = JSON.parse(formData.get('email') as string) as ICustomer['email']
  const companyName = formData.get('companyName') as ICustomer['companyName']
  const billingAddress = JSON.parse(formData.get('billingAddress') as string)
  const shippingAddress = JSON.parse(formData.get('shippingAddress') as string)
  const useBillingAddressAsShippingAddress = JSON.parse(
    formData.get('useBillingAddressAsShippingAddress') as string
  )

  return await createCustomer(request, {
    firstName,
    lastName,
    email,
    phone,
    companyName,
    agencyId,
    siteId,
    billingAddress,
    shippingAddress,
    useBillingAddressAsShippingAddress,
  })
}

export default function CustomersCreateRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { customer, sites, agencies } = loaderData as unknown as {
    customer: ICustomer
    sites: ISite[]
    agencies: IAgency[]
  }

  return (
    <>
      <CustomerForm
        customer={customer}
        sites={sites}
        agencies={agencies}
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
