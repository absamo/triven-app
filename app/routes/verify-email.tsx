import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { INVITATION_STATUSES, USER_STATUSES } from "~/app/common/constants";
import { prisma } from "~/app/db.server";
import { auth } from "~/app/lib/auth";
import VerifyEmail from "~/app/pages/VerifyEmail";
import { getUserInvitationByToken } from "~/app/services/better-auth.server";

export { VerifyEmail as default };

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const inviteToken = url.searchParams.get("invite");

    // Only redirect if it's a GET request and no email is provided
    // For POST requests (form submissions), we'll let the action handle the logic
    if (!email && request.method === "GET") {
        // If there's an invite token but no email, something went wrong
        // The user should have gone through join-team first
        if (inviteToken) {
            return redirect(`/join-team?invite=${inviteToken}&error=missing_email`);
        }
        return redirect("/signup");
    }

    // For POST requests, return empty email if not in URL (action will handle validation)
    return { email: email || "", inviteToken: inviteToken || null };
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;
    const url = new URL(request.url);
    const inviteToken = url.searchParams.get("invite");

    if (!email || !otp) {
        return {
            error: "Please enter both your email and verification code to continue.",
            email
        };
    } try {



        const userBeforeVerification = await prisma.user.findFirst({
            where: { email: email.trim() },
            select: { emailVerified: true }
        });


        // Check user's verification status BEFORE calling the verification API
        // This way we can determine if this is the first time they're verifying

        let isFirstVerification = !userBeforeVerification?.emailVerified;



        // Use Better Auth API directly to verify the OTP as raw response to get full control
        const response = await auth.api.verifyEmailOTP({
            body: {
                email: email.trim(),
                otp: otp.trim()
            },
            headers: {
                ...Object.fromEntries(request.headers.entries()),
                'content-type': 'application/json'
            },
            asResponse: true
        });

        const result = await response.json();
        const responseHeaders = response.headers;

        if (result && result.user && result.status) {
            // Handle invitation context if present
            let invitationData = null;
            if (inviteToken) {
                try {
                    const invitation = await getUserInvitationByToken(inviteToken);
                    if (invitation && invitation.status === INVITATION_STATUSES.INVITED && invitation.email === email.trim()) {
                        invitationData = invitation;
                    }
                } catch (inviteError) {
                    console.error("Error processing invitation during verification:", inviteError);
                }
            }

            // Create the business user and account record to link Better Auth user to our business tables
            try {

                const existingAccount = await prisma.account.findFirst({
                    where: { userId: result.user.id }
                });

                if (!existingAccount) {
                    // Extract name parts from Better Auth user
                    const fullName = result.user.name || result.user.email.split('@')[0];
                    const nameParts = fullName.split(' ');
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    let userData: any = {
                        id: result.user.id, // Use same ID as Better Auth user
                        email: result.user.email,
                        image: result.user.image,
                        isOnline: true,
                        lastOnlineAt: new Date(),
                        profile: {
                            create: {
                                firstName,
                                lastName,
                            }
                        }
                    };

                    // If this is an invitation, link the user to the existing company
                    if (invitationData) {
                        // Get inviter details to link to the same company
                        const inviter = await prisma.user.findUnique({
                            where: { id: invitationData.inviterId },
                            include: { role: true }
                        });

                        if (inviter) {
                            // Link user to the inviter's company with appropriate defaults
                            userData.companyId = inviter.companyId;
                            userData.roleId = inviter.roleId; // Use same role as inviter for now
                            userData.agencyId = inviter.agencyId;
                            userData.siteId = inviter.siteId;
                            userData.status = USER_STATUSES.REGISTERED; // Invited users are registered immediately
                        } else {
                            userData.status = USER_STATUSES.PENDING_BUSINESS_SETUP;
                        }
                    } else {
                        userData.status = USER_STATUSES.PENDING_BUSINESS_SETUP;
                    }

                    // Create business user with profile
                    await prisma.user.create({
                        data: userData
                    });

                    // Create Account record to link Better Auth user to business user
                    await prisma.account.create({
                        data: {
                            userId: result.user.id,
                            accountId: result.user.id,
                            providerId: 'email', // Better Auth email provider
                            accessToken: null,
                            refreshToken: null,
                        }
                    });

                    // If this was an invitation, mark it as accepted
                    if (invitationData) {
                        await prisma.invitation.update({
                            where: { id: invitationData.id },
                            data: { status: INVITATION_STATUSES.ACCEPTED }
                        });
                    }
                }

                // Note: Welcome email will be sent after business setup completion
                // in the business-setup.server.ts file to ensure the user has fully
                // set up their account before receiving the welcome message

            } catch (dbError: any) {
                // Continue anyway - the user is verified, we can try to fix the linkage later
            }            // Check if Better Auth provided session cookies in the response headers
            const sessionCookie = responseHeaders.get('set-cookie');

            if (sessionCookie) {
                // Better Auth provided a session cookie, so email verification created a session
                let redirectUrl = "/auth/business-setup";

                // If this was an invitation and user is linked to company, go to dashboard
                if (invitationData) {
                    redirectUrl = "/dashboard";
                }

                const redirectResponse = redirect(redirectUrl);

                // Forward the session cookie from Better Auth
                redirectResponse.headers.set('set-cookie', sessionCookie);

                return redirectResponse;
            } else {
                // For emailOTP with overrideDefaultEmailVerification, we need to handle session creation
                // since autoSignInAfterVerification doesn't work with the OTP plugin

                // The user's email is now verified, so we'll redirect them to login
                // with a clear message that they need to sign in one more time
                let loginUrl = `/login?verified=true&email=${encodeURIComponent(result.user.email)}&message=Email verified successfully! Please sign in to complete the process.`;

                // If this was an invitation, add context
                if (invitationData) {
                    loginUrl += "&invitation=true";
                }

                return redirect(loginUrl);
            }
        } else {
            return {
                error: "The verification code you entered is incorrect or has expired. Please check your code or request a new one.",
                email
            };
        }

    } catch (error: any) {
        // Provide specific error messages based on common error patterns
        let errorMessage = "Something went wrong during verification. Please try again.";

        if (error?.message) {
            if (error.message.includes('expired') || error.message.includes('invalid')) {
                errorMessage = "The verification code you entered is incorrect or has expired. Please check your code or request a new one.";
            } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
                errorMessage = "Too many verification attempts. Please wait a moment before trying again.";
            }
        }

        return {
            error: errorMessage,
            email
        };
    }
}
