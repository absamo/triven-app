import {
    type LoaderFunctionArgs,
    redirect
} from "react-router"
import { INVITATION_STATUSES } from "~/app/common/constants"
import { getUserInvitationByToken } from "~/app/services/better-auth.server"

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const token = url.searchParams.get("invite")

    if (!token) {
        // No invitation token provided, redirect to regular signup
        return redirect("/join-team")
    }

    try {
        // Get invitation details
        const invitation = await getUserInvitationByToken(token)

        if (!invitation) {
            // Invalid or expired invitation token
            return redirect("/join-team?error=invalid_invitation")
        }

        if (invitation.status !== INVITATION_STATUSES.INVITED) {
            // Invitation already used or expired
            return redirect("/join-team?error=invitation_used")
        }

        // Check if invitation is still valid (within 7 days)
        const now = new Date()
        if (invitation.validity && invitation.validity < now) {
            return redirect("/join-team?error=invitation_expired")
        }

        // Redirect to join-team with invitation context
        return redirect(`/join-team?invite=${token}`)

    } catch (error) {
        console.error("Error processing invitation:", error)
        return redirect("/join-team?error=invitation_error")
    }
}

// This route is just for processing invitation links and redirecting
// The actual signup happens in the regular signup route
export { loader as action }
