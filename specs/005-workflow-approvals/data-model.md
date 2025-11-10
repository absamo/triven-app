# Data Model: Workflow Approval Process Enhancement

**Feature**: 005-workflow-approvals  
**Date**: 2025-11-09  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data model changes required for the workflow approval process enhancement. It extends existing Prisma models and adds new entities to support email notifications, reminders, user preferences, and orphaned approval tracking.

## Entity Changes

### 1. ApprovalRequest (Extended)

**Purpose**: Tracks individual approval requests with enhanced fields for reassignment, orphaned state, and email preference tracking.

**Schema Changes**:
```prisma
model ApprovalRequest {
  id                 String              @id @default(cuid())
  workflowInstanceId String?
  stepExecutionId    String?
  entityType         ApprovalEntityType
  entityId           String
  requestType        ApprovalRequestType
  status             ApprovalStatus
  priority           ApprovalPriority    @default(Medium)
  requestedBy        String
  assignedTo         String?
  assignedRole       String?
  title              String
  description        String?
  data               Json                // Now includes reassignment metadata
  conditions         Json?
  requestedAt        DateTime            @default(now())
  reviewedAt         DateTime?
  completedAt        DateTime?
  expiresAt          DateTime?
  notes              String?
  decision           ApprovalDecision?
  decisionReason     String?
  companyId          String
  
  // NEW FIELDS for 005-workflow-approvals
  orphaned           Boolean             @default(false)
  orphanedAt         DateTime?
  
  createdAt          DateTime            @default(now())
  updatedAt          DateTime?           @updatedAt

  workflowInstance WorkflowInstance?      @relation(fields: [workflowInstanceId], references: [id])
  stepExecution    WorkflowStepExecution? @relation(fields: [stepExecutionId], references: [id])
  requestedByUser  User                   @relation("ApprovalRequestRequestedBy", fields: [requestedBy], references: [id])
  assignedToUser   User?                  @relation("ApprovalRequestAssignedTo", fields: [assignedTo], references: [id])
  assignedToRole   Role?                  @relation("ApprovalRequestAssignedRole", fields: [assignedRole], references: [id])
  company          Company                @relation(fields: [companyId], references: [id])
  comments         ApprovalComment[]
  emailLogs        EmailLog[]             // NEW RELATION
  notifications    Notification[]         // NEW RELATION

  @@index([status, assignedTo])
  @@index([entityType, entityId])
  @@index([companyId, requestedAt])
  @@index([orphaned, status])               // NEW INDEX for admin dashboard
}
```

**New Fields Explained**:
- `orphaned`: Boolean flag indicating approval is assigned to role with no active members
- `orphanedAt`: Timestamp when approval became orphaned (for SLA tracking)

**Data Field JSON Structure** (extended):
```typescript
interface ApprovalRequestData {
  // Existing entity data...
  
  // NEW: Reassignment tracking
  reassignment?: {
    originalAssignee: string;    // User ID who was originally assigned
    newAssignee: string;          // User ID who is now assigned
    reason: 'user_deactivated' | 'user_deleted' | 'manual_reassign';
    timestamp: string;            // ISO 8601
    reassignedBy?: string;        // User ID who triggered reassignment (for manual)
  };
}
```

**Validation Rules**:
- If `orphaned === true`, must have `orphanedAt` timestamp
- If `orphaned === true`, status must be 'Pending'
- If `status === 'Approved' | 'Rejected'`, must have `reviewedAt` and `completedAt`
- If `assignedTo` is null, `assignedRole` must be set (or orphaned)
- If `expiresAt` is set, must be future date

**State Transitions**:
```
Pending → Approved (decision made)
Pending → Rejected (decision made)
Pending → Cancelled (workflow cancelled)
Pending → Expired (expiresAt reached without decision)
Pending → Orphaned flag (role has no members)
Orphaned flag → Pending (admin assigns to valid user)
```

---

### 2. EmailLog (New)

**Purpose**: Audit trail of all email notifications sent, tracking delivery status, retry attempts, and failure reasons for compliance and debugging.

