import { prisma } from "~/app/db.server"
import { auth } from "~/app/lib/auth"

// Helper function to create users with better-auth
export async function createBetterAuthUsers(company: any, roles: any[], agencies: any[], sites: any[]) {
    const users = [
        {
            email: "admin@flowtech.com",
            name: "Admin User",
            password: "password123",
            roleId: roles.find(r => r.name === "Admin")!.id,
            profile: {
                firstName: "Admin",
                lastName: "User",
                phone: "(555) 100-0001",
            }
        },
        {
            email: "manager@flowtech.com",
            name: "Jane Manager",
            password: "password123",
            roleId: roles.find(r => r.name === "Manager")!.id,
            profile: {
                firstName: "Jane",
                lastName: "Manager",
                phone: "(555) 100-0002",
            }
        },
        {
            email: "warehouse@flowtech.com",
            name: "Bob Warehouse",
            password: "password123",
            roleId: roles.find(r => r.name === "Warehouse Staff")!.id,
            profile: {
                firstName: "Bob",
                lastName: "Warehouse",
                phone: "(555) 100-0003",
            }
        },
        {
            email: "sales@flowtech.com",
            name: "Alice Sales",
            password: "password123",
            roleId: roles.find(r => r.name === "Sales Staff")!.id,
            profile: {
                firstName: "Alice",
                lastName: "Sales",
                phone: "(555) 100-0004",
            }
        }
    ]

    const createdUsers = []

    for (const userData of users) {
        try {
            // Use better-auth to create the user
            const result = await auth.api.signUpEmail({
                body: {
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                }
            })

            if (!result.user) {
                console.error(`Failed to create user ${userData.email}`)
                continue
            }

            // Check if Account record exists, if not create it
            const existingAccount = await prisma.account.findFirst({
                where: { userId: result.user.id }
            })

            if (!existingAccount) {
                // Create Account record for email/password authentication
                // Better Auth automatically handles password hashing and storage
                await prisma.account.create({
                    data: {
                        accountId: result.user.id,
                        providerId: "credential",
                        userId: result.user.id,
                        // Password is already handled by Better Auth during signUpEmail
                    }
                })
            }

            // Update user with additional fields and create profile separately
            // since better-auth user creation might not handle all custom fields
            const updatedUser = await prisma.user.update({
                where: { id: result.user.id },
                data: {
                    emailVerified: true,
                    companyId: company.id,
                    roleId: userData.roleId,
                    agencyId: agencies[0].id,
                    siteId: sites[0].id,
                    status: "Registered",
                    profile: {
                        create: userData.profile
                    }
                }
            })

            createdUsers.push(updatedUser)
        } catch (error) {
            // Error creating user - this may happen if user already exists
        }
    }

    return createdUsers
}
