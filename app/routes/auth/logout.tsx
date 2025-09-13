import type { ActionFunction } from "react-router"
import { redirect } from "react-router"
import { auth } from "~/app/lib/auth"

export const action: ActionFunction = async ({ request }) => {
  try {
    await auth.api.signOut({ headers: request.headers })
  } catch (error) {
    console.error("❌ Better Auth signOut failed:", error)
    // Continue with redirect even if signOut fails
  }
  return redirect("/")
}

export const loader = () => redirect("/")
