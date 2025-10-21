# Research Document: Trial Alert Display Redesign

**Feature**: Trial Alert Display Redesign  
**Date**: October 21, 2025  
**Status**: Phase 0 Complete

## Overview

This document consolidates research findings for implementing a redesigned trial alert display system that provides clear visibility of trial status and automatically disappears upon conversion to paid subscription.

## Research Tasks Completed

### 1. Existing Trial Alert Implementation Analysis

**Research Focus**: Understanding the current trial alert implementation to identify what needs to be redesigned.

**Findings**:
- **Current Location**: Trial alert is displayed in the Header component (`app/layouts/Header/Header.tsx`)
- **Current Display Logic**: 
  - Shows when `hasActiveTrialBanner` prop is true
  - Displays days remaining with orange color
  - Includes upgrade button when `showUpgradeCta` is true
- **Current Calculation**: Trial days calculated in Layout component using `dayjs` and `subscriptionStatus.trialEnd`
- **Current Position**: Centered in header between logo and user menu
- **Real-time Updates**: Uses `SubscriptionStreamManager` with SSE to update subscription status

**Decision**: **Refactor existing Header trial alert into dedicated TrialAlert component with improved design patterns**

**Rationale**: 
- Current implementation mixes concerns (header layout + trial logic)
- Need flexible positioning (not just header)
- Improved urgency-based styling not present
- Better separation of concerns enables independent testing

**Alternatives Considered**:
- Keep trial alert only in header → Rejected: limits flexibility for different urgency levels
- Create entirely new banner system → Rejected: existing SSE infrastructure works well

---

### 2. Real-Time Subscription Status Update Mechanism

**Research Focus**: How to ensure trial alert disappears immediately after payment without page refresh.

**Findings**:
- **Existing Infrastructure**: `SubscriptionStreamManager` singleton class (`app/lib/subscription-stream.ts` - needs verification)
- **SSE Pattern**: Server-Sent Events used for real-time subscription updates
- **Current Usage**: Layout component subscribes to subscription status changes via SSE
- **Event Flow**: 
  1. Payment webhook updates database
  2. Server broadcasts subscription status change via SSE
  3. Client receives event and updates React state
  4. UI re-renders with new subscription status
- **Reconnection**: Manager handles automatic reconnection on disconnect

**Decision**: **Use existing SubscriptionStreamManager SSE infrastructure for real-time alert removal**

**Rationale**:
- Already implemented and working in production
- Handles edge cases (reconnection, multiple tabs)
- ~3 second latency acceptable for trial conversion feedback
- No polling overhead

**Alternatives Considered**:
- WebSocket with bidirectional communication → Rejected: SSE sufficient for one-way updates
- Polling every 5 seconds → Rejected: unnecessary server load, higher latency
- Manual page refresh requirement → Rejected: poor UX

---

### 3. Trial Urgency Level Design Patterns

**Research Focus**: Best practices for urgency-based UI indicators in SaaS applications.

**Findings**:
- **Industry Patterns**:
  - Low urgency (7+ days): Subtle badge or banner, informational tone
  - Medium urgency (3-6 days): More prominent banner, warning colors (yellow/orange)
  - High urgency (1-2 days): Highly visible alert, urgent colors (red/orange), larger size
- **Color Psychology**:
  - Yellow: Caution, attention needed
  - Orange: Warning, time-sensitive
  - Red: Urgent, critical action required
- **Mantine UI Colors**: `yellow`, `orange`, `red` with semantic variants (`yellow.7`, `orange.6`, etc.)
- **Positioning Strategy**:
  - Low urgency: Header badge or inline alert
  - Medium urgency: Prominent banner below header
  - High urgency: Full-width banner or modal-like alert

**Decision**: **Implement three-tier urgency system with Mantine theme colors**

**Rationale**:
- Aligns with industry best practices
- Mantine UI provides consistent, theme-aware color system
- Progressive disclosure matches user mental model (more days = less urgency)
- Accessibility: color + text content + size variation

**Design Specification**:
```typescript
// Urgency levels based on days remaining
LOW_URGENCY: 7+ days
  - Color: var(--mantine-color-blue-6)
  - Size: Compact badge in header
  - Message: "X days left in trial"
  - CTA: Optional "Upgrade" link

MEDIUM_URGENCY: 3-6 days
  - Color: var(--mantine-color-orange-6)
  - Size: Prominent banner below header
  - Message: "Your trial expires in X days"
  - CTA: Prominent "Upgrade Now" button

HIGH_URGENCY: 1-2 days
  - Color: var(--mantine-color-red-6)
  - Size: Full-width alert banner
  - Message: "Trial expires soon! Upgrade to keep access"
  - CTA: Large "Upgrade Now" button
  - Icon: Warning/clock icon
```

**Alternatives Considered**:
- Four-tier system (10+, 7-9, 3-6, 1-2) → Rejected: too granular, cognitive overhead
- Two-tier system (>3, ≤3) → Rejected: insufficient gradation
- Consistent design regardless of urgency → Rejected: doesn't match user need for progressive awareness

