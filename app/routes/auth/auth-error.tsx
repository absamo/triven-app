import type { LoaderFunction } from 'react-router'
import AuthErrorPage from '~/app/pages/Auth/AuthError'
import type { Route } from './+types/auth-error'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  return {
    error,
    errorDescription,
  }
}

export default function AuthErrorRoute({ loaderData }: Route.ComponentProps) {
  return <AuthErrorPage error={loaderData.error} errorDescription={loaderData.errorDescription} />
}
