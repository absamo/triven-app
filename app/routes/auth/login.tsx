import type { LoaderFunction } from 'react-router'
import { redirect } from 'react-router'
import { auth } from '~/app/lib/auth.server'
import Login from '~/app/pages/Login/Login'

export const loader: LoaderFunction = async ({ request }) => {
  // Check if user is already authenticated with a valid session
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (session?.user) {
      // User is already authenticated, redirect to dashboard
      return redirect('/dashboard')
    }
  } catch (error) {
    // Session validation failed, continue to login page
    // This is expected for unauthenticated users, so don't throw
    console.debug('No valid session found, showing login page')
  }

  return null
}

export default function LoginPage() {
  return <Login />
}