---

### 4. Trial Status Calculation Logic

**Research Focus**: Accurate and consistent trial status computation across the application.

**Findings**:
- **Current Calculation**: Scattered across multiple components
- **Data Source**: `Subscription.trialEnd` (Unix timestamp in seconds)
- **Libraries**: `dayjs` already used throughout application
- **Edge Cases**:
  - Timezone differences: Use UTC timestamps, display in local timezone
  - Same-day expiration: Consider expired if difference < 24 hours
  - Negative days (already expired): Should show expired state, not negative numbers
  - Trial extended by admin: Calculation handles this automatically via updated trialEnd

**Decision**: **Create centralized subscription utility module with pure functions for trial calculations**

**Rationale**:
- Single source of truth for business logic
- Easier to test independently
- Reusable across components
- Prevents calculation drift

**Function Specifications**:
```typescript
// app/utils/subscription.ts

export function calculateTrialDaysRemaining(trialEnd: number): number {
  // Returns days remaining, 0 if expired, handles edge cases
}

export function getTrialUrgencyLevel(daysRemaining: number): 'low' | 'medium' | 'high' | 'expired' {
  // Returns urgency level based on days remaining
}

export function shouldShowTrialAlert(status: string, trialEnd: number): boolean {
  // Determines if trial alert should be visible
}

export function getTrialAlertConfig(daysRemaining: number, urgencyLevel: string) {
  // Returns alert configuration (colors, messages, size)
}
```

**Alternatives Considered**:
- Keep calculations inline in components → Rejected: duplication, hard to test
- Use Prisma computed fields → Rejected: calculation better done client-side for real-time updates
- Create React hooks for calculations → Rejected: pure functions more flexible and testable

---

### 5. Responsive Design Strategy for Trial Alerts

**Research Focus**: How to display trial alerts effectively across different screen sizes.

**Findings**:
- **Breakpoints**: Mantine UI uses standard breakpoints (xs: 576px, sm: 768px, md: 992px, lg: 1200px, xl: 1408px)
- **Current Application Constraints**: Minimum supported width 320px (mobile)
- **Layout Considerations**:
  - Mobile (320-767px): Limited horizontal space, trial alert should be compact
  - Tablet (768-991px): Moderate space, can show more detail
  - Desktop (992px+): Full space, can show comprehensive trial info
- **Mantine Components**: `Stack`, `Group`, `Flex` with responsive props

**Decision**: **Implement responsive trial alert using Mantine's responsive utilities and conditional rendering**

**Rationale**:
- Mantine provides built-in responsive design system
- Mobile-first approach ensures critical info visible on smallest screens
- Progressive enhancement adds detail on larger screens

**Responsive Strategy**:
```typescript
// Mobile (< 768px):
- Compact badge in header: "X days left"
- Upgrade button icon-only or abbreviated

// Tablet (768-991px):
- Badge with short message: "Trial: X days remaining"
- Standard upgrade button

// Desktop (992px+):
- Full alert with complete message
- Large upgrade button with icon
- Optional additional context (plan details)
```

**Implementation Approach**:
- Use Mantine's `hiddenFrom`/`visibleFrom` props
- Use responsive sizing: `size={{ base: 'sm', md: 'md' }}`
- Conditional text based on viewport width

**Alternatives Considered**:
- Fixed design for all screen sizes → Rejected: poor mobile UX
- Different component for each breakpoint → Rejected: maintenance burden
- CSS media queries only → Rejected: Mantine's responsive props more maintainable

---

### 6. Internationalization (i18n) for Trial Messages

**Research Focus**: Supporting English and French translations for trial alerts.

**Findings**:
- **Current System**: `react-i18next` with namespace-based translation files
- **Existing Namespaces**: `navigation`, `payment`, `auth`, `common`, `emails`
- **Translation Files**: `app/locales/en/` and `app/locales/fr/`
- **Usage Pattern**: `const { t } = useTranslation(['namespace'])` then `t('namespace:key')`
- **Interpolation**: Supports variable interpolation like `{days}`, `{planName}`

**Decision**: **Create new `trial` translation namespace with comprehensive trial alert messages**

**Rationale**:
- Dedicated namespace keeps trial-related translations organized
- Follows existing project pattern
- Enables easy addition of more languages in future