**Schema**:
```prisma
model EmailLog {
  id                String              @id @default(cuid())
  approvalRequestId String
  recipientId       String
  recipientEmail    String
  subject           String
  emailType         EmailType
  deliveryStatus    EmailDeliveryStatus @default(pending)
  retryCount        Int                 @default(0)
  failureReason     String?
  manualReviewFlag  Boolean             @default(false)
  reminderThreshold String?             // "24h_pending" | "48h_before_expiration"
  sentAt            DateTime?
  deliveredAt       DateTime?
  failedAt          DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime?           @updatedAt

  approvalRequest ApprovalRequest @relation(fields: [approvalRequestId], references: [id], onDelete: Cascade)
  recipient       User            @relation("EmailLogRecipient", fields: [recipientId], references: [id])

  @@index([approvalRequestId, emailType])
  @@index([deliveryStatus, manualReviewFlag])
  @@index([recipientId, sentAt])
}

enum EmailType {
  initial_approval
  approval_reminder_24h
  approval_reminder_48h
  approval_reassigned
  approval_orphaned
  approval_completed
  approval_expired
}

enum EmailDeliveryStatus {
  pending
  sent
  delivered
  failed
  bounced
  queued_for_digest
}
```

**Field Descriptions**:
- `emailType`: Categorizes email for filtering and deduplication
- `deliveryStatus`: Tracks email lifecycle from pending to delivered/failed
- `retryCount`: Number of send attempts (0-3)
- `failureReason`: Error message from Resend if delivery fails
- `manualReviewFlag`: Set to true after 3 failed retries for admin attention
- `reminderThreshold`: Which reminder triggered this email (null for non-reminders)
- `sentAt`: When Resend API was called
- `deliveredAt`: When Resend confirmed delivery (webhook)
- `failedAt`: When final retry failed

**Validation Rules**:
- If `deliveryStatus === 'failed'`, must have `failureReason` and `failedAt`
- If `deliveryStatus === 'sent' | 'delivered'`, must have `sentAt`
- `retryCount` must be 0-3
- If `manualReviewFlag === true`, `deliveryStatus` must be 'failed'

---

### 3. Notification (Extended)

**Purpose**: In-app notifications for approval requests. Extended to support approval-specific notification types and linking.

**Schema Changes**:
```prisma
model Notification {
  id                String             @id @default(cuid())
  status            NotificationStatus
  message           String
  companyId         String
  productId         String?            // Made optional (was required)
  approvalRequestId String?            // NEW FIELD
  notificationType  String?            // NEW FIELD: "approval_request", "approval_reminder", etc.
  createdById       String
  recipientId       String             // NEW FIELD (who receives notification)
  read              Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime?          @updatedAt
  
  company          Company             @relation(fields: [companyId], references: [id])
  createdBy        User                @relation("NotificationCreatedBy", fields: [createdById], references: [id])
  recipient        User                @relation("NotificationRecipient", fields: [recipientId], references: [id])
  product          Product?            @relation(fields: [productId], references: [id])
  approvalRequest  ApprovalRequest?    @relation(fields: [approvalRequestId], references: [id])
  
  @@index([recipientId, read, createdAt])
  @@index([approvalRequestId])         // NEW INDEX
}
```

**New Fields Explained**:
- `approvalRequestId`: Links notification to specific approval request
- `notificationType`: Categorizes notification for filtering/styling
- `recipientId`: Explicit recipient (previous model relied on implicit user context)

**Notification Types**:
```typescript
type NotificationType = 
  | 'approval_request'      // New approval assigned
  | 'approval_reminder'     // 24h pending reminder
  | 'approval_urgent'       // 48h before expiration
  | 'approval_reassigned'   // Approval reassigned to you
  | 'approval_orphaned'     // Your request became orphaned
  | 'approval_approved'     // Your request was approved
  | 'approval_rejected';    // Your request was rejected
```

**Validation Rules**:
- If `notificationType` starts with 'approval_', must have `approvalRequestId`
- `recipientId` must be active user
- `message` must be localized based on recipient's profile.locale

---

### 4. Profile (Extended)

**Purpose**: User profile settings extended to support email delivery preferences and digest scheduling.

**Schema Changes**:
```prisma
model Profile {
  id                      String                   @id @default(cuid())
  userId                  String                   @unique
  // ... existing fields (firstName, lastName, phone, etc.)
  
  // NEW FIELDS for 005-workflow-approvals
  emailDeliveryPreference EmailDeliveryPreference  @default(immediate)
  digestTime              String?                  // "HH:00" format (e.g., "08:00", "17:00")
  locale                  String                   @default("en")  // For email localization
  
  createdAt               DateTime                 @default(now())
  updatedAt               DateTime?                @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}

enum EmailDeliveryPreference {
  immediate
  daily_digest
  disabled
}
```

**New Fields Explained**:
- `emailDeliveryPreference`: How user wants to receive approval emails
- `digestTime`: Hour of day to send digest (only relevant if preference is daily_digest)
- `locale`: Language for email content ("en" | "fr")

