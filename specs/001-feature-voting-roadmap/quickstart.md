# Quickstart Guide: Feature Voting Roadmap Implementation

**Feature**: Feature Voting & Product Roadmap  
**Target Audience**: Developers implementing this feature  
**Estimated Time**: 2-3 development sprints

## Overview

This guide provides a step-by-step walkthrough for implementing the feature voting roadmap. Follow this sequence to build the feature incrementally while maintaining test coverage and constitutional compliance.

---

## Prerequisites

Before starting implementation:

- [ ] Read the [feature specification](./spec.md)
- [ ] Review the [implementation plan](./plan.md)
- [ ] Understand the [data model](./data-model.md)
- [ ] Familiarize yourself with the [API contracts](./contracts/)
- [ ] Verify development environment is set up:
  - Node.js 20+ installed
  - PostgreSQL running
  - Triven App dependencies installed (`bun install`)
  - Database migrations up to date (`bun run db:push`)

---

## Implementation Phases

### Phase 1: Database Schema & Models

**Goal**: Create database schema and Prisma models for roadmap feature.

#### Step 1.1: Add Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
// Add FeatureStatus enum
enum FeatureStatus {
  TODO
  PLANNED
  IN_PROGRESS
  SHIPPED
}

// Add FeatureRequest model
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

// Add FeatureVote model
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

// Add FeatureAuditLog model
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

// Update User model to include new relations
model User {
  // ... existing fields ...
  
  createdFeatures  FeatureRequest[]  @relation("FeatureCreatedBy")
  votes            FeatureVote[]     @relation("FeatureVotes")
  featureAuditLogs FeatureAuditLog[] @relation("FeatureAuditLogs")
}
```

#### Step 1.2: Create Migration

```bash
bun run db:gen && bun run db:push
# Or create a specific migration:
npx prisma migrate dev --name add_roadmap_tables
```

#### Step 1.3: Verify Schema

```bash
npx prisma studio
# Check that new tables exist: feature_requests, feature_votes, feature_audit_logs
```

#### Step 1.4: (Optional) Seed Test Data

Add to `prisma/seed.ts`:

```typescript
// Find or create an admin user
const adminUser = await db.user.findFirst({
  where: { role: { permissions: { has: 'ADMIN' } } }
});

if (adminUser) {
  // Create sample features
  await db.featureRequest.createMany({
    data: [
      {
        title: 'Dark mode support',
        description: 'Add dark theme option for better UX at night',
        status: 'PLANNED',
        createdById: adminUser.id
      },
      {
        title: 'Export reports to PDF',
        description: 'Allow exporting inventory reports in PDF format',
        status: 'TODO',
        createdById: adminUser.id
      },
      {
        title: 'Mobile app',
        description: 'Native iOS and Android applications',
        status: 'IN_PROGRESS',
        createdById: adminUser.id
      }
    ]
  });
  
  console.log('✅ Seeded roadmap features');
}
```

**Checkpoint**: Database schema is ready. Move to Phase 2.

---

### Phase 2: TypeScript Types & Validators

**Goal**: Create type definitions and Zod schemas for request validation.

#### Step 2.1: Create Type Definitions

Create `app/lib/roadmap/types.ts`:

```typescript
import type { FeatureRequest, FeatureVote, FeatureAuditLog } from '@prisma/client';

export type { FeatureRequest, FeatureVote, FeatureAuditLog };

export type FeatureStatus = 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED';

export type FeatureWithVotes = FeatureRequest & {
  createdBy: { name: string | null };
  hasVoted: boolean;
  _count: { votes: number };
};

export type FeatureDetailed = FeatureWithVotes & {
  auditLogs: (FeatureAuditLog & {
    user: { name: string | null };
  })[];
};

export type CreateFeatureInput = {
  title: string;
  description: string;
  status?: FeatureStatus;
};

export type UpdateFeatureInput = {
  title?: string;
  description?: string;
  status?: FeatureStatus;
};

export type VoteUpdateEvent = {
  type: 'VOTE_UPDATE';
  featureId: string;
  voteCount: number;
  voterId?: string;
  action: 'add' | 'remove';
  timestamp: string;
};

