import { render } from '@react-email/render'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { emailOTP } from 'better-auth/plugins'
import { Resend } from 'resend'
import { USER_STATUSES } from '~/app/common/constants'
import { prisma } from '~/app/db.server'
import EmailOTPVerification from '~/app/emails/email-otp-verification'
import PasswordReset from '~/app/emails/password-reset'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      allowedAttempts: 5,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          if (type === 'email-verification') {
            let userName

            const user = await prisma.user.findUnique({
              where: { email },
              include: { profile: true },
            })

            if (user?.profile?.firstName) {
              userName = user.profile.firstName
            } else if (user?.name) {
              // Use Better Auth name if profile firstName not available
              userName = user.name.split(' ')[0] || userName
            }

            // Render React Email template for OTP verification
            const emailHtml = await render(
              EmailOTPVerification({
                name: userName,
                otp,
              })
            )

            const emailPayload = {
              from: process.env.FROM_EMAIL || 'Triven <onboarding@resend.dev>',
              to: email,
              subject: 'Verify your email address - Triven',
              html: emailHtml,
            }

            await resend.emails.send(emailPayload)
          } else if (type === 'forget-password') {
            // Handle password reset OTP
            const emailHtml = await render(
              EmailOTPVerification({
                name: email.split('@')[0],
                otp,
              })
            )

            const emailPayload = {
              from: process.env.FROM_EMAIL || 'Triven <onboarding@resend.dev>',
              to: email,
              subject: 'Reset your password - Triven',
              html: emailHtml,
            }

            const result = await resend.emails.send(emailPayload)
          }

          // Explicitly return void to ensure no return value issues
          return undefined
        } catch (error: any) {
          // Don't re-throw the error - let Better Auth handle it
          // Re-throwing might cause Better Auth to rollback the DB transaction
          return undefined
        }
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // For OAuth users, allow creation without email verification
          // For email/password signup with emailOTP plugin, let Better Auth handle the verification flow
          try {
            return {
              data: {
                ...user,
                status: USER_STATUSES.PENDING_BUSINESS_SETUP,
                active: true,
              },
            }
          } catch (error) {
            throw error // This will prevent user creation
          }
        },
        after: async (user) => {
          // Only create profile after user is successfully created
          try {
            // Extract names from user data
            const fullName = user.name || ''
            const nameParts = fullName.split(' ')
            const firstName = nameParts[0] || user.email.split('@')[0]
            const lastName = nameParts.slice(1).join(' ') || ''

            await prisma.profile.create({
              data: {
                userId: user.id,
                firstName,
                lastName,
              },
            })
          } catch (error) {
            // Don't throw error here as user is already created
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Mark user as online when session is created
          try {
            await prisma.user.update({
              where: { id: session.userId },
              data: {
                isOnline: true,
                lastOnlineAt: new Date(),
              },
            })
          } catch (error) {
            console.error('Error updating user online status on session create:', error)
          }
        },
      },
      update: {
        after: async (session) => {
          // Update lastOnlineAt when session is updated (indicates activity)
          try {
            await prisma.user.update({
              where: { id: session.userId },
              data: {
                lastOnlineAt: new Date(),
              },
            })
          } catch (error) {
            console.error('Error updating user lastOnlineAt on session update:', error)
          }
        },
      },
      delete: {
        after: async (session) => {
          // Mark user as offline when session is deleted
          try {
            await prisma.user.update({
              where: { id: session.userId },
              data: {
                isOnline: false,
                lastOnlineAt: new Date(),
              },
            })
          } catch (error) {
            console.error('Error updating user online status on session delete:', error)
          }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          return { data: account }
        },
        after: async (account) => {
          // This should capture OAuth account creation
          if (account.providerId === 'google' && account.idToken) {
            try {
              // Decode the ID token to get Google profile information
              const base64Payload = account.idToken.split('.')[1]
              const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

              const firstName = payload.given_name
              const lastName = payload.family_name
              const avatar = payload.picture

              // Update the existing profile with proper Google data
              await prisma.profile.updateMany({
                where: { userId: account.userId },
                data: {
                  firstName,
                  lastName,
                  avatar,
                },
              })
            } catch (error) {
              // Error updating profile with Google data
            }
          }
        },
      },
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Always require verification
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      // Render React Email template for password reset
      const emailHtml = await render(
        PasswordReset({
          name: user.name || user.email.split('@')[0],
          resetUrl: url,
        })
      )

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Triven <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your password - Triven',
        html: emailHtml,
      })
    },
  },
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  callbacks: {},
  user: {
    additionalFields: {
      companyId: {
        type: 'string',
        required: false,
      },
      roleId: {
        type: 'string',
        required: false,
      },
      agencyId: {
        type: 'string',
        required: false,
      },
      siteId: {
        type: 'string',
        required: false,
      },
      isOnline: {
        type: 'boolean',
        defaultValue: false,
      },
      lastOnlineAt: {
        type: 'date',
        required: false,
      },
      stripeCustomerId: {
        type: 'string',
        required: false,
      },
      status: {
        type: 'string',
        defaultValue: 'ACTIVE',
      },
      active: {
        type: 'boolean',
        defaultValue: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
