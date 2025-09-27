import { redirect } from "react-router"
import type { Permission } from "~/app/common/helpers/user"
import { prisma } from "~/app/db.server"
import { auth } from "~/app/lib/auth"
import type { INVITATION_STATUSES } from "../common/constants"

export interface BetterAuthUser {
    id: string
    email: string
    companyId: string | null
    roleId: string | null
    agencyId: string | null
    siteId: string | null
    image: string | undefined
    role: {
        id: string
        name: string
        permissions: string[]
    } | null
    profile: {
        firstName: string
        lastName: string
        phone?: string
        avatar?: string
    }
    company: {
        id: string
        name: string
        currencies: any[]
    } | null
    agency: {
        id: string
        name: string
    } | null
    site: {
        id: string
        name: string
    } | null
    subscriptions: {
        id: string
        planId: string
        status: string
        trialEnd: number
        currentPeriodStart: number
        currentPeriodEnd: number
    } | null
    status: string
    isOnline: boolean
    lastOnlineAt: Date | null
    needsBusinessSetup?: boolean
}

/**
 * Get the current better-auth session and linked business user data
 */
export async function getBetterAuthUser(request: Request): Promise<BetterAuthUser | null> {
    try {


        // Check better-auth session
        const session = await auth.api.getSession({ headers: request.headers })

        if (!session?.user) {

            return null
        }



        // Find the Account record that links better-auth to our business user
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id // This should match the better-auth user ID
            },
            include: {
                user: {
                    include: {
                        role: true,
                        profile: true,
                        company: {
                            include: {
                                currencies: true
                            }
                        },
                        agency: true,
                        site: true,
                        subscriptions: {
                            include: {
                                price: true
                            }
                        }
                    }
                }
            }
        })


        const user = account?.user

        // Check if user is active (not deactivated)
        if (user?.active === false) {

            // Create a custom error that will be handled by the auth error handler
            throw new Error('INACTIVE_USER')
        }

        // Handle users without business setup (new flow)
        if (!user?.companyId || !user.roleId || !user.agencyId) {

            return {
                id: user?.id || '',
                email: user?.email || '',
                image: user?.image as string,
                companyId: user?.companyId || null,
                roleId: user?.roleId || null,
                agencyId: user?.agencyId || null,
                siteId: user?.siteId || null,
                role: user?.role ? {
                    id: user?.role.id,
                    name: user?.role.name,
                    permissions: user?.role.permissions
                } : null,
                profile: {
                    firstName: user?.profile?.firstName || '',
                    lastName: user?.profile?.lastName || '',
                    phone: user?.profile?.phone as string,
                    avatar: user?.profile?.avatar as string
                },
                company: user?.company ? {
                    id: user?.company.id,
                    name: user?.company.name,
                    currencies: Array.isArray(user?.company.currencies) ? user?.company.currencies : []
                } : null,
                agency: user?.agency ? {
                    id: user?.agency.id,
                    name: user?.agency.name
                } : null,
                site: user?.site ? {
                    id: user?.site.id,
                    name: user?.site.name
                } : null,
                subscriptions: user?.subscriptions ? {
                    id: user.subscriptions.id,
                    planId: user.subscriptions.planId,
                    status: user.subscriptions.status,
                    trialEnd: user.subscriptions.trialEnd,
                    currentPeriodStart: user.subscriptions.currentPeriodStart,
                    currentPeriodEnd: user.subscriptions.currentPeriodEnd
                } : null,
                status: user?.status || 'INCOMPLETE_SETUP',
                isOnline: user?.isOnline || false,
                lastOnlineAt: user?.lastOnlineAt || null,
                needsBusinessSetup: true // Flag to indicate incomplete setup
            }
        }

        // For complete users with business setup
        return {
            id: user.id,
            email: user.email,
            image: user.image as string,
            companyId: user.companyId!,
            roleId: user.roleId!,
            agencyId: user.agencyId!,
            siteId: user.siteId as string,
            role: {
                id: user.role!.id,
                name: user.role!.name,
                permissions: user.role!.permissions
            },
            profile: {
                firstName: user.profile?.firstName || '',
                lastName: user.profile?.lastName || '',
                phone: user.profile?.phone as string,
                avatar: user.profile?.avatar as string
            },
            company: {
                id: user.company!.id,
                name: user.company!.name,
                currencies: Array.isArray(user.company!.currencies) ? user.company!.currencies : []
            },
            agency: user.agency ? {
                id: user.agency.id,
                name: user.agency.name
            } : null,
            site: user.site ? {
                id: user.site.id,
                name: user.site.name
            } : null,
            subscriptions: user.subscriptions ? {
                id: user.subscriptions.id,
                planId: user.subscriptions.planId,
                status: user.subscriptions.status,
                trialEnd: user.subscriptions.trialEnd,
                currentPeriodStart: user.subscriptions.currentPeriodStart,
                currentPeriodEnd: user.subscriptions.currentPeriodEnd
            } : null,
            status: user.status,
            isOnline: user.isOnline,
            lastOnlineAt: user.lastOnlineAt
        }
    } catch (error) {
        console.error('[getBetterAuthUser] Error during authentication:', error);
        if (error instanceof Error && error.message === 'INACTIVE_USER') {
            throw error; // Re-throw specific errors
        }
        console.error('[getBetterAuthUser] Unexpected error:', error);
        return null;
    }
}

