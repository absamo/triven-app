// Client-side utilities for Better Auth
import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  plugins: [emailOTPClient()],
})

// Export the useSession hook directly from authClient for proper SSR support
export const useSession = authClient.useSession

// Export other methods directly from the client
export const {
  signIn,
  signUp,
  signOut,
  getSession,
  // Session management
  forgetPassword,
  resetPassword,
  verifyEmail,
  // User management
  updateUser,
  changePassword,
  deleteUser,
  // Email OTP methods
  emailOtp,
} = authClient

// Helper for email/password sign in
export const signInWithEmail = (email: string, password: string) =>
  signIn.email({ email, password, callbackURL: '/dashboard' })

// Helper for Google OAuth
export const signInWithGoogle = () =>
  signIn.social({ provider: 'google', callbackURL: '/dashboard' })

// Helper for email/password sign up
export const signUpWithEmail = (email: string, password: string, name?: string) =>
  signUp.email({ email, password, name: name || '', callbackURL: '/dashboard' })

// Export the client for direct use
export { authClient as client }
