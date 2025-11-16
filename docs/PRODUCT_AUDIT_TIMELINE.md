# Product Audit Timeline Feature

## Overview

The Product Audit Timeline feature provides comprehensive tracking and visualization of all changes made to products in the inventory management system. This includes creation, updates, deletions, and field-level comparisons.

## Features

### ✅ Implemented

1. **View Product Change History**
   - Complete timeline of product lifecycle events
   - Event types: Create, Update, Delete
   - User attribution for all changes
   - Timestamps with relative time display ("2 hours ago")
   - Visual indicators (icons and badges) by event type

2. **Track Deleted Products**
   - Deleted products shown with red styling
   - Historical data preserved for audit compliance
   - View full product state before deletion

3. **Filter and Search**
   - Filter by event type (Create/Update/Delete)
   - Date range filtering
   - Active filter count display
   - Clear all filters functionality

4. **Compare Field Changes**
   - Expandable field-by-field comparison
   - Before/after values with visual diff
   - Numeric delta calculations (e.g., "+100 units")
   - Color-coded changes (green for positive, red for negative)

## Architecture

### Database Schema

```prisma
model AuditEvent {
  id              String   @id @default(cuid())
  entityType      String   // e.g., "product"
  entityId        String   // Product ID
  eventType       String   // "create" | "update" | "delete"
  userId          String
  userName        String
  timestamp       DateTime @default(now())
  changedFields   String[] // Array of field names that changed
  beforeSnapshot  Json?    // Full product state before change
  afterSnapshot   Json?    // Full product state after change
  
  user User @relation("AuditEventUser", fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([entityType, entityId, timestamp(sort: Desc)])
  @@index([userId])
  @@index([timestamp])
}
```

### Key Services

#### audit.server.ts
Core audit logging service with three main methods:
- `logCreate(entityType, entityId, entityData, userId, userName)` - Log creation events
- `logUpdate(entityType, entityId, beforeData, afterData, userId, userName)` - Log updates with field diff
- `logDelete(entityType, entityId, entityData, userId, userName)` - Log deletions

Features:
- Automatic field change detection
- System field exclusion (createdAt, updatedAt)
- Non-blocking error handling
- Full state snapshots for reconstruction

#### audit-query.server.ts
Query service for retrieving audit history:
- `getAuditHistory(options)` - Paginated history with filters

Features:
- Cursor-based pagination (20 items per page)
- Filter by event type
- Filter by date range
- Filter by user
- Total count for analytics

### API Endpoints

#### GET /api/audit/products/:productId
Retrieves paginated audit history for a product.

**Query Parameters:**
- `cursor` - Pagination cursor (optional)
- `limit` - Items per page (default: 20)
- `eventType` - Filter: "create" | "update" | "delete" (optional)
- `startDate` - ISO date string (optional)
- `endDate` - ISO date string (optional)

**Response:**
```json
{
  "items": [
    {
      "id": "...",
      "eventType": "update",
      "userId": "...",
      "userName": "John Doe",
      "timestamp": "2025-11-15T10:30:00Z",
      "changedFields": ["price", "stock"],
      "beforeSnapshot": {...},
      "afterSnapshot": {...}
    }
  ],
  "total": 42,
  "nextCursor": "...",
  "hasMore": true
}
```

**Authentication:** Requires `read:products` permission

### Frontend Components

#### ProductAuditDrawer
Main UI component - Mantine Drawer sliding from right.

Features:
- Timeline visualization with icons
- Loading states
- Error handling with retry
- Empty states
- Filter panel integration
- Field comparison integration
- Infinite scroll pagination

#### AuditFilterPanel
Collapsible filter UI with:
- Event type dropdown
- Date range picker
- Active filter count badge
- Apply/Clear buttons

#### FieldComparison
Expandable field comparison for updates:
- Shows changed fields count
- Before/after values side-by-side
- Strikethrough for old values
- Numeric deltas with color coding
- Field labels with i18n support

#### useAuditHistory Hook
Custom React hook for data fetching:
- Automatic fetching when enabled
- Loading and error states
- Pagination support
- Filter integration
- Refetch capability

## Integration Points

### Product Service Integration
The audit service is integrated into `products.server.ts`:

```typescript
// In createProduct
await auditService.logCreate('product', product.id, product, userId, userName)

// In updateProduct
const before = await getProduct(id)
// ... perform update ...
await auditService.logUpdate('product', id, before, updated, userId, userName)

// In deleteProduct
const product = await getProduct(id)
await auditService.logDelete('product', id, product, userId, userName)
```

All audit logging is wrapped in try-catch to prevent blocking operations if audit logging fails.

### Products Page Integration
Added "View History" menu item in product actions:
```tsx
<Menu.Item
  leftSection={<IconClock size={16} />}
  onClick={() => {
    setSelectedProductForAudit(product)
    open()
  }}
>
  {t('viewHistory')}
</Menu.Item>
```

## Internationalization

All UI text is translatable via `app/locales/en/audit.ts`:
- Event type labels
- Time ago formatting
- Filter labels
- Comparison labels
- Field names
- Error messages
- Empty states

Example usage:
```typescript
{t('audit.eventType.create', 'Created')}
{t('audit.filters.title', 'Filters')}
{t('audit.fields.product.price', 'Price')}
```

## Performance Optimizations

1. **Database Indexes**
   - Compound index on (entityType, entityId, timestamp DESC)
   - Individual indexes on userId and timestamp
   - Optimized for filtering and sorting

2. **Cursor-Based Pagination**
   - Efficient for large datasets
   - No offset calculations
   - Consistent performance

3. **Query Optimization**
   - Selective field loading
   - Limit unnecessary joins
   - Use Prisma's query optimization

4. **Frontend Optimizations**
   - Lazy loading of drawer content
   - Conditional rendering
   - Memoized computations (ready for future enhancement)

## Testing

### Unit Tests
Located in `app/test/services/`:
- `audit.server.test.ts` - Core audit service tests
- `audit-query.server.test.ts` - Query service tests

Test coverage:
- Create/Update/Delete logging
- Field change detection
- Pagination logic
- Filter combinations
- Error handling

### Running Tests
```bash
bun test app/test/services/audit
```

## Security Considerations

1. **Authentication**
   - All API endpoints require authentication
   - Permission check: `read:products`

2. **Data Privacy**
   - Full snapshots stored for reconstruction
   - Consider PII implications
   - Implement data retention policies

3. **Audit Integrity**
   - Immutable audit records (no updates/deletes)
   - User attribution cannot be changed
   - Timestamps are server-generated

## Usage Examples

### Viewing Product History
1. Navigate to Products page
2. Click menu (⋮) on any product row
3. Select "View History"
4. Drawer slides in from right with timeline

### Filtering Events
1. Click "Filters" button
2. Select event type and/or date range
3. Click "Apply Filters"
4. Timeline updates to show filtered results

### Comparing Field Changes
1. Find an "Updated" event in timeline
2. Click "View field changes (X)" to expand
3. See before/after comparison for each changed field
4. Numeric fields show deltas (e.g., "+50")

## Future Enhancements

### Planned (Not Implemented)
1. **Advanced Filtering**
   - Filter by specific fields
   - User-based filtering UI
   - Saved filter presets

2. **Export Functionality**
   - Export audit log to CSV/PDF
   - Custom date range exports
   - Include in compliance reports

3. **Real-Time Updates**
   - SSE integration for live updates
   - Show new events without refresh
   - Notification on changes by others

4. **Analytics Dashboard**
   - Change frequency metrics
   - User activity statistics
   - Most changed products
   - Compliance reporting

5. **Diff Visualization**
   - Visual diff for complex fields
   - JSON diff viewer
   - Image diff for product images
   - Syntax highlighting

6. **Performance Enhancements**
   - Virtual scrolling for large timelines
   - Component memoization
   - Query result caching
   - Optimistic UI updates

7. **Accessibility Improvements**
   - Full keyboard navigation
   - Screen reader optimization
   - ARIA live regions for updates
   - High contrast mode support

## Troubleshooting

### Timeline Not Loading
1. Check network tab for API errors
2. Verify user has `read:products` permission
3. Check database connectivity
4. Review audit event records in database

### Missing Events
1. Verify audit logging is not failing silently
2. Check `products.server.ts` integration
3. Review application logs for errors
3. Ensure user context is available

### Performance Issues
1. Check database index usage with EXPLAIN
2. Reduce page size if needed
3. Consider implementing caching
4. Review query complexity

### Filter Not Working
1. Clear browser cache
2. Check date format compatibility
3. Verify API query parameter encoding
4. Test with different filter combinations

## Maintenance

### Database Cleanup
Consider implementing retention policies:
```sql
-- Example: Delete audit events older than 2 years
DELETE FROM "AuditEvent"
WHERE "timestamp" < NOW() - INTERVAL '2 years'
AND "entityType" = 'product';
```

### Monitoring
Key metrics to track:
- Audit event creation rate
- Query response times
- Storage growth
- Failed audit attempts

## Related Documentation
- [Prisma Schema Documentation](../prisma/schema.prisma)
- [API Routes Documentation](../app/routes/README.md)
- [Testing Guide](./MASTRA_TESTING_GUIDE.md)
- [Database Design](../docs/DATABASE_DESIGN.md)

## Version History
- **v1.0.0** (2025-11-15): Initial implementation
  - Core audit logging
  - Timeline visualization
  - Filtering and comparison
  - Database schema and indexes
  - API endpoints
  - UI components
