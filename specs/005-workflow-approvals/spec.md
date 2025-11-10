# Feature Specification: Workflow Approval Process Enhancement

**Feature Branch**: `005-workflow-approvals`  
**Created**: 2025-11-09  
**Status**: Draft  
**Input**: User description: "update workflows process. improve who can create workflows. send email to the person needs to review and make approval. Also add notification when a user receives an approval request"

## Clarifications

### Session 2025-11-09

- Q: How should the system handle multiple approval requests to the same user - send one email per request immediately, or batch them? → A: Send immediate emails per request with background queue, but allow users to opt into daily digest mode
- Q: When an email notification fails to deliver, how should the system handle the failure? → A: Retry 3 times with exponential backoff, then store failed notifications for manual review dashboard
- Q: What happens when a user is deleted but has pending approval requests assigned to them? → A: Automatically reassign to another active user with the same role, send notification about reassignment
- Q: What happens when an approval request is assigned to a role with no active members? → A: Place in admin dashboard as "orphaned approval", allow manual assignment to correct user/role
- Q: At what intervals should reminder emails be sent for pending approval requests? → A: Send reminders at 24 hours pending, then 48 hours before expiration (if applicable)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Permission-Based Workflow Creation (Priority: P1)

Users with appropriate permissions can create workflow templates to automate business processes. The system restricts workflow creation based on roles and permissions to ensure only authorized personnel can define approval processes.

**Why this priority**: Core security requirement that prevents unauthorized workflow creation and ensures proper governance. Without this, any user could create workflows that might bypass critical business controls.

**Independent Test**: Can be fully tested by attempting to create a workflow template with different user roles and verifying that only users with "create_workflow" permission succeed, delivering immediate security value.

**Acceptance Scenarios**:

1. **Given** a user with "create_workflow" permission, **When** they navigate to workflow creation page, **Then** they can access the workflow template builder and save new templates
2. **Given** a user without "create_workflow" permission, **When** they attempt to access workflow creation, **Then** they receive an access denied message and cannot create workflows
3. **Given** an admin creating a workflow template, **When** they define workflow steps with specific approvers, **Then** the system validates that assigned approvers have appropriate permissions
4. **Given** a workflow template being created, **When** the creator assigns approval steps to roles, **Then** the system validates those roles exist and have appropriate permissions
5. **Given** a user with pending approval requests is deleted/deactivated, **When** the deletion occurs, **Then** their pending requests are automatically reassigned to another active user from the same role with notification sent
6. **Given** an approval request is assigned to a role with no active members, **When** the assignment occurs, **Then** the request is marked as "orphaned" and appears in admin dashboard with requester notification sent

---

### User Story 2 - Email Notifications for Approval Requests (Priority: P1)

When an approval request is assigned to a user or role, the system sends an email notification to inform them of the pending approval. The email contains essential details about the request and a link to review it.

**Why this priority**: Critical for workflow effectiveness - approvers must be notified immediately to prevent delays. Without email notifications, approval requests may go unnoticed, blocking business processes.

**Independent Test**: Can be fully tested by triggering an approval request and verifying that the assigned approver receives an email with correct details, demonstrating immediate communication value.

**Acceptance Scenarios**:

1. **Given** an approval request is created and assigned to a specific user, **When** the request is saved, **Then** an email is sent to the assigned user with request details and review link
2. **Given** an approval request is assigned to a role (not a specific user), **When** the request is created, **Then** emails are sent to all users with that role
3. **Given** an approval request email is sent, **When** the recipient opens it, **Then** they see the request title, description, requester name, priority level, and a direct link to review
4. **Given** multiple approval requests are created simultaneously, **When** they are assigned to the same user with immediate email preference, **Then** the system queues and sends individual emails for each request
5. **Given** a user has selected daily digest email preference, **When** approval requests are assigned throughout the day, **Then** they receive a single summary email at their configured time
6. **Given** an approval request has an expiration date, **When** the email is sent, **Then** it includes the deadline information prominently

---

### User Story 3 - In-App Notification for Approval Requests (Priority: P2)

Users receive in-app notifications when they are assigned approval requests, providing immediate visibility without relying solely on email. Notifications appear in the notification center with key details.

**Why this priority**: Enhances user experience by providing redundant notification channels, but system functions with email alone. Important for users who work primarily in-app.

**Independent Test**: Can be fully tested by creating an approval request and verifying the notification appears in the assignee's notification center with correct details, independent of email functionality.

**Acceptance Scenarios**:

1. **Given** a user is assigned an approval request, **When** the request is created, **Then** a notification appears in their notification center
2. **Given** a user has unread approval notifications, **When** they view their notification list, **Then** approval notifications are marked with high priority styling
3. **Given** a user clicks on an approval notification, **When** they interact with it, **Then** they are navigated directly to the approval request details page
4. **Given** a user reviews an approval request, **When** they make a decision (approve/reject), **Then** the notification is automatically marked as read
5. **Given** an approval request expires or is cancelled, **When** the status changes, **Then** the notification is updated to reflect the new status

---

### User Story 4 - Approval Request Email Reminders (Priority: P3)

The system sends reminder emails for pending approval requests that are approaching their deadline or have been pending for an extended period, ensuring timely reviews.

**Why this priority**: Improves workflow completion rates but not essential for core functionality. Users already receive initial notifications, reminders are quality-of-life enhancement.

**Independent Test**: Can be fully tested by creating an approval request with a deadline, waiting for the reminder threshold, and verifying reminder email is sent with appropriate urgency indicators.

**Acceptance Scenarios**:

1. **Given** an approval request is pending for 24 hours without action, **When** the system runs scheduled reminder check, **Then** a standard reminder email is sent to the assigned approver with elapsed time
2. **Given** an approval request with expiration date has 48 hours remaining, **When** the system checks deadlines, **Then** an urgent reminder email is sent with deadline warning and remaining time
3. **Given** a user has multiple pending approvals at reminder threshold, **When** reminder time is reached and user has immediate email preference, **Then** they receive individual reminder emails for each request
4. **Given** an approval request has no expiration date, **When** 24-hour reminder is sent, **Then** no further automated reminders are sent unless request remains pending for additional escalation thresholds

---

### Edge Cases

- **[RESOLVED]** What happens when an approval request is assigned to a role with no active members? → System marks request as "orphaned" and surfaces in admin dashboard for manual assignment to appropriate user/role
- **[RESOLVED]** How does the system handle email delivery failures or bounced emails? → System retries 3 times with exponential backoff (1s, 2s, 4s), then stores failed notification in manual review dashboard for admin action
- **[RESOLVED]** What occurs when a user is deleted but has pending approval requests assigned to them? → System automatically reassigns to another active user from the same role and sends notification explaining the reassignment
- How are notifications handled when multiple workflow instances create approval requests simultaneously?
- What happens when a workflow template is deactivated but has active workflow instances?
- How does the system behave when an approver's permissions are revoked while they have pending requests?
- What occurs when an approval request's assignee is changed after initial notification?
- How are duplicate notifications prevented when a user belongs to multiple roles assigned to the same request?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict workflow template creation to users with "create_workflow" permission
- **FR-002**: System MUST validate that workflow step assignees (users or roles) exist and are active before saving workflow templates
- **FR-002a**: When an assigned approver user is deleted or deactivated, system MUST automatically reassign their pending approval requests to another active user from the same role
- **FR-002b**: System MUST send notification to newly assigned approver explaining the reassignment with original assignee name and reason for change
- **FR-002c**: System MUST log reassignment events in approval request audit trail with timestamp, original assignee, new assignee, and reason
- **FR-002d**: When an approval request is assigned to a role with no active members, system MUST mark it as "orphaned" and surface in admin dashboard
- **FR-002e**: Admin dashboard MUST display orphaned approvals with workflow details, assigned role, requester, creation date, and provide manual assignment interface
- **FR-002f**: System MUST notify workflow requester when their approval request becomes orphaned with explanation and expected resolution timeline
- **FR-003**: System MUST send email notification to assigned approver(s) immediately when an approval request is created, respecting user's email delivery preference (immediate or digest)
- **FR-004**: Email notifications MUST include request title, description, requester name, priority level, expiration date (if set), and direct link to review page
- **FR-005**: System MUST send emails to all active users in a role when approval request is assigned to that role
- **FR-003a**: System MUST queue approval notification emails in background job system to ensure non-blocking performance
- **FR-003b**: System MUST support daily digest mode where users receive one summary email containing all pending approval requests at a configured time
- **FR-006**: System MUST create in-app notification for assigned approver(s) when approval request is created
- **FR-007**: In-app notifications MUST display request title, priority, requester, and time created
- **FR-008**: System MUST mark in-app notification as read when user views or acts on the approval request
- **FR-009**: System MUST send standard reminder emails for approval requests pending 24 hours without action
- **FR-010**: System MUST send urgent reminder emails for approval requests with expiration dates when 48 hours remain until expiration
- **FR-010a**: Reminder emails MUST include elapsed time since request creation and remaining time until expiration (if applicable)
- **FR-010b**: System MUST track reminder send timestamps to prevent duplicate reminders for the same threshold
- **FR-011**: System MUST handle email delivery failures gracefully and log errors for monitoring
- **FR-011a**: System MUST retry failed email deliveries 3 times with exponential backoff (1 second, 2 seconds, 4 seconds)
- **FR-011b**: System MUST store permanently failed email notifications (after retry exhaustion) in a manual review queue accessible via admin dashboard
- **FR-011c**: Admin dashboard MUST display failed notifications with recipient details, failure reason, timestamp, and option to manually resend
- **FR-012**: System MUST prevent duplicate email notifications when a user qualifies for notification through multiple paths
- **FR-013**: System MUST update notification status when approval request status changes (completed, cancelled, expired)
- **FR-014**: System MUST provide audit trail of all notifications sent (email and in-app) for each approval request
- **FR-015**: System MUST allow users to configure email notification preferences with three options: immediate (default, one email per request), daily digest (single summary email at configured time), or disabled (no email notifications)