export type FeatureUpdateEvent = {
  type: 'FEATURE_UPDATE';
  featureId: string;
  changes: Partial<FeatureRequest>;
  timestamp: string;
};

export type FeatureCreatedEvent = {
  type: 'FEATURE_CREATED';
  feature: FeatureWithVotes;
  timestamp: string;
};

export type FeatureDeletedEvent = {
  type: 'FEATURE_DELETED';
  featureId: string;
  timestamp: string;
};

export type WebSocketEvent = 
  | VoteUpdateEvent 
  | FeatureUpdateEvent 
  | FeatureCreatedEvent 
  | FeatureDeletedEvent;
```

#### Step 2.2: Create Zod Validators

Create `app/lib/roadmap/validators.ts`:

```typescript
import { z } from 'zod';

export const FeatureStatusSchema = z.enum(['TODO', 'PLANNED', 'IN_PROGRESS', 'SHIPPED']);

export const CreateFeatureSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be 10,000 characters or less')
    .trim(),
  status: FeatureStatusSchema.optional().default('TODO')
});

export const UpdateFeatureSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be 10,000 characters or less')
    .trim()
    .optional(),
  status: FeatureStatusSchema.optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided'
);

export const ListFeaturesQuerySchema = z.object({
  status: FeatureStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  cursor: z.string().optional()
});
```

**Checkpoint**: Types and validators are ready. Move to Phase 3.

---

### Phase 3: Service Layer (TDD)

**Goal**: Implement business logic with test-first development.

#### Step 3.1: Write Feature Service Tests

Create `app/test/roadmap/feature.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureService } from '~/services/roadmap/feature.service';
import { db } from '~/lib/db.server';

describe('FeatureService', () => {
  let service: FeatureService;
  let testAdminId: string;
  
  beforeEach(async () => {
    service = new FeatureService();
    // Create test admin user
    const admin = await db.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Test Admin',
        status: 'ACTIVE',
        // Assign admin role
      }
    });
    testAdminId = admin.id;
  });
  
  describe('createFeature', () => {
    it('should create a feature with valid data', async () => {
      const input = {
        title: 'Test Feature',
        description: 'Test description',
        status: 'TODO' as const
      };
      
      const feature = await service.createFeature(input, testAdminId);
      
      expect(feature).toBeDefined();
      expect(feature.title).toBe(input.title);
      expect(feature.description).toBe(input.description);
      expect(feature.status).toBe('TODO');
      expect(feature.voteCount).toBe(0);
      expect(feature.createdById).toBe(testAdminId);
    });
    
    it('should create audit log entry', async () => {
      const input = {
        title: 'Test Feature',
        description: 'Test description'
      };
      
      const feature = await service.createFeature(input, testAdminId);
      
      const auditLog = await db.featureAuditLog.findFirst({
        where: { featureId: feature.id, action: 'CREATED' }
      });
      
      expect(auditLog).toBeDefined();
      expect(auditLog?.userId).toBe(testAdminId);
    });
  });
  
  describe('listFeatures', () => {
    it('should return features sorted by vote count', async () => {
      // Create features with different vote counts
      // ... test implementation
    });
    
    it('should filter by status', async () => {
      // ... test implementation
    });
  });
  
  describe('updateFeature', () => {
    it('should update feature and create audit log', async () => {
      // ... test implementation
    });
  });
  
  describe('deleteFeature', () => {
    it('should cascade delete votes and audit logs', async () => {
      // ... test implementation
    });
  });
});
```

#### Step 3.2: Implement Feature Service

Create `app/services/roadmap/feature.service.ts`:

```typescript
import { db } from '~/lib/db.server';
import type { 
  CreateFeatureInput, 
  UpdateFeatureInput, 
  FeatureWithVotes 
} from '~/lib/roadmap/types';

export class FeatureService {
  async createFeature(
    input: CreateFeatureInput, 
    createdById: string
  ) {
    return db.$transaction(async (tx) => {
      const feature = await tx.featureRequest.create({
        data: {
          ...input,
          createdById
        }
      });
      
      await tx.featureAuditLog.create({
        data: {
          featureId: feature.id,
          userId: createdById,
          action: 'CREATED',
          newValue: feature
        }
      });
      
      return feature;
    });
  }
  
  async listFeatures(
    status?: string,
    userId?: string,
    limit = 30,
    cursor?: string
  ): Promise<FeatureWithVotes[]> {
    const features = await db.featureRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { votes: true } },
        votes: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      },
      orderBy: [
        { status: 'asc' },
        { voteCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined
    });
    
    return features.map(f => ({
      ...f,
      hasVoted: userId ? f.votes.length > 0 : false
    }));
  }
  
  async getFeature(id: string, userId?: string) {
    const feature = await db.featureRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { votes: true } },
        votes: userId ? {
          where: { userId },
          select: { id: true }
        } : false,
        auditLogs: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    if (!feature) return null;
    
    return {
      ...feature,
      hasVoted: userId ? feature.votes.length > 0 : false
    };
  }
  
  async updateFeature(
    id: string, 
    input: UpdateFeatureInput, 
    userId: string
  ) {
    return db.$transaction(async (tx) => {
      const oldFeature = await tx.featureRequest.findUnique({
        where: { id }
      });
      
      if (!oldFeature) throw new Error('Feature not found');
      
      const updated = await tx.featureRequest.update({
        where: { id },
        data: input
      });
      
      await tx.featureAuditLog.create({
        data: {
          featureId: id,
          userId,
          action: input.status ? 'STATUS_CHANGED' : 'UPDATED',
          oldValue: oldFeature,
          newValue: updated
        }
      });
      
      return updated;
    });
  }
  
  async deleteFeature(id: string, userId: string) {
    return db.$transaction(async (tx) => {
      await tx.featureAuditLog.create({
        data: {
          featureId: id,
          userId,
          action: 'DELETED'
        }
      });
      
      await tx.featureRequest.delete({
        where: { id }
      });
    });
  }
}
```

#### Step 3.3: Write Vote Service Tests

Create `app/test/roadmap/vote.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { VoteService } from '~/services/roadmap/vote.service';
import { db } from '~/lib/db.server';

describe('VoteService', () => {
  let service: VoteService;
  let testUserId: string;
  let testFeatureId: string;
  
  beforeEach(async () => {
    service = new VoteService();
    // Setup test data
  });
  
  describe('castVote', () => {
    it('should create vote and increment vote count', async () => {
      // ... test implementation
    });
    
    it('should throw error if already voted', async () => {
      // ... test implementation
    });
    
    it('should throw error if feature is IN_PROGRESS or SHIPPED', async () => {
      // ... test implementation
    });
  });
  
  describe('removeVote', () => {
    it('should delete vote and decrement vote count', async () => {
      // ... test implementation
    });
    
    it('should throw error if vote does not exist', async () => {
      // ... test implementation
    });
  });
});
```

#### Step 3.4: Implement Vote Service

Create `app/services/roadmap/vote.service.ts`:

```typescript
import { db } from '~/lib/db.server';

export class VoteService {
  async castVote(featureId: string, userId: string) {
    // Check if feature is votable
    const feature = await db.featureRequest.findUnique({
      where: { id: featureId },
      select: { status: true }
    });
    
    if (!feature) {
      throw new Error('Feature not found');
    }
    
    if (feature.status === 'IN_PROGRESS' || feature.status === 'SHIPPED') {
      throw new Error('Cannot vote on features in IN_PROGRESS or SHIPPED status');
    }
    
    try {
      return await db.$transaction(async (tx) => {
        const vote = await tx.featureVote.create({
          data: { featureId, userId }
        });
        
        await tx.featureRequest.update({
          where: { id: featureId },
          data: { voteCount: { increment: 1 } }
        });
        
        return vote;
      });
    } catch (error: any) {
      if (error.code === 'P2002') { // Unique constraint violation
        throw new Error('You have already voted on this feature');
      }
      throw error;
    }
  }
  
  async removeVote(featureId: string, userId: string) {
    try {
      return await db.$transaction(async (tx) => {
        await tx.featureVote.delete({
          where: {
            featureId_userId: { featureId, userId }
          }
        });
        
        await tx.featureRequest.update({
          where: { id: featureId },
          data: { voteCount: { decrement: 1 } }
        });
      });
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        throw new Error('Vote not found');
      }
      throw error;
    }
  }
}
```

#### Step 3.5: Run Tests

```bash
bun run test app/test/roadmap/
```

**Checkpoint**: Service layer implemented with passing tests. Move to Phase 4.

---

### Phase 4: API Endpoints

**Goal**: Create REST API endpoints following OpenAPI spec.

#### Step 4.1: Create Permission Utility

Create `app/lib/roadmap/permissions.ts`:

```typescript
import { auth } from '~/lib/auth.server';
import { db } from '~/lib/db.server';

export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ 
    headers: request.headers 
  });
  
  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: true }
  });
  
  if (!user?.role?.permissions?.includes('ROADMAP_ACCESS')) {
    throw new Response('Forbidden - Admin access required', { status: 403 });
  }
  
  return user;
}

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({ 
    headers: request.headers 
  });
  
  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });
  
  if (!user) {
    throw new Response('User not found', { status: 404 });
  }
  
  return user;
}
```

#### Step 4.2: Create Feature Endpoints

Create `app/routes/api/api.roadmap.features.ts`:

```typescript
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { FeatureService } from '~/services/roadmap/feature.service';
import { 
  CreateFeatureSchema, 
  UpdateFeatureSchema, 
  ListFeaturesQuerySchema 
} from '~/lib/roadmap/validators';
import { requireAdmin, requireAuth } from '~/lib/roadmap/permissions';

const featureService = new FeatureService();

// GET /api/roadmap/features
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  const url = new URL(request.url);
  const query = ListFeaturesQuerySchema.parse({
    status: url.searchParams.get('status'),
    limit: url.searchParams.get('limit'),
    cursor: url.searchParams.get('cursor')
  });
  
  const features = await featureService.listFeatures(
    query.status,
    user.id,
    query.limit,
    query.cursor
  );
  
  return json({ 
    features,
    nextCursor: features[features.length - 1]?.id,
    hasMore: features.length === query.limit
  });
}

// POST /api/roadmap/features
export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'POST') {
    const admin = await requireAdmin(request);
    const body = await request.json();
    const input = CreateFeatureSchema.parse(body);
    
    const feature = await featureService.createFeature(input, admin.id);
    
    // TODO: Broadcast via WebSocket
    
    return json(feature, { status: 201 });
  }
  
  return json({ error: 'Method not allowed' }, { status: 405 });
}

// PATCH/DELETE specific feature at /api/roadmap/features/:featureId
// (Create separate route file or handle in same file with URL parsing)
```

#### Step 4.3: Create Vote Endpoints

Create `app/routes/api/api.roadmap.votes.ts`:

```typescript
import { json, type ActionFunctionArgs } from 'react-router';
import { VoteService } from '~/services/roadmap/vote.service';
import { requireAuth } from '~/lib/roadmap/permissions';

