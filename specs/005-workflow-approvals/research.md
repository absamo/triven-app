# Research: Workflow Approval Process Enhancement

**Feature**: 005-workflow-approvals  
**Date**: 2025-11-09  
**Phase**: 0 - Research & Discovery

## Overview

This document consolidates research findings for implementing the workflow approval process enhancement, including permission-based workflow creation, email notifications, in-app notifications, and automated reminders.

## Research Areas

### 1. Background Job System for Email Processing

**Decision**: Use Node.js setTimeout/setInterval for immediate implementation, with path to upgrade to BullMQ/Redis for production

**Rationale**:
- Project currently has no job queue infrastructure (no BullMQ, no Redis in dependencies)
- Feature requires non-blocking email operations and scheduled reminder processing
- Node.js built-in timers provide immediate solution for MVP
- Background tasks can run in same process during development
- Clear upgrade path when scale demands it

**Implementation Approach**:
- Create `app/lib/jobs/scheduler.ts` with in-memory job queue
- Use `setInterval` for periodic reminder checks (every 15 minutes)
- Use exponential backoff with `setTimeout` for email retries
- Store job state in PostgreSQL for persistence across restarts
- Document migration path to BullMQ in quickstart.md

**Alternatives Considered**:
- **BullMQ + Redis**: Production-grade but adds infrastructure complexity (rejected for MVP)
- **node-cron**: Good for scheduled tasks but doesn't handle retry logic well
- **Agenda**: MongoDB-based, incompatible with PostgreSQL stack

**References**:
- React Router's defer() for background processing during SSR
- Existing Prisma transactions for atomic job state updates

---

### 2. Email Retry with Exponential Backoff

**Decision**: Implement custom retry logic with exponential backoff (1s, 2s, 4s) in email service

**Rationale**:
- Resend SDK doesn't provide built-in retry mechanism
- Requirement specifies exactly 3 retries with exponential timing
- Simple to implement with Promise-based retry wrapper
- Failed emails after retry exhaustion go to manual review queue

**Implementation Approach**:
```typescript
async function sendEmailWithRetry(emailData: EmailData, maxRetries = 3) {
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await resend.emails.send(emailData);
      await logEmailSuccess(emailData, attempt);
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        await logEmailFailure(emailData, error, attempt);
        await queueForManualReview(emailData, error);
        throw error;
      }
      await sleep(delays[attempt]);
    }
  }
}
```

**Alternatives Considered**:
- **p-retry library**: Adds dependency, custom implementation is 20 lines
- **Resend webhooks**: For delivery tracking, not for retry logic

---

### 3. Duplicate Email Prevention

**Decision**: Use Set-based deduplication with composite key (userId + approvalRequestId + emailType)

**Rationale**:
- User can be assigned approval through multiple paths (directly + via role)
- Requirement: prevent duplicate emails when user qualifies through multiple paths
- Must check before sending each email in batch
- Composite key ensures uniqueness per approval per notification type

**Implementation Approach**:
```typescript
async function sendApprovalEmails(approvalRequest: ApprovalRequest) {
  const recipients = new Set<string>();
  
  // Collect direct assignee
  if (approvalRequest.assignedTo) {
    recipients.add(approvalRequest.assignedTo);
  }
  
  // Collect role members
  if (approvalRequest.assignedRole) {
    const roleUsers = await getUsersByRole(approvalRequest.assignedRole);
    roleUsers.forEach(user => recipients.add(user.id));
  }
  
  // Send unique emails
  for (const userId of recipients) {
    await sendEmailWithRetry({ userId, approvalRequestId, type: 'initial' });
  }
}
```

**Alternatives Considered**:
- **Database-enforced uniqueness**: Too rigid, prevents legitimate duplicate notifications
- **24-hour deduplication window**: Unnecessarily complex for this use case

---

### 4. Reminder Email Scheduling

**Decision**: Periodic batch processing (every 15 minutes) querying for reminder-eligible approvals

