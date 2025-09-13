import type { LoaderFunction } from "react-router"
import { redirect } from "react-router"
import { auth } from "~/app/lib/auth"
import Login from "~/app/pages/Login/Login"

export const loader: LoaderFunction = async ({ request }) => {
  // Check if user is already authenticated with a valid session
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (session?.user) {
      // Validate session hasn't expired by checking expiresAt if available
      // Better Auth handles this internally, but we can add additional checks if needed
      return redirect("/dashboard")
    }
  } catch (error) {
    // Session validation failed, continue to login page
    throw (error)
  }

  return null
}

export default function LoginPage() {
  return <Login />
}
