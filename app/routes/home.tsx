import type { LoaderFunction } from 'react-router'
import { redirect } from 'react-router'
import { auth } from '~/app/lib/auth'
import HomePage from '~/app/pages/Home'

export const loader: LoaderFunction = async ({ request }) => {
  // Check if user is already authenticated
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (session?.user) {
      // If user is logged in, redirect to dashboard
      return redirect('/dashboard')
    }
  } catch (error) {
    // Session validation failed, show landing page
  }

  return null
}

export default function Home() {
  return <HomePage />
}
