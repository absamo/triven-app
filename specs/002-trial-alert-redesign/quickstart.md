# Quickstart Guide: Trial Alert Display Redesign

**Feature**: Trial Alert Display Redesign  
**For**: Developers implementing this feature  
**Date**: October 21, 2025

## Overview

This guide walks you through implementing the redesigned trial alert display system. Follow these steps in order to build the feature according to the specification and constitutional requirements.

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 20+ installed
- ✅ Bun package manager
- ✅ PostgreSQL database running
- ✅ Stripe CLI configured (for testing webhooks)
- ✅ Environment variables configured (`.env` file)
- ✅ Project dependencies installed (`bun install`)
- ✅ Database migrations applied (`bun run db:push`)

---

## Implementation Phases

### Phase 1: Utility Functions (TDD)

**Files to Create**:
- `app/utils/subscription.ts`
- `app/test/utils/subscription.test.ts`

#### Step 1.1: Write Tests First

Create `app/test/utils/subscription.test.ts`:

```typescript
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
})

describe('getTrialUrgencyLevel', () => {
  it('returns "low" for 7+ days', () => {
    expect(getTrialUrgencyLevel(7)).toBe('low')
    expect(getTrialUrgencyLevel(14)).toBe('low')
  })

  it('returns "medium" for 3-6 days', () => {
    expect(getTrialUrgencyLevel(3)).toBe('medium')
    expect(getTrialUrgencyLevel(6)).toBe('medium')
  })

  it('returns "high" for 1-2 days', () => {
    expect(getTrialUrgencyLevel(1)).toBe('high')
    expect(getTrialUrgencyLevel(2)).toBe('high')
  })

  it('returns "expired" for 0 days', () => {
    expect(getTrialUrgencyLevel(0)).toBe('expired')
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

  it('hides alert for expired trial', () => {
    const trialEnd = Math.floor(Date.now() / 1000) - 24 * 60 * 60 // Past
    expect(shouldShowTrialAlert('trialing', trialEnd)).toBe(false)
  })

  it('hides alert for trialEnd of 0', () => {
    expect(shouldShowTrialAlert('trialing', 0)).toBe(false)
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

  it('returns default for non-trial status', () => {
    const status = calculateTrialStatus({ status: 'active', trialEnd: 0 })
    
    expect(status.isTrial).toBe(false)
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
})
```

**Run Tests** (they should fail):
```bash
bun run test app/test/utils/subscription.test.ts
```

#### Step 1.2: Implement Utility Functions

Create `app/utils/subscription.ts`:

```typescript
import dayjs from 'dayjs'

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
  icon: any | null
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
  if (daysRemaining === 0) return 'expired'
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
```

**Run Tests** (they should pass):
```bash
bun run test app/test/utils/subscription.test.ts
```

---

### Phase 2: Internationalization

**Files to Create**:
- `app/locales/en/trial.ts`
- `app/locales/fr/trial.ts`

#### Step 2.1: English Translations

Create `app/locales/en/trial.ts`:

```typescript
export default {
  // Days remaining messages
  daysRemaining: '{{days}} days left in trial',
  oneDayRemaining: '1 day left in trial',
  trialExpiresIn: 'Trial expires in {{days}} days',
  trialExpiresToday: 'Trial expires today',
  
  // Urgency messages
  trialExpiringSoon: 'Your trial is expiring soon!',
  upgradeToKeepAccess: 'Upgrade to keep access',
  dontLoseAccess: "Don't lose access to your inventory",
  
  // CTA buttons
  upgradeNow: 'Upgrade Now',
  viewPlans: 'View Plans',
  
  // Expired state
  trialExpired: 'Trial Expired',
  trialHasExpired: 'Your trial has expired',
  reactivateWithUpgrade: 'Reactivate by upgrading to a paid plan',
}
```

#### Step 2.2: French Translations

Create `app/locales/fr/trial.ts`:

```typescript
export default {
  // Days remaining messages
  daysRemaining: '{{days}} jours restants dans l\'essai',
  oneDayRemaining: '1 jour restant dans l\'essai',
  trialExpiresIn: 'L\'essai expire dans {{days}} jours',
  trialExpiresToday: 'L\'essai expire aujourd\'hui',
  
  // Urgency messages
  trialExpiringSoon: 'Votre essai expire bientôt !',
  upgradeToKeepAccess: 'Mettez à niveau pour conserver l\'accès',
  dontLoseAccess: 'Ne perdez pas l\'accès à votre inventaire',
  
  // CTA buttons
  upgradeNow: 'Mettre à niveau maintenant',
  viewPlans: 'Voir les plans',
  
  // Expired state
  trialExpired: 'Essai expiré',
  trialHasExpired: 'Votre essai a expiré',
  reactivateWithUpgrade: 'Réactivez en passant à un plan payant',
}
```

---

### Phase 3: TrialAlert Component (TDD)

**Files to Create**:
- `app/components/TrialAlert/TrialAlert.tsx`
- `app/components/TrialAlert/TrialAlert.module.css`
- `app/components/TrialAlert/index.ts`
- `app/test/components/TrialAlert.test.tsx`

#### Step 3.1: Write Component Tests

Create `app/test/components/TrialAlert.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TrialAlert from '~/app/components/TrialAlert'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'trial:daysRemaining') return `${params?.days} days left in trial`
      if (key === 'trial:upgradeNow') return 'Upgrade Now'
      return key
    },
  }),
}))

describe('TrialAlert Component', () => {
  it('renders with low urgency styling for 7+ days', () => {
    const { container } = render(
      <TrialAlert
        daysRemaining={7}
        urgencyLevel="low"
        onUpgradeClick={() => {}}
        showUpgradeButton={true}
      />
    )
    
    expect(screen.getByText('7 days left in trial')).toBeInTheDocument()
    // Check for blue color class or data-color attribute
  })

  it('renders with medium urgency for 3-6 days', () => {
    render(
      <TrialAlert
        daysRemaining={5}
        urgencyLevel="medium"
        onUpgradeClick={() => {}}
        showUpgradeButton={true}
      />
    )
    
    expect(screen.getByText(/5 days/i)).toBeInTheDocument()
  })

  it('calls onUpgrade when button clicked', async () => {
    const onUpgrade = vi.fn()
    const { user } = render(
      <TrialAlert
        daysRemaining={5}
        urgencyLevel="medium"
        onUpgradeClick={onUpgrade}
        showUpgradeButton={true}
      />
    )
    
    const button = screen.getByRole('button', { name: /upgrade/i })
    await user.click(button)
    
    expect(onUpgrade).toHaveBeenCalledOnce()
  })

  it('does not render upgrade button when showUpgradeButton is false', () => {
    render(
      <TrialAlert
        daysRemaining={7}
        urgencyLevel="low"
        onUpgradeClick={() => {}}
        showUpgradeButton={false}
      />
    )
    
    expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument()
  })
})
```

#### Step 3.2: Implement TrialAlert Component

Create `app/components/TrialAlert/TrialAlert.tsx`:

```typescript
import { Badge, Button, Flex, Group, Text } from '@mantine/core'
import { IconAlertTriangle, IconClock, IconCrown } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { TrialUrgencyLevel } from '~/app/utils/subscription'
import classes from './TrialAlert.module.css'

interface TrialAlertProps {
  daysRemaining: number
  urgencyLevel: TrialUrgencyLevel
  onUpgradeClick: () => void
  showUpgradeButton: boolean
  position?: 'header' | 'banner'
}

export default function TrialAlert({
  daysRemaining,
  urgencyLevel,
  onUpgradeClick,
  showUpgradeButton,
  position = 'header',
}: TrialAlertProps) {
  const { t } = useTranslation(['trial'])

  // Don't render if expired or not trial
  if (urgencyLevel === 'expired' || daysRemaining === 0) {
    return null
  }

  // Determine color based on urgency
  const color = urgencyLevel === 'low' ? 'blue' : urgencyLevel === 'medium' ? 'orange' : 'red'

  // Determine icon
  const Icon = urgencyLevel === 'high' ? IconAlertTriangle : urgencyLevel === 'medium' ? IconClock : null

  // Message with interpolation
  const message = daysRemaining === 1 
    ? t('trial:oneDayRemaining')
    : t('trial:daysRemaining', { days: daysRemaining })

  // Compact header badge for low urgency
  if (urgencyLevel === 'low' && position === 'header') {
    return (
      <Group gap="sm">
        <Badge color={color} variant="light" size="lg">
          <Text size="sm" fw={500}>
            {message}
          </Text>
        </Badge>
        {showUpgradeButton && (
          <Button
            variant="light"
            color={color}
            size="xs"
            leftSection={<IconCrown size={14} />}
            onClick={onUpgradeClick}
          >
            {t('trial:upgradeNow')}
          </Button>
        )}
      </Group>
    )
  }

  // Prominent banner for medium/high urgency
  return (
    <Flex
      className={classes.banner}
      align="center"
      justify="center"
      gap="md"
      p="md"
      style={{
        backgroundColor: `var(--mantine-color-${color}-1)`,
        borderBottom: `2px solid var(--mantine-color-${color}-5)`,
      }}
    >
      {Icon && (
        <Icon
          size={urgencyLevel === 'high' ? 28 : 24}
          color={`var(--mantine-color-${color}-7)`}
        />
      )}
      <Text size={urgencyLevel === 'high' ? 'lg' : 'md'} fw={600} c={`${color}.9`}>
        {urgencyLevel === 'high' ? t('trial:trialExpiringSoon') : message}
      </Text>
      {showUpgradeButton && (
        <Button
          variant="filled"
          color={color}
          size={urgencyLevel === 'high' ? 'md' : 'sm'}
          leftSection={<IconCrown size={18} />}
          onClick={onUpgradeClick}
        >
          {t('trial:upgradeNow')}
        </Button>
      )}
    </Flex>
  )
}
```