/**
 * Require a better-auth user with specific permissions
 */
export async function requireBetterAuthUser(
    request: Request,
    permissions?: Permission[]
): Promise<BetterAuthUser> {
    const user = await getBetterAuthUser(request)

    if (!user) {
        throw redirect("/")
    }



    // Check permissions if provided
    if (permissions && permissions.length > 0) {
        if (!hasPermissions(user, permissions)) {
            throw new Response("Forbidden: Insufficient permissions", {
                status: 403,
                statusText: "Forbidden"
            })
        }
    }

    return user
}

/**
 * Check if user has specific permissions
 */
export function hasPermissions(user: BetterAuthUser, permissions: Permission[]): boolean {
    if (!user.role) {
        return false
    }

    // Check if user has all required permissions

    const hasAllPermissions = permissions.every(permission => {
        const hasPermission = user.role!.permissions.includes(permission)
        return hasPermission
    })
    return hasAllPermissions
}

/**
 * Get better-auth session without business data (for lightweight checks)
 */
export async function getBetterAuthSession(request: Request) {
    return await auth.api.getSession({ headers: request.headers })
}

/**
 * Sign out user from better-auth
 */
export async function signOut(request: Request) {
    await auth.api.signOut({ headers: request.headers })
    return redirect("/")
}

/**
 * Get user by email for team invitations and management
 */
export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            role: true,
            profile: true,
            company: {
                include: {
                    currencies: true
                }
            },
            agency: true,
            site: true,
            subscriptions: {
                include: {
                    price: true
                }
            }
        }
    })

    if (!user) {
        return null
    }

    return {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        roleId: user.roleId,
        agencyId: user.agencyId,
        siteId: user.siteId,
        role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions
        } : null,
        profile: {
            firstName: user.profile?.firstName || '',
            lastName: user.profile?.lastName || '',
            phone: user.profile?.phone,
            avatar: user.profile?.avatar
        },
        company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            currencies: Array.isArray(user.company.currencies) ? user.company.currencies : []
        } : null,
        agency: user.agency ? {
            id: user.agency.id,
            name: user.agency.name
        } : null,
        site: user.site ? {
            id: user.site.id,
            name: user.site.name
        } : null,
        subscriptions: user.subscriptions ? {
            id: user.subscriptions.id,
            planId: user.subscriptions.planId,
            status: user.subscriptions.status,
            trialEnd: user.subscriptions.trialEnd,
            currentPeriodStart: user.subscriptions.currentPeriodStart,
            currentPeriodEnd: user.subscriptions.currentPeriodEnd
        } : null,
        status: user.status,
        isOnline: user.isOnline,
        lastOnlineAt: user.lastOnlineAt
    }
}

/**
 * Get user invitation by token for invitation flow
 */
export async function getUserInvitationByToken(token: string) {
    const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
            invitee: {
                include: {
                    profile: true,
                    company: true
                }
            },
        }
    })

    if (!invitation) {
        return null
    }

    const inviter = await prisma.user.findUnique({
        where: { id: invitation.inviterId },
        include: {
            profile: true,
            company: true
        }
    })

    return { ...invitation, inviter } as {
        id: string;
        email: string;
        inviterId: string;
        validity?: Date;
        token: string;
        status: typeof INVITATION_STATUSES[keyof typeof INVITATION_STATUSES];
        invitee: {
            profile: {
                firstName: string;
                lastName: string;
            },
            company: {
                name: string;
            }
        } | null;
        inviter: {
            profile: {
                firstName: string;
                lastName: string;
            },
            company: {
                name: string;
            }
        } | null;
    };

}
