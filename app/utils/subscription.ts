// Type definitions
export type TrialUrgencyLevel = 'low' | 'medium' | 'high' | 'expired'
export type MantineColor = 'blue' | 'orange' | 'red' | 'gray'
export type AlertPosition = 'header' | 'banner' | 'modal'
export type AlertSize = 'compact' | 'default' | 'large'

export interface TrialStatus {
  isTrial: boolean
  daysRemaining: number
  urgencyLevel: TrialUrgencyLevel
  isExpired: boolean
  expiresAt: Date | null
}

export interface TrialAlertConfig {
  visible: boolean
  color: MantineColor
  size: AlertSize
  icon: string | null
  message: string
  showUpgradeButton: boolean
  position: AlertPosition
}

/**
 * Calculates days remaining until trial ends
 * @param trialEnd - Unix timestamp in seconds (from Stripe/database)
 * @returns Days remaining (0 if expired or trialEnd is 0)
 */
export function calculateTrialDaysRemaining(trialEnd: number): number {
  if (trialEnd === 0) return 0

  const now = Date.now()
  const trialEndMs = trialEnd * 1000

  if (trialEndMs <= now) return 0

  // Round up to ensure "1 day left" shows for same-day expiration
  return Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24))
}

/**
 * Determines urgency level based on days remaining
 * @param daysRemaining - Number of days until trial expires
 * @returns Urgency level
 */
export function getTrialUrgencyLevel(daysRemaining: number): TrialUrgencyLevel {
  if (daysRemaining <= 0) return 'expired'
  if (daysRemaining <= 2) return 'high'
  if (daysRemaining <= 6) return 'medium'
  return 'low'
}

/**
 * Determines if trial alert should be shown
 * @param status - Subscription status
 * @param trialEnd - Trial end timestamp
 * @returns True if alert should be visible
 */
export function shouldShowTrialAlert(status: string, trialEnd: number): boolean {
  if (status !== 'trialing') return false
  if (trialEnd === 0) return false

  const daysRemaining = calculateTrialDaysRemaining(trialEnd)
  return daysRemaining > 0
}

/**
 * Calculates complete trial status
 * @param subscription - Subscription data
 * @returns Complete trial status
 */
export function calculateTrialStatus(subscription: {
  status: string
  trialEnd: number
}): TrialStatus {
  if (subscription.status !== 'trialing') {
    return {
      isTrial: false,
      daysRemaining: 0,
      urgencyLevel: 'expired',
      isExpired: false,
      expiresAt: null,
    }
  }

  const daysRemaining = calculateTrialDaysRemaining(subscription.trialEnd)
  const urgencyLevel = getTrialUrgencyLevel(daysRemaining)

  return {
    isTrial: true,
    daysRemaining,
    urgencyLevel,
    isExpired: daysRemaining === 0,
    expiresAt: subscription.trialEnd > 0 ? new Date(subscription.trialEnd * 1000) : null,
  }
}

/**
 * Generates alert configuration based on trial status
 * @param trialStatus - Current trial status
 * @param canUpgrade - Whether user can upgrade
 * @returns Alert configuration
 */
export function getTrialAlertConfig(
  trialStatus: TrialStatus,
  canUpgrade: boolean
): TrialAlertConfig {
  // Don't show alert if not trial or expired
  if (!trialStatus.isTrial || trialStatus.isExpired) {
    return {
      visible: false,
      color: 'gray',
      size: 'compact',
      icon: null,
      message: '',
      showUpgradeButton: false,
      position: 'header',
    }
  }

  // Low urgency: 7+ days
  if (trialStatus.urgencyLevel === 'low') {
    return {
      visible: true,
      color: 'blue',
      size: 'compact',
      icon: null,
      message: 'trial:daysRemaining',
      showUpgradeButton: canUpgrade,
      position: 'header',
    }
  }

  // Medium urgency: 3-6 days
  if (trialStatus.urgencyLevel === 'medium') {
    return {
      visible: true,
      color: 'orange',
      size: 'default',
      icon: 'IconClock',
      message: 'trial:trialExpiresIn',
      showUpgradeButton: canUpgrade,
      position: 'banner',
    }
  }

  // High urgency: 1-2 days
  return {
    visible: true,
    color: 'red',
    size: 'large',
    icon: 'IconAlertTriangle',
    message: 'trial:trialExpiringSoon',
    showUpgradeButton: canUpgrade,
    position: 'banner',
  }
}
