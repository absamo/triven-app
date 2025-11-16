# Implementation Quickstart: Product Audit Timeline

**Feature**: 007-product-audit-timeline  
**Date**: 2025-11-14  
**Phase**: Phase 1 - Design

## Overview

This guide provides step-by-step implementation instructions for the Product Audit Timeline feature. Follow these steps in order to build a complete audit logging system with timeline UI.

## Prerequisites

- [ ] Read `research.md` for architectural decisions
- [ ] Read `data-model.md` for database schema understanding
- [ ] Review `contracts/` for API specifications
- [ ] Ensure local dev environment is running (`bun run dev`)
- [ ] PostgreSQL database is accessible

## Implementation Order

This feature should be implemented in the following order to follow TDD principles and ensure each layer can be tested before moving to the next:

```
Database Schema (Prisma)
    ↓
Audit Service Layer (business logic)
    ↓
API Route (HTTP interface)
    ↓
React Hook (data fetching)
    ↓
UI Components (presentation)
```

---

## Step 1: Database Schema (Prisma)

**Location**: `prisma/schema.prisma`

### 1.1 Add AuditEvent Model

Add the following model to your schema:

```prisma
model AuditEvent {
  id              String   @id @default(cuid())
  entityType      String   // 'product', 'order', 'customer', etc.
  entityId        String   // CUID of the entity
  eventType       String   // 'create', 'update', 'delete'
  userId          String   // User who performed the action
  userName        String   // User's name at time of action (denormalized)
  timestamp       DateTime @default(now())
  changedFields   String[] @default([]) // Field names that changed
  beforeSnapshot  Json?    // Full entity state before change
  afterSnapshot   Json?    // Full entity state after change
  createdAt       DateTime @default(now())

  // Soft reference to User (no FK constraint to allow user deletion)
  user User @relation(fields: [userId], references: [id], onDelete: NoAction)

  @@index([entityType, entityId, timestamp(sort: Desc)])
  @@index([userId])
  @@index([timestamp])
  @@map("audit_events")
}
```

### 1.2 Update User Model

Add the reverse relation to the User model:

```prisma
model User {
  id           String        @id @default(cuid())
  // ... existing fields ...
  auditEvents  AuditEvent[]  // Add this relation
}
```

### 1.3 Create Migration

```bash
cd /Users/mas/MAS/triven-app
bunx prisma migrate dev --name add_audit_events
```

**Expected Output**: Migration file created, database updated.

### 1.4 Verify Schema

```bash
bunx prisma db pull
bunx prisma generate
```

**Test Checkpoint**: Run Prisma Studio to verify table exists:
```bash
bunx prisma studio
```

---

## Step 2: Audit Service (Business Logic)

**Location**: `app/services/audit.server.ts`

### 2.1 Create Audit Service

Create `app/services/audit.server.ts` with the following structure:

```typescript
import { db } from '~/db.server';
import type { AuditEvent } from '@prisma/client';

export type EventType = 'create' | 'update' | 'delete';
export type EntityType = 'product'; // Extend with 'order', 'customer', etc.

interface CreateAuditOptions {
  entityType: EntityType;
  entityId: string;
  userId: string;
  userName: string;
  eventType: EventType;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  changedFields?: string[];
}

/**
 * Core audit logging service
 * 
 * Usage:
 *   await auditService.logCreate('product', productId, userId, userName, productData);
 *   await auditService.logUpdate('product', productId, userId, userName, oldData, newData);
 *   await auditService.logDelete('product', productId, userId, userName, productData);
 */
export const auditService = {
  /**
   * Log a creation event
   */
  async logCreate(
    entityType: EntityType,
    entityId: string,
    userId: string,
    userName: string,
    afterSnapshot: Record<string, unknown>
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      entityType,
      entityId,
      userId,
      userName,
      eventType: 'create',
      beforeSnapshot: null,
      afterSnapshot,
      changedFields: [],
    });
  },

  /**
   * Log an update event with field-level change detection
   */
  async logUpdate(
    entityType: EntityType,
    entityId: string,
    userId: string,
    userName: string,
    beforeSnapshot: Record<string, unknown>,
    afterSnapshot: Record<string, unknown>
  ): Promise<AuditEvent | null> {
    const changedFields = this.detectChangedFields(beforeSnapshot, afterSnapshot);
    
    // Skip logging if no fields actually changed
    if (changedFields.length === 0) {
      return null;
    }

    return this.createAuditEvent({
      entityType,
      entityId,
      userId,
      userName,
      eventType: 'update',
      beforeSnapshot,
      afterSnapshot,
      changedFields,
    });
  },

  /**
   * Log a deletion event
   */
  async logDelete(
    entityType: EntityType,
    entityId: string,
    userId: string,
    userName: string,
    beforeSnapshot: Record<string, unknown>
  ): Promise<AuditEvent> {
    return this.createAuditEvent({
      entityType,
      entityId,
      userId,
      userName,
      eventType: 'delete',
      beforeSnapshot,
      afterSnapshot: null,
      changedFields: [],
    });
  },

  /**
   * Internal: Create audit event with error handling
   */
  async createAuditEvent(options: CreateAuditOptions): Promise<AuditEvent> {
    try {
      return await db.auditEvent.create({
        data: {
          entityType: options.entityType,
          entityId: options.entityId,
          userId: options.userId,
          userName: options.userName,
          eventType: options.eventType,
          beforeSnapshot: options.beforeSnapshot ?? null,
          afterSnapshot: options.afterSnapshot ?? null,
          changedFields: options.changedFields ?? [],
        },
      });
    } catch (error) {
      // Log error but don't throw - audit failures shouldn't block operations
      console.error('[Audit Service] Failed to create audit event:', error);
      throw error; // Re-throw for now, will be caught at service layer
    }
  },

  /**
   * Detect which fields changed between two snapshots
   */
  detectChangedFields(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      // Skip system fields
      if (['createdAt', 'updatedAt'].includes(key)) continue;

      const beforeValue = before[key];
      const afterValue = after[key];

      // Deep equality check (handles nested objects, dates, etc.)
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  },
};
```

### 2.2 Write Tests for Audit Service

Create `app/test/services/audit.server.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { auditService } from '~/services/audit.server';
import { db } from '~/db.server';

describe('auditService', () => {
  const mockUserId = 'user123';
  const mockUserName = 'Test User';
  const mockProductId = 'prod123';

  beforeEach(async () => {
    // Clean up audit events before each test
    await db.auditEvent.deleteMany({});
  });

  describe('logCreate', () => {
    it('should create audit event for product creation', async () => {
      const productData = { name: 'Test Product', sku: 'TEST-001' };
      
      const event = await auditService.logCreate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        productData
      );

      expect(event.eventType).toBe('create');
      expect(event.beforeSnapshot).toBeNull();
      expect(event.afterSnapshot).toEqual(productData);
      expect(event.changedFields).toEqual([]);
    });
  });

  describe('logUpdate', () => {
    it('should detect and log field changes', async () => {
      const before = { name: 'Old Name', price: 10, sku: 'TEST-001' };
      const after = { name: 'New Name', price: 15, sku: 'TEST-001' };

      const event = await auditService.logUpdate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        before,
        after
      );

      expect(event?.eventType).toBe('update');
      expect(event?.changedFields).toEqual(expect.arrayContaining(['name', 'price']));
      expect(event?.changedFields).not.toContain('sku');
    });

    it('should return null when no fields changed', async () => {
      const data = { name: 'Same', price: 10 };

      const event = await auditService.logUpdate(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        data,
        data
      );

      expect(event).toBeNull();
    });
  });

  describe('logDelete', () => {
    it('should create audit event for product deletion', async () => {
      const productData = { name: 'Deleted Product', sku: 'DEL-001' };

      const event = await auditService.logDelete(
        'product',
        mockProductId,
        mockUserId,
        mockUserName,
        productData
      );

      expect(event.eventType).toBe('delete');
      expect(event.beforeSnapshot).toEqual(productData);
      expect(event.afterSnapshot).toBeNull();
    });
  });
});
```

**Test Checkpoint**: Run tests to verify service logic:
```bash
bun test app/test/services/audit.server.test.ts
```

---

## Step 3: Query Service (Audit Retrieval)

**Location**: `app/services/audit-query.server.ts`

### 3.1 Create Query Service

```typescript
import { db } from '~/db.server';
import type { AuditEvent } from '@prisma/client';

interface GetAuditHistoryOptions {
  entityType: string;
  entityId: string;
  cursor?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: 'create' | 'update' | 'delete';
}

interface AuditHistoryResult {
  items: AuditEvent[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export const auditQueryService = {
  /**
   * Get paginated audit history for an entity
   */
  async getAuditHistory(options: GetAuditHistoryOptions): Promise<AuditHistoryResult> {
    const limit = options.limit ?? 20;

    // Build where clause
    const where: any = {
      entityType: options.entityType,
      entityId: options.entityId,
    };

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    if (options.userId) {
      where.userId = options.userId;
    }

    if (options.eventType) {
      where.eventType = options.eventType;
    }

    // Get total count (for UI display)
    const total = await db.auditEvent.count({ where });

    // Fetch events with cursor pagination
    const events = await db.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit + 1, // Fetch one extra to check if more exist
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1, // Skip the cursor itself
      }),
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
      total,
    };
  },
};
```

### 3.2 Write Tests for Query Service

Create `app/test/services/audit-query.server.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { auditQueryService } from '~/services/audit-query.server';
import { db } from '~/db.server';

describe('auditQueryService', () => {
  const mockProductId = 'prod123';

  beforeEach(async () => {
    await db.auditEvent.deleteMany({});
    
    // Create test audit events
    for (let i = 0; i < 25; i++) {
      await db.auditEvent.create({
        data: {
          entityType: 'product',
          entityId: mockProductId,
          eventType: 'update',
          userId: `user${i}`,
          userName: `User ${i}`,
          changedFields: ['name'],
          beforeSnapshot: { name: `Old ${i}` },
          afterSnapshot: { name: `New ${i}` },
        },
      });
    }
  });

  describe('getAuditHistory', () => {
    it('should return paginated results', async () => {
      const result = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeTruthy();
      expect(result.total).toBe(25);
    });

    it('should support cursor pagination', async () => {
      const firstPage = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 10,
      });

      const secondPage = await auditQueryService.getAuditHistory({
        entityType: 'product',
        entityId: mockProductId,
        limit: 10,
        cursor: firstPage.nextCursor!,
      });

      expect(secondPage.items).toHaveLength(10);
      expect(firstPage.items[0].id).not.toBe(secondPage.items[0].id);
    });
  });
});
```

**Test Checkpoint**: Run tests:
```bash
bun test app/test/services/audit-query.server.test.ts
```

---

## Step 4: API Route

**Location**: `app/routes/api/audit.products.$productId.ts`

### 4.1 Create API Route

```typescript
import type { LoaderFunctionArgs } from 'react-router';
import { json } from 'react-router';
import { getBetterAuthUser } from '~/lib/auth.server';
import { auditQueryService } from '~/services/audit-query.server';
import { GetAuditHistoryQuerySchema, GetAuditHistoryParamsSchema } from '~/types/audit';

export async function loader({ params, request }: LoaderFunctionArgs) {
  // 1. Authentication
  const user = await getBetterAuthUser(request);
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse and validate parameters
    const parsedParams = GetAuditHistoryParamsSchema.parse(params);
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams);
    const parsedQuery = GetAuditHistoryQuerySchema.parse(query);

    // 3. TODO: Check authorization - user has access to this product
    // For now, assume all authenticated users can view audit history

    // 4. Fetch audit history
    const result = await auditQueryService.getAuditHistory({
      entityType: 'product',
      entityId: parsedParams.productId,
      cursor: parsedQuery.cursor,
      limit: parsedQuery.limit,
      startDate: parsedQuery.startDate ? new Date(parsedQuery.startDate) : undefined,
      endDate: parsedQuery.endDate ? new Date(parsedQuery.endDate) : undefined,
      userId: parsedQuery.userId,
      eventType: parsedQuery.eventType,
    });

    return json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }
    return json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

### 4.2 Write Integration Tests

Create `app/test/routes/api.audit.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequest } from '~/test/utils';
import { loader } from '~/routes/api/audit.products.$productId';
import { db } from '~/db.server';

