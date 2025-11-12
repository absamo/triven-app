# Tasks: Workflow Approval Process Enhancement

**Feature Branch**: `005-workflow-approvals`  
**Generated**: 2025-11-09  
**Input**: Design documents from `/specs/005-workflow-approvals/`

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database schema setup

- [X] T001 Apply Prisma schema changes for EmailLog model, ApprovalRequest extensions, Notification extensions, and Profile extensions in `prisma/schema.prisma`
- [X] T002 Generate Prisma migration file `prisma/migrations/005_workflow_approvals/migration.sql` with new tables, indexes, and enums
- [X] T003 Run `bun run db:gen && bun run db:push` to apply schema changes and regenerate Prisma client
- [X] T004 Update seed script `prisma/seed.ts` to add workflow permissions to admin role ("create_workflow", "approve_workflows", "admin_orphaned_approvals")
- [X] T005 [P] Create TypeScript types file `app/types/workflow-approvals.ts` for shared interfaces (CreateApprovalData, ReviewApprovalData, EmailData, ApprovalRecipient)
- [X] T006 [P] Create email template types file `app/types/email.ts` for email props interfaces

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Implement helper function `getApprovalRecipients()` in `app/services/workflow-approvals.server.ts` to resolve users from assignedTo/assignedRole with deduplication
- [X] T008 Implement email retry wrapper `sendEmailWithRetry()` in `app/services/email.server.ts` with exponential backoff (1s, 2s, 4s) and EmailLog integration
- [X] T009 [P] Create notification service `app/services/notifications.server.ts` with `createNotification()` and `markNotificationRead()` functions
- [X] T010 [P] Create React Email template `app/emails/approval-request.tsx` for initial approval request emails with English and French localization
- [X] T011 [P] Create React Email template `app/emails/approval-reminder.tsx` for 24h pending reminder emails with localization
- [X] T012 [P] Create React Email template `app/emails/approval-urgent-reminder.tsx` for 48h before expiration urgent reminders with localization
- [X] T013 [P] Create React Email template `app/emails/approval-reassigned.tsx` for reassignment notification emails with localization
- [X] T014 [P] Create React Email template `app/emails/approval-orphaned.tsx` for orphaned approval notification to requester with localization
- [X] T015 Create background job scheduler `app/lib/jobs/scheduler.ts` with in-memory queue and periodic execution support
- [X] T016 Implement approval reminder job `app/lib/jobs/approval-reminders.ts` with `processApprovalReminders()` function (24h and 48h thresholds)
- [X] T017 Implement email digest job `app/lib/jobs/email-digest.ts` with `processEmailDigests()` function for daily digest mode
- [X] T018 Initialize job schedulers in `app/entry.server.tsx` with environment check (production or ENABLE_JOBS=true)
- [X] T019 Add Zod validation schemas in `app/common/validations/workflow-approvals.ts` for CreateApprovalRequest, ReviewApprovalRequest, CreateWorkflowTemplate

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Permission-Based Workflow Creation (Priority: P1) 🎯 MVP

**Goal**: Restrict workflow template creation to users with "create_workflow" permission, validate assignees have appropriate permissions

**Independent Test**: Attempt to create a workflow template with users having/lacking "create_workflow" permission. Verify only authorized users succeed and all assignees are validated for "approve_workflows" permission.

### Implementation for User Story 1

- [ ] T020 [P] [US1] Implement permission check helper `hasPermission()` in `app/services/auth.server.ts` that checks user.role.permissions array
- [ ] T021 [P] [US1] Implement assignee validation function `validateWorkflowAssignees()` in `app/services/workflow-approvals.server.ts` to check assignees have "approve_workflows" permission
- [ ] T022 [US1] Create API route `app/routes/api/workflows.create.ts` with POST action that checks "create_workflow" permission, validates assignees, and creates WorkflowTemplate
- [ ] T023 [US1] Create API route `app/routes/api/workflows.$id.deactivate.ts` with POST action to deactivate workflow templates
- [ ] T024 [US1] Create Mantine form component `app/components/WorkflowTemplateForm/index.tsx` with step builder, assignee selection, and permission validation
- [ ] T025 [US1] Add workflow template list page `app/pages/workflows/index.tsx` showing user's created templates with create/edit actions
- [ ] T026 [US1] Add error handling for missing permission with 403 response and user-friendly error message
- [ ] T027 [US1] Implement user deletion reassignment logic in `app/services/workflow-approvals.server.ts` with `reassignApprovalsOnUserDeletion()` function that finds pending approvals, attempts role-based reassignment, marks as orphaned if no assignee available
- [ ] T028 [US1] Add reassignment notification sending in `reassignApprovalsOnUserDeletion()` using approval-reassigned email template
- [ ] T029 [US1] Implement orphaned detection function `checkAndMarkOrphaned()` in `app/services/workflow-approvals.server.ts` that checks role member count and marks approval as orphaned if zero
- [ ] T030 [US1] Add orphaned notification sending using approval-orphaned email template to requester

