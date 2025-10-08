import { redirect } from 'react-router'
import { auth } from '~/app/lib/auth'

// Helper function to handle auth errors consistently
function handleAuthError(error: unknown, url: URL): Response {
  // Handle OAuth callback errors specifically
  if (url.pathname.includes('/callback/') && url.searchParams.has('error')) {
    const errorParam = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    // Check for session expired errors
    if (errorParam === 'access_denied' || errorDescription?.toLowerCase().includes('session')) {
      const errorUrl = new URL('/login', url.origin)
      errorUrl.searchParams.set('message', 'Session expired. Please sign in again.')
      return redirect(errorUrl.toString())
    }

    // Redirect to custom error page with error details
    const errorUrl = new URL('/auth-error', url.origin)
    if (errorParam) errorUrl.searchParams.set('error', errorParam)
    if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)

    return redirect(errorUrl.toString())
  }

  // For other errors, check if we can extract error info
  if (error instanceof Error) {
    const errorUrl = new URL('/auth-error', url.origin)
    const errorMessage = error.message.toLowerCase()

    // Check for session/expiration related errors
    if (
      errorMessage.includes('session expired') ||
      errorMessage.includes('invalid session') ||
      errorMessage.includes('session not found')
    ) {
      const loginUrl = new URL('/login', url.origin)
      loginUrl.searchParams.set('message', 'Session expired. Please sign in again.')
      return redirect(loginUrl.toString())
    }

    // Categorize common Better Auth errors
    if (errorMessage.includes('user already exists') || errorMessage.includes('email already')) {
      errorUrl.searchParams.set('error', 'user_already_exists')
    } else if (
      errorMessage.includes('unable to create user') ||
      errorMessage.includes('creation failed')
    ) {
      errorUrl.searchParams.set('error', 'unable_to_create_user')
    } else if (
      errorMessage.includes('invalid credentials') ||
      errorMessage.includes('invalid password')
    ) {
      errorUrl.searchParams.set('error', 'invalid_credentials')
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('access denied')) {
      errorUrl.searchParams.set('error', 'access_denied')
    } else {
      errorUrl.searchParams.set('error', 'server_error')
    }

    errorUrl.searchParams.set('error_description', error.message)
    return redirect(errorUrl.toString())
  }

  // Default error redirect
  return redirect('/auth-error?error=unknown_error')
}

export async function loader({ request, params }: { request: Request; params: any }) {
  const url = new URL(request.url)

  // Intercept Better Auth's built-in error page and redirect to our custom one
  if (url.pathname === '/api/auth/error') {
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    const errorUrl = new URL('/auth-error', url.origin)
    if (error) errorUrl.searchParams.set('error', error)
    if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)

    return redirect(errorUrl.toString())
  }

  try {
    return await auth.handler(request)
  } catch (error) {
    return handleAuthError(error, url)
  }
}

export async function action({ request, params }: { request: Request; params: any }) {
  const url = new URL(request.url)

  // Intercept Better Auth's built-in error page and redirect to our custom one
  if (url.pathname === '/api/auth/error') {
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')

    const errorUrl = new URL('/auth-error', url.origin)
    if (error) errorUrl.searchParams.set('error', error)
    if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)

    return redirect(errorUrl.toString())
  }

  try {
    return await auth.handler(request)
  } catch (error) {
    return handleAuthError(error, url)
  }
}