describe('GET /api/audit/products/:productId', () => {
  beforeEach(async () => {
    await db.auditEvent.deleteMany({});
  });

  it('should return 401 without authentication', async () => {
    const request = createRequest('/api/audit/products/prod123');
    const response = await loader({ params: { productId: 'prod123' }, request });
    
    expect(response.status).toBe(401);
  });

  it('should return audit history for authenticated user', async () => {
    // TODO: Mock authentication
    // Create test audit events
    // Call loader
    // Assert response structure
  });
});
```

**Test Checkpoint**: Test with curl or Postman:
```bash
curl -X GET "http://localhost:3000/api/audit/products/[PRODUCT_ID]" \
  -H "Authorization: Bearer [TOKEN]"
```

---

## Step 5: React Hook (Data Fetching)

**Location**: `app/hooks/useAuditHistory.ts`

### 5.1 Create Hook

```typescript
import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { AuditHistoryResponse } from '~/types/audit';

interface UseAuditHistoryOptions {
  productId: string;
  enabled?: boolean;
}

export function useAuditHistory({ productId, enabled = true }: UseAuditHistoryOptions) {
  const fetcher = useFetcher<AuditHistoryResponse>();
  const [events, setEvents] = useState<AuditHistoryResponse['items']>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Initial load
  useEffect(() => {
    if (enabled && productId) {
      fetcher.load(`/api/audit/products/${productId}`);
    }
  }, [productId, enabled]);

  // Update state when data arrives
  useEffect(() => {
    if (fetcher.data) {
      setEvents(fetcher.data.items);
      setNextCursor(fetcher.data.nextCursor);
      setHasMore(fetcher.data.hasMore);
    }
  }, [fetcher.data]);

  // Load more events (for infinite scroll)
  const loadMore = () => {
    if (hasMore && nextCursor && fetcher.state === 'idle') {
      fetcher.load(`/api/audit/products/${productId}?cursor=${nextCursor}`);
    }
  };

  return {
    events,
    isLoading: fetcher.state === 'loading',
    error: fetcher.data?.error,
    hasMore,
    loadMore,
    total: fetcher.data?.total ?? 0,
  };
}
```

---

## Step 6: UI Components

### 6.1 Product Audit Drawer

**Location**: `app/components/ProductAuditDrawer/ProductAuditDrawer.tsx`

```typescript
import { Drawer, Timeline, Button, Text, Badge, Stack } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useAuditHistory } from '~/hooks/useAuditHistory';
import { AuditEvent } from './AuditEvent';

interface ProductAuditDrawerProps {
  productId: string;
  opened: boolean;
  onClose: () => void;
}

