import { Resend } from 'resend'
import {
  FreeTrialWelcome,
  PaymentFailed,
  PaymentMethodUpdate,
  PaymentSuccess,
  PlanUpgrade,
  SubscriptionCancelled,
  SubscriptionConfirmation,
  TrialExpiring,
} from '~/app/emails'
import { DemoRequestNotification } from '~/app/emails/demo-request-notification'
import type { DemoRequest } from '~/app/lib/landing/types'

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
      subject:
        locale === 'fr'
          ? 'Bienvenue à votre essai gratuit Triven !'
          : 'Welcome to your Triven free trial!',
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
      subject:
        locale === 'fr'
          ? 'Abonnement confirmé - Bienvenue chez Triven !'
          : 'Subscription confirmed - Welcome to Triven!',
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
      subject:
        locale === 'fr'
          ? `Plan mis à niveau vers ${emailProps.newPlan} !`
          : `Plan upgraded to ${emailProps.newPlan}!`,
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
      subject:
        locale === 'fr' ? 'Action requise : Échec du paiement' : 'Action required: Payment failed',
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
      subject:
        locale === 'fr'
          ? `Votre essai expire dans ${emailProps.daysLeft} jours !`
          : `Your trial expires in ${emailProps.daysLeft} days!`,
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
      subject:
        locale === 'fr'
          ? 'Abonnement annulé - Nous vous remercions'
          : 'Subscription cancelled - Thank you',
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
export function formatDate(date: Date | number | undefined, locale: 'en' | 'fr'): string {
  if (!date) {
    // Fallback to current date if undefined
    date = Math.floor(Date.now() / 1000)
  }

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

/**
 * Send demo request notification to sales team
 * Constitutional Principle VI: API-First Development
 */
export async function sendDemoRequestNotification(demoRequest: DemoRequest): Promise<void> {
  try {
    const salesEmail = process.env.SALES_EMAIL || 'sales@triven.app'

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <notifications@triven.app>',
      to: salesEmail,
      subject: `New Demo Request from ${demoRequest.name} at ${demoRequest.company}`,
      react: DemoRequestNotification({ demoRequest }),
    })

    console.log(`✅ Demo request notification sent for request ID ${demoRequest.id}`)
  } catch (error) {
    console.error('❌ Failed to send demo request notification:', error)
    throw error
  }
}

// ========== T008: Workflow Approval Email Functions ==========

import { prisma } from '~/app/db.server'
import type { EmailData } from '~/app/types/workflow-approvals'

/**
 * T008: Send email with retry logic and exponential backoff
 */
export async function sendEmailWithRetry(
  emailData: EmailData,
  maxRetries: number = 3
): Promise<void> {
  const delays = [1000, 2000, 4000] // 1s, 2s, 4s
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sendApprovalRequestEmail(emailData)

      // Log success
      await prisma.emailLog.create({
        data: {
          approvalRequestId: emailData.approvalId,
          recipientId: emailData.recipientId!,
          recipientEmail: emailData.to,
          subject: `Approval request: ${emailData.approvalTitle}`,
          emailType: emailData.type,
          deliveryStatus: 'sent',
          retryCount: attempt,
          sentAt: new Date(),
        },
      })

      return
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        // Final failure - log and queue for manual review
        await prisma.emailLog.create({
          data: {
            approvalRequestId: emailData.approvalId,
            recipientId: emailData.recipientId!,
            recipientEmail: emailData.to,
            subject: `Approval request: ${emailData.approvalTitle}`,
            emailType: emailData.type,
            deliveryStatus: 'failed',
            retryCount: attempt,
            failureReason: lastError.message,
            manualReviewFlag: true,
            failedAt: new Date(),
          },
        })
        throw lastError
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
    }
  }
}

/**
 * T035: Send approval request email
 */
async function sendApprovalRequestEmail(emailData: EmailData): Promise<void> {
  const { to, approvalTitle, approvalDescription, requesterName, priority, expiresAt, reviewUrl, locale = 'en' } = emailData

  const subject = locale === 'fr' 
    ? `Nouvelle demande d'approbation: ${approvalTitle}`
    : `New approval request: ${approvalTitle}`

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'Triven <notifications@triven.app>',
    to,
    subject,
    html: `
      <h2>${locale === 'fr' ? 'Nouvelle demande d\'approbation' : 'New Approval Request'}</h2>
      <p><strong>${locale === 'fr' ? 'Titre' : 'Title'}:</strong> ${approvalTitle}</p>
      ${approvalDescription ? `<p><strong>${locale === 'fr' ? 'Description' : 'Description'}:</strong> ${approvalDescription}</p>` : ''}
      <p><strong>${locale === 'fr' ? 'Demandeur' : 'Requested by'}:</strong> ${requesterName}</p>
      <p><strong>${locale === 'fr' ? 'Priorité' : 'Priority'}:</strong> ${priority}</p>
      ${expiresAt ? `<p><strong>${locale === 'fr' ? 'Expire le' : 'Expires at'}:</strong> ${new Date(expiresAt).toLocaleString()}</p>` : ''}
      <p><a href="${reviewUrl || `${process.env.BASE_URL}/approvals/${emailData.approvalId}`}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
        ${locale === 'fr' ? 'Examiner la demande' : 'Review Request'}
      </a></p>
    `,
  })

  console.log(`✅ Approval request email sent to ${to}`)
}

/**
 * T033: Queue approval notification for daily digest
 */
export async function queueForDigest(userId: string, approvalId: string): Promise<void> {
  await prisma.emailLog.create({
    data: {
      approvalRequestId: approvalId,
      recipientId: userId,
      recipientEmail: '', // Will be filled during digest processing
      subject: 'Approval Digest',
      emailType: 'initial_approval',
      deliveryStatus: 'queued_for_digest',
      retryCount: 0,
    },
  })
}

/**
 * T067: Retry failed email delivery
 */
export async function retryFailedEmail(emailLogId: string): Promise<void> {
  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
    include: {
      approvalRequest: {
        include: { requestedByUser: true },
      },
      recipient: { include: { profile: true } },
    },
  })

  if (!emailLog) {
    throw new Error('Email log not found')
  }

  // Reset log entry
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      deliveryStatus: 'pending',
      manualReviewFlag: false,
      failureReason: null,
      failedAt: null,
    },
  })

  // Attempt resend
  try {
    await sendEmailWithRetry({
      to: emailLog.recipientEmail,
      approvalId: emailLog.approvalRequestId,
      approvalTitle: emailLog.approvalRequest.title,
      approvalDescription: emailLog.approvalRequest.description || undefined,
      requesterName: emailLog.approvalRequest.requestedByUser?.name || 'Unknown',
      priority: emailLog.approvalRequest.priority,
      type: emailLog.emailType as any,
      locale: emailLog.recipient.profile?.locale as 'en' | 'fr' || 'en',
      recipientId: emailLog.recipientId,
    })

    console.log(`✅ Successfully retried failed email ${emailLogId}`)
  } catch (error) {
    console.error(`❌ Retry failed for email ${emailLogId}:`, error)
    throw error
  }
}
