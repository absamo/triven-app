# Data Model: Product Audit Timeline

**Feature**: 007-product-audit-timeline  
**Date**: 2025-11-14  
**Phase**: Phase 1 - Design

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│   User      │────────<│  AuditEvent  │
│             │ creates │              │
│  id         │         │  id          │
│  email      │         │  entityType  │
│  name       │         │  entityId    │
└─────────────┘         │  eventType   │
                        │  userId      │
                        │  userName    │
┌─────────────┐         │  timestamp   │
│   Product   │         │  changedFields│
│             │         │  beforeSnapshot│
│  id         │         │  afterSnapshot│
│  name       │<────────│              │
│  sku        │ tracked └──────────────┘
│  ...        │
└─────────────┘
```

**Relationship Notes**:
- `AuditEvent.userId` references `User.id` (soft reference, no FK constraint to allow for user deletion)
- `AuditEvent.entityId` stores the ID of the tracked entity (e.g., `Product.id`) as a string
- No direct FK to `Product` - audit survives product deletion (Constitutional requirement)
- One-to-many: User → AuditEvent (one user creates many audit events)
- Polymorphic pattern: `entityType` + `entityId` allows tracking any entity type

## Core Entities

### AuditEvent

**Purpose**: Represents a single change action on any tracked entity (products, orders, etc.)

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique identifier for the audit event |
| `entityType` | String | NOT NULL, indexed | Type of entity being tracked (e.g., 'product', 'order') |
| `entityId` | String | NOT NULL, indexed | ID of the entity being tracked |
| `eventType` | String | NOT NULL, enum | Type of event: 'create', 'update', 'delete' |
| `userId` | String | NOT NULL, indexed | User who performed the action |
| `userName` | String | NOT NULL | User's name at time of action (denormalized for historical accuracy) |
| `timestamp` | DateTime | NOT NULL, default: now() | When the action occurred |
| `changedFields` | String[] | NOT NULL, default: [] | List of field names that changed (empty for create/delete) |
| `beforeSnapshot` | Json | Nullable | Full entity state before change (null for create) |
| `afterSnapshot` | Json | Nullable | Full entity state after change (null for delete) |
| `createdAt` | DateTime | NOT NULL, default: now() | When the audit record was created |

**Indexes**:
- Primary: `id`
- Composite: `(entityType, entityId, timestamp DESC)` - For timeline queries
- Single: `userId` - For filtering by user
- Single: `timestamp` - For date range filtering

**Validation Rules**:
- `entityType` must be one of: 'product' (future: 'order', 'customer', 'supplier')
- `eventType` must be one of: 'create', 'update', 'delete'
- For 'create' events: `beforeSnapshot` must be null, `afterSnapshot` required, `changedFields` empty
- For 'update' events: both snapshots required, `changedFields` must not be empty
- For 'delete' events: `beforeSnapshot` required, `afterSnapshot` must be null, `changedFields` empty
- `userId` must reference existing User (checked at service layer, not DB FK)
- `entityId` must be a valid CUID format

**Immutability**: Once created, audit events CANNOT be modified or deleted (enforced at service layer, no update/delete methods exposed)

---

### Product (Existing Entity - Tracked)

**Changes Required**: None. Product entity remains unchanged. Audit system tracks it externally.

**Fields Tracked** (from spec):
- `name` → "Product Name"
- `sku` → "SKU"
- `description` → "Description"
- `costPrice` → "Cost Price"
- `sellingPrice` → "Selling Price"
- `quantity` → "Stock Quantity"
- `categoryId` → "Category" (will display category name, not ID)
- `supplierId` → "Supplier" (will display supplier name, not ID)
- `status` → "Status"
- `imageUrl` → "Product Image"
- `minStockLevel` → "Minimum Stock Level"
- `maxStockLevel` → "Maximum Stock Level"

**Note**: Relationship fields (category, supplier) will be resolved to names in audit display logic.

---

### User (Existing Entity - Audit Creator)

**Changes Required**: None. User entity remains unchanged.

**Relationship**: One user creates many audit events. User deletion does NOT cascade to audit events (preserved for historical record).

---

## Prisma Schema

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

// Add relation to existing User model
model User {
  id           String        @id @default(cuid())
  // ... existing fields ...
  auditEvents  AuditEvent[]  // Reverse relation
}
```

**Migration Notes**:
- Add `auditEvents` relation to User model
- Create `audit_events` table with indexes
- No data migration needed (fresh table)