**Validation Rules**:
- If `emailDeliveryPreference === 'daily_digest'`, must have `digestTime`
- `digestTime` must match format "HH:00" where HH is 00-23
- `locale` must be valid i18next locale code

---

### 5. Role (No Schema Changes)

**Purpose**: Existing Role model supports permissions array. No schema changes needed.

**Relevant Fields**:
```prisma
model Role {
  id          String    @id @default(cuid())
  name        String
  permissions String[]  // Existing field, will add "create_workflow", "approve_workflows"
  // ... other fields
}
```

**New Permission Strings**:
- `"create_workflow"`: Allows user to create workflow templates
- `"approve_workflows"`: Allows user to be assigned as approver in workflow steps
- `"admin_orphaned_approvals"`: Allows access to orphaned approvals admin dashboard

---

### 6. User (No Schema Changes, New Relations)

**Purpose**: User model gains new relations for email logs and notification recipients.

**New Relations**:
```prisma
model User {
  // ... existing fields
  
  // NEW RELATIONS
  emailLogs              EmailLog[]       @relation("EmailLogRecipient")
  notificationsReceived  Notification[]   @relation("NotificationRecipient")
  
  // ... existing relations
}
```

---

## Database Migration Strategy

### Migration File: `prisma/migrations/005_workflow_approvals/migration.sql`

```sql
-- 1. Add EmailLog table
CREATE TABLE "EmailLog" (
  "id" TEXT NOT NULL,
  "approvalRequestId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "emailType" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "failureReason" TEXT,
  "manualReviewFlag" BOOLEAN NOT NULL DEFAULT false,
  "reminderThreshold" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- 2. Add enums
CREATE TYPE "EmailType" AS ENUM (
  'initial_approval',
  'approval_reminder_24h',
  'approval_reminder_48h',
  'approval_reassigned',
  'approval_orphaned',
  'approval_completed',
  'approval_expired'
);

CREATE TYPE "EmailDeliveryStatus" AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced',
  'queued_for_digest'
);

CREATE TYPE "EmailDeliveryPreference" AS ENUM (
  'immediate',
  'daily_digest',
  'disabled'
);

-- 3. Extend ApprovalRequest
ALTER TABLE "ApprovalRequest" ADD COLUMN "orphaned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ApprovalRequest" ADD COLUMN "orphanedAt" TIMESTAMP(3);

-- 4. Extend Notification (make productId optional, add new fields)
ALTER TABLE "Notification" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "Notification" ADD COLUMN "approvalRequestId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "notificationType" TEXT;
ALTER TABLE "Notification" ADD COLUMN "recipientId" TEXT;

-- Backfill recipientId with createdById for existing notifications
UPDATE "Notification" SET "recipientId" = "createdById" WHERE "recipientId" IS NULL;

-- Make recipientId required after backfill
ALTER TABLE "Notification" ALTER COLUMN "recipientId" SET NOT NULL;

-- 5. Extend Profile
ALTER TABLE "Profile" ADD COLUMN "emailDeliveryPreference" TEXT NOT NULL DEFAULT 'immediate';
ALTER TABLE "Profile" ADD COLUMN "digestTime" TEXT;
ALTER TABLE "Profile" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- 6. Create indexes
CREATE INDEX "EmailLog_approvalRequestId_emailType_idx" ON "EmailLog"("approvalRequestId", "emailType");
CREATE INDEX "EmailLog_deliveryStatus_manualReviewFlag_idx" ON "EmailLog"("deliveryStatus", "manualReviewFlag");
CREATE INDEX "EmailLog_recipientId_sentAt_idx" ON "EmailLog"("recipientId", "sentAt");
CREATE INDEX "ApprovalRequest_orphaned_status_idx" ON "ApprovalRequest"("orphaned", "status");
CREATE INDEX "Notification_recipientId_read_createdAt_idx" ON "Notification"("recipientId", "read", "createdAt");
CREATE INDEX "Notification_approvalRequestId_idx" ON "Notification"("approvalRequestId");

-- 7. Create foreign keys
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_approvalRequestId_fkey" 
  FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_recipientId_fkey" 
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_approvalRequestId_fkey" 
  FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" 
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Rollback Strategy

```sql
-- Drop in reverse order
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_approvalRequestId_fkey";
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_recipientId_fkey";
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_approvalRequestId_fkey";

DROP INDEX "Notification_approvalRequestId_idx";
DROP INDEX "Notification_recipientId_read_createdAt_idx";
DROP INDEX "ApprovalRequest_orphaned_status_idx";
DROP INDEX "EmailLog_recipientId_sentAt_idx";
DROP INDEX "EmailLog_deliveryStatus_manualReviewFlag_idx";
DROP INDEX "EmailLog_approvalRequestId_emailType_idx";