**Translation Keys Required**:
```typescript
// app/locales/en/trial.ts
export default {
  // Days remaining messages
  daysRemaining: '{days} days left in trial',
  oneDayRemaining: '1 day left in trial',
  trialExpiresIn: 'Trial expires in {days} days',
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

**Alternatives Considered**:
- Add to existing `payment` namespace → Rejected: namespace becoming too large
- Add to existing `navigation` namespace → Rejected: trial alerts not navigation
- No dedicated namespace, inline translations → Rejected: violates i18n best practices

---

### 7. Testing Strategy for Trial Alert System

**Research Focus**: Comprehensive testing approach for trial alert functionality.

**Findings**:
- **Existing Test Infrastructure**: 
  - Vitest for unit tests
  - Testing Library for component tests
  - Playwright for E2E tests
- **Testing Patterns**: Tests in `app/test/` mirroring source structure
- **Mocking Strategy**: Mock SSE, subscription data, time calculations

**Decision**: **Implement three-tier testing strategy: Unit → Component → E2E**

**Rationale**:
- Unit tests for business logic (calculations, utilities)
- Component tests for UI rendering and interactions
- E2E tests for critical user flows (trial conversion)
- Matches project testing philosophy (Test-First Development)

**Test Specifications**:

**Unit Tests** (`app/test/utils/subscription.test.ts`):
```typescript
describe('calculateTrialDaysRemaining', () => {
  it('calculates days correctly for future date')
  it('returns 0 for past date')
  it('handles same-day expiration')
  it('handles timezone differences')
})

describe('getTrialUrgencyLevel', () => {
  it('returns "low" for 7+ days')
  it('returns "medium" for 3-6 days')
  it('returns "high" for 1-2 days')
  it('returns "expired" for 0 days')
})

describe('shouldShowTrialAlert', () => {
  it('shows alert for trialing status with days remaining')
  it('hides alert for active status')
  it('hides alert for expired trial')
})
```

**Component Tests** (`app/test/components/TrialAlert.test.tsx`):
```typescript
describe('TrialAlert Component', () => {
  it('renders with low urgency styling for 7+ days')
  it('renders with medium urgency styling for 3-6 days')
  it('renders with high urgency styling for 1-2 days')
  it('does not render for active subscription')
  it('displays correct message based on days remaining')
  it('shows upgrade button when prop is true')
  it('calls onUpgrade when button clicked')
  it('renders responsive layout on mobile')
  it('renders responsive layout on desktop')
  it('supports dark and light themes')
})
```

**E2E Tests** (future - not created in /plan command):
```typescript
describe('Trial Alert Flow', () => {
  it('displays trial alert for trial user on login')
  it('updates urgency as trial approaches expiration')
  it('removes alert immediately after payment success')
  it('navigates to billing page on upgrade click')
  it('maintains alert state across page navigation')
})
```

**Alternatives Considered**:
- Only E2E tests → Rejected: slow, hard to debug, doesn't test units
- Only unit tests → Rejected: doesn't verify UI rendering
- Manual testing only → Rejected: violates TDD constitution requirement

---

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Language | TypeScript | 5.8.2 | Type-safe development |
| Frontend Framework | React Router | 7.8.2 | Routing and data loading |
| UI Library | Mantine UI | 8.2.7 | Component library with theme support |
| State Management | React Hooks | 19.1.1 | Local state + SSE updates |
| Real-time Updates | SSE (Server-Sent Events) | Native | Subscription status streaming |
| Date/Time | dayjs | 1.11.13 | Trial date calculations |
| Internationalization | react-i18next | 25.3.2 | Multi-language support |
| Testing | Vitest + Testing Library | 3.2.3 / 16.3.0 | Unit + component tests |
| Database | PostgreSQL + Prisma | Latest | Subscription data persistence |

## Key Design Decisions Summary

1. **Component Architecture**: Dedicated `TrialAlert` component with centralized utility functions
2. **Real-time Updates**: Leverage existing `SubscriptionStreamManager` SSE infrastructure
3. **Urgency System**: Three-tier system (low/medium/high) based on days remaining
4. **Styling**: Mantine UI components with theme-aware colors (dark/light mode support)
5. **Responsive Design**: Mobile-first with progressive enhancement using Mantine responsive utilities
6. **Internationalization**: New `trial` namespace with English and French translations
7. **Testing**: Three-tier strategy (unit → component → E2E) following TDD principles
8. **Performance**: SSE updates within 3 seconds, no polling, graceful degradation

## Open Questions & Resolutions

**Q1**: Should trial alert persist after user dismisses it?  
**A**: No. Alert should remain visible until trial converts or expires. No dismiss functionality to ensure users are always aware of trial status.

**Q2**: What happens if SSE connection fails?  
**A**: Graceful degradation - use last known subscription status from loader data. Alert may not disappear immediately after payment but will update on next page load.

**Q3**: Should alert block critical application functionality?  
**A**: No. Alert should be informational and non-blocking. Users can continue using the app even with trial alerts visible.

**Q4**: How to handle trial extensions by admin?  
**A**: Automatic. Calculation uses `trialEnd` timestamp from database which admins can update. Alert will reflect new expiration date immediately via SSE.

## Next Steps (Phase 1)

1. Generate `data-model.md` - document subscription data entities and state transitions
2. Generate API contracts in `/contracts/` - define any new API endpoints (if needed)
3. Generate `quickstart.md` - developer guide for implementing this feature
4. Update agent context with trial alert implementation patterns

---

**Research Phase Complete** ✅  
**All NEEDS CLARIFICATION items resolved** ✅  
**Ready for Phase 1: Design & Contracts** ✅