**Checkpoint**: User Story 1 complete - Users can create workflow templates with permission control, assignees are validated, user deletion triggers reassignment or orphaning

---

## Phase 4: User Story 2 - Email Notifications for Approval Requests (Priority: P1)

**Goal**: Send email notifications to assigned approvers when approval requests are created, respecting user email preferences (immediate, digest, disabled)

**Independent Test**: Create an approval request assigned to a user and to a role. Verify users receive individual emails (immediate mode) or emails are queued for digest, and users with disabled preference receive no emails. Verify email contains all required details and review link.

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement core function `createApprovalRequest()` in `app/services/workflow-approvals.server.ts` that creates ApprovalRequest, checks for orphaned state, and triggers notifications
- [ ] T032 [P] [US2] Implement notification orchestration function `sendApprovalNotifications()` in `app/services/workflow-approvals.server.ts` that gets recipients, deduplicates, checks email preferences, and sends emails/creates notifications
- [ ] T033 [P] [US2] Implement digest queue function `queueForDigest()` in `app/services/email.server.ts` that stores pending approval notifications for digest processing
- [ ] T034 [US2] Create API route `app/routes/api/approvals.create.ts` with POST action calling createApprovalRequest() with request validation
- [ ] T035 [US2] Extend `sendApprovalRequestEmail()` function in `app/services/email.server.ts` to support all email template fields (title, description, requester, priority, expiration, reviewUrl, locale)
- [ ] T036 [US2] Implement role-based email distribution in `sendApprovalNotifications()` to fetch all active role members and send individual emails
- [ ] T037 [US2] Add email duplicate prevention using Set-based deduplication by userId in `sendApprovalNotifications()`
- [ ] T038 [US2] Add EmailLog record creation for each email sent with type "initial_approval", deliveryStatus, recipientId, and approvalRequestId
- [ ] T039 [US2] Implement email preference checking in `sendApprovalNotifications()` reading profile.emailDeliveryPreference (immediate, daily_digest, disabled)
- [ ] T040 [US2] Add user profile settings page `app/pages/settings/notifications.tsx` with email preference selector (immediate, daily_digest, disabled) and digest time picker (HH:00 format)

**Checkpoint**: User Story 2 complete - Email notifications are sent to all assigned approvers respecting preferences, with proper deduplication and audit logging

---

## Phase 5: User Story 3 - In-App Notification for Approval Requests (Priority: P2)

**Goal**: Create in-app notifications when users are assigned approval requests, display in notification center with priority styling, enable navigation to approval details

**Independent Test**: Create an approval request assigned to a user. Verify notification appears in their notification center with correct details, high-priority styling, and clicking navigates to approval detail page. Verify notification is marked read after review.

### Implementation for User Story 3

