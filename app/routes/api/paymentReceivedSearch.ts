import { type LoaderFunctionArgs, type LoaderFunction } from 'react-router'

import { getFilteredPaymentsReceived } from '~/app/services/payments.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = JSON.parse(url.searchParams.get('search') as string) as string

  const statuses =
    (JSON.parse(url.searchParams.get('statuses') as string) as unknown as string[]) || []

  const invoices =
    (JSON.parse(url.searchParams.get('invoices') as string) as unknown as string[]) || []

  const paymentDate = JSON.parse(url.searchParams.get('date') as string) as Date | null

  const paymentsReceived = await getFilteredPaymentsReceived(request, {
    search,
    statuses,
    invoices,
    paymentDate,
  })

  return { paymentsReceived }
}
