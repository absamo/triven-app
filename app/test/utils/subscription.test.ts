import { describe, expect, it } from 'vitest'
import {
  calculateTrialDaysRemaining,
  calculateTrialStatus,
  getTrialAlertConfig,
  getTrialUrgencyLevel,
  shouldShowTrialAlert,
} from '~/app/utils/subscription'

describe('calculateTrialDaysRemaining', () => {
  it('calculates days correctly for future date', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days from now
    expect(calculateTrialDaysRemaining(trialEnd)).toBe(7)
  })

  it('returns 0 for past date', () => {
    const trialEnd = Math.floor(Date.now() / 1000) - 24 * 60 * 60 // 1 day ago
    expect(calculateTrialDaysRemaining(trialEnd)).toBe(0)
  })

  it('returns 0 for trialEnd of 0', () => {
    expect(calculateTrialDaysRemaining(0)).toBe(0)
  })

  it('handles same-day expiration', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 12 * 60 * 60 // 12 hours from now
    expect(calculateTrialDaysRemaining(trialEnd)).toBe(1) // Rounds up to 1 day
  })

  it('handles edge case of exactly 24 hours remaining', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // Exactly 24 hours
    expect(calculateTrialDaysRemaining(trialEnd)).toBe(1)
  })
})

describe('getTrialUrgencyLevel', () => {
  it('returns "low" for 7+ days', () => {
    expect(getTrialUrgencyLevel(7)).toBe('low')
    expect(getTrialUrgencyLevel(14)).toBe('low')
    expect(getTrialUrgencyLevel(30)).toBe('low')
  })

  it('returns "medium" for 3-6 days', () => {
    expect(getTrialUrgencyLevel(3)).toBe('medium')
    expect(getTrialUrgencyLevel(4)).toBe('medium')
    expect(getTrialUrgencyLevel(5)).toBe('medium')
    expect(getTrialUrgencyLevel(6)).toBe('medium')
  })

  it('returns "high" for 1-2 days', () => {
    expect(getTrialUrgencyLevel(1)).toBe('high')
    expect(getTrialUrgencyLevel(2)).toBe('high')
  })

  it('returns "expired" for 0 days', () => {
    expect(getTrialUrgencyLevel(0)).toBe('expired')
  })

  it('handles negative days as expired', () => {
    expect(getTrialUrgencyLevel(-1)).toBe('expired')
  })
})

describe('shouldShowTrialAlert', () => {
  it('shows alert for trialing status with days remaining', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    expect(shouldShowTrialAlert('trialing', trialEnd)).toBe(true)
  })

  it('hides alert for active status', () => {
    expect(shouldShowTrialAlert('active', 0)).toBe(false)
  })

  it('hides alert for canceled status', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    expect(shouldShowTrialAlert('canceled', trialEnd)).toBe(false)
  })

  it('hides alert for expired trial', () => {
    const trialEnd = Math.floor(Date.now() / 1000) - 24 * 60 * 60 // Past
    expect(shouldShowTrialAlert('trialing', trialEnd)).toBe(false)
  })

  it('hides alert for trialEnd of 0', () => {
    expect(shouldShowTrialAlert('trialing', 0)).toBe(false)
  })

  it('shows alert on last day of trial', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 12 * 60 * 60 // 12 hours remaining
    expect(shouldShowTrialAlert('trialing', trialEnd)).toBe(true)
  })
})