export function ProductAuditDrawer({ productId, opened, onClose }: ProductAuditDrawerProps) {
  const { events, isLoading, hasMore, loadMore, total } = useAuditHistory({
    productId,
    enabled: opened,
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'create': return <IconPlus size={16} />;
      case 'update': return <IconEdit size={16} />;
      case 'delete': return <IconTrash size={16} />;
      default: return null;
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title={`Audit History (${total} events)`}
    >
      <Stack>
        {isLoading && <Text>Loading...</Text>}
        
        {events.length === 0 && !isLoading && (
          <Text c="dimmed">No audit history available</Text>
        )}

        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {events.map((event) => (
            <Timeline.Item
              key={event.id}
              bullet={getEventIcon(event.eventType)}
              title={<AuditEvent event={event} />}
            >
              {/* Event details will expand here */}
            </Timeline.Item>
          ))}
        </Timeline>

        {hasMore && (
          <Button onClick={loadMore} variant="light">
            Load More
          </Button>
        )}
      </Stack>
    </Drawer>
  );
}
```

### 6.2 Test with Chrome DevTools MCP (Post-Implementation)

After implementing UI:

1. Navigate to products page: `http://localhost:3000/products`
2. Take snapshot to verify audit button exists
3. Click audit button for a product
4. Verify drawer opens with timeline
5. Test scroll behavior for lazy loading
6. Test drawer close functionality

---

## Step 7: Integration with Product Service

**Location**: `app/services/product.server.ts`

### 7.1 Add Audit Logging to Product Operations

```typescript
import { auditService } from './audit.server';

export const productService = {
  async create(data: ProductCreate, userId: string, userName: string) {
    const product = await db.product.create({ data });
    
    // Log creation
    try {
      await auditService.logCreate('product', product.id, userId, userName, product);
    } catch (error) {
      console.error('Failed to log product creation:', error);
      // Continue - don't fail operation due to audit error
    }
    
    return product;
  },

  async update(id: string, data: ProductUpdate, userId: string, userName: string) {
    const oldProduct = await db.product.findUnique({ where: { id } });
    if (!oldProduct) throw new Error('Product not found');
    
    const newProduct = await db.product.update({ where: { id }, data });
    
    // Log update
    try {
      await auditService.logUpdate('product', id, userId, userName, oldProduct, newProduct);
    } catch (error) {
      console.error('Failed to log product update:', error);
    }
    
    return newProduct;
  },

  async delete(id: string, userId: string, userName: string) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');
    
    // Soft delete
    await db.product.update({ 
      where: { id }, 
      data: { deletedAt: new Date() } 
    });
    
    // Log deletion
    try {
      await auditService.logDelete('product', id, userId, userName, product);
    } catch (error) {
      console.error('Failed to log product deletion:', error);
    }
  },
};
```

---

## Step 8: i18n Translations

**Location**: `app/locales/en.json`

Add field labels:

```json
{
  "audit": {
    "title": "Audit History",
    "noEvents": "No audit history available",
    "loadMore": "Load More",
    "events": {
      "create": "{{userName}} created {{entityType}}",
      "update": "{{userName}} updated {{count}} field(s)",
      "delete": "{{userName}} deleted {{entityType}}"
    },
    "fields": {
      "product": {
        "name": "Product Name",
        "sku": "SKU",
        "description": "Description",
        "costPrice": "Cost Price",
        "sellingPrice": "Selling Price",
        "quantity": "Stock Quantity",
        "categoryId": "Category",
        "supplierId": "Supplier",
        "status": "Status",
        "imageUrl": "Product Image",
        "minStockLevel": "Minimum Stock Level",
        "maxStockLevel": "Maximum Stock Level"
      }
    }
  }
}
```

---

## Verification Checklist

Before marking this feature complete, verify:

- [ ] Database migration created and applied
- [ ] All unit tests pass (`bun test`)
- [ ] API endpoint returns correct data structure
- [ ] Authentication is enforced on audit endpoint
- [ ] Cursor pagination works correctly
- [ ] Drawer opens and displays timeline
- [ ] Event icons match event types
- [ ] Field labels use i18n translations
- [ ] Lazy loading triggers on scroll
- [ ] Audit logging doesn't block product operations
- [ ] Chrome DevTools MCP tests pass

---

## Performance Considerations

### Query Optimization

- Composite index on `(entityType, entityId, timestamp)` ensures fast timeline queries
- Cursor pagination maintains O(1) performance regardless of page depth
- Limit queries to 20-100 events per page

### Memory Management

- Don't load all events at once - use pagination
- Consider implementing virtual scrolling for very long histories (1000+ events)

### Error Handling

- Audit failures MUST NOT block product operations
- Wrap all audit service calls in try-catch
- Log errors for observability but continue execution

---

## Next Steps

After completing this implementation:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Run `/speckit.analyze` to verify cross-artifact consistency
3. Begin implementation following TDD workflow
4. Use Context7 MCP before implementing to fetch latest docs:
   - Query Prisma docs for schema patterns
   - Query Mantine docs for Drawer/Timeline components
   - Query React Router docs for loader patterns
5. Use Chrome DevTools MCP after UI implementation for comprehensive testing

---

## Support

If you encounter issues during implementation:

1. Review `research.md` for architectural decisions
2. Check `data-model.md` for schema details
3. Refer to `contracts/` for API specifications
4. Review constitutional principles in `.specify/memory/constitution.md`
5. Consult `.github/copilot-instructions.md` for project-specific patterns
