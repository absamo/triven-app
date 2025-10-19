import { Resend } from 'resend'
import { 
  FreeTrialWelcome,
  SubscriptionConfirmation,
  PlanUpgrade,
  PaymentMethodUpdate,
  PaymentFailed,
  PaymentSuccess,
  TrialExpiring,
  SubscriptionCancelled,
} from '~/app/emails'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailBaseProps {
  to: string
  locale?: 'en' | 'fr'
}

interface TrialWelcomeProps extends EmailBaseProps {
  name: string
  trialEndDate: string
  dashboardUrl?: string
}

interface SubscriptionConfirmationProps extends EmailBaseProps {
  name: string
  planName: string
  planPrice: string
  billingCycle: string
  nextBillingDate: string
  dashboardUrl?: string
  billingUrl?: string
}

interface PlanUpgradeProps extends EmailBaseProps {
  name: string
  oldPlan: string
  newPlan: string
  newPrice: string
  billingCycle: string
  upgradeDate: string
  nextBillingDate: string
  dashboardUrl?: string
  billingUrl?: string
}

interface PaymentMethodUpdateProps extends EmailBaseProps {
  name: string
  planName: string
  newPaymentMethod: string
  lastFour: string
  updateDate: string
  nextBillingDate: string
  amount: string
  billingUrl?: string
  supportUrl?: string
}

interface PaymentFailedProps extends EmailBaseProps {
  name: string
  planName: string
  amount: string
  failureReason: string
  nextAttemptDate: string
  updatePaymentUrl?: string
  supportUrl?: string
}

interface PaymentSuccessProps extends EmailBaseProps {
  name: string
  planName: string
  amount: string
  paymentDate: string
  invoiceNumber: string
  invoiceUrl?: string
  billingUrl?: string
}

interface TrialExpiringProps extends EmailBaseProps {
  name: string
  daysLeft: number
  expirationDate: string
  planRecommendation: string
  planPrice: string
  upgradeUrl?: string
  dashboardUrl?: string
}

interface SubscriptionCancelledProps extends EmailBaseProps {
  name: string
  planName: string
  cancellationDate: string
  endDate: string
  reason: string
  reactivateUrl?: string
  exportDataUrl?: string
  feedbackUrl?: string
}

export async function sendTrialWelcomeEmail(props: TrialWelcomeProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <onboarding@triven.app>',
      to,
      subject: locale === 'fr' ? 'Bienvenue à votre essai gratuit Triven !' : 'Welcome to your Triven free trial!',
      react: FreeTrialWelcome({
        ...emailProps,
        locale,
        dashboardUrl: emailProps.dashboardUrl || `${process.env.BASE_URL}/dashboard`,
      }),
    })
    
    console.log(`✅ Trial welcome email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send trial welcome email:', error)
    throw error
  }
}

export async function sendSubscriptionConfirmationEmail(props: SubscriptionConfirmationProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <billing@triven.app>',
      to,
      subject: locale === 'fr' ? 'Abonnement confirmé - Bienvenue chez Triven !' : 'Subscription confirmed - Welcome to Triven!',
      react: SubscriptionConfirmation({
        ...emailProps,
        locale,
        dashboardUrl: emailProps.dashboardUrl || `${process.env.BASE_URL}/dashboard`,
        billingUrl: emailProps.billingUrl || `${process.env.BASE_URL}/billing`,
      }),
    })
    
    console.log(`✅ Subscription confirmation email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send subscription confirmation email:', error)
    throw error
  }
}