const voteService = new VoteService();

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const featureId = params.featureId;
  
  if (!featureId) {
    return json({ error: 'Feature ID required' }, { status: 400 });
  }
  
  try {
    if (request.method === 'POST') {
      const vote = await voteService.castVote(featureId, user.id);
      
      // TODO: Broadcast via WebSocket
      
      return json({ 
        success: true, 
        voteCount: vote.feature.voteCount,
        votedAt: vote.votedAt
      }, { status: 201 });
    }
    
    if (request.method === 'DELETE') {
      await voteService.removeVote(featureId, user.id);
      
      // TODO: Broadcast via WebSocket
      
      return json({ success: true });
    }
    
    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    if (error.message.includes('already voted')) {
      return json({ error: error.message }, { status: 409 });
    }
    if (error.message.includes('Cannot vote')) {
      return json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
```

**Checkpoint**: API endpoints are functional. Test with curl or Postman before moving to Phase 5.

---

### Phase 5: Frontend Components

**Goal**: Build React components using Mantine UI.

#### Step 5.1: Create Feature Card Component

Create `app/components/Roadmap/FeatureCard.tsx`:

```typescript
import { Card, Text, Badge, Button, Group, Stack } from '@mantine/core';
import { IconThumbUp, IconThumbUpFilled } from '@tabler/icons-react';
import type { FeatureWithVotes } from '~/lib/roadmap/types';

interface FeatureCardProps {
  feature: FeatureWithVotes;
  onVote: (featureId: string) => Promise<void>;
  onUnvote: (featureId: string) => Promise<void>;
  isAdmin?: boolean;
  onEdit?: (feature: FeatureWithVotes) => void;
  onDelete?: (featureId: string) => void;
}

export function FeatureCard({ 
  feature, 
  onVote, 
  onUnvote,
  isAdmin,
  onEdit,
  onDelete
}: FeatureCardProps) {
  const handleVoteToggle = async () => {
    if (feature.hasVoted) {
      await onUnvote(feature.id);
    } else {
      await onVote(feature.id);
    }
  };
  
  const canVote = feature.status === 'TODO' || feature.status === 'PLANNED';
  
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Text fw={500} size="lg">{feature.title}</Text>
        
        <Text size="sm" c="dimmed" lineClamp={3}>
          {feature.description}
        </Text>
        
        <Group justify="space-between">
          <Button
            variant={feature.hasVoted ? 'filled' : 'light'}
            leftSection={feature.hasVoted ? <IconThumbUpFilled size={16} /> : <IconThumbUp size={16} />}
            onClick={handleVoteToggle}
            disabled={!canVote}
          >
            {feature.voteCount} votes
          </Button>
          
          {isAdmin && (
            <Group gap="xs">
              <Button size="xs" variant="subtle" onClick={() => onEdit?.(feature)}>
                Edit
              </Button>
              <Button size="xs" variant="subtle" color="red" onClick={() => onDelete?.(feature.id)}>
                Delete
              </Button>
            </Group>
          )}
        </Group>
        
        <Text size="xs" c="dimmed">
          Created by {feature.createdBy.name || 'Unknown'}
        </Text>
      </Stack>
    </Card>
  );
}
```

#### Step 5.2: Create Kanban Board Component

Create `app/components/Roadmap/KanbanBoard.tsx`:

```typescript
import { Grid, Stack, Title, Text } from '@mantine/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FeatureCard } from './FeatureCard';
import type { FeatureWithVotes } from '~/lib/roadmap/types';

const COLUMNS = {
  TODO: { title: 'To Do', color: 'gray' },
  PLANNED: { title: 'Planned', color: 'blue' },
  IN_PROGRESS: { title: 'In Progress', color: 'yellow' },
  SHIPPED: { title: 'Shipped', color: 'green' }
};

interface KanbanBoardProps {
  features: FeatureWithVotes[];
  onVote: (featureId: string) => Promise<void>;
  onUnvote: (featureId: string) => Promise<void>;
  onStatusChange?: (featureId: string, newStatus: string) => Promise<void>;
  isAdmin?: boolean;
}

export function KanbanBoard({ 
  features, 
  onVote, 
  onUnvote,
  onStatusChange,
  isAdmin 
}: KanbanBoardProps) {
  const groupedFeatures = Object.entries(COLUMNS).reduce((acc, [status]) => {
    acc[status] = features.filter(f => f.status === status);
    return acc;
  }, {} as Record<string, FeatureWithVotes[]>);
  
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !isAdmin) return;
    
    const { draggableId: featureId, destination } = result;
    const newStatus = destination.droppableId;
    
    await onStatusChange?.(featureId, newStatus);
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Grid>
        {Object.entries(COLUMNS).map(([status, { title, color }]) => (
          <Grid.Col key={status} span={{ base: 12, md: 6, lg: 3 }}>
            <Stack gap="md">
              <Title order={3}>{title}</Title>
              
              <Droppable droppableId={status} isDropDisabled={!isAdmin}>
                {(provided) => (
                  <Stack
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    gap="md"
                    style={{ minHeight: 400 }}
                  >
                    {groupedFeatures[status]?.length === 0 && (
                      <Text c="dimmed" ta="center">No features</Text>
                    )}
                    
                    {groupedFeatures[status]?.map((feature, index) => (
                      <Draggable
                        key={feature.id}
                        draggableId={feature.id}
                        index={index}
                        isDragDisabled={!isAdmin}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <FeatureCard
                              feature={feature}
                              onVote={onVote}
                              onUnvote={onUnvote}
                              isAdmin={isAdmin}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </Stack>
          </Grid.Col>
        ))}
      </Grid>
    </DragDropContext>
  );
}
```

#### Step 5.3: Create Roadmap Page Route

Create `app/routes/roadmap.tsx`:

```typescript
import { useLoaderData } from 'react-router';
import { json, type LoaderFunctionArgs } from 'react-router';
import { Container, Title, Button } from '@mantine/core';
import { KanbanBoard } from '~/components/Roadmap/KanbanBoard';
import { requireAdmin } from '~/lib/roadmap/permissions';
import { FeatureService } from '~/services/roadmap/feature.service';

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  const featureService = new FeatureService();
  const features = await featureService.listFeatures(undefined, admin.id);
  
  return json({ 
    features,
    isAdmin: true,
    user: { id: admin.id, name: admin.name }
  });
}

export default function RoadmapPage() {
  const { features, isAdmin } = useLoaderData<typeof loader>();
  
  const handleVote = async (featureId: string) => {
    await fetch(`/api/roadmap/features/${featureId}/vote`, {
      method: 'POST'
    });
    // Reload or update state
  };
  
  const handleUnvote = async (featureId: string) => {
    await fetch(`/api/roadmap/features/${featureId}/vote`, {
      method: 'DELETE'
    });
    // Reload or update state
  };
  
  const handleStatusChange = async (featureId: string, newStatus: string) => {
    await fetch(`/api/roadmap/features/${featureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    // Reload or update state
  };
  
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">Product Roadmap</Title>
      
      {isAdmin && (
        <Button mb="xl">Add Feature</Button>
      )}
      
      <KanbanBoard
        features={features}
        onVote={handleVote}
        onUnvote={handleUnvote}
        onStatusChange={handleStatusChange}
        isAdmin={isAdmin}
      />
    </Container>
  );
}
```

**Checkpoint**: Basic UI is functional. Test in browser before moving to WebSocket integration.

---

### Phase 6: WebSocket Integration

**Goal**: Add real-time updates using WebSocket.

#### Step 6.1: Create WebSocket Service

Create `app/services/roadmap/websocket.service.ts`:

```typescript
// See contracts/websocket.md for full implementation
// Key points:
// - Handle connection upgrades
// - Validate session on connect
// - Broadcast vote/feature updates
// - Implement heartbeat/ping-pong
```

#### Step 6.2: Create WebSocket Endpoint

Create `app/routes/api/api.roadmap.ws.ts`:

```typescript
// WebSocket endpoint implementation
// Connect to WebSocket server
// Handle client messages (SUBSCRIBE/UNSUBSCRIBE)
```

#### Step 6.3: Integrate WebSocket in Frontend

Update roadmap page to connect to WebSocket and handle events.

**Checkpoint**: Real-time updates working. Test with multiple browser tabs.

---

## Testing Checklist

Before marking the feature complete, verify:

- [ ] All unit tests passing (`bun run test`)
- [ ] API endpoints tested (manual or integration tests)
- [ ] Admin can create/edit/delete features
- [ ] Users can vote/unvote on features
- [ ] Vote counts update in real-time
- [ ] Drag-and-drop works for admin
- [ ] Access control prevents non-admin access
- [ ] Mobile responsive (test at 375px width)
- [ ] Error handling works (network failures, validation errors)
- [ ] Database migrations run successfully
- [ ] No console errors in browser

---

## Deployment

### Pre-deployment:
1. Run all tests: `bun run test`
2. Run database migration: `bun run db:push` (production)
3. Verify environment variables are set

### Post-deployment:
1. Monitor error logs
2. Check WebSocket connection health
3. Verify vote count accuracy
4. Test admin access control

---

## Next Steps (Phase 2 - Tasks)

This quickstart provides the foundation. Use `/speckit.tasks` command to generate:
- Detailed task breakdown
- Estimated time per task
- Dependencies between tasks
- Acceptance criteria per task

---

**Quickstart Guide Complete**: You now have a roadmap for implementation. Proceed to Phase 2 (`/speckit.tasks`) for granular task breakdown.