---

## State Transitions

### Product Lifecycle with Audit Tracking

```
┌─────────────────┐
│  Product        │
│  does not exist │
└────────┬────────┘
         │ Create
         ▼
  ┌──────────────────────┐
  │ AuditEvent created:  │
  │ - eventType: create  │
  │ - beforeSnapshot: null│
  │ - afterSnapshot: {...}│
  └──────────┬───────────┘
             │
         ┌───▼────┐
         │Product │
         │exists  │
         └───┬────┘
             │ Update
             ▼
  ┌──────────────────────┐
  │ AuditEvent created:  │
  │ - eventType: update  │
  │ - beforeSnapshot: {..}│
  │ - afterSnapshot: {...}│
  │ - changedFields: [..] │
  └──────────┬───────────┘
             │
         ┌───▼────┐
         │Product │
         │exists  │
         └───┬────┘
             │ Soft Delete
             ▼
  ┌──────────────────────┐
  │ AuditEvent created:  │
  │ - eventType: delete  │
  │ - beforeSnapshot: {..}│
  │ - afterSnapshot: null │
  └──────────┬───────────┘
             │
         ┌───▼────────────┐
         │Product marked  │
         │as deleted      │
         │(deletedAt set) │
         └────────────────┘

Note: AuditEvent records persist even after product deletion
```

---

## Data Examples

### Example 1: Product Creation

```json
{
  "id": "clx123abc",
  "entityType": "product",
  "entityId": "clx456def",
  "eventType": "create",
  "userId": "user123",
  "userName": "John Doe",
  "timestamp": "2025-11-14T10:30:00Z",
  "changedFields": [],
  "beforeSnapshot": null,
  "afterSnapshot": {
    "id": "clx456def",
    "name": "Wireless Mouse",
    "sku": "WM-001",
    "costPrice": 15.99,
    "sellingPrice": 29.99,
    "quantity": 100,
    "categoryId": "cat123",
    "status": "active"
  }
}
```

**Display**: "John Doe created Product 'Wireless Mouse'"

---

### Example 2: Product Update (Multiple Fields)

```json
{
  "id": "clx789ghi",
  "entityType": "product",
  "entityId": "clx456def",
  "eventType": "update",
  "userId": "user456",
  "userName": "Jane Smith",
  "timestamp": "2025-11-14T14:45:00Z",
  "changedFields": ["sellingPrice", "quantity"],
  "beforeSnapshot": {
    "id": "clx456def",
    "name": "Wireless Mouse",
    "sku": "WM-001",
    "costPrice": 15.99,
    "sellingPrice": 29.99,
    "quantity": 100,
    "categoryId": "cat123",
    "status": "active"
  },
  "afterSnapshot": {
    "id": "clx456def",
    "name": "Wireless Mouse",
    "sku": "WM-001",
    "costPrice": 15.99,
    "sellingPrice": 24.99,
    "quantity": 85,
    "categoryId": "cat123",
    "status": "active"
  }
}
```

**Display Summary**: "Jane Smith updated 2 fields: Selling Price, Stock Quantity"

**Expanded View**:
- Selling Price: ~~$29.99~~ → **$24.99** (decreased by $5.00)
- Stock Quantity: ~~100~~ → **85** (decreased by 15)

---

### Example 3: Product Deletion

```json
{
  "id": "clx999jkl",
  "entityType": "product",
  "entityId": "clx456def",
  "eventType": "delete",
  "userId": "user123",
  "userName": "John Doe",
  "timestamp": "2025-11-15T09:15:00Z",
  "changedFields": [],
  "beforeSnapshot": {
    "id": "clx456def",
    "name": "Wireless Mouse",
    "sku": "WM-001",
    "costPrice": 15.99,
    "sellingPrice": 24.99,
    "quantity": 85,
    "categoryId": "cat123",
    "status": "active"
  },
  "afterSnapshot": null
}
```

**Display**: "John Doe deleted Product 'Wireless Mouse' (SKU: WM-001)"

---

## Storage Estimates

**Per Event Storage**:
- Metadata (id, type, user, timestamp, fields): ~200 bytes
- JSON snapshots (average product): ~400-600 bytes
- **Total per event**: ~600-800 bytes
- **Spec requirement**: <1KB per event ✅

**Scale Projection** (1000 products, 10 changes each over 1 year):
- Total events: 10,000
- Storage: ~8 MB
- Query performance: <50ms with proper indexes