**Rationale**:
- Two reminder thresholds: 24 hours pending, 48 hours before expiration
- 15-minute check interval meets "<15 minutes of threshold" requirement
- Batch processing more efficient than individual timers per approval
- Reminder timestamps stored in EmailLog prevent duplicate reminders

**Implementation Approach**:
```typescript
// Runs every 15 minutes
async function processApprovalReminders() {
  const now = new Date();
  
  // Find approvals pending 24 hours without reminder
  const pending24h = await db.approvalRequest.findMany({
    where: {
      status: 'Pending',
      requestedAt: { lte: subHours(now, 24) },
      NOT: {
        emailLogs: {
          some: { emailType: '24h_pending' }
        }
      }
    }
  });
  
  // Find approvals 48h from expiration without urgent reminder
  const urgent48h = await db.approvalRequest.findMany({
    where: {
      status: 'Pending',
      expiresAt: { 
        gte: now,
        lte: addHours(now, 48)
      },
      NOT: {
        emailLogs: {
          some: { emailType: '48h_before_expiration' }
        }
      }
    }
  });
  
  await sendReminderEmails(pending24h, '24h_pending');
  await sendReminderEmails(urgent48h, '48h_before_expiration');
}
```

**Alternatives Considered**:
- **Individual timers per approval**: Doesn't scale, memory intensive
- **Hourly checks**: Doesn't meet 15-minute SLA
- **Real-time triggers on creation**: Can't handle 48h-before-expiration case

---

### 5. User Deletion and Approval Reassignment

**Decision**: Use Prisma database triggers + application-level reassignment logic

**Rationale**:
- Requirement: Auto-reassign pending approvals when user is deleted/deactivated
- Must happen atomically with user status change
- Need to send notification to new assignee about reassignment
- Audit trail must capture original assignee, new assignee, reason

**Implementation Approach**:
```typescript
async function deactivateUser(userId: string, reason: string) {
  await db.$transaction(async (tx) => {
    // Update user status
    await tx.user.update({
      where: { id: userId },
      data: { active: false }
    });
    
    // Find pending approvals
    const pendingApprovals = await tx.approvalRequest.findMany({
      where: { 
        assignedTo: userId,
        status: 'Pending'
      },
      include: { assignedToUser: { include: { role: true } } }
    });
    
    // Reassign each approval
    for (const approval of pendingApprovals) {
      const roleId = approval.assignedToUser?.roleId;
      if (!roleId) {
        await markAsOrphaned(tx, approval);
        continue;
      }
      
      const newAssignee = await findActiveUserByRole(tx, roleId, userId);
      if (!newAssignee) {
        await markAsOrphaned(tx, approval);
        continue;
      }
      
      await tx.approvalRequest.update({
        where: { id: approval.id },
        data: { 
          assignedTo: newAssignee.id,
          // Store reassignment metadata in JSON field
          data: {
            ...approval.data,
            reassignment: {
              originalAssignee: userId,
              newAssignee: newAssignee.id,
              reason: 'user_deactivated',
              timestamp: new Date().toISOString()
            }
          }
        }
      });
      
      await sendReassignmentNotification(newAssignee, approval, userId);
    }
  });
}
```

**Alternatives Considered**:
- **Database CASCADE DELETE**: Loses approval data, unacceptable
- **PostgreSQL triggers**: Complex to maintain, harder to test
- **SET NULL on delete**: Requires manual reassignment, delays workflow

---

### 6. Orphaned Approval Handling

**Decision**: Add `orphaned` boolean flag and `orphanedAt` timestamp to ApprovalRequest, create admin dashboard query

**Rationale**:
- Occurs when approval assigned to role with no active members
- Must be visible for manual admin intervention
- Requester must be notified their workflow is blocked
- Different from reassignment (no eligible assignee exists)

**Implementation Approach**:
```typescript
// Prisma schema addition
model ApprovalRequest {
  // ... existing fields
  orphaned      Boolean   @default(false)
  orphanedAt    DateTime?
}

// Admin dashboard query
async function getOrphanedApprovals(companyId: string) {
  return db.approvalRequest.findMany({
    where: {
      companyId,
      orphaned: true,
      status: 'Pending'
    },
    include: {
      assignedToRole: true,
      requestedByUser: true,
      workflowInstance: {
        include: { workflowTemplate: true }
      }
    },
    orderBy: { orphanedAt: 'asc' }
  });
}

// Mark as orphaned when no eligible assignees
async function markAsOrphaned(tx, approval: ApprovalRequest) {
  await tx.approvalRequest.update({
    where: { id: approval.id },
    data: {
      orphaned: true,
      orphanedAt: new Date()
    }
  });
  
  await sendOrphanedNotification(approval.requestedByUser);
}
```

**Alternatives Considered**:
- **Status enum value**: ORPHANED status conflates with PENDING/APPROVED lifecycle
- **Separate table**: Overkill, adds query complexity
- **JSON metadata only**: Not queryable for admin dashboard

---

### 7. Email Delivery Preference (Immediate vs Digest)

**Decision**: Add `emailDeliveryPreference` enum to User profile with cron job for digest sending

**Rationale**:
- Requirement supports three modes: immediate (default), daily digest, disabled
- Digest users receive single summary email at configured time
- Must batch approval notifications throughout the day
- Configuration stored per-user, not per-company

**Implementation Approach**:
```typescript
// Prisma schema addition to Profile model
model Profile {
  // ... existing fields
  emailDeliveryPreference EmailDeliveryPreference @default(immediate)
  digestTime              String?                 // "08:00" format
}

enum EmailDeliveryPreference {
  immediate
  daily_digest
  disabled
}

// Modified email sending logic
async function sendApprovalEmail(userId: string, approvalId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });
  
  if (user.profile?.emailDeliveryPreference === 'disabled') {
    return; // Skip email
  }
  
  if (user.profile?.emailDeliveryPreference === 'daily_digest') {
    await queueForDigest(userId, approvalId);
    return;
  }
  
  // immediate mode (default)
  await sendEmailWithRetry({ userId, approvalId });
}

// Daily digest job (runs hourly, checks digest times)
async function processEmailDigests() {
  const currentHour = new Date().getHours();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
  
  const digestUsers = await db.user.findMany({
    where: {
      profile: {
        emailDeliveryPreference: 'daily_digest',
        digestTime: currentTime
      }
    }
  });
  
  for (const user of digestUsers) {
    const pendingApprovals = await getPendingApprovalsSince(user.id, subDays(new Date(), 1));
    if (pendingApprovals.length > 0) {
      await sendDigestEmail(user, pendingApprovals);
    }
  }
}
```

**Alternatives Considered**:
- **Company-level setting**: Doesn't support individual preferences
- **Weekly digest**: Not mentioned in requirements
- **Real-time digest triggers**: Defeats purpose of batching

---

### 8. Permission-Based Workflow Creation

**Decision**: Add "create_workflow" permission string to Role.permissions array, check on workflow template creation

**Rationale**:
- Role model already has `permissions: String[]` field
- Better Auth provides role-based access control foundation
- Permission check happens server-side in route action
- Follows existing permission patterns in codebase

**Implementation Approach**:
```typescript
// Server-side permission check
async function createWorkflowTemplate(request: Request) {
  const user = await requireAuth(request);
  
  if (!hasPermission(user, 'create_workflow')) {
    throw new Response('Unauthorized', { status: 403 });
  }
  
  // Validate assignees have appropriate permissions
  const { steps } = await parseFormData(request);
  for (const step of steps) {
    if (step.assigneeUserId) {
      const assignee = await db.user.findUnique({
        where: { id: step.assigneeUserId },
        include: { role: true }
      });
      if (!assignee?.role?.permissions.includes('approve_workflows')) {
        throw new Error(`User ${assignee.name} lacks approve_workflows permission`);
      }
    }
  }
  
  return db.workflowTemplate.create({ data: workflowData });
}

// Helper function
function hasPermission(user: User & { role: Role }, permission: string): boolean {
  return user.role?.permissions.includes(permission) ?? false;
}
```

