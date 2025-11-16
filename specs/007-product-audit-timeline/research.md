# Research: Product Audit Timeline

**Date**: 2025-11-14  
**Feature**: 007-product-audit-timeline  
**Phase**: Phase 0 - Research & Resolution

## Research Questions

### 1. Audit Data Capture Strategy

**Question**: What is the best approach to capture product changes at the ORM level with Prisma?

**Options Evaluated**:

1. **Prisma Middleware** (deprecated in Prisma 5+)
   - Interceptor pattern for all queries
   - Global or model-specific hooks
   - **Issue**: Middleware API is deprecated and will be removed

2. **Service Layer Pattern**
   - Wrap all write operations in service functions
   - Explicit audit logging in each service method
   - **Pros**: Full control, explicit, testable
   - **Cons**: Requires discipline, can be forgotten

3. **Prisma Extensions** (Prisma 4.16+)
   - Modern replacement for middleware
   - Can intercept and modify queries
   - Type-safe and composable
   - **Pros**: Officially supported, automatic capture, type-safe
   - **Cons**: Newer API, less examples available

**Decision**: **Use Service Layer Pattern with Audit Service**

**Rationale**:
- **Explicit and predictable**: Every change goes through a service function that calls audit service
- **Testable**: Easy to mock audit service in tests
- **Constitutional alignment**: Follows Service-Oriented Architecture (Principle I)
- **No magic**: Developers clearly see audit calls in code
- **Battle-tested**: Matches existing patterns in the codebase (e.g., workflow services)
- **Flexible**: Can customize what gets audited per operation

**Implementation Pattern**:
```typescript
// app/services/product.server.ts
export async function updateProduct(productId: string, updates: ProductUpdate, userId: string) {
  const oldProduct = await db.product.findUnique({ where: { id: productId } });
  const newProduct = await db.product.update({ 
    where: { id: productId }, 
    data: updates 
  });
  
  await auditService.logUpdate({
    entityType: 'product',
    entityId: productId,
    userId,
    oldData: oldProduct,
    newData: newProduct,
  });
  
  return newProduct;
}
```

**Alternatives Considered**:
- Prisma Extensions: Too new, less community support, adds "magic" layer
- Manual logging at route level: Too error-prone, violates service encapsulation
- Database triggers: Platform-specific, harder to test, violates TypeScript type safety

---

### 2. Field Change Detection and Storage

**Question**: How should we detect which fields changed and store the before/after values efficiently?

**Options Evaluated**:

1. **Deep object comparison with field-by-field storage**
   - Compare old and new objects, store each changed field separately
   - Normalized data model: `FieldChange` table with `fieldName`, `oldValue`, `newValue`
   - **Pros**: Queryable, filterable by field name, exact change tracking
   - **Cons**: More complex schema, multiple records per change event

2. **JSON snapshot approach**
   - Store full entity state as JSON before and after
   - Calculate diff on read (client-side or server-side)
   - **Pros**: Simple schema, preserves complete context
   - **Cons**: Larger storage footprint, diff calculation overhead

3. **Hybrid: JSON snapshots + field summary**
   - Store full JSON snapshots in `AuditEvent.beforeSnapshot` and `afterSnapshot`
   - Store array of changed field names in `AuditEvent.changedFields`
   - Calculate detailed diffs on-demand from snapshots
   - **Pros**: Balance of queryability and simplicity
   - **Cons**: Duplicate storage (snapshots + field names)

**Decision**: **Hybrid Approach - JSON Snapshots + Field Summary**

**Rationale**:
- **Storage efficiency**: Full snapshots <1KB per spec requirement (SC-007)
- **Query flexibility**: Can filter by changed fields using array contains
- **Read optimization**: Pre-computed field list avoids diff calculation in list view
- **Detail on demand**: Full snapshots enable detailed comparison when event expanded
- **Future-proof**: Captures all context even if schema changes later
- **Simplicity**: Fewer tables, less complex queries

**Data Model**:
```typescript
model AuditEvent {
  id            String   @id @default(cuid())
  entityType    String   // 'product', 'order', etc.
  entityId      String   // product.id
  eventType     String   // 'create', 'update', 'delete'
  userId        String
  timestamp     DateTime @default(now())
  changedFields String[] // ['name', 'price', 'quantity']
  beforeSnapshot Json?   // Full entity state before change
  afterSnapshot  Json?   // Full entity state after change
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([entityType, entityId, timestamp])
  @@index([userId])
}
```

**Alternatives Considered**:
- Separate FieldChange table: Over-engineering for initial implementation
- Diff-only storage: Loses context, harder to understand changes
- Event sourcing: Too complex for audit logging use case

---

### 3. Timeline UI/UX Patterns

**Question**: What is the best UX pattern for displaying audit events with field changes?

**Research**: Examined common audit trail UIs from GitHub, Linear, Notion, and Stripe Dashboard.

**Best Practices Identified**:

1. **Timeline Layout**
   - Vertical timeline with events in reverse chronological order
   - Visual timeline connector line between events
   - Icons differentiate event types (plus for create, pencil for edit, trash for delete)
   - Timestamp grouping by day/week for large histories

2. **Event Cards**
   - Compact summary view showing: user avatar, user name, action summary, relative timestamp
   - Expandable details for field changes (accordion or modal)
   - Color coding: neutral for create, blue for edit, red for delete

3. **Field Change Display**
   - Side-by-side or diff-style comparison
   - Highlight changed values (strikethrough old, bold new)
   - Group related fields (e.g., all pricing fields together)
   - Show field labels in user-friendly format (not database column names)

**Decision**: **Mantine Timeline Component with Expandable Event Cards**

**Rationale**:
- **Mantine Timeline**: Built-in component with timeline line and bullet points
- **Progressive disclosure**: Summary view → expand for details (matches spec requirement FR-009)
- **Scan-friendly**: Users can quickly skim timeline without cognitive overload
- **Familiar pattern**: Matches UX expectations from other SaaS tools
- **Accessible**: Mantine components include ARIA attributes

**Component Structure**:
```tsx
<Drawer position="right" opened={opened} onClose={onClose}>
  <Timeline>
    {events.map(event => (
      <Timeline.Item 
        key={event.id}
        bullet={<EventIcon type={event.eventType} />}
        title={<EventSummary event={event} />}
      >
        <Collapse in={expandedEvents.includes(event.id)}>
          <FieldChangeList changes={event.changedFields} 
                          before={event.beforeSnapshot} 
                          after={event.afterSnapshot} />
        </Collapse>
      </Timeline.Item>
    ))}
  </Timeline>
  
  {/* Lazy load more on scroll */}
  <InfiniteScroll onLoadMore={loadMoreEvents} />
</Drawer>
```

**Alternatives Considered**:
- List view without timeline: Less visual hierarchy
- Modal for details: Loses timeline context when drilling down
- Inline diff tool: Too complex for simple field changes

---

### 4. Performance and Pagination Strategy

**Question**: How to efficiently load and display 1000+ audit events without UI freezing?

**Research**: Analyzed pagination strategies for large datasets and React performance patterns.

**Options Evaluated**:

1. **Offset-based pagination** (traditional page numbers)
   - `skip` and `take` in Prisma queries
   - **Pros**: Simple to implement, familiar UX
   - **Cons**: Performance degrades with deep pagination, inconsistent with adds/deletes

2. **Cursor-based pagination** (keyset pagination)
   - Use `cursor` (last event ID) and `take` in Prisma
   - **Pros**: Consistent performance, handles real-time updates well
   - **Cons**: Can't jump to arbitrary pages

3. **Infinite scroll with windowing** (virtual scrolling)
   - Load chunks as user scrolls, unload off-screen events
   - Use `react-window` or `@tanstack/react-virtual`
   - **Pros**: Smooth UX, efficient memory usage
   - **Cons**: More complex, may have edge cases with variable heights

**Decision**: **Cursor-based Pagination with Infinite Scroll**

**Rationale**:
- **Performance**: Cursor queries use index efficiently, O(1) vs O(n) for offset
- **Spec alignment**: Matches FR-013 requirement (load 20, lazy load more)
- **Memory efficient**: Load only what's visible + small buffer
- **Simple UX**: No page numbers, just seamless scrolling
- **Future-proof**: Supports potential real-time updates in future iterations

**Implementation**:
```typescript
// API endpoint: GET /api/audit/products/:productId?cursor=<eventId>&limit=20
export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');
  const limit = 20;
  
  const events = await db.auditEvent.findMany({
    where: { 
      entityType: 'product', 
      entityId: params.productId 
    },
    orderBy: { timestamp: 'desc' },
    take: limit + 1, // Fetch one extra to check if more exist
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  
  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? items[items.length - 1].id : null;
  
  return { items, nextCursor, hasMore };
}
```

**Alternatives Considered**:
- Offset pagination: Poor performance at scale
- Virtual scrolling: Over-engineering for initial implementation
- Load all events: Violates performance constraints (SC-005)

---

### 5. Field Name Mapping (Database → User-Friendly)

**Question**: How to display technical field names (e.g., `costPrice`) as user-friendly labels (e.g., "Cost Price")?

**Options Evaluated**:

1. **Hard-coded mapping object**
   - Simple object: `{ costPrice: 'Cost Price', sku: 'SKU' }`
   - **Pros**: Simple, fast lookup
   - **Cons**: Duplication, not maintainable for large schemas

2. **Zod schema metadata**
   - Extend Zod schemas with `.describe()` for human labels
   - **Pros**: Single source of truth with validation
   - **Cons**: Requires schema refactoring

3. **i18n translation keys**
   - Use react-i18next with translation keys: `fields.product.costPrice`
   - **Pros**: Internationalization-ready, centralized labels
   - **Cons**: Adds indirection, requires translation files

**Decision**: **i18n Translation Keys with react-i18next**

**Rationale**:
- **Already in use**: Project uses react-i18next (per copilot-instructions)
- **Future-proof**: Supports internationalization from day one
- **Centralized**: All labels in `app/locales/en.json`
- **Consistent**: Matches existing pattern for UI labels
- **Extensible**: Easy to add new fields or languages