export async function sendPlanUpgradeEmail(props: PlanUpgradeProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <billing@triven.app>',
      to,
      subject: locale === 'fr' ? `Plan mis à niveau vers ${emailProps.newPlan} !` : `Plan upgraded to ${emailProps.newPlan}!`,
      react: PlanUpgrade({
        ...emailProps,
        locale,
        dashboardUrl: emailProps.dashboardUrl || `${process.env.BASE_URL}/dashboard`,
        billingUrl: emailProps.billingUrl || `${process.env.BASE_URL}/billing`,
      }),
    })
    
    console.log(`✅ Plan upgrade email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send plan upgrade email:', error)
    throw error
  }
}

export async function sendPaymentMethodUpdateEmail(props: PaymentMethodUpdateProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <billing@triven.app>',
      to,
      subject: locale === 'fr' ? 'Méthode de paiement mise à jour' : 'Payment method updated',
      react: PaymentMethodUpdate({
        ...emailProps,
        locale,
        billingUrl: emailProps.billingUrl || `${process.env.BASE_URL}/billing`,
        supportUrl: emailProps.supportUrl || `${process.env.BASE_URL}/support`,
      }),
    })
    
    console.log(`✅ Payment method update email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send payment method update email:', error)
    throw error
  }
}

export async function sendPaymentFailedEmail(props: PaymentFailedProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <billing@triven.app>',
      to,
      subject: locale === 'fr' ? 'Action requise : Échec du paiement' : 'Action required: Payment failed',
      react: PaymentFailed({
        ...emailProps,
        locale,
        updatePaymentUrl: emailProps.updatePaymentUrl || `${process.env.BASE_URL}/billing`,
        supportUrl: emailProps.supportUrl || `${process.env.BASE_URL}/support`,
      }),
    })
    
    console.log(`✅ Payment failed email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send payment failed email:', error)
    throw error
  }
}

export async function sendPaymentSuccessEmail(props: PaymentSuccessProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <billing@triven.app>',
      to,
      subject: locale === 'fr' ? 'Paiement confirmé - Merci !' : 'Payment confirmed - Thank you!',
      react: PaymentSuccess({
        ...emailProps,
        locale,
        billingUrl: emailProps.billingUrl || `${process.env.BASE_URL}/billing`,
      }),
    })
    
    console.log(`✅ Payment success email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send payment success email:', error)
    throw error
  }
}

export async function sendTrialExpiringEmail(props: TrialExpiringProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <onboarding@triven.app>',
      to,
      subject: locale === 'fr' ? `Votre essai expire dans ${emailProps.daysLeft} jours !` : `Your trial expires in ${emailProps.daysLeft} days!`,
      react: TrialExpiring({
        ...emailProps,
        locale,
        upgradeUrl: emailProps.upgradeUrl || `${process.env.BASE_URL}/billing/upgrade`,
        dashboardUrl: emailProps.dashboardUrl || `${process.env.BASE_URL}/dashboard`,
      }),
    })
    
    console.log(`✅ Trial expiring email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send trial expiring email:', error)
    throw error
  }
}

export async function sendSubscriptionCancelledEmail(props: SubscriptionCancelledProps) {
  const { to, locale = 'en', ...emailProps } = props
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <billing@triven.app>',
      to,
      subject: locale === 'fr' ? 'Abonnement annulé - Nous vous remercions' : 'Subscription cancelled - Thank you',
      react: SubscriptionCancelled({
        ...emailProps,
        locale,
        reactivateUrl: emailProps.reactivateUrl || `${process.env.BASE_URL}/billing/reactivate`,
        exportDataUrl: emailProps.exportDataUrl || `${process.env.BASE_URL}/export`,
        feedbackUrl: emailProps.feedbackUrl || `${process.env.BASE_URL}/feedback`,
      }),
    })
    
    console.log(`✅ Subscription cancelled email sent to ${to}`)
  } catch (error) {
    console.error('❌ Failed to send subscription cancelled email:', error)
    throw error
  }
}

// Helper function to determine user locale from database or request
export async function getUserLocale(userId: string): Promise<'en' | 'fr'> {
  try {
    // You might want to add a locale field to your user table
    // For now, default to English
    return 'en'
  } catch (error) {
    console.error('Failed to get user locale:', error)
    return 'en'
  }
}

// Helper function to format dates based on locale
export function formatDate(date: Date | number, locale: 'en' | 'fr'): string {
  const dateObj = typeof date === 'number' ? new Date(date * 1000) : date
  
  if (locale === 'fr') {
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Helper function to format currency based on locale
export function formatCurrency(amount: number, currency: string, locale: 'en' | 'fr'): string {
  const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
  
  return formatter.format(amount / 100) // Stripe amounts are in cents
}