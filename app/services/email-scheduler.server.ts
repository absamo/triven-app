import { prisma } from '~/app/db.server'
import { 
  sendTrialExpiringEmail,
  sendSubscriptionCancelledEmail,
  getUserLocale,
  formatDate,
} from '~/app/services/email.server'

/**
 * Sends trial expiring emails to users whose trials are expiring soon
 * Should be run daily via cron job or similar scheduler
 */
export async function sendTrialExpiringEmails() {
  try {
    console.log('🔍 Checking for expiring trials...')
    
    // Find users with trials expiring in 3 days and 1 day
    const threeDaysFromNow = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60)
    const oneDayFromNow = Math.floor(Date.now() / 1000) + (1 * 24 * 60 * 60)
    
    // Get subscriptions expiring in 3 days
    const trialsExpiring3Days = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        trialEnd: {
          gte: threeDaysFromNow - 3600, // 1 hour buffer
          lte: threeDaysFromNow + 3600, // 1 hour buffer
        },
      },
      include: {
        user: true,
        plan: true,
      },
    })

    // Get subscriptions expiring in 1 day
    const trialsExpiring1Day = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        trialEnd: {
          gte: oneDayFromNow - 3600, // 1 hour buffer
          lte: oneDayFromNow + 3600, // 1 hour buffer
        },
      },
      include: {
        user: true,
        plan: true,
      },
    })

    console.log(`📧 Found ${trialsExpiring3Days.length} trials expiring in 3 days`)
    console.log(`📧 Found ${trialsExpiring1Day.length} trials expiring in 1 day`)

    // Send 3-day warning emails
    for (const subscription of trialsExpiring3Days) {
      try {
        const locale = await getUserLocale(subscription.userId)
        
        await sendTrialExpiringEmail({
          to: subscription.user.email,
          locale,
          name: subscription.user.name || subscription.user.email.split('@')[0],
          daysLeft: 3,
          expirationDate: formatDate(subscription.trialEnd, locale),
          planRecommendation: subscription.plan?.name || 'Professional',
          planPrice: '$29', // Default price, should be fetched from plan
          upgradeUrl: `${process.env.BASE_URL}/billing/upgrade`,
          dashboardUrl: `${process.env.BASE_URL}/dashboard`,
        })
        
        console.log(`✅ Sent 3-day expiry email to ${subscription.user.email}`)
      } catch (error) {
        console.error(`❌ Failed to send 3-day expiry email to ${subscription.user.email}:`, error)
      }
    }

    // Send 1-day warning emails
    for (const subscription of trialsExpiring1Day) {
      try {
        const locale = await getUserLocale(subscription.userId)
        
        await sendTrialExpiringEmail({
          to: subscription.user.email,
          locale,
          name: subscription.user.name || subscription.user.email.split('@')[0],
          daysLeft: 1,
          expirationDate: formatDate(subscription.trialEnd, locale),
          planRecommendation: subscription.plan?.name || 'Professional',
          planPrice: '$29', // Default price, should be fetched from plan
          upgradeUrl: `${process.env.BASE_URL}/billing/upgrade`,
          dashboardUrl: `${process.env.BASE_URL}/dashboard`,
        })
        
        console.log(`✅ Sent 1-day expiry email to ${subscription.user.email}`)
      } catch (error) {
        console.error(`❌ Failed to send 1-day expiry email to ${subscription.user.email}:`, error)
      }
    }

    return {
      threeDayEmails: trialsExpiring3Days.length,
      oneDayEmails: trialsExpiring1Day.length,
    }
  } catch (error) {
    console.error('❌ Failed to send trial expiring emails:', error)
    throw error
  }
}

/**
 * Handles subscription cancellation emails
 * Called when a subscription is cancelled via webhook or API
 */
export async function handleSubscriptionCancellation(subscriptionId: string, cancellationReason?: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true,
        plan: true,
      },
    })

    if (!subscription) {
      console.error(`Subscription ${subscriptionId} not found`)
      return
    }

    const locale = await getUserLocale(subscription.userId)
    
    await sendSubscriptionCancelledEmail({
      to: subscription.user.email,
      locale,
      name: subscription.user.name || subscription.user.email.split('@')[0],
      planName: subscription.plan?.name || 'Professional',
      cancellationDate: formatDate(new Date(), locale),
      endDate: formatDate(subscription.currentPeriodEnd, locale),
      reason: cancellationReason || 'At your request',
      reactivateUrl: `${process.env.BASE_URL}/billing/reactivate`,
      exportDataUrl: `${process.env.BASE_URL}/export`,
      feedbackUrl: `${process.env.BASE_URL}/feedback`,
    })
    
    console.log(`✅ Sent cancellation email to ${subscription.user.email}`)
  } catch (error) {
    console.error(`❌ Failed to send cancellation email for subscription ${subscriptionId}:`, error)
    throw error
  }
}

/**
 * Creates a cron job handler for trial expiring emails
 * This can be called from a scheduled API endpoint
 */
export async function cronTrialExpiringEmails() {
  console.log('🕐 Starting scheduled trial expiring emails job...')
  
  try {
    const result = await sendTrialExpiringEmails()
    console.log(`✅ Trial expiring emails job completed:`, result)
    return result
  } catch (error) {
    console.error('❌ Trial expiring emails job failed:', error)
    throw error
  }
}

/**
 * API endpoint to manually trigger trial expiring emails
 * Should be protected by authentication in production
 */
export async function handleTrialExpiringEmailsRequest() {
  try {
    const result = await cronTrialExpiringEmails()
    return new Response(JSON.stringify({
      success: true,
      message: 'Trial expiring emails sent successfully',
      ...result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Trial expiring emails request failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send trial expiring emails',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}