# Quickstart: Workflow Approval Process Enhancement

**Feature**: 005-workflow-approvals  
**Branch**: `005-workflow-approvals`  
**Date**: 2025-11-09

## Overview

This guide helps developers implement and test the workflow approval process enhancement. It covers database setup, service implementation, API endpoints, email templates, background jobs, and testing strategies.

## Prerequisites

- Node.js 20+, Bun runtime installed
- PostgreSQL database running
- Resend API key configured in `.env`
- Project dependencies installed: `bun install`

## Quick Start (5 minutes)

```bash
# 1. Checkout feature branch
git checkout 005-workflow-approvals

# 2. Apply database migration
bun run db:gen
bun run db:push

# 3. Add permissions to admin role
bunx prisma studio
# Navigate to Role table → Find "Admin" role → Add to permissions array:
# ["create_workflow", "approve_workflows", "admin_orphaned_approvals"]

# 4. Start development server
bun run dev

# 5. Test approval creation (in another terminal)
curl -X POST http://localhost:3000/api/approvals/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_session=YOUR_SESSION_COOKIE" \
  -d '{
    "entityType": "purchase_order",
    "entityId": "cuid_po_123",
    "requestType": "approval",
    "title": "Approve PO #1234",
    "assignedRole": "cuid_approver_role",
    "priority": "High"
  }'
```

## Database Migration

### Step 1: Generate Prisma Client

```bash
bun run db:gen
```

### Step 2: Apply Schema Changes

The migration adds:
- `EmailLog` table for email audit trail
- `orphaned` and `orphanedAt` fields to `ApprovalRequest`
- `approvalRequestId`, `notificationType`, `recipientId` to `Notification`
- `emailDeliveryPreference`, `digestTime`, `locale` to `Profile`
- New enums: `EmailType`, `EmailDeliveryStatus`, `EmailDeliveryPreference`
- Indexes for performance

```bash
# Apply migration to database
bun run db:push

# Or create migration file first (recommended for production)
bunx prisma migrate dev --name workflow_approvals
```

### Step 3: Seed Test Data

```typescript
// Add to prisma/seed.ts

import { db } from '../app/db.server';

async function seedWorkflowPermissions() {
  // Find admin role
  const adminRole = await db.role.findFirst({
    where: { name: 'Admin' }
  });

  if (adminRole) {
    await db.role.update({
      where: { id: adminRole.id },
      data: {
        permissions: {
          push: ['create_workflow', 'approve_workflows', 'admin_orphaned_approvals']
        }
      }
    });
  }

  // Create approver role
  await db.role.upsert({
    where: { name_companyId: { name: 'Approver', companyId: 'your_company_id' } },
    create: {
      name: 'Approver',
      description: 'Can approve workflow requests',
      permissions: ['approve_workflows'],
      companyId: 'your_company_id'
    },
    update: {}
  });
}

// Run: bun run db:reset
```

## Service Implementation

### Core Service: `app/services/workflow-approvals.server.ts`

```typescript
import { db } from '~/app/db.server';
import { sendApprovalRequestEmail, sendReassignmentEmail } from './email.server';
import { createNotification } from './notifications.server';

export async function createApprovalRequest(data: CreateApprovalData, requestedBy: string) {
  // Check if assigned to role with no active members
  if (data.assignedRole) {
    const roleMembers = await db.user.count({
      where: {
        roleId: data.assignedRole,
        active: true
      }
    });

    if (roleMembers === 0) {
      // Mark as orphaned
      const approval = await db.approvalRequest.create({
        data: {
          ...data,
          requestedBy,
          orphaned: true,
          orphanedAt: new Date()
        }
      });

      await sendOrphanedNotification(approval);
      return approval;
    }
  }

  // Create approval request
  const approval = await db.approvalRequest.create({
    data: {
      ...data,
      requestedBy
    }
  });

  // Send notifications (background, non-blocking)
  await sendApprovalNotifications(approval);

  return approval;
}

async function sendApprovalNotifications(approval: ApprovalRequest) {
  const recipients = await getApprovalRecipients(approval);

  // Deduplicate recipients
  const uniqueRecipients = Array.from(new Set(recipients.map(r => r.id)));

  for (const recipientId of uniqueRecipients) {
    const user = recipients.find(r => r.id === recipientId)!;

    // Check email preference
    if (user.profile?.emailDeliveryPreference !== 'disabled') {
      if (user.profile?.emailDeliveryPreference === 'daily_digest') {
        await queueForDigest(user.id, approval.id);
      } else {
        await sendEmailWithRetry({
          to: user.email,
          approvalId: approval.id,
          type: 'initial_approval',
          locale: user.profile?.locale || 'en'
        });
      }
    }

    // Always create in-app notification
    await createNotification({
      recipientId: user.id,
      companyId: approval.companyId,
      approvalRequestId: approval.id,
      notificationType: 'approval_request',
      message: `New approval request: ${approval.title}`,
      status: 'info'
    });
  }
}

export async function reviewApprovalRequest(
  approvalId: string,
  userId: string,
  decision: ApprovalDecision,
  reason?: string
) {
  // Verify user is authorized to review
  const approval = await db.approvalRequest.findUnique({
    where: { id: approvalId },
    include: { assignedToRole: { include: { users: true } } }
  });

  if (!approval) {
    throw new Error('Approval request not found');
  }

  const isDirectlyAssigned = approval.assignedTo === userId;
  const isRoleMember = approval.assignedToRole?.users.some(u => u.id === userId);

  if (!isDirectlyAssigned && !isRoleMember) {
    throw new Error('User not authorized to review this approval');
  }

  // Update approval
  return db.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: decision === 'Approve' ? 'Approved' : 'Rejected',
      decision,
      decisionReason: reason,
      reviewedAt: new Date(),
      completedAt: new Date()
    }
  });
}
```

### Email Service Extension: `app/services/email.server.ts`

```typescript
// Add to existing email.server.ts

export async function sendApprovalRequestEmail(props: ApprovalRequestEmailProps) {
  const { to, approvalTitle, approvalDescription, requesterName, priority, expiresAt, reviewUrl, locale = 'en' } = props;

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Triven <notifications@triven.app>',
      to,
      subject: locale === 'fr' 
        ? `Nouvelle demande d'approbation: ${approvalTitle}`
        : `New approval request: ${approvalTitle}`,
      react: ApprovalRequestEmail({
        approvalTitle,
        approvalDescription,
        requesterName,
        priority,
        expiresAt,
        reviewUrl: reviewUrl || `${process.env.BASE_URL}/approvals/${approvalId}`,
        locale
      })
    });

    console.log(`✅ Approval request email sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send approval request email:', error);
    throw error;
  }
}

export async function sendEmailWithRetry(emailData: EmailData, maxRetries = 3) {
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sendApprovalRequestEmail(emailData);
      
      // Log success
      await db.emailLog.create({
        data: {
          approvalRequestId: emailData.approvalId,
          recipientId: emailData.recipientId,
          recipientEmail: emailData.to,
          subject: `Approval request: ${emailData.approvalTitle}`,
          emailType: emailData.type,
          deliveryStatus: 'sent',
          retryCount: attempt,
          sentAt: new Date()
        }
      });
      
      return;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        // Final failure - log and queue for manual review
        await db.emailLog.create({
          data: {
            approvalRequestId: emailData.approvalId,
            recipientId: emailData.recipientId,
            recipientEmail: emailData.to,
            subject: `Approval request: ${emailData.approvalTitle}`,
            emailType: emailData.type,
            deliveryStatus: 'failed',
            retryCount: attempt,
            failureReason: lastError.message,
            manualReviewFlag: true,
            failedAt: new Date()
          }
        });
        throw lastError;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }
}
```

### Background Jobs: `app/lib/jobs/approval-reminders.ts`

```typescript
import { db } from '~/app/db.server';
import { subHours, addHours } from 'date-fns';
import { sendEmailWithRetry } from '~/app/services/email.server';

export async function processApprovalReminders() {
  console.log('🔔 Processing approval reminders...');
  
  const now = new Date();

  // Find approvals pending 24 hours
  const pending24h = await db.approvalRequest.findMany({
    where: {
      status: 'Pending',
      orphaned: false,
      requestedAt: { lte: subHours(now, 24) },
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
      assignedToRole: { include: { users: { include: { profile: true } } } },
      requestedByUser: true
    }
  });

  // Find approvals 48h from expiration
  const urgent48h = await db.approvalRequest.findMany({
    where: {
      status: 'Pending',
      orphaned: false,
      expiresAt: { 
        gte: now,
        lte: addHours(now, 48)
      },
      NOT: {
        emailLogs: {
          some: { 
            emailType: 'approval_reminder_48h',
            deliveryStatus: { in: ['sent', 'delivered'] }
          }
        }
      }
    },
    include: {
      assignedToUser: { include: { profile: true } },
      assignedToRole: { include: { users: { include: { profile: true } } } },
      requestedByUser: true
    }
  });

  // Send 24h reminders
  for (const approval of pending24h) {
    const recipients = getApprovalRecipients(approval);
    for (const recipient of recipients) {
      if (recipient.profile?.emailDeliveryPreference !== 'disabled') {
        await sendEmailWithRetry({
          to: recipient.email,
          approvalId: approval.id,
          approvalTitle: approval.title,
          type: 'approval_reminder_24h',
          locale: recipient.profile?.locale || 'en'
        });
      }
    }
  }

  // Send 48h urgent reminders
  for (const approval of urgent48h) {
    const recipients = getApprovalRecipients(approval);
    for (const recipient of recipients) {
      if (recipient.profile?.emailDeliveryPreference !== 'disabled') {
        await sendEmailWithRetry({
          to: recipient.email,
          approvalId: approval.id,
          approvalTitle: approval.title,
          type: 'approval_reminder_48h',
          locale: recipient.profile?.locale || 'en'
        });
      }
    }
  }

  console.log(`✅ Sent ${pending24h.length} standard reminders, ${urgent48h.length} urgent reminders`);
}

// Start reminder job (runs every 15 minutes)
export function startReminderScheduler() {
  setInterval(processApprovalReminders, 15 * 60 * 1000); // 15 minutes
  console.log('🚀 Approval reminder scheduler started (15-minute interval)');
}
```

### Job Initialization: `app/entry.server.tsx`

```typescript
import { startReminderScheduler } from './lib/jobs/approval-reminders';

// Add after other initialization
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true') {
  startReminderScheduler();
}
```

## API Routes

### Create Approval: `app/routes/api/approvals.create.ts`

```typescript
import { type ActionFunctionArgs, json } from 'react-router';
import { requireAuth } from '~/app/services/auth.server';
import { createApprovalRequest } from '~/app/services/workflow-approvals.server';
import { z } from 'zod';

const createApprovalSchema = z.object({
  entityType: z.enum(['purchase_order', 'sales_order', 'stock_adjustment']),
  entityId: z.string(),
  requestType: z.enum(['approval', 'review', 'sign_off']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  assignedTo: z.string().optional(),
  assignedRole: z.string().optional(),
  title: z.string().max(200),
  description: z.string().optional(),
  data: z.record(z.any()),
  expiresAt: z.string().datetime().optional()
}).refine(data => data.assignedTo || data.assignedRole, {
  message: 'Must specify either assignedTo or assignedRole'
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  
  const body = await request.json();
  const data = createApprovalSchema.parse(body);
  
  const approval = await createApprovalRequest(data, user.id);
  
  return json(approval, { status: 201 });
}
```

### Review Approval: `app/routes/api/approvals.$id.review.ts`

```typescript
import { type ActionFunctionArgs, json } from 'react-router';
import { requireAuth } from '~/app/services/auth.server';
import { reviewApprovalRequest } from '~/app/services/workflow-approvals.server';
import { z } from 'zod';

const reviewSchema = z.object({
  decision: z.enum(['Approve', 'Reject', 'RequestChanges']),
  decisionReason: z.string().optional(),
  notes: z.string().optional()
}).refine(data => {
  if (data.decision !== 'Approve') {
    return !!data.decisionReason;
  }
  return true;
}, {
  message: 'decisionReason required for Reject and RequestChanges'
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const { id } = params;
  
  const body = await request.json();
  const { decision, decisionReason, notes } = reviewSchema.parse(body);
  
  const approval = await reviewApprovalRequest(id!, user.id, decision, decisionReason);
  
  return json(approval);
}
```

## Testing

### Unit Tests: `app/test/services/workflow-approvals.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApprovalRequest } from '~/app/services/workflow-approvals.server';
import { db } from '~/app/db.server';

vi.mock('~/app/db.server', () => ({
  db: {
    approvalRequest: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

describe('createApprovalRequest', () => {
  it('should create approval and send notifications', async () => {
    vi.mocked(db.user.count).mockResolvedValue(2); // Role has members
    vi.mocked(db.approvalRequest.create).mockResolvedValue({
      id: 'approval_123',
      status: 'Pending',
      orphaned: false
    } as any);

    const approval = await createApprovalRequest({
      entityType: 'purchase_order',
      entityId: 'po_123',
      requestType: 'approval',
      title: 'Test Approval',
      assignedRole: 'role_123'
    }, 'user_123');

    expect(approval.orphaned).toBe(false);
    expect(db.approvalRequest.create).toHaveBeenCalled();
  });

  it('should mark as orphaned when role has no members', async () => {
    vi.mocked(db.user.count).mockResolvedValue(0); // No role members
    vi.mocked(db.approvalRequest.create).mockResolvedValue({
      id: 'approval_123',
      orphaned: true,
      orphanedAt: expect.any(Date)
    } as any);

    const approval = await createApprovalRequest({
      entityType: 'purchase_order',
      entityId: 'po_123',
      requestType: 'approval',
      title: 'Test Approval',
      assignedRole: 'empty_role'
    }, 'user_123');

    expect(approval.orphaned).toBe(true);
  });
});
```

### Integration Tests: `app/test/routes/api/approvals.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('POST /api/approvals/create', () => {
  it('should create approval request with valid data', async () => {
    const response = await fetch('http://localhost:3000/api/approvals/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth_session=test_session'
      },
      body: JSON.stringify({
        entityType: 'purchase_order',
        entityId: 'po_123',
        requestType: 'approval',
        title: 'Approve PO #123',
        assignedRole: 'approver_role',
        priority: 'High'
      })
    });

    expect(response.status).toBe(201);
    const approval = await response.json();
    expect(approval.id).toBeDefined();
    expect(approval.status).toBe('Pending');
  });
});
```

## Email Templates

Create React Email templates in `app/emails/`:

### `approval-request.tsx`

```typescript
import { Button, Html, Text, Section } from '@react-email/components';

interface ApprovalRequestEmailProps {
  approvalTitle: string;
  approvalDescription?: string;
  requesterName: string;
  priority: string;
  expiresAt?: string;
  reviewUrl: string;
  locale: 'en' | 'fr';
}

export function ApprovalRequestEmail(props: ApprovalRequestEmailProps) {
  const { approvalTitle, requesterName, priority, reviewUrl, locale } = props;

  const t = locale === 'fr' ? {
    greeting: 'Bonjour',
    body: `${requesterName} a créé une demande d'approbation qui nécessite votre attention.`,
    title: 'Titre',
    priority: 'Priorité',
    action: 'Examiner la demande'
  } : {
    greeting: 'Hello',
    body: `${requesterName} has created an approval request that requires your attention.`,
    title: 'Title',
    priority: 'Priority',
    action: 'Review Request'
  };

  return (
    <Html>
      <Section>
        <Text>{t.greeting},</Text>
        <Text>{t.body}</Text>
        <Text><strong>{t.title}:</strong> {approvalTitle}</Text>
        <Text><strong>{t.priority}:</strong> {priority}</Text>
        <Button href={reviewUrl}>{t.action}</Button>
      </Section>
    </Html>
  );
}
```

## Troubleshooting

### Emails Not Sending

1. Check Resend API key: `echo $RESEND_API_KEY`
2. Check EmailLog table for failure reasons: `SELECT * FROM "EmailLog" WHERE "manualReviewFlag" = true`
3. Verify FROM_EMAIL domain is verified in Resend dashboard

### Reminders Not Running

1. Check job scheduler started: Look for log `🚀 Approval reminder scheduler started`
2. Verify `ENABLE_JOBS=true` in `.env` for development
3. Check EmailLog for reminder send history

### Orphaned Approvals Not Appearing

1. Verify role has no active members: `SELECT COUNT(*) FROM "User" WHERE "roleId" = 'role_id' AND "active" = true`
2. Check `orphaned` flag: `SELECT * FROM "ApprovalRequest" WHERE "orphaned" = true`
3. Verify admin permission: User role must include `admin_orphaned_approvals`

## Migration to Production Job Queue

When ready to scale, migrate from Node.js timers to BullMQ:

```bash
# Install dependencies
bun add bullmq ioredis

# Update docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

# Replace app/lib/jobs/scheduler.ts with BullMQ workers
# See: https://docs.bullmq.io/
```

## Next Steps

1. Implement `/speckit.tasks` to break down implementation into tasks
2. Run `/speckit.implement` to execute TDD implementation
3. Deploy to staging for QA testing
4. Monitor EmailLog and Notification tables for delivery metrics

## Support

For questions or issues:
- Check [data-model.md](./data-model.md) for schema details
- Check [contracts/approval-api.yaml](./contracts/approval-api.yaml) for API reference
- Review [research.md](./research.md) for design decisions