Create `app/components/TrialAlert/TrialAlert.module.css`:

```css
.banner {
  width: 100%;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .banner {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}
```

Create `app/components/TrialAlert/index.ts`:

```typescript
export { default } from './TrialAlert'
```

**Run Tests**:
```bash
bun run test app/test/components/TrialAlert.test.tsx
```

---

### Phase 4: Integration with Layout

**Files to Modify**:
- `app/layouts/Layout/Layout.tsx`
- `app/layouts/Header/Header.tsx`

#### Step 4.1: Update Layout Component

Modify `app/layouts/Layout/Layout.tsx` to use new trial utilities and TrialAlert component:

```typescript
// Add imports
import TrialAlert from '~/app/components/TrialAlert'
import { calculateTrialStatus, getTrialAlertConfig } from '~/app/utils/subscription'

// In LayoutContent component, replace existing trial calculations with:
const trialStatus = calculateTrialStatus({
  status: subscriptionStatus.status,
  trialEnd: subscriptionStatus.trialEnd,
})

const trialAlertConfig = getTrialAlertConfig(
  trialStatus,
  canUpgrade(user.currentPlan, subscriptionStatus.status)
)

// Replace existing hasActiveTrialBanner calculation:
const hasActiveTrialBanner = trialAlertConfig.visible && trialAlertConfig.position === 'header'

// Add banner rendering after header:
{trialAlertConfig.visible && trialAlertConfig.position === 'banner' && (
  <TrialAlert
    daysRemaining={trialStatus.daysRemaining}
    urgencyLevel={trialStatus.urgencyLevel}
    onUpgradeClick={() => navigate('/billing?upgrade=true')}
    showUpgradeButton={trialAlertConfig.showUpgradeButton}
    position="banner"
  />
)}
```

#### Step 4.2: Update Header Component

Modify `app/layouts/Header/Header.tsx` to use TrialAlert component:

```typescript
// Add import
import TrialAlert from '~/app/components/TrialAlert'

// Replace existing trial alert rendering in header with:
{hasActiveTrialBanner && (
  <Flex align="center" justify="center" style={{ flex: 1 }}>
    <TrialAlert
      daysRemaining={trialPeriodDays}
      urgencyLevel={trialPeriodDays >= 7 ? 'low' : trialPeriodDays >= 3 ? 'medium' : 'high'}
      onUpgradeClick={onUpgradeClick}
      showUpgradeButton={showUpgradeCta}
      position="header"
    />
  </Flex>
)}
```

---

## Testing Strategy

### Run Unit Tests

```bash
# Test subscription utilities
bun run test app/test/utils/subscription.test.ts

# Test TrialAlert component
bun run test app/test/components/TrialAlert.test.tsx

# Run all tests
bun run test
```

### Manual Testing Checklist

#### Test 1: Low Urgency (7+ Days)
1. Create test user with trial ending in 10 days
2. Login and verify blue badge in header
3. Check "Upgrade Now" button appears
4. Verify dark/light mode both work

#### Test 2: Medium Urgency (3-6 Days)
1. Modify test user trial to end in 5 days
2. Verify orange banner below header
3. Check clock icon appears
4. Verify message shows correct days

#### Test 3: High Urgency (1-2 Days)
1. Modify test user trial to end in 1 day
2. Verify red banner with large styling
3. Check warning icon appears
4. Verify urgent message displays

#### Test 4: Trial Conversion
1. Complete payment for trial subscription
2. Verify alert disappears within 3 seconds
3. Check no alert on subsequent page loads
4. Verify multiple tabs update simultaneously

#### Test 5: Responsive Design
1. Test on mobile (375px width)
2. Test on tablet (768px width)
3. Test on desktop (1920px width)
4. Verify layout adapts appropriately

#### Test 6: SSE Reconnection
1. Start with trial user
2. Disable network (DevTools offline mode)
3. Re-enable network
4. Verify alert still shows correct status

---

## Stripe Testing

### Test Trial Conversion with Stripe CLI

```bash
# Terminal 1: Start webhook listener
bun run stripe:listen

# Terminal 2: Start dev server
bun run dev

# Terminal 3: Trigger test webhook
stripe trigger invoice.payment_succeeded
```

**Expected Behavior**:
1. Webhook received and processed
2. Database subscription status updated
3. SSE event broadcast
4. Trial alert disappears within 3 seconds

---

## Debugging Tips

### Trial Alert Not Showing

**Check**:
1. Subscription status is "trialing": `console.log(user.planStatus)`
2. Trial end is in future: `console.log(user.trialPeriodDays)`
3. Component receives correct props: Add `console.log` in TrialAlert

### Alert Not Disappearing After Payment

**Check**:
1. Stripe webhook received: Check terminal logs
2. Database updated: Query subscription table
3. SSE event sent: Check network tab for event stream
4. React state updated: Add `console.log` in Layout useEffect

### SSE Connection Issues

**Check**:
1. Browser supports SSE: All modern browsers do
2. CORS configured: Check server CORS settings
3. Authentication valid: Check session cookie
4. Network tab shows open connection: EventStream type

---

## Performance Monitoring

### Metrics to Track

- **Initial Load**: Trial alert visible within 200ms
- **SSE Latency**: Status update within 3 seconds of webhook
- **Re-render Performance**: No jank when alert appears/disappears
- **Memory**: No memory leaks from SSE connection

### Performance Testing

```typescript
// Add to Layout component for development
useEffect(() => {
  const start = performance.now()
  console.log('⏱️ Trial status calculation took:', performance.now() - start, 'ms')
}, [subscriptionStatus])
```

---

## Deployment Checklist

Before deploying to production:

- ✅ All unit tests passing
- ✅ All component tests passing
- ✅ Manual testing completed (all scenarios)
- ✅ Dark/light mode verified
- ✅ Responsive design verified (mobile/tablet/desktop)
- ✅ Stripe webhook tested with test mode
- ✅ SSE connection tested with disconnection scenarios
- ✅ Internationalization verified (English + French)
- ✅ No console errors or warnings
- ✅ Performance metrics acceptable
- ✅ Constitutional compliance verified

---

## Rollback Plan

If issues arise in production:

1. **Immediate**: Feature flag to disable trial alerts
2. **Short-term**: Revert to previous trial display system
3. **Long-term**: Fix issues and redeploy with additional testing

**Feature Flag**:
```typescript
// In Layout.tsx
const SHOW_NEW_TRIAL_ALERT = process.env.ENABLE_NEW_TRIAL_ALERT === 'true'

{SHOW_NEW_TRIAL_ALERT ? (
  <TrialAlert {...props} />
) : (
  <OldTrialAlert {...props} />
)}
```

---

## Support & Resources

- **Spec**: `specs/002-trial-alert-redesign/spec.md`
- **Research**: `specs/002-trial-alert-redesign/research.md`
- **Data Model**: `specs/002-trial-alert-redesign/data-model.md`
- **API Contracts**: `specs/002-trial-alert-redesign/contracts/api-dependencies.md`
- **Constitution**: `.specify/memory/constitution.md`
- **Mantine Docs**: https://mantine.dev
- **React Router v7 Docs**: https://reactrouter.com

---

**Implementation Complete** ✅  
**Ready for /tasks breakdown** ✅
