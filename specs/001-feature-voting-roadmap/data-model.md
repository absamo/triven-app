# Data Model: Feature Voting Roadmap

**Created**: 20 October 2025  
**Feature**: Feature Voting & Product Roadmap  
**Status**: Complete

## Overview

This document defines the data model for the feature voting roadmap, including entities, relationships, validation rules, and state transitions. The design follows Prisma ORM patterns and integrates with the existing Triven App schema.

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│       User          │
│  (Existing Model)   │
├─────────────────────┤
│ id: String (PK)     │
│ email: String       │
│ name: String?       │
│ roleId: String (FK) │
│ ...                 │
└──────────┬──────────┘
           │
           │ 1:N (created by)
           │
           ▼
┌─────────────────────────┐          1:N          ┌──────────────────────┐
│   FeatureRequest        │◄─────────────────────│  FeatureVote         │
├─────────────────────────┤                       ├──────────────────────┤
│ id: String (PK)         │                       │ id: String (PK)      │
│ title: String           │                       │ featureId: String FK │
│ description: String     │                       │ userId: String FK    │
│ status: FeatureStatus   │                       │ votedAt: DateTime    │
│ voteCount: Int          │                       └──────────────────────┘
│ createdById: String FK  │                                │
│ createdAt: DateTime     │                                │
│ updatedAt: DateTime     │                       1:N (votes)
└────────────┬────────────┘                                │
             │                                             │
             │                                             │
             │ 1:N                                         │
             │                                             │
             ▼                                             │
┌─────────────────────────┐                                │
│  FeatureAuditLog        │                                │
├─────────────────────────┤                                │
│ id: String (PK)         │                                │
│ featureId: String FK    │                                │
│ userId: String FK       │◄───────────────────────────────┘
│ action: String          │                      1:N (voted by)
│ oldValue: Json?         │
│ newValue: Json?         │
│ timestamp: DateTime     │
└─────────────────────────┘
```

---

## Entities

### 1. FeatureRequest

Represents a proposed product feature that can be voted on and managed through the roadmap.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, @default(cuid()) | Unique identifier |
| `title` | String | @db.VarChar(200), required | Feature title (max 200 chars) |
| `description` | String | @db.Text, required | Detailed feature description |
| `status` | FeatureStatus | Enum, @default(TODO) | Current stage in roadmap |
| `voteCount` | Int | @default(0), ≥ 0 | Denormalized vote count for performance |
| `createdById` | String | FK → User.id, required | Admin who created the feature |
| `createdAt` | DateTime | @default(now()) | Creation timestamp |
| `updatedAt` | DateTime | @updatedAt | Last modification timestamp |

**Relations**:
- `createdBy: User` - Many-to-one with User (creator)
- `votes: FeatureVote[]` - One-to-many with FeatureVote
- `auditLogs: FeatureAuditLog[]` - One-to-many with FeatureAuditLog

**Indexes**:
```prisma
@@index([status, voteCount(sort: Desc), createdAt])  // Primary query pattern
@@index([createdById])                                // Filter by creator
```

**Validation Rules**:
- `title`: 1-200 characters, no leading/trailing whitespace
- `description`: 1-10,000 characters
- `voteCount`: Must match actual count of related FeatureVote records (enforced via transactions)
- `status`: Must be valid FeatureStatus enum value

**Business Rules**:
- Only admins can create, update, or delete features (FR-015, FR-016, FR-018)
- Vote count updates atomically with vote add/remove operations
- Status changes logged in FeatureAuditLog (FR-023)
- Deletion requires confirmation and cascades to votes and audit logs

---

### 2. FeatureVote

Represents a user's vote on a feature request. Implements one-vote-per-user-per-feature constraint.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, @default(cuid()) | Unique identifier |
| `featureId` | String | FK → FeatureRequest.id, required | Feature being voted on |
| `userId` | String | FK → User.id, required | User casting the vote |
| `votedAt` | DateTime | @default(now()) | Timestamp when vote was cast |

**Relations**:
- `feature: FeatureRequest` - Many-to-one with FeatureRequest
- `user: User` - Many-to-one with User

**Indexes & Constraints**:
```prisma
@@unique([featureId, userId])  // Enforce one vote per user per feature (FR-010)
@@index([userId])              // Query all votes by user
@@index([featureId])           // Query all votes for feature
```

**Validation Rules**:
- `featureId`: Must reference existing FeatureRequest
- `userId`: Must reference existing User
- Uniqueness enforced at database level (prevents duplicate votes)

**Business Rules**:
- Users can only vote on features with status TODO or PLANNED (FR-014)
- Voting on IN_PROGRESS or SHIPPED features returns 400 error
- Vote removal allowed at any time (FR-011)
- Cascade delete when feature or user is deleted

---

### 3. FeatureAuditLog

Tracks all changes to feature requests for audit trail and transparency.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, @default(cuid()) | Unique identifier |
| `featureId` | String | FK → FeatureRequest.id, required | Feature that was modified |
| `userId` | String | FK → User.id, required | User who performed the action |
| `action` | String | Enum-like, required | Type of action performed |
| `oldValue` | Json? | Optional | Previous state (for updates) |
| `newValue` | Json? | Optional | New state (for updates) |
| `timestamp` | DateTime | @default(now()) | When action occurred |

**Relations**:
- `feature: FeatureRequest` - Many-to-one with FeatureRequest
- `user: User` - Many-to-one with User

**Indexes**:
```prisma
@@index([featureId, timestamp])  // Query audit history for feature
@@index([userId])                // Query actions by user
```

**Action Types** (enum-like string values):
- `CREATED`: Feature was created
- `STATUS_CHANGED`: Feature moved between columns
- `UPDATED`: Feature title/description edited
- `DELETED`: Feature removed from roadmap
- `VOTE_ADDED`: User voted on feature (optional - could log in separate vote audit table)
- `VOTE_REMOVED`: User removed vote (optional)

**Validation Rules**:
- `action`: Must be one of the defined action types
- `oldValue` and `newValue`: Must be valid JSON when present
- For STATUS_CHANGED: oldValue and newValue should contain status information

**Business Rules**:
- All feature modifications create audit log entry (FR-023)
- Audit logs are immutable (no updates or deletes)
- Retention policy: keep indefinitely for compliance

---

### 4. FeatureStatus (Enum)

Represents the four stages of the roadmap kanban board.

**Values**:
```prisma
enum FeatureStatus {
  TODO        // "To Do" column - initial state for new ideas
  PLANNED     // "Planned" column - approved for development
  IN_PROGRESS // "In Progress" column - actively being built
  SHIPPED     // "Shipped" column - completed and released
}
```

**State Transitions**:

```
TODO ──────────► PLANNED ──────────► IN_PROGRESS ──────────► SHIPPED
  │                │                      │                      │
  │                │                      │                      │
  └────────────────┴──────────────────────┴──────────────────────┘
         (Allowed backward transitions for corrections)
```

**Transition Rules**:
- **Forward transitions**: TODO → PLANNED → IN_PROGRESS → SHIPPED (typical flow)
- **Backward transitions**: Allowed for corrections (e.g., IN_PROGRESS → PLANNED if deprioritized)
- **Skip transitions**: Allowed (e.g., TODO → IN_PROGRESS for urgent fixes)
- **All transitions**: Logged in FeatureAuditLog with old/new status

**Voting Rules by Status**:
- `TODO`: ✅ Voting enabled
- `PLANNED`: ✅ Voting enabled
- `IN_PROGRESS`: ❌ Voting disabled (feature committed)
- `SHIPPED`: ❌ Voting disabled (feature complete)

---

## User Model Extensions

The existing User model requires these additions:

```prisma
model User {
  // ... existing fields ...
  
  // New relations for roadmap feature
  createdFeatures  FeatureRequest[]  @relation("FeatureCreatedBy")
  votes            FeatureVote[]     @relation("FeatureVotes")
  featureAuditLogs FeatureAuditLog[] @relation("FeatureAuditLogs")
}
```

**Access Control**:
- Admin determination: Check `user.role.permissions.includes('ROADMAP_ACCESS')`
- Or check for specific role name if using fixed admin role
- Existing Better Auth session provides user context

---

## Database Constraints

### Primary Keys
- All entities use `cuid()` for distributed-safe unique IDs
- Consistent with existing Triven App schema patterns

### Foreign Keys
- `FeatureRequest.createdById` → `User.id` (ON DELETE: Restrict - preserve audit trail)
- `FeatureVote.featureId` → `FeatureRequest.id` (ON DELETE: Cascade - votes deleted with feature)
- `FeatureVote.userId` → `User.id` (ON DELETE: Cascade - votes deleted with user)
- `FeatureAuditLog.featureId` → `FeatureRequest.id` (ON DELETE: Cascade - logs tied to feature)
- `FeatureAuditLog.userId` → `User.id` (ON DELETE: Restrict - preserve audit trail)

### Unique Constraints
- `FeatureVote.[featureId, userId]`: Enforces one vote per user per feature (FR-010)

### Check Constraints
```sql
ALTER TABLE "FeatureRequest" 
ADD CONSTRAINT "voteCount_non_negative" 
CHECK ("voteCount" >= 0);
```

---

## Prisma Schema Definition

```prisma
// Add to prisma/schema.prisma

enum FeatureStatus {
  TODO
  PLANNED
  IN_PROGRESS
  SHIPPED
}

model FeatureRequest {
  id          String        @id @default(cuid())
  title       String        @db.VarChar(200)
  description String        @db.Text
  status      FeatureStatus @default(TODO)
  voteCount   Int           @default(0)
  createdById String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  createdBy   User              @relation("FeatureCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  votes       FeatureVote[]
  auditLogs   FeatureAuditLog[]
  
  @@index([status, voteCount(sort: Desc), createdAt])
  @@index([createdById])
  @@map("feature_requests")
}

model FeatureVote {
  id        String   @id @default(cuid())
  featureId String
  userId    String
  votedAt   DateTime @default(now())
  
  feature FeatureRequest @relation(fields: [featureId], references: [id], onDelete: Cascade)
  user    User           @relation("FeatureVotes", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([featureId, userId])
  @@index([userId])
  @@index([featureId])
  @@map("feature_votes")
}

model FeatureAuditLog {
  id        String    @id @default(cuid())
  featureId String
  userId    String
  action    String
  oldValue  Json?
  newValue  Json?
  timestamp DateTime  @default(now())
  
  feature FeatureRequest @relation(fields: [featureId], references: [id], onDelete: Cascade)
  user    User           @relation("FeatureAuditLogs", fields: [userId], references: [id], onDelete: Restrict)
  
  @@index([featureId, timestamp])
  @@index([userId])
  @@map("feature_audit_logs")
}

// Update User model
model User {
  // ... existing fields ...
  
  createdFeatures  FeatureRequest[]  @relation("FeatureCreatedBy")
  votes            FeatureVote[]     @relation("FeatureVotes")
  featureAuditLogs FeatureAuditLog[] @relation("FeatureAuditLogs")
}
```

---

## Migration Strategy

### Step 1: Create Migration
```bash
npx prisma migrate dev --name add_roadmap_tables
```

### Step 2: Seed Initial Data (Optional)
```typescript
// prisma/seed.ts additions
const sampleFeatures = [
  {
    title: "Dark mode support",
    description: "Add dark theme option to the application",
    status: "PLANNED",
    voteCount: 0
  },
  {
    title: "Export reports to PDF",
    description: "Allow exporting inventory reports in PDF format",
    status: "TODO",
    voteCount: 0
  }
];

for (const feature of sampleFeatures) {
  await db.featureRequest.create({
    data: {
      ...feature,
      createdById: adminUserId, // Use existing admin user
    }
  });
}
```

### Step 3: Verify Migration
```bash
npx prisma studio
# Inspect new tables: feature_requests, feature_votes, feature_audit_logs
```

---

## Query Patterns

### Get all features grouped by status (for kanban board)
```typescript
const features = await db.featureRequest.findMany({
  include: {
    createdBy: { select: { name: true } },
    _count: { select: { votes: true } },
    votes: {
      where: { userId: currentUserId },
      select: { id: true }
    }
  },
  orderBy: [
    { status: 'asc' },
    { voteCount: 'desc' },
    { createdAt: 'desc' }
  ]
});

// Group by status for kanban columns
const grouped = {
  TODO: features.filter(f => f.status === 'TODO'),
  PLANNED: features.filter(f => f.status === 'PLANNED'),
  IN_PROGRESS: features.filter(f => f.status === 'IN_PROGRESS'),
  SHIPPED: features.filter(f => f.status === 'SHIPPED')
};
```

### Cast vote (with transaction)
```typescript
const vote = await db.$transaction(async (tx) => {
  // Create vote
  const newVote = await tx.featureVote.create({
    data: {
      featureId,
      userId
    }
  });
  
  // Increment vote count
  await tx.featureRequest.update({
    where: { id: featureId },
    data: { voteCount: { increment: 1 } }
  });
  
  return newVote;
});
```

### Remove vote (with transaction)
```typescript
await db.$transaction(async (tx) => {
  // Delete vote
  await tx.featureVote.delete({
    where: {
      featureId_userId: { featureId, userId }
    }
  });
  
  // Decrement vote count
  await tx.featureRequest.update({
    where: { id: featureId },
    data: { voteCount: { decrement: 1 } }
  });
});
```

### Update status with audit log
```typescript
await db.$transaction(async (tx) => {
  const oldFeature = await tx.featureRequest.findUnique({
    where: { id: featureId }
  });
  
  const updated = await tx.featureRequest.update({
    where: { id: featureId },
    data: { status: newStatus }
  });
  
  await tx.featureAuditLog.create({
    data: {
      featureId,
      userId,
      action: 'STATUS_CHANGED',
      oldValue: { status: oldFeature.status },
      newValue: { status: newStatus }
    }
  });
  
  return updated;
});
```

---

## Performance Considerations

### Indexes
- **(status, voteCount DESC, createdAt)**: Composite index for main kanban query
- **(featureId, userId)**: Unique constraint doubles as query index for vote checks
- **userId**: For "my votes" queries
- **featureId**: For vote count aggregations (backup to denormalized count)

### Denormalization
- **voteCount on FeatureRequest**: Avoids expensive COUNT queries on every feature load
- Trade-off: Requires transaction to keep in sync with FeatureVote table
- Recovery: Can recalculate from FeatureVote table if inconsistency detected

### Pagination
```typescript
// Cursor-based pagination for infinite scroll
const features = await db.featureRequest.findMany({
  take: 30,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  where: { status: 'TODO' },
  orderBy: { voteCount: 'desc' }
});
```

---

**Data Model Complete**: Ready for API contract definition (Phase 1 continuation).
