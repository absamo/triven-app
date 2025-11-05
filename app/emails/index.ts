// Subscription email templates (internationalized)

export { default as DemoRequestEmail } from './demo-request'
export { default as EmailOtpVerificationEmail } from './email-otp-verification'
export { default as FreeTrialWelcome } from './free-trial-welcome'
export { default as PasswordResetEmail } from './password-reset'
export { default as PaymentFailed } from './payment-failed'
export { default as PaymentMethodUpdate } from './payment-method-update'
export { default as PaymentSuccess } from './payment-success'
export { default as PlanUpgrade } from './plan-upgrade'
export { default as SubscriptionCancelled } from './subscription-cancelled'
export { default as SubscriptionConfirmation } from './subscription-confirmation'
export { default as TrialExpiring } from './trial-expiring'
// Other email templates
export { default as WelcomeEmail } from './welcome-email'

// Email template types for better TypeScript support
export interface EmailTemplateProps {
  name?: string
  dashboardUrl?: string
  billingUrl?: string
  supportUrl?: string
  locale?: 'en' | 'fr'
}

export interface SubscriptionEmailProps extends EmailTemplateProps {
  planName?: string
  planPrice?: string
  billingCycle?: string
  nextBillingDate?: string
}

export interface PaymentEmailProps extends EmailTemplateProps {
  amount?: string
  paymentDate?: string
  invoiceNumber?: string
  failureReason?: string
}

export interface TrialEmailProps extends EmailTemplateProps {
  trialEndDate?: string
  daysLeft?: number
  expirationDate?: string
}