**Index Overhead**: ~20-30% of data size (~2-3 MB)

---

## Query Patterns

### 1. Get Audit Timeline for Product

```typescript
const events = await db.auditEvent.findMany({
  where: {
    entityType: 'product',
    entityId: productId,
  },
  orderBy: { timestamp: 'desc' },
  take: 20,
  include: {
    user: {
      select: { id: true, name: true, email: true },
    },
  },
});
```

**Performance**: ~10-20ms with composite index on (entityType, entityId, timestamp)

---

### 2. Cursor-Based Pagination

```typescript
const events = await db.auditEvent.findMany({
  where: {
    entityType: 'product',
    entityId: productId,
  },
  orderBy: { timestamp: 'desc' },
  take: 21, // Load 20 + 1 to check hasMore
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
});

const hasMore = events.length > 20;
const items = hasMore ? events.slice(0, 20) : events;
const nextCursor = hasMore ? items[items.length - 1].id : null;
```

**Performance**: ~10-20ms per page (cursor-based is O(1), not affected by page depth)

---

### 3. Filter by Date Range

```typescript
const events = await db.auditEvent.findMany({
  where: {
    entityType: 'product',
    entityId: productId,
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
  },
  orderBy: { timestamp: 'desc' },
});
```

**Performance**: ~15-30ms with timestamp index

---

### 4. Filter by User

```typescript
const events = await db.auditEvent.findMany({
  where: {
    entityType: 'product',
    entityId: productId,
    userId: userId,
  },
  orderBy: { timestamp: 'desc' },
});
```

**Performance**: ~15-25ms with userId index

---

## Data Integrity Rules

### Write Rules (Enforced at Service Layer)

1. **Immutability**: No UPDATE or DELETE operations on AuditEvent after creation
2. **Completeness**: All required fields must be present before writing
3. **Snapshot Validation**: 
   - Create: `beforeSnapshot = null`, `afterSnapshot` required
   - Update: Both snapshots required, must detect at least one field change
   - Delete: `beforeSnapshot` required, `afterSnapshot = null`
4. **User Context**: `userId` and `userName` must be captured from authenticated session
5. **Timestamp**: Server timestamp, not client-provided (prevents tampering)

### Read Rules (Enforced at API Layer)

1. **Authentication**: Must have valid session to read audit history
2. **Authorization**: Can only read audit for entities you have access to (enforced by entity access rules)
3. **No modifications**: API only exposes GET endpoints, no PUT/POST/DELETE

### Consistency Rules

1. **Soft Deletes**: Products are soft-deleted (marked with `deletedAt`), never hard-deleted
2. **Orphaned Audits**: Audit events can reference deleted products (intentional for historical record)
3. **User References**: Audit events can reference deleted users (userName preserved)

---

## Future Extensibility

### Adding New Entity Types

To track a new entity (e.g., Order):

1. **No schema changes needed** - `entityType` is a string field
2. Add translation keys to `app/locales/en.json`:
   ```json
   {
     "audit": {
       "fields": {
         "order": {
           "orderNumber": "Order Number",
           "totalAmount": "Total Amount",
           // ... other fields
         }
       }
     }
   }
   ```
3. Update service to call audit logging:
   ```typescript
   await auditService.logUpdate('order', orderId, userId, oldOrder, newOrder);
   ```
4. Optionally create entity-specific UI components (or reuse generic ones)

### Performance Optimization (Future)

- **Partitioning**: Partition `audit_events` table by `entityType` if volume grows significantly
- **Archiving**: Move events older than 2 years to cold storage
- **Compression**: Compress JSON snapshots for long-term storage
- **Read Replicas**: Query audit data from read replicas to reduce load on primary DB

---

## Summary

**Schema Additions**:
- 1 new table: `AuditEvent`
- 1 new relation: `User.auditEvents`
- 3 new indexes for query performance

**Design Principles**:
- **Generic**: Works for any entity type via polymorphic pattern
- **Immutable**: Audit events are write-once, never modified
- **Decoupled**: No foreign keys to tracked entities (survives deletion)
- **Efficient**: JSON storage keeps events <1KB, cursor pagination scales to millions
- **Queryable**: Indexed for common access patterns (timeline, user, date range)

**Constitutional Alignment**:
- ✅ Service-Oriented: Audit is a standalone service
- ✅ Data Integrity: Immutable audit trail with complete context
- ✅ Performance: Indexed queries, cursor pagination, <500ms API responses
