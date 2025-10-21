# Data Model: Trial Alert Display Redesign

**Feature**: Trial Alert Display Redesign  
**Date**: October 21, 2025  
**Status**: Phase 1 Complete

## Overview

This document defines the data entities, their relationships, validation rules, and state transitions for the trial alert display system. Since this feature primarily consumes existing subscription data rather than creating new entities, the focus is on data flow and computed states.

## Existing Database Entities

### Subscription Entity

**Source**: `prisma/schema.prisma` - `Subscription` model  
**Purpose**: Stores user subscription information including trial status

**Fields**:
```prisma
model Subscription {
  id                 String    @id @unique           // Stripe subscription ID
  userId             String    @unique                // User reference
  planId             String                          // Plan reference
  priceId            String                          // Price reference
  interval           String                          // "month" | "year"
  status             String                          // Stripe subscription status
  currentPeriodStart Int                             // Unix timestamp (seconds)
  currentPeriodEnd   Int                             // Unix timestamp (seconds)
  trialStart         Int                             // Unix timestamp (seconds)
  trialEnd           Int                             // Unix timestamp (seconds)
  cancelAtPeriodEnd  Boolean   @default(false)
  
  // Payment method details
  paymentMethodId    String?
  last4              String?
  brand              String?
  expMonth           Int?
  expYear            Int?
  
  // Cancellation tracking
  cancelledAt        DateTime?
  cancelledBy        String?
  cancellationReason String?
  scheduledCancelAt  DateTime?
  
  // Audit fields
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  // Relations
  plan               Plan      @relation(fields: [planId], references: [id])
  price              Price     @relation(fields: [priceId], references: [id])
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Relevant Fields for Trial Alert**:
- `status`: Subscription status (must be "trialing" to show alert)
- `trialStart`: When trial began (Unix timestamp in seconds)
- `trialEnd`: When trial ends (Unix timestamp in seconds)
- `updatedAt`: Last update time (for cache invalidation)

**Validation Rules**:
- `status` must be one of: "active", "trialing", "canceled", "incomplete", "incomplete_expired", "past_due", "unpaid"
- `trialEnd` must be greater than `trialStart` for valid trials
- `trialEnd` must be in the future for active trials (or 0 for non-trial subscriptions)

**No Database Changes Required**: Existing schema contains all necessary fields.

---

## Computed Data Models

These are runtime-computed entities that don't exist in the database but are calculated from subscription data.

### TrialStatus (Computed)

**Purpose**: Represents the current state of a user's trial  
**Computed From**: `Subscription.status`, `Subscription.trialEnd`  
**Lifetime**: Ephemeral (calculated per request/render)

**Type Definition**:
```typescript
// app/utils/subscription.ts

export interface TrialStatus {
  isTrial: boolean                    // Is subscription in trial status?
  daysRemaining: number              // Days until trial ends (0 if expired)
  urgencyLevel: TrialUrgencyLevel    // Computed urgency level
  isExpired: boolean                 // Is trial past expiration?
  expiresAt: Date | null            // Trial end date (local timezone)
}

export type TrialUrgencyLevel = 'low' | 'medium' | 'high' | 'expired'
```

**Calculation Logic**:
```typescript
export function calculateTrialStatus(subscription: {
  status: string
  trialEnd: number
}): TrialStatus {
  // If not trialing status, return default
  if (subscription.status !== 'trialing') {
    return {
      isTrial: false,
      daysRemaining: 0,
      urgencyLevel: 'expired',
      isExpired: false,
      expiresAt: null,
    }
  }
  
  // Calculate days remaining
  const now = Date.now()
  const trialEndMs = subscription.trialEnd * 1000
  const daysRemaining = Math.max(0, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24)))
  
  // Determine urgency level
  let urgencyLevel: TrialUrgencyLevel
  if (daysRemaining === 0) {
    urgencyLevel = 'expired'
  } else if (daysRemaining <= 2) {
    urgencyLevel = 'high'
  } else if (daysRemaining <= 6) {
    urgencyLevel = 'medium'
  } else {
    urgencyLevel = 'low'
  }
  
  return {
    isTrial: true,
    daysRemaining,
    urgencyLevel,
    isExpired: daysRemaining === 0,
    expiresAt: new Date(trialEndMs),
  }
}
```

**Validation Rules**:
- `daysRemaining` must be >= 0
- `urgencyLevel` must be one of: "low", "medium", "high", "expired"
- `expiresAt` must be valid Date or null

---

### TrialAlertConfig (Computed)

**Purpose**: Configuration for rendering trial alert UI  
**Computed From**: `TrialStatus.urgencyLevel`, `TrialStatus.daysRemaining`  
**Lifetime**: Ephemeral (calculated per render)

**Type Definition**:
```typescript
// app/utils/subscription.ts

export interface TrialAlertConfig {
  visible: boolean                    // Should alert be shown?
  color: MantineColor                 // Mantine theme color
  size: 'compact' | 'default' | 'large'  // Alert size
  icon: React.ComponentType | null   // Icon component
  message: string                     // i18n key for message
  showUpgradeButton: boolean         // Should show upgrade CTA?
  position: 'header' | 'banner' | 'modal'  // Where to display
}

type MantineColor = 'blue' | 'orange' | 'red' | 'gray'
```

**Calculation Logic**:
```typescript
export function getTrialAlertConfig(
  trialStatus: TrialStatus,
  canUpgrade: boolean
): TrialAlertConfig {
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
      icon: IconClock,
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
    icon: IconAlertTriangle,
    message: 'trial:trialExpiringSoon',
    showUpgradeButton: canUpgrade,
    position: 'banner',
  }
}
```

**Validation Rules**:
- `visible` must be boolean
- `color` must be valid Mantine theme color
- `size` must be one of: "compact", "default", "large"
- `position` must be one of: "header", "banner", "modal"

---

## State Transitions

### Trial Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                     Trial Lifecycle                              │
└─────────────────────────────────────────────────────────────────┘

                    User Signs Up (Free Trial)
                              │
                              ▼
                    ┌──────────────────┐
                    │  Trial Created   │
                    │  status: trialing│
                    │  trialEnd: +14d  │
                    └──────────────────┘
                              │
                              │ (Time passes)
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
          ┌──────────────────┐  ┌──────────────────┐
          │   Low Urgency    │  │  User Upgrades   │
          │   7+ days left   │  │  (Payment Added) │
          │   Blue badge     │  └──────────────────┘
          └──────────────────┘            │
                    │                     │
                    │ (Time passes)       │
                    ▼                     │
          ┌──────────────────┐            │
          │  Medium Urgency  │            │
          │   3-6 days left  │            │
          │  Orange banner   │            │
          └──────────────────┘            │
                    │                     │
                    │ (Time passes)       │
                    ▼                     │
          ┌──────────────────┐            │
          │   High Urgency   │            │
          │   1-2 days left  │            │
          │   Red banner     │            │
          └──────────────────┘            │
                    │                     │
                    │                     │
                    ▼                     ▼
          ┌──────────────────┐  ┌──────────────────┐
          │  Trial Expired   │  │ Active Paid Sub  │
          │  status: trialing│  │ status: active   │
          │  trialEnd passed │  │ trialEnd: 0      │
          │  Show modal      │  │ NO ALERT SHOWN   │
          └──────────────────┘  └──────────────────┘
```

### State Transition Rules

**Rule 1: Alert Visibility**
- **Show Alert**: `status === "trialing" AND trialEnd > currentTime AND trialEnd > 0`
- **Hide Alert**: `status !== "trialing" OR trialEnd <= currentTime OR trialEnd === 0`

**Rule 2: Urgency Progression** (one-way, time-based)
- `low` → `medium`: When `daysRemaining` decreases from 7 to 6
- `medium` → `high`: When `daysRemaining` decreases from 3 to 2
- `high` → `expired`: When `daysRemaining` decreases from 1 to 0

**Rule 3: Conversion (Any urgency → Hidden)**
- **Trigger**: Stripe webhook `invoice.payment_succeeded` for trial subscription
- **Database Update**: `status` changes from "trialing" to "active", `trialEnd` set to 0
- **SSE Broadcast**: Subscription status change event sent to connected clients
- **Client Update**: React state updated, alert component unmounts
- **Latency**: < 3 seconds from payment to alert removal

**Rule 4: Trial Extension (Urgency may decrease)**
- **Trigger**: Admin updates `trialEnd` to future date
- **Effect**: `daysRemaining` recalculated, urgency may decrease (e.g., high → medium)
- **Validation**: New `trialEnd` must be > current time

---

## Real-Time Data Flow

### SSE (Server-Sent Events) Data Structure

**Event Type**: `subscription`  
**Source**: Backend webhook processing or manual status updates  
**Consumer**: `SubscriptionStreamManager` singleton

**Payload Structure**:
```typescript
interface SubscriptionUpdateEvent {
  type: 'subscription'
  userId: string              // Target user ID
  status: string             // New subscription status
  trialEnd: number           // New trial end timestamp (0 for non-trial)
  timestamp: number          // Event timestamp (Unix seconds)
}
```

**Example Event**:
```json
{
  "type": "subscription",
  "userId": "clx1234567890",
  "status": "active",
  "trialEnd": 0,
  "timestamp": 1729512000
}
```

### Client-Side State Management

**Location**: `app/layouts/Layout/Layout.tsx`  
**State**: React `useState` hook for subscription status

**State Structure**:
```typescript
const [subscriptionStatus, setSubscriptionStatus] = useState<{
  status: string
  trialEnd: number
}>({
  status: user.planStatus,           // Initial from loader
  trialEnd: calculatedTrialEnd,      // Initial from loader
})
```

**Update Flow**:
1. Component mounts → Initialize state from loader data
2. SSE connection established → Subscribe to subscription updates
3. Server broadcasts event → `SubscriptionStreamManager` receives
4. Manager dispatches event → Component listener triggered
5. Listener updates state → `setSubscriptionStatus(newData)`
6. React re-renders → Trial alert component receives new props
7. Alert component re-calculates `TrialStatus` → UI updates

---

## Data Validation

### Input Validation (from Stripe/Database)

**Subscription Status Values** (from Stripe):
```typescript
enum StripeSubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
}
```

**Validation Schema** (Zod):
```typescript
// app/common/validations/subscriptionSchema.ts

import { z } from 'zod'

export const subscriptionStatusSchema = z.enum([
  'active',
  'trialing',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
])

export const subscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: subscriptionStatusSchema,
  trialStart: z.number().int().nonnegative(),
  trialEnd: z.number().int().nonnegative(),
  currentPeriodStart: z.number().int().nonnegative(),
  currentPeriodEnd: z.number().int().nonnegative(),
})

export type ISubscription = z.infer<typeof subscriptionSchema>
```

### Computed Value Validation

**Trial Days Remaining**:
- Must be >= 0
- Must be integer
- Formula: `Math.max(0, Math.ceil((trialEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))`

**Urgency Level**:
- Must be one of: "low", "medium", "high", "expired"
- Deterministic based on `daysRemaining`

---

## Edge Cases & Handling

### Edge Case 1: Multiple Browser Tabs

**Scenario**: User has multiple tabs open when trial converts  
**Handling**: 
- SSE broadcasts to all tabs via `BroadcastChannel` or individual connections
- Each tab independently updates its local state
- Alert disappears in all tabs within 3 seconds

### Edge Case 2: SSE Connection Lost

**Scenario**: Network interruption, server restart  
**Handling**:
- `SubscriptionStreamManager` attempts automatic reconnection (exponential backoff)
- Alert continues showing last known state
- On successful reconnection, server sends current subscription status
- Alert updates to reflect current reality

### Edge Case 3: Timezone Differences

**Scenario**: User in different timezone than server  
**Handling**:
- All timestamps stored in UTC (Unix seconds)
- Client converts to local timezone for display only
- Calculations use UTC timestamps consistently
- No timezone-related drift

### Edge Case 4: Trial Expiration During Session

**Scenario**: User is actively using app when trial expires  
**Handling**:
- No automatic logout or hard block
- Alert changes to "expired" state
- User can continue current session
- On next navigation or page refresh, loader may enforce access restrictions

### Edge Case 5: Same-Day Expiration

**Scenario**: Trial expires today (< 24 hours remaining)  
**Handling**:
- If < 24 hours remain, show "1 day left" (rounded up)
- If < 1 hour remains, show "Trial expires today"
- Use high urgency styling (red)

### Edge Case 6: Admin Trial Extension

**Scenario**: Admin extends trial from backend  
**Handling**:
- Database `trialEnd` updated
- SSE broadcast sent with new `trialEnd`
- Client recalculates `daysRemaining` and `urgencyLevel`
- Alert urgency may decrease (e.g., from high to medium)
- No page refresh required

---

## Performance Considerations

### Calculation Performance

**Trial Status Calculation**:
- **Operation**: Pure function, O(1) complexity
- **Frequency**: Every render when subscription status changes
- **Cost**: Negligible (simple arithmetic and comparisons)
- **Optimization**: Memoize with `useMemo` if needed

**Alert Config Calculation**:
- **Operation**: Pure function, O(1) complexity
- **Frequency**: When `TrialStatus` changes
- **Cost**: Negligible
- **Optimization**: None needed

### Real-Time Update Performance

**SSE Connection**:
- **Overhead**: 1 persistent HTTP connection per tab
- **Bandwidth**: Minimal (events only on status change)
- **Latency**: < 3 seconds from webhook to UI update
- **Scalability**: Handled by existing infrastructure

---

## Summary

**No Database Schema Changes Required** ✅  
**Data Model**: Leverages existing `Subscription` entity with computed states  
**State Management**: React local state + SSE for real-time updates  
**Validation**: Zod schemas for runtime safety  
**Edge Cases**: Comprehensive handling documented  
**Performance**: Optimized for real-time updates with minimal overhead

**Ready for Contract Generation** ✅