describe('calculateTrialStatus', () => {
  it('returns correct status for active trial', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
    const status = calculateTrialStatus({ status: 'trialing', trialEnd })

    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBe(7)
    expect(status.urgencyLevel).toBe('low')
    expect(status.isExpired).toBe(false)
    expect(status.expiresAt).toBeInstanceOf(Date)
  })

  it('returns correct status for medium urgency trial', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60
    const status = calculateTrialStatus({ status: 'trialing', trialEnd })

    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBe(5)
    expect(status.urgencyLevel).toBe('medium')
    expect(status.isExpired).toBe(false)
  })

  it('returns correct status for high urgency trial', () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 1 * 24 * 60 * 60
    const status = calculateTrialStatus({ status: 'trialing', trialEnd })

    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBe(1)
    expect(status.urgencyLevel).toBe('high')
    expect(status.isExpired).toBe(false)
  })

  it('returns default for non-trial status', () => {
    const status = calculateTrialStatus({ status: 'active', trialEnd: 0 })

    expect(status.isTrial).toBe(false)
    expect(status.daysRemaining).toBe(0)
    expect(status.urgencyLevel).toBe('expired')
    expect(status.expiresAt).toBe(null)
  })

  it('handles expired trial correctly', () => {
    const trialEnd = Math.floor(Date.now() / 1000) - 24 * 60 * 60 // Yesterday
    const status = calculateTrialStatus({ status: 'trialing', trialEnd })

    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBe(0)
    expect(status.urgencyLevel).toBe('expired')
    expect(status.isExpired).toBe(true)
  })

  it('handles trialEnd of 0', () => {
    const status = calculateTrialStatus({ status: 'trialing', trialEnd: 0 })

    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBe(0)
    expect(status.urgencyLevel).toBe('expired')
    expect(status.expiresAt).toBe(null)
  })
})

describe('getTrialAlertConfig', () => {
  it('returns correct config for low urgency', () => {
    const trialStatus = {
      isTrial: true,
      daysRemaining: 7,
      urgencyLevel: 'low' as const,
      isExpired: false,
      expiresAt: new Date(),
    }
    const config = getTrialAlertConfig(trialStatus, true)

    expect(config.visible).toBe(true)
    expect(config.color).toBe('blue')
    expect(config.size).toBe('compact')
    expect(config.position).toBe('header')
    expect(config.showUpgradeButton).toBe(true)
    expect(config.message).toBe('trial:daysRemaining')
  })

  it('returns correct config for medium urgency', () => {
    const trialStatus = {
      isTrial: true,
      daysRemaining: 5,
      urgencyLevel: 'medium' as const,
      isExpired: false,
      expiresAt: new Date(),
    }
    const config = getTrialAlertConfig(trialStatus, true)

    expect(config.visible).toBe(true)
    expect(config.color).toBe('orange')
    expect(config.size).toBe('default')
    expect(config.position).toBe('banner')
    expect(config.icon).toBe('IconClock')
  })

  it('returns correct config for high urgency', () => {
    const trialStatus = {
      isTrial: true,
      daysRemaining: 1,
      urgencyLevel: 'high' as const,
      isExpired: false,
      expiresAt: new Date(),
    }
    const config = getTrialAlertConfig(trialStatus, true)

    expect(config.visible).toBe(true)
    expect(config.color).toBe('red')
    expect(config.size).toBe('large')
    expect(config.position).toBe('banner')
    expect(config.icon).toBe('IconAlertTriangle')
  })

  it('hides alert for non-trial', () => {
    const trialStatus = {
      isTrial: false,
      daysRemaining: 0,
      urgencyLevel: 'expired' as const,
      isExpired: true,
      expiresAt: null,
    }
    const config = getTrialAlertConfig(trialStatus, false)

    expect(config.visible).toBe(false)
  })

  it('hides alert for expired trial', () => {
    const trialStatus = {
      isTrial: true,
      daysRemaining: 0,
      urgencyLevel: 'expired' as const,
      isExpired: true,
      expiresAt: new Date(),
    }
    const config = getTrialAlertConfig(trialStatus, true)

    expect(config.visible).toBe(false)
  })

  it('respects canUpgrade parameter', () => {
    const trialStatus = {
      isTrial: true,
      daysRemaining: 7,
      urgencyLevel: 'low' as const,
      isExpired: false,
      expiresAt: new Date(),
    }
    const configWithUpgrade = getTrialAlertConfig(trialStatus, true)
    const configWithoutUpgrade = getTrialAlertConfig(trialStatus, false)

    expect(configWithUpgrade.showUpgradeButton).toBe(true)
    expect(configWithoutUpgrade.showUpgradeButton).toBe(false)
  })
})