### Key Entities *(include if feature involves data)*

- **WorkflowTemplate**: Represents reusable workflow definitions with permission requirements for creation
  - Relationships: Created by users with specific permissions, contains multiple workflow steps
  - Key attributes: name, description, trigger conditions, creation permissions, active status

- **ApprovalRequest**: Represents individual approval requests requiring review and decision
  - Relationships: Assigned to users or roles, linked to workflow instances, contains approval comments, tracks reassignment history
  - Key attributes: title, description, status, priority, assigned approver, expiration date, decision, original assignee (if reassigned), reassignment reason, orphaned flag, orphaned timestamp

- **Notification**: In-app notifications informing users of approval requests and status changes
  - Relationships: Belongs to user, references approval request, tracks read status
  - Key attributes: message, status, read status, notification type, creation timestamp

- **EmailLog**: Audit trail of email notifications sent by the system
  - Relationships: Links to approval request, recipient user, tracks delivery status
  - Key attributes: recipient email, subject, send timestamp, delivery status, email type (initial/reminder/urgent_reminder), retry count, failure reason, manual review flag, reminder threshold (24h_pending or 48h_before_expiration)

- **Permission**: Defines specific capabilities users can perform, including workflow creation
  - Relationships: Assigned to roles, which are assigned to users
  - Key attributes: permission code (e.g., "create_workflow"), description, module

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Only users with "create_workflow" permission can successfully create workflow templates (100% enforcement rate)
- **SC-002**: Approval request emails are delivered within 2 minutes of request creation for 99% of cases
- **SC-003**: In-app notifications appear immediately (within 5 seconds) when approval requests are created
- **SC-004**: Users can navigate from notification to approval request detail page in under 3 clicks
- **SC-005**: Reminder emails are sent for 100% of pending approval requests that exceed 24 hours, with delivery within 15 minutes of threshold
- **SC-005a**: Urgent reminder emails are sent for 100% of approval requests reaching 48 hours before expiration
- **SC-006**: Email delivery failure rate is logged and does not exceed 2% of total sent
- **SC-006a**: Failed email notifications requiring manual review are surfaced in admin dashboard within 10 seconds of retry exhaustion
- **SC-006b**: Retry mechanism succeeds in recovering at least 80% of transient email delivery failures
- **SC-007**: Zero duplicate email notifications sent to users who qualify through multiple paths
- **SC-008**: Approval completion rate increases by at least 25% after email notification implementation
- **SC-009**: Average time to first approval action decreases by at least 40% compared to pre-notification baseline
- **SC-010**: Users can identify their pending approval requests within 10 seconds of logging in
- **SC-011**: Approval requests are automatically reassigned within 30 seconds of assignee user deletion/deactivation with zero data loss
- **SC-012**: Orphaned approval requests (assigned to empty roles) are flagged and visible in admin dashboard within 10 seconds of creation

## Assumptions

1. The existing `WorkflowTemplate` model supports storing permission requirements for workflow creation
2. Email service (Resend) is configured and operational with appropriate sending limits
3. Existing `Notification` model can be extended to support approval-specific notification types
4. Users have valid email addresses in their user profiles
5. The application has a notification center UI component that can display approval notifications
6. Role-based access control (RBAC) system is fully implemented with permission checking mechanisms
7. Approval request detail pages have stable URLs that can be embedded in emails
8. System has scheduled job capability for sending reminder emails
9. Notification preferences can be stored in user profile or settings
10. Email templates support localization based on user language preferences

## Dependencies

- Resend email service integration must be operational
- User authentication and authorization system must support permission checking
- Role management system must be able to resolve users by role
- Notification system infrastructure must support creation and display of notifications
- Workflow execution engine must trigger approval request creation events
- Job scheduler or background task system for sending reminder emails (must run at least hourly to meet timing requirements)

## Open Questions

This section intentionally left empty - all critical aspects have reasonable defaults documented in Assumptions section.
