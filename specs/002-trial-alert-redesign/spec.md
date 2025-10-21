# Feature Specification: Trial Alert Display Redesign

**Feature Branch**: `002-trial-alert-redesign`  
**Created**: October 21, 2025  
**Status**: Draft  
**Input**: User description: "redesign trial alert display. find the best to display. it should disapear after trial conversion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Active Trial Alert Display (Priority: P1)

Users with active trials need clear, non-intrusive visibility of their trial status and remaining time to encourage timely conversion decisions without disrupting their workflow.

**Why this priority**: Core feature value - trial visibility directly impacts conversion rates and prevents unexpected access loss. Must work independently as the primary user journey.

**Independent Test**: Can be fully tested by logging in with a trial account and verifying that trial status is clearly visible, shows accurate days remaining, and provides upgrade path. Delivers immediate value by informing users of trial status.

**Acceptance Scenarios**:

1. **Given** a user has an active trial with 7+ days remaining, **When** they navigate to any page, **Then** they see a subtle, informative trial status indicator showing days remaining and upgrade option
2. **Given** a user has an active trial with 3 or fewer days remaining, **When** they view the dashboard, **Then** they see a more prominent trial alert with urgency indicators (e.g., color changes, emphasis) and clear upgrade call-to-action
3. **Given** a user has an active trial with 1 day remaining, **When** they log in, **Then** they see a high-priority alert emphasizing immediate action needed
4. **Given** a trial user views the alert, **When** they click the upgrade button, **Then** they are taken to the billing page with their trial plan pre-selected for seamless conversion

---

### User Story 2 - Trial Conversion Confirmation (Priority: P2)

After a user upgrades from trial to a paid plan, the trial alert must automatically disappear to confirm successful conversion and provide a clean, professional user experience.

**Why this priority**: Essential for user experience - removing the alert confirms the upgrade worked and prevents confusion. Must work independently to verify conversion status.

**Independent Test**: Can be fully tested by upgrading a trial account to paid plan and verifying the alert disappears immediately upon successful payment confirmation. Delivers value by providing visual confirmation of upgrade success.

**Acceptance Scenarios**:

1. **Given** a user completes trial-to-paid conversion, **When** the payment is successfully processed, **Then** the trial alert disappears immediately from all pages
2. **Given** a converted user refreshes the page, **When** the page loads, **Then** no trial alert is displayed
3. **Given** a user upgrades their subscription, **When** they navigate through the app, **Then** they see a paid plan badge instead of trial indicators
4. **Given** a trial alert was visible, **When** subscription status updates to 'active' (non-trial), **Then** the alert is removed without page refresh using real-time subscription status updates

---

### User Story 3 - Expired Trial Handling (Priority: P3)

Users whose trials have expired need clear notification that access is restricted and guidance on how to restore full access through subscription activation.

**Why this priority**: Important for conversion recovery but lower priority than active trial management. Can be tested independently with expired trial accounts.

**Independent Test**: Can be fully tested by accessing app with an expired trial account and verifying appropriate blocking/notification mechanism. Delivers value by guiding expired users to conversion.

**Acceptance Scenarios**:

1. **Given** a user's trial has expired (0 days remaining), **When** they attempt to access the application, **Then** they see a modal or full-page notice indicating trial expiration with clear upgrade options
2. **Given** an expired trial user views the notice, **When** they click to upgrade, **Then** they are directed to the billing page with appropriate plan recommendations
3. **Given** a trial expired less than 7 days ago, **When** the user views the upgrade page, **Then** they see a "reactivate" message encouraging them to resume service

---

### Edge Cases

- What happens when a user has multiple browser tabs open during trial conversion? (All tabs should update trial status via real-time sync)
- How does the system handle trial alerts when backend subscription status API is temporarily unavailable? (Show last known status, graceful degradation)
- What happens if trial conversion payment is pending or processing? (Show appropriate pending status, don't remove alert prematurely)
- How are trial alerts displayed on mobile devices with limited screen space? (Responsive design with collapsible or bottom-sheet alerts)
- What happens when a user's trial is extended by support/admin? (Alert should update to show new expiration date)
- How does the system handle timezone differences for trial expiration calculations? (Use server-side UTC timestamps, display in user's local timezone)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display trial status indicator to all users with active trial subscriptions (planStatus === 'trialing' AND trialPeriodDays > 0)
- **FR-002**: System MUST calculate and display accurate days remaining based on trial end timestamp compared to current date
- **FR-003**: System MUST adjust alert prominence based on trial urgency:
  - 7+ days remaining: Low urgency (subtle display)
  - 3-6 days remaining: Medium urgency (moderate prominence)
  - 1-2 days remaining: High urgency (prominent display with visual emphasis)
- **FR-004**: System MUST provide direct navigation to billing/upgrade flow from trial alert
- **FR-005**: System MUST hide trial alert immediately when subscription status changes from 'trialing' to 'active', 'paid', or any non-trial status
- **FR-006**: System MUST use real-time subscription updates to remove trial alert without requiring page refresh after conversion
- **FR-007**: Trial alert MUST be responsive and display appropriately on desktop, tablet, and mobile devices
- **FR-008**: System MUST persist trial alert visibility state across page navigation within the application
- **FR-009**: System MUST display trial alert on all authenticated pages except the billing/upgrade flow itself
- **FR-010**: System MUST show appropriate messaging for expired trials (trialPeriodDays <= 0) with upgrade options
- **FR-011**: Trial alert MUST not block or obscure critical application functionality
- **FR-012**: System MUST display trial plan name in the alert (e.g., "Professional Trial", "Standard Trial")

### Key Entities *(include if feature involves data)*

- **User Subscription Status**: Contains planStatus (trialing, active, canceled, etc.), trialEnd timestamp, trialStart timestamp, currentPlan name, and trialPeriodDays calculation
- **Trial Alert State**: UI state tracking alert visibility, urgency level, message content, and user interaction history (dismissed, clicked, converted)
- **Real-time Subscription Events**: Events carrying subscription status changes for immediate UI updates without polling

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trial users can identify their remaining trial days within 2 seconds of viewing any page
- **SC-002**: Trial alert disappears within 3 seconds of successful payment completion without requiring manual page refresh
- **SC-003**: 100% of trial-to-paid conversions result in automatic trial alert removal
- **SC-004**: Trial alert displays correctly and remains readable on screens from 320px (mobile) to 3840px (4K desktop) width
- **SC-005**: Users can navigate from trial alert to billing page in 1 click
- **SC-006**: Trial expiration countdown accuracy is within 1 hour of actual expiration time
- **SC-007**: Trial alert visibility does not interfere with any primary user actions (adding products, creating orders, viewing analytics)
- **SC-008**: Upgrade click-through rate from trial alert increases by at least 20% compared to previous implementation

