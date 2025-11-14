import type { ActionFunction } from 'react-router'
import { redirect } from 'react-router'
import { auth } from '~/app/lib/auth.server'

export const action: ActionFunction = async ({ request }) => {
  try {
    await auth.api.signOut({ headers: request.headers })
  } catch (error) {
    console.error('❌ Better Auth signOut failed:', error)
    // Continue with redirect even if signOut fails
  }
  return redirect('/login')
}

export const loader = () => redirect('/login')
