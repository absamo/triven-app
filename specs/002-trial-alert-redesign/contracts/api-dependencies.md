# API Dependencies: Trial Alert Display Redesign

**Feature**: Trial Alert Display Redesign  
**Date**: October 21, 2025  
**Type**: API Consumption (No New Endpoints)

## Overview

This feature does NOT introduce new API endpoints. Instead, it consumes existing subscription-related APIs and real-time event streams. This document catalogs the existing APIs that the trial alert system depends on.

---

## Existing API Dependencies

### 1. Subscription Status SSE Stream

**Endpoint**: `/api/subscription-stream` (or similar SSE endpoint)  
**Method**: `GET` (Server-Sent Events)  
**Authentication**: Required (session-based via Better Auth)  
**Purpose**: Real-time subscription status updates for trial alert removal

**Request**:
```http
GET /api/subscription-stream HTTP/1.1
Host: app.triven.com
Accept: text/event-stream
Cookie: session=<session-token>
```

**Response** (SSE Event Stream):
```
event: connected
data: {"type":"connected","timestamp":1729512000}

event: subscription
data: {"type":"subscription","userId":"clx123","status":"active","trialEnd":0,"timestamp":1729512060}

event: subscription
data: {"type":"subscription","userId":"clx123","status":"trialing","trialEnd":1730116800,"timestamp":1729512120}
```

**Event Types**:
- `connected`: Connection established
- `subscription`: Subscription status changed

**Payload Schema** (subscription event):
```typescript
{
  type: 'subscription',
  userId: string,        // Target user ID
  status: string,        // New subscription status
  trialEnd: number,      // Trial end timestamp (Unix seconds, 0 for non-trial)
  timestamp: number      // Event timestamp
}
```

**Error Handling**:
- Connection lost: Client reconnects automatically (handled by `SubscriptionStreamManager`)
- Authentication failure: 401 response, redirect to login
- Server error: Client continues with last known state

**Usage in Feature**:
- Trial alert listens to `subscription` events
- On `status` change from "trialing" to "active", alert disappears
- Updates happen within 3 seconds of payment webhook processing

---

### 2. User Loader Data (React Router)

**Endpoint**: Root loader (implicit, not direct API)  
**Method**: N/A (Server-side data loading)  
**Authentication**: Required (Better Auth session)  
**Purpose**: Initial subscription status on page load

**Data Structure**:
```typescript
interface UserLoaderData {
  user: {
    id: string
    email: string
    planStatus: string         // Subscription status
    currentPlan: string        // Plan name (e.g., "professional")
    trialPeriodDays: number   // Days remaining (calculated server-side)
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
    role: {
      name: string
      permissions: string[]
    }
    // ... other user fields
  }
  // ... other loader data
}
```

**Relevant Fields**:
- `planStatus`: Current subscription status ("trialing", "active", etc.)
- `trialPeriodDays`: Pre-calculated days remaining (for initial render)

**Usage in Feature**:
- Initial trial alert visibility and urgency level
- Fallback when SSE unavailable
- Source of truth on page load

---

### 3. Subscription Status Check API (Fallback)

**Endpoint**: `/api/subscription-status`  
**Method**: `POST`  
**Authentication**: Required (Better Auth session)  
**Purpose**: Manual subscription status verification (fallback for SSE)

**Request**:
```http
POST /api/subscription-status HTTP/1.1
Host: app.triven.com
Content-Type: application/json
Cookie: session=<session-token>

{
  "action": "check"
}
```

**Response** (Success):
```json
{
  "status": "active",
  "message": "Subscription is active",
  "subscriptionStatus": "active",
  "trialEnd": 0
}
```

**Response** (Trial Active):
```json
{
  "status": "trialing",
  "message": "Subscription is trialing",
  "subscriptionStatus": "trialing",
  "trialEnd": 1730116800,
  "trialDaysRemaining": 7
}
```