**Implementation**:
```typescript
// app/locales/en.json
{
  "audit": {
    "fields": {
      "product": {
        "name": "Product Name",
        "sku": "SKU",
        "costPrice": "Cost Price",
        "sellingPrice": "Selling Price",
        "quantity": "Stock Quantity",
        "categoryId": "Category"
      }
    }
  }
}

// Component usage
const { t } = useTranslation();
const fieldLabel = t(`audit.fields.product.${fieldName}`);
```

**Alternatives Considered**:
- Hard-coded map: Not maintainable
- Schema-driven: Requires major refactoring

---

### 6. Audit Capture Points (When to Log)

**Question**: Where in the application flow should audit logging be triggered?

**Options Evaluated**:

1. **ORM level** (middleware/extensions)
   - Automatic capture on all database writes
   - **Pros**: No chance to forget
   - **Cons**: Captures unintended changes, hard to filter

2. **Service layer**
   - Explicit calls in service functions
   - **Pros**: Controlled, contextual
   - **Cons**: Can be forgotten

3. **API route handlers**
   - Log in route before/after DB operations
   - **Pros**: Request context available
   - **Cons**: Tight coupling, violates service encapsulation

**Decision**: **Service Layer with Explicit Audit Calls**

**Rationale**:
- **Matches decision #1**: Consistent with service pattern choice
- **Clear ownership**: Service owns business logic AND audit
- **Testability**: Easy to verify audit calls in service tests
- **Flexibility**: Can omit audit for certain operations (e.g., background jobs)

**Convention**: All write operations (create, update, delete) in product service call audit service:
```typescript
// app/services/product.server.ts
export const productService = {
  async create(data, userId) {
    const product = await db.product.create({ data });
    await auditService.logCreate('product', product.id, userId, { summary: `Product ${product.name} created` });
    return product;
  },
  
  async update(id, updates, userId) {
    const old = await db.product.findUnique({ where: { id } });
    const product = await db.product.update({ where: { id }, data: updates });
    await auditService.logUpdate('product', id, userId, old, product);
    return product;
  },
  
  async delete(id, userId) {
    const product = await db.product.findUnique({ where: { id } });
    await db.product.update({ where: { id }, data: { deletedAt: new Date() } }); // Soft delete
    await auditService.logDelete('product', id, userId, product);
  }
};
```

---

## Technology Decisions

### Frontend Stack
- **Mantine UI Drawer**: Right-side overlay (matches spec requirement)
- **Mantine Timeline**: Visual timeline component with bullets and connector line
- **React Router loader**: Data fetching pattern for audit events
- **react-i18next**: Field name translations
- **No additional dependencies**: Use existing project libraries

### Backend Stack
- **Prisma**: Audit tables in schema, cursor-based queries
- **Zod**: Request validation for audit API endpoints
- **Better Auth**: User context for capturing who made changes
- **No background jobs**: Synchronous audit logging (acceptable latency)

### Testing Stack
- **Vitest**: Unit tests for audit service logic
- **Testing Library**: Component tests for drawer and timeline
- **Prisma test utilities**: In-memory SQLite for integration tests
- **Chrome DevTools MCP**: Post-implementation UI testing (per Constitution Principle VIII)

---

## Open Questions Resolved

### Q: How to handle deleted users?
**A**: Store `userId` reference but don't enforce foreign key constraint or use `onDelete: SetNull`. Display "[Deleted User]" in UI if user no longer exists. Alternatively, denormalize and store user name at time of change in `AuditEvent.userName` field.

**Decision**: Add `userName` field to `AuditEvent` to preserve historical context. This aligns with audit immutability principle - we want to know who made the change even if the user is deleted later.

### Q: How to handle bulk operations?
**A**: Each product gets its own audit entry. If needed, add optional `batchId` field to group related changes, but not required for initial implementation.

**Decision**: Omit batch tracking in v1. Can be added later if needed without schema changes (just add nullable `batchId` column).

### Q: Should audit logging block product operations?
**A**: No. Audit failures should be logged but not prevent product updates. Use try-catch around audit calls with error logging.

**Decision**: Audit is important but not critical. Wrap audit service calls in try-catch, log errors, continue operation. Constitutional alignment (Principle VI - fault tolerance pattern).

---

## Summary

**Architectural Decisions**:
1. Service layer pattern for audit capture (explicit, testable, maintainable)
2. Hybrid storage: JSON snapshots + field summary (balance of efficiency and queryability)
3. Cursor-based pagination with infinite scroll (performance + UX)
4. i18n for field labels (future-proof, consistent)
5. Mantine UI components (Drawer, Timeline) for familiar, accessible UX

**Key Trade-offs**:
- Explicit service calls over automatic middleware: Chose predictability over convenience
- JSON snapshots over normalized field changes: Chose simplicity over perfect normalization
- Cursor pagination over offset: Chose performance over traditional page numbers
- Synchronous audit logging over async: Chose consistency over marginal performance gain (can optimize later if needed)

**Next Steps**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md)