- [ ] T041 [P] [US3] Extend `sendApprovalNotifications()` in `app/services/workflow-approvals.server.ts` to create in-app notifications for all recipients using createNotification()
- [ ] T042 [P] [US3] Create API route `app/routes/api/notifications.list.ts` with GET loader returning user's notifications filtered by read status and type with pagination
- [ ] T043 [P] [US3] Create API route `app/routes/api/notifications.$id.mark-read.ts` with POST action calling markNotificationRead()
- [ ] T044 [US3] Create notification center component `app/components/NotificationCenter/index.tsx` with unread badge, dropdown list, and notification items
- [ ] T045 [US3] Create approval notification item component `app/components/ApprovalNotification/index.tsx` with high-priority styling, approval details, and click handler for navigation
- [ ] T046 [US3] Add notification center to main layout `app/layouts/DashboardLayout.tsx` in header with real-time polling (5-second interval using React Router revalidation)
- [ ] T047 [US3] Implement auto-mark-as-read logic in approval detail page loader `app/routes/approvals.$id.tsx` that marks related notification as read when approval is viewed
- [ ] T048 [US3] Add notification status update function `updateNotificationStatus()` in `app/services/notifications.server.ts` to update notification when approval status changes (completed, cancelled, expired)
- [ ] T049 [US3] Create API route `app/routes/api/approvals.$id.review.ts` with POST action calling reviewApprovalRequest() with decision validation
- [ ] T050 [US3] Implement core review function `reviewApprovalRequest()` in `app/services/workflow-approvals.server.ts` that validates user authorization, updates approval status, records decision and timestamps

**Checkpoint**: User Story 3 complete - In-app notifications appear for assigned approvals, users can navigate to details, notifications are marked read appropriately

---

## Phase 6: User Story 4 - Approval Request Email Reminders (Priority: P3)

**Goal**: Send reminder emails for pending approval requests at 24 hours pending and 48 hours before expiration, tracking reminder history to prevent duplicates

**Independent Test**: Create an approval request with no expiration. Wait 24 hours (or simulate timestamp). Verify standard reminder email is sent. Create another approval with expiration date in 49 hours. Wait 1 hour (or simulate). Verify urgent reminder email is sent with deadline warning. Verify no duplicate reminders are sent.

### Implementation for User Story 4

- [ ] T051 [P] [US4] Implement `processApprovalReminders()` in `app/lib/jobs/approval-reminders.ts` with query for 24h pending approvals without reminder EmailLog entries
- [ ] T052 [P] [US4] Add query in `processApprovalReminders()` for approvals 48h before expiration without urgent reminder EmailLog entries
- [ ] T053 [P] [US4] Implement reminder email sending loop in `processApprovalReminders()` that calls sendEmailWithRetry() for each recipient with appropriate emailType
- [ ] T054 [US4] Add EmailLog tracking in `sendEmailWithRetry()` with reminderThreshold field ("24h_pending" or "48h_before_expiration") to prevent duplicate reminders
- [ ] T055 [US4] Extend approval-reminder email template to include elapsed time since request creation
- [ ] T056 [US4] Extend approval-urgent-reminder email template to include remaining time until expiration and deadline emphasis styling
- [ ] T057 [US4] Add reminder scheduler initialization in `app/lib/jobs/scheduler.ts` calling processApprovalReminders() every 15 minutes using setInterval
- [ ] T058 [US4] Add reminder history display in approval detail page `app/routes/approvals.$id.tsx` showing reminder timestamps and types from EmailLog
- [ ] T059 [US4] Implement digest mode reminder handling in `processApprovalReminders()` that checks user preference and queues reminders for digest instead of immediate send

**Checkpoint**: User Story 4 complete - Reminder emails are sent at appropriate thresholds, duplicates are prevented, digest mode is respected

---

## Phase 7: Admin Features & Oversight

**Purpose**: Administrative tools for managing orphaned approvals and failed email notifications

- [ ] T060 [P] Create API route `app/routes/api/admin.orphaned-approvals.ts` with GET loader querying orphaned approvals with permission check ("admin_orphaned_approvals")
- [ ] T061 [P] Create API route `app/routes/api/admin.orphaned-approvals.$id.reassign.ts` with POST action to manually reassign orphaned approval to user or role
- [ ] T062 [P] Create API route `app/routes/api/admin.failed-emails.ts` with GET loader querying EmailLog entries with manualReviewFlag=true
- [ ] T063 [P] Create API route `app/routes/api/admin.failed-emails.$id.retry.ts` with POST action to manually retry failed email delivery
- [ ] T064 Create admin dashboard page `app/pages/admin/orphaned-approvals.tsx` showing orphaned approval list with workflow details, assigned role, requester, creation date, and reassignment form
- [ ] T065 Create failed emails dashboard page `app/pages/admin/failed-emails.tsx` showing failed email list with recipient, failure reason, retry count, failed timestamp, and retry button
- [ ] T066 Implement orphaned approval reassignment function `reassignOrphanedApproval()` in `app/services/workflow-approvals.server.ts` that updates approval, clears orphaned flag, sends notification to new assignee
- [ ] T067 Implement failed email retry function `retryFailedEmail()` in `app/services/email.server.ts` that resets EmailLog entry, attempts resend, updates status