**Alternatives Considered**:
- **Separate Permission table**: Over-engineering for string-based permissions
- **Hard-coded role names**: Inflexible, requires code changes
- **Bitwise permission flags**: Premature optimization

---

### 9. In-App Notification Storage & Display

**Decision**: Extend existing Notification model to support approval-specific types with real-time polling

**Rationale**:
- Notification model exists with basic structure (id, status, message, read, createdAt)
- Need approval-specific fields: approvalRequestId, notificationType
- React Router loaders with revalidation provide "real-time" updates (polling)
- Meets <5 second requirement without WebSocket complexity

**Implementation Approach**:
```typescript
// Prisma schema extension
model Notification {
  id                String             @id @default(cuid())
  status            NotificationStatus
  message           String
  companyId         String
  productId         String?            // Made optional
  approvalRequestId String?            // New field
  notificationType  String?            // "approval_request", "approval_reminder", etc.
  createdById       String
  recipientId       String             // New field (who receives notification)
  read              Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime?          @updatedAt
  
  company          Company             @relation(fields: [companyId], references: [id])
  createdBy        User                @relation("NotificationCreatedBy", fields: [createdById], references: [id])
  recipient        User                @relation("NotificationRecipient", fields: [recipientId], references: [id])
  product          Product?            @relation(fields: [productId], references: [id])
  approvalRequest  ApprovalRequest?    @relation(fields: [approvalRequestId], references: [id])
  
  @@index([recipientId, read, createdAt])
}

// React Router loader with revalidation
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  const notifications = await db.notification.findMany({
    where: {
      recipientId: user.id,
      read: false
    },
    include: { approvalRequest: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  
  return json({ notifications }, {
    headers: {
      'Cache-Control': 'private, max-age=5' // Poll every 5 seconds
    }
  });
}
```

**Alternatives Considered**:
- **WebSocket/SSE for real-time**: Over-engineering for 5-second SLA
- **Separate ApprovalNotification table**: Fragmentation, complex queries
- **Browser notifications API**: Requires user permission, supplementary not primary

---

## Technology Stack Summary

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Email Service** | Resend 6.0.1 | Already integrated, reliable delivery |
| **Database** | PostgreSQL + Prisma | Existing stack, ACID transactions |
| **Background Jobs** | Node.js timers (MVP) | No new infrastructure, upgrade path to BullMQ |
| **Auth & Permissions** | Better Auth 1.3.3 | Existing RBAC foundation |
| **Testing** | Vitest + Testing Library | Project standard |
| **Email Templates** | React Email | Type-safe, existing pattern in codebase |
| **Real-time Updates** | React Router revalidation | Meets 5-second SLA without WebSocket |
| **Validation** | Zod 4.1.0 | Type-safe form validation |
| **UI Components** | Mantine 8.2.7 | Design system consistency |

---

## Open Questions Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved:

1. ✅ **Background job system**: Node.js timers for MVP, documented upgrade path
2. ✅ **Email retry mechanism**: Custom implementation with exponential backoff
3. ✅ **Duplicate prevention**: Set-based deduplication by composite key
4. ✅ **Reminder scheduling**: 15-minute batch processing with EmailLog tracking
5. ✅ **User deletion handling**: Transaction-based reassignment with audit trail
6. ✅ **Orphaned approvals**: Database flag + admin dashboard query
7. ✅ **Email preferences**: User profile enum with digest cron job
8. ✅ **Permission checking**: String-based permission in Role.permissions array
9. ✅ **In-app notifications**: Extended Notification model with polling

---

## Next Steps

Proceed to Phase 1:
1. Generate `data-model.md` with complete Prisma schema changes
2. Create OpenAPI contracts in `/contracts/` directory
3. Write `quickstart.md` for developers
4. Update agent context with new technologies (none added, all existing)