**Response** (Error):
```json
{
  "error": "Not authenticated",
  "status": 401
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

**Usage in Feature**:
- Rarely used (SSE preferred)
- Fallback when SSE connection fails persistently
- Manual verification in edge cases

---

## Webhook Dependencies (Indirect)

### Stripe Webhook: `invoice.payment_succeeded`

**Endpoint**: `/api/webhook` (Stripe webhook receiver)  
**Method**: `POST`  
**Authentication**: Stripe signature verification  
**Purpose**: Triggers subscription status update and SSE broadcast

**Flow**:
1. User completes payment for trial subscription
2. Stripe sends `invoice.payment_succeeded` webhook
3. Backend updates `Subscription.status` to "active", `trialEnd` to 0
4. Backend broadcasts SSE event with new status
5. Client receives SSE event, trial alert disappears

**Trial Alert Dependency**:
- Indirect: Trial alert doesn't call this endpoint
- Critical: Webhook processing triggers the SSE event that removes alert
- Latency: ~1-3 seconds from webhook to alert removal

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Trial Alert Data Flow                         │
└─────────────────────────────────────────────────────────────────┘

1. Page Load:
   ┌──────────────┐
   │ React Router │──────> Loader fetches user data
   │   Loader     │        (includes planStatus, trialPeriodDays)
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Trial Alert  │──────> Calculates initial urgency & config
   │  Component   │        Displays based on loader data
   └──────────────┘


2. Real-Time Updates (Payment):
   ┌──────────────┐
   │    Stripe    │──────> invoice.payment_succeeded webhook
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │   Backend    │──────> Updates Subscription.status = 'active'
   │   Webhook    │        Sets Subscription.trialEnd = 0
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ SSE Broadcast│──────> Sends subscription event to all user's tabs
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │SubscriptionS │──────> Receives event, dispatches to listeners
   │treamManager  │
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Layout State │──────> setSubscriptionStatus({ status: 'active', trialEnd: 0 })
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Trial Alert  │──────> Re-renders, calculates isTrial = false
   │  Component   │        Component unmounts (not visible)
   └──────────────┘


3. Fallback (SSE Unavailable):
   ┌──────────────┐
   │ Trial Alert  │──────> Uses loader data only
   │  Component   │        May not update until page refresh
   └──────────────┘
```

---

## API Contract Testing

### Unit Tests (Mock API Responses)

**Test**: SSE subscription event handling
```typescript
describe('SubscriptionStreamManager', () => {
  it('dispatches subscription event to listeners', () => {
    const mockEvent = {
      type: 'subscription',
      userId: 'test-user',
      status: 'active',
      trialEnd: 0,
      timestamp: Date.now() / 1000,
    }
    
    const listener = vi.fn()
    manager.addListener('subscription', listener)
    
    // Simulate SSE event
    manager.handleMessage(mockEvent)
    
    expect(listener).toHaveBeenCalledWith(mockEvent)
  })
})
```

**Test**: Loader data provides correct trial status
```typescript
describe('Layout Loader', () => {
  it('calculates trialPeriodDays correctly', async () => {
    const mockSubscription = {
      status: 'trialing',
      trialEnd: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    }
    
    const loaderData = await loader({ request: mockRequest })
    
    expect(loaderData.user.planStatus).toBe('trialing')
    expect(loaderData.user.trialPeriodDays).toBe(7)
  })
})
```

### Integration Tests (API Mocking)

**Test**: Trial alert disappears after payment webhook
```typescript
describe('Trial Alert Integration', () => {
  it('removes alert when subscription status changes to active', async () => {
    // Setup: Render with trial status
    const { queryByText } = render(<Layout user={trialUser} />)
    expect(queryByText(/trial/i)).toBeInTheDocument()
    
    // Simulate webhook processing + SSE event
    await act(async () => {
      mockSSE.emit('subscription', {
        type: 'subscription',
        userId: trialUser.id,
        status: 'active',
        trialEnd: 0,
      })
    })
    
    // Assert: Alert should disappear
    await waitFor(() => {
      expect(queryByText(/trial/i)).not.toBeInTheDocument()
    })
  })
})
```

---

## No New API Endpoints Required

This feature is **API consumption only**. All necessary APIs already exist:

✅ SSE stream for real-time updates  
✅ Loader data for initial subscription status  
✅ Fallback status check endpoint (existing)  
✅ Webhook processing infrastructure (existing)

**No REST API design needed** for this feature.

---

## Performance Considerations

### API Call Frequency

- **SSE Connection**: 1 persistent connection per browser tab
- **Loader Calls**: Once per page navigation (standard React Router behavior)
- **Fallback API**: Only on SSE failure (rare)

### Bandwidth Usage

- **SSE Events**: ~100-200 bytes per event
- **Frequency**: Only on status changes (infrequent)
- **Total**: Negligible bandwidth overhead

### Latency Requirements

- **Initial Load**: Trial status available immediately (from loader)
- **Real-Time Update**: < 3 seconds from webhook to UI update
- **Acceptable**: Meets success criteria SC-002

---

## Security Considerations

### Authentication

- All endpoints require Better Auth session
- SSE connection authenticated via session cookie
- No additional auth needed for trial alert feature

### Data Privacy

- Subscription status is user-specific (no cross-user data exposure)
- SSE events only sent to authenticated user's connections
- No sensitive payment details exposed in trial alert

---

## Summary

**API Dependencies**: Existing endpoints only, no new APIs  
**Real-Time**: SSE subscription events  
**Fallback**: Loader data + manual status check  
**Security**: Authenticated, user-specific data  
**Performance**: Negligible overhead, < 3s latency

**Ready for Quickstart Guide** ✅