---

## Phase 8: Core Approval Workflow Features

**Purpose**: List, view, and review approval requests

- [ ] T068 [P] Create API route `app/routes/api/approvals.list.ts` with GET loader returning user's pending approvals with filtering (status, priority) and pagination
- [ ] T069 [P] Create API route `app/routes/api/approvals.$id.ts` with GET loader returning full approval details with relationships (requester, workflow, comments)
- [ ] T070 Create approvals list page `app/pages/approvals/index.tsx` with filterable table showing title, requester, priority, status, requested date, and actions
- [ ] T071 Create approval detail page `app/routes/approvals.$id.tsx` with full approval information, review form, comment history, and email log history
- [ ] T072 Create approval action modal component `app/components/ApprovalActionModal/index.tsx` with decision selector (Approve, Reject, RequestChanges), reason textarea, and validation
- [ ] T073 Implement approval list query function `getPendingApprovals()` in `app/services/workflow-approvals.server.ts` that queries by assignedTo OR role membership with status filter
- [ ] T074 Add authorization check in `reviewApprovalRequest()` to verify user is directly assigned OR is member of assigned role

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T075 [P] Add comprehensive error handling with try-catch blocks and user-friendly error messages in all API routes
- [ ] T076 [P] Add loading states and error boundaries to all React components (WorkflowTemplateForm, NotificationCenter, ApprovalActionModal, approval pages)
- [ ] T077 [P] Add i18n translations for all UI strings in `app/locales/en/workflow-approvals.json` and `app/locales/fr/workflow-approvals.json`
- [ ] T078 [P] Add database indexes verification: Run `EXPLAIN ANALYZE` on key queries (pending approvals by user, orphaned approvals, failed emails, reminder-eligible approvals)
- [ ] T079 Implement email delivery webhook handler in `app/routes/api/webhooks.resend.ts` to update EmailLog deliveryStatus based on Resend callbacks
- [ ] T080 Add approval request history/audit trail display in approval detail page showing all status changes, reassignments, and reviews with timestamps
- [ ] T081 Add performance monitoring for email sending operations with timing logs and success/failure metrics
- [ ] T082 Add integration with existing workflow execution engine to trigger approval creation when workflow steps execute
- [ ] T083 Create quickstart validation script `scripts/validate-workflow-approvals.ts` that tests core flows (create approval, send email, create notification, send reminder)
- [ ] T084 [P] Update project documentation `docs/WORKFLOW_APPROVALS.md` with architecture overview, email flow diagram, and troubleshooting guide
- [ ] T085 Run `bun run db:reset && bun run db:seed` to validate migrations and seed data work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational (Phase 2) completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 3 (P2): Can start after Foundational - Integrates with US2 but independently testable
  - User Story 4 (P3): Can start after Foundational - Extends US2 but independently testable
- **Admin Features (Phase 7)**: Depends on User Story 1 completion (uses orphaned detection and reassignment)
- **Core Workflow (Phase 8)**: Depends on User Stories 1-3 completion (uses approval creation, email sending, notifications)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### Within Each User Story

- Models/types before services
- Services before API routes
- API routes before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities Per Phase

**Phase 1 - Setup**: Tasks T005 and T006 can run in parallel with T001-T004

**Phase 2 - Foundational**: Tasks T009, T010, T011, T012, T013, T014 can all run in parallel after T007-T008

**Phase 3 - User Story 1**: Tasks T020 and T021 can run in parallel

**Phase 4 - User Story 2**: Tasks T031, T032, T033 can run in parallel

**Phase 5 - User Story 3**: Tasks T041, T042, T043 can run in parallel

**Phase 6 - User Story 4**: Tasks T051 and T052 can run in parallel

