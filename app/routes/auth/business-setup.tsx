import type { ActionFunction, LoaderFunction } from 'react-router'
import { redirect } from 'react-router'
import BusinessSetup from '~/app/pages/Auth/BusinessSetup'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import { completeBusinessSetup } from '~/app/services/business-setup.server'

export const loader: LoaderFunction = async ({ request }): Promise<{ user: any } | Response> => {
  const url = new URL(request.url)
  const isVerified = url.searchParams.get('verified') === 'true'
  const userId = url.searchParams.get('userId')
  const email = url.searchParams.get('email')

  // Get the user to check their status
  const user = await getBetterAuthUser(request)

  // If user is verified but no session exists, redirect to login with helpful message
  if (!user && isVerified) {
    return redirect(
      `/login?verified=true&message=Email verified successfully! Please sign in to continue.${email ? `&email=${encodeURIComponent(email)}` : ''}`
    )
  }

  if (!user) {
    return redirect('/login')
  }

  // If user already has business setup, redirect to dashboard
  if (user.companyId && user.roleId && user.agencyId && !user.needsBusinessSetup) {
    return redirect('/dashboard')
  }

  return { user }
}

export const action: ActionFunction = async ({
  request,
}): Promise<{ error?: string } | Response> => {
  const user = await getBetterAuthUser(request)

  if (!user) {
    return redirect('/login')
  }

  const formData = await request.formData()
  const companyName = formData.get('companyName') as string
  const companyCountry = formData.get('companyCountry') as string
  const companyCity = formData.get('companyCity') as string
  const companyAddress = formData.get('companyAddress') as string
  const companyPostalCode = formData.get('companyPostalCode') as string
  const agencyName = formData.get('agencyName') as string
  const warehouseName = formData.get('warehouseName') as string
  const warehouseAddress = formData.get('warehouseAddress') as string
  const warehouseCity = formData.get('warehouseCity') as string
  const warehouseCountry = formData.get('warehouseCountry') as string
  const warehousePostalCode = formData.get('warehousePostalCode') as string
  const defaultCurrency = formData.get('defaultCurrency') as string

  try {
    await completeBusinessSetup(user.id, {
      companyName,
      companyCountry,
      companyCity,
      companyAddress,
      companyPostalCode,
      agencyName,
      warehouseName,
      warehouseAddress,
      warehouseCity,
      warehouseCountry,
      warehousePostalCode,
      defaultCurrency,
    })

    return redirect('/dashboard')
  } catch (error) {
    return {
      error: 'Failed to complete business setup. Please try again.',
    }
  }
}

export default function BusinessSetupRoute({
  loaderData,
  actionData,
}: {
  loaderData: { user: any }
  actionData: { error?: string }
}) {
  return <BusinessSetup user={loaderData?.user} error={actionData?.error} />
}