ALTER TABLE "Profile" DROP COLUMN "locale";
ALTER TABLE "Profile" DROP COLUMN "digestTime";
ALTER TABLE "Profile" DROP COLUMN "emailDeliveryPreference";

ALTER TABLE "Notification" DROP COLUMN "recipientId";
ALTER TABLE "Notification" DROP COLUMN "notificationType";
ALTER TABLE "Notification" DROP COLUMN "approvalRequestId";
ALTER TABLE "Notification" ALTER COLUMN "productId" SET NOT NULL;

ALTER TABLE "ApprovalRequest" DROP COLUMN "orphanedAt";
ALTER TABLE "ApprovalRequest" DROP COLUMN "orphaned";

DROP TYPE "EmailDeliveryPreference";
DROP TYPE "EmailDeliveryStatus";
DROP TYPE "EmailType";

DROP TABLE "EmailLog";
```

---

## Query Patterns

### 1. Find Pending Approvals for User

```typescript
const userApprovals = await db.approvalRequest.findMany({
  where: {
    OR: [
      { assignedTo: userId },
      { assignedRole: { in: userRoleIds } }
    ],
    status: 'Pending',
    orphaned: false
  },
  include: {
    requestedByUser: true,
    workflowInstance: {
      include: { workflowTemplate: true }
    }
  },
  orderBy: [
    { priority: 'desc' },
    { requestedAt: 'asc' }
  ]
});
```

### 2. Find Approvals Needing 24h Reminder

```typescript
const reminderDue = await db.approvalRequest.findMany({
  where: {
    status: 'Pending',
    orphaned: false,
    requestedAt: { lte: subHours(new Date(), 24) },
    NOT: {
      emailLogs: {
        some: { 
          emailType: 'approval_reminder_24h',
          deliveryStatus: { in: ['sent', 'delivered'] }
        }
      }
    }
  },
  include: {
    assignedToUser: { include: { profile: true } },
    assignedToRole: { include: { users: { include: { profile: true } } } }
  }
});
```

### 3. Find Failed Emails for Manual Review

```typescript
const failedEmails = await db.emailLog.findMany({
  where: {
    manualReviewFlag: true,
    deliveryStatus: 'failed'
  },
  include: {
    approvalRequest: {
      include: { requestedByUser: true }
    },
    recipient: true
  },
  orderBy: { failedAt: 'desc' }
});
```

### 4. Find Orphaned Approvals for Admin Dashboard

```typescript
const orphanedApprovals = await db.approvalRequest.findMany({
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
```

### 5. Get User's Unread Approval Notifications

```typescript
const notifications = await db.notification.findMany({
  where: {
    recipientId: userId,
    read: false,
    notificationType: { startsWith: 'approval_' }
  },
  include: { approvalRequest: true },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

---

## Performance Considerations

### Index Strategy

1. **ApprovalRequest**:
   - Composite index on `(orphaned, status)` for admin dashboard
   - Existing indexes on `(status, assignedTo)`, `(companyId, requestedAt)` remain

2. **EmailLog**:
   - Composite index on `(approvalRequestId, emailType)` for deduplication queries
   - Composite index on `(deliveryStatus, manualReviewFlag)` for admin dashboard
   - Index on `(recipientId, sentAt)` for user email history

3. **Notification**:
   - Composite index on `(recipientId, read, createdAt)` for notification center
   - Index on `approvalRequestId` for linking

### Query Optimization

- Use `findMany` with `take` limits to prevent large result sets
- Include only necessary relations (avoid deep nesting)
- Batch notification creates using `createMany` for role assignments
- Use transactions for approval creation + notification generation

---

## Data Integrity Constraints

1. **Referential Integrity**:
   - EmailLog.approvalRequestId → CASCADE DELETE (email logs tied to approval lifecycle)
   - Notification.approvalRequestId → SET NULL (notifications persist after approval deletion for history)
   - All user foreign keys → CASCADE DELETE (clean up on user deletion)

2. **Business Logic Constraints**:
   - Orphaned approvals must have `orphanedAt` timestamp (enforced in application layer)
   - Email retry count cannot exceed 3 (enforced in retry logic)
   - Digest time must be valid hour format (validated with Zod schema)
   - Permission strings must be from allowed set (validated on role create/update)

---

## Next Steps

1. Generate OpenAPI contracts for approval workflow endpoints
2. Create quickstart.md with database migration instructions
3. Update agent context (no new technologies added)