**Phase 7 - Admin Features**: Tasks T060, T061, T062, T063 can all run in parallel

**Phase 8 - Core Workflow**: Tasks T068 and T069 can run in parallel

**Phase 9 - Polish**: Tasks T075, T076, T077, T078, T084 can all run in parallel

### Cross-Phase Parallel Work

Once Foundational (Phase 2) is complete, the following can proceed in parallel:
- User Story 1 (Phase 3)
- User Story 2 (Phase 4)
- User Story 3 (Phase 5) - may wait for US2 integration points but can develop independently

---

## Parallel Example: User Story 2

```bash
# Launch these tasks together after foundational phase:
T031: "Implement createApprovalRequest() in app/services/workflow-approvals.server.ts"
T032: "Implement sendApprovalNotifications() in app/services/workflow-approvals.server.ts"
T033: "Implement queueForDigest() in app/services/email.server.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (database schema, types)
2. Complete Phase 2: Foundational (email templates, services, background jobs) - CRITICAL
3. Complete Phase 3: User Story 1 (permission-based workflow creation, orphaned detection)
4. Complete Phase 4: User Story 2 (email notifications with preferences)
5. **STOP and VALIDATE**: Test workflow creation and approval email flow end-to-end
6. Deploy/demo if ready

**MVP Deliverable**: Users with permission can create workflows. Approval requests send emails to assignees respecting preferences. Orphaned approvals are detected and flagged.

### Incremental Delivery

1. **Release 1** (Setup + Foundational + US1 + US2):
   - Workflow creation with permissions ✅
   - Email notifications on approval creation ✅
   - Orphaned approval detection ✅
   - User deletion reassignment ✅

2. **Release 2** (Add US3):
   - In-app notifications ✅
   - Notification center UI ✅
   - Real-time notification updates ✅

3. **Release 3** (Add US4):
   - 24h and 48h reminder emails ✅
   - Digest mode support ✅
   - Reminder history tracking ✅

4. **Release 4** (Add Admin Features):
   - Orphaned approvals dashboard ✅
   - Failed emails dashboard ✅
   - Manual reassignment and retry ✅

5. **Release 5** (Add Core Workflow + Polish):
   - Approval list and detail pages ✅
   - Review and approve/reject ✅
   - Documentation and optimization ✅

### Parallel Team Strategy

With multiple developers, after completing Setup + Foundational together:

- **Developer A**: User Story 1 (Phases 3) - Workflow creation and permissions
- **Developer B**: User Story 2 (Phase 4) - Email notifications
- **Developer C**: User Story 3 (Phase 5) - In-app notifications
- **Developer D**: User Story 4 (Phase 6) - Reminder emails

After user stories complete, regroup for Admin Features, Core Workflow, and Polish phases.

---

## Summary

- **Total Tasks**: 85 tasks
- **User Story 1** (P1): 11 tasks (T020-T030) - Permission-based workflow creation
- **User Story 2** (P1): 10 tasks (T031-T040) - Email notifications
- **User Story 3** (P2): 10 tasks (T041-T050) - In-app notifications
- **User Story 4** (P3): 9 tasks (T051-T059) - Reminder emails
- **Setup**: 6 tasks (T001-T006)
- **Foundational**: 13 tasks (T007-T019)
- **Admin Features**: 8 tasks (T060-T067)
- **Core Workflow**: 7 tasks (T068-T074)
- **Polish**: 11 tasks (T075-T085)

**Parallel Opportunities**: 29 tasks marked [P] can run in parallel within their phases

**Suggested MVP Scope**: Phases 1-4 (Setup + Foundational + US1 + US2) = 40 tasks

**MVP Value**: Complete workflow approval system with email notifications, permission control, orphaned detection, and user reassignment handling.

---

## Notes

- All tasks include exact file paths for clarity
- [P] tasks can be parallelized within their phase
- [Story] labels (US1, US2, US3, US4) map to spec.md user stories
- Each user story is independently completable and testable
- Follow TDD where applicable: write tests first, ensure they fail, implement to pass
- Commit after each task or logical group
- Stop at checkpoints to validate story independence
- Tests are optional - only included if explicitly requested in spec
