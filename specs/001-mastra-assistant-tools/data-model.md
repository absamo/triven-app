# Data Model: Enhanced Mastra Assistant Tools

**Date**: November 3, 2025  
**Feature**: 001-mastra-assistant-tools  
**Purpose**: Entity schemas, relationships, and database modifications

---

## Schema Modifications

### 1. Product Model - Add Optimistic Locking

**Modification**: Add `version` field for concurrency control

```prisma
model Product {
  id                    String    @id @default(cuid())
  sku                   String    @unique
  name                  String
  description           String?
  sellingPrice          Decimal   @db.Decimal(10, 2)
  costPrice             Decimal?  @db.Decimal(10, 2)
  availableQuantity     Int       @default(0)
  reorderLevel          Int       @default(10)
  status                ProductStatus
  version               Int       @default(1)  // NEW FIELD - optimistic locking
  categoryId            String?
  companyId             String
  createdById           String?
  updatedById           String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relationships
  category              Category? @relation(fields: [categoryId], references: [id])
  company               Company   @relation(fields: [companyId], references: [id])
  createdBy             User?     @relation("productCreatedBy", fields: [createdById], references: [id])
  updatedBy             User?     @relation("productUpdatedBy", fields: [updatedById], references: [id])
  // ... existing relationships
  
  @@index([sku])
  @@index([companyId])
  @@index([categoryId])
  @@index([status])
}
```

**Migration Rationale**:
- Supports FR-025 (optimistic locking for concurrent access)
- Default value of 1 ensures existing rows are compatible
- Int type is efficient (4 bytes) and sufficient (supports 2B+ updates)

---

### 2. ToolExecutionLog Model - New Entity

**Purpose**: Audit trail for all tool executions (FR-024)

```prisma
model ToolExecutionLog {
  id              String    @id @default(cuid())
  toolName        String    @db.VarChar(100)
  userId          String
  companyId       String?
  parameters      Json      // Sanitized input parameters
  result          Json      // Sanitized tool output
  success         Boolean
  errorMessage    String?   @db.Text
  executionTimeMs Int       // Duration in milliseconds
  ipAddress       String?   @db.VarChar(45)
  userAgent       String?   @db.Text
  createdAt       DateTime  @default(now())
  
  // Relationships
  user            User      @relation(fields: [userId], references: [id])
  company         Company?  @relation(fields: [companyId], references: [id])
  
  @@index([toolName, createdAt])
  @@index([userId, createdAt])
  @@index([companyId, createdAt])
  @@index([success, createdAt])
  @@index([createdAt])
}
```

**Field Details**:
- `toolName`: Tool identifier (e.g., "updateProductStock", "createOrder")
- `parameters`: JSON with sanitized inputs (PII masked, tokens redacted)
- `result`: JSON with sanitized outputs (sensitive data removed)
- `success`: Boolean for quick filtering of failures
- `errorMessage`: Full error text for debugging (nullable for successful executions)
- `executionTimeMs`: Performance monitoring and optimization
- `ipAddress` / `userAgent`: Security audit trail (optional)

**Indexes**:
- Primary queries: By tool name, user, company, date range
- Performance query: Success/failure rates over time
- Retention query: Bulk deletions by createdAt

---

## Existing Entities (Reference)

### Category Model

Used by FR-005 (list categories), FR-006 (create category), FR-007 (move products)

```prisma
model Category {
  id          String     @id @default(cuid())
  name        String     @db.VarChar(200)
  description String?    @db.Text
  companyId   String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  company     Company    @relation(fields: [companyId], references: [id])
  products    Product[]
  
  @@unique([name, companyId])
  @@index([companyId])
}
```

**Tool Operations**:
- **List**: Query with product count aggregation and inventory value sum
- **Create**: Insert with name uniqueness check per company
- **Move Products**: Update Product.categoryId in transaction

---

### Order Models (SalesOrder)

Used by FR-008 (get orders), FR-009 (create order), FR-010 (update status)

```prisma
model SalesOrder {
  id                String              @id @default(cuid())
  orderNumber       String              @unique
  customerId        String
  companyId         String
  status            OrderStatus         // DRAFT, PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  subtotal          Decimal             @db.Decimal(10, 2)
  tax               Decimal             @db.Decimal(10, 2)
  total             Decimal             @db.Decimal(10, 2)
  notes             String?             @db.Text
  shippedAt         DateTime?
  deliveredAt       DateTime?
  cancelledAt       DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  customer          Customer            @relation(fields: [customerId], references: [id])
  company           Company             @relation(fields: [companyId], references: [id])
  items             SalesOrderItem[]
  
  @@index([orderNumber])
  @@index([customerId])
  @@index([companyId])
  @@index([status])
  @@index([createdAt])
}

model SalesOrderItem {
  id              String     @id @default(cuid())
  salesOrderId    String
  productId       String
  quantity        Int
  unitPrice       Decimal    @db.Decimal(10, 2)
  subtotal        Decimal    @db.Decimal(10, 2)
  createdAt       DateTime   @default(now())
  
  salesOrder      SalesOrder @relation(fields: [salesOrderId], references: [id])
  product         Product    @relation(fields: [productId], references: [id])
  
  @@index([salesOrderId])
  @@index([productId])
}
```

**Tool Operations**:
- **Get Orders**: Filter by date range, status, customer with items included
- **Create Order**: Transaction - create order + items + decrement Product.availableQuantity
- **Update Status**: Update status field with timestamp (shippedAt, deliveredAt, cancelledAt)
- **Sales Analytics**: Aggregate SalesOrderItem by product, category, date range

**Status Transitions** (for FR-010):
```
DRAFT → PENDING → CONFIRMED → SHIPPED → DELIVERED
  ↓       ↓          ↓
CANCELLED (from any pre-shipped state)
```

---

### Supplier & PurchaseOrder Models

Used by FR-015 (list suppliers), FR-016 (create PO), FR-017 (receive PO)

```prisma
model Supplier {
  id              String          @id @default(cuid())
  name            String          @db.VarChar(200)
  contactName     String?         @db.VarChar(200)
  email           String?         @db.VarChar(200)
  phone           String?         @db.VarChar(50)
  address         String?         @db.Text
  paymentTerms    String?         @db.VarChar(100)
  leadTimeDays    Int             @default(7)
  currencyId      String?
  companyId       String
  active          Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  company         Company         @relation(fields: [companyId], references: [id])
  currency        Currency?       @relation(fields: [currencyId], references: [id])
  purchaseOrders  PurchaseOrder[]
  
  @@index([companyId])
  @@index([active])
}

model PurchaseOrder {
  id              String            @id @default(cuid())
  poNumber        String            @unique
  supplierId      String
  companyId       String
  status          POStatus          // DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
  subtotal        Decimal           @db.Decimal(10, 2)
  tax             Decimal           @db.Decimal(10, 2)
  total           Decimal           @db.Decimal(10, 2)
  expectedDate    DateTime?
  receivedAt      DateTime?
  notes           String?           @db.Text
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  supplier        Supplier          @relation(fields: [supplierId], references: [id])
  company         Company           @relation(fields: [companyId], references: [id])
  items           PurchaseOrderItem[]
  
  @@index([poNumber])
  @@index([supplierId])
  @@index([companyId])
  @@index([status])
}

model PurchaseOrderItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  productId       String
  quantity        Int
  receivedQty     Int           @default(0)
  unitCost        Decimal       @db.Decimal(10, 2)
  subtotal        Decimal       @db.Decimal(10, 2)
  createdAt       DateTime      @default(now())
  
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  product         Product       @relation(fields: [productId], references: [id])
  
  @@index([purchaseOrderId])
  @@index([productId])
}
```

**Tool Operations**:
- **List Suppliers**: Query with performance metrics (avg lead time, order accuracy rate)
- **Create PO**: Transaction - create PO + items with cost calculations
- **Receive PO**: Transaction - update PO status + increment Product.availableQuantity + set receivedQty

**Performance Metrics Calculation**:
```sql
-- Average lead time (actual vs expected)
SELECT AVG(EXTRACT(DAY FROM receivedAt - createdAt)) FROM PurchaseOrder 
WHERE supplierId = ? AND status = 'RECEIVED'

-- Order accuracy (% of items received fully)
SELECT 
  COUNT(CASE WHEN receivedQty = quantity THEN 1 END) * 100.0 / COUNT(*) 
FROM PurchaseOrderItem 
WHERE purchaseOrderId IN (
  SELECT id FROM PurchaseOrder WHERE supplierId = ?
)
```

---

## Data Relationships Diagram

```
Company
  ├─→ Product (many)
  │     ├─→ Category (optional)
  │     ├─→ SalesOrderItem (many)
  │     └─→ PurchaseOrderItem (many)
  │
  ├─→ Category (many)
  │     └─→ Product (many)
  │
  ├─→ SalesOrder (many)
  │     ├─→ Customer (one)
  │     └─→ SalesOrderItem (many)
  │           └─→ Product (one)
  │
  ├─→ PurchaseOrder (many)
  │     ├─→ Supplier (one)
  │     └─→ PurchaseOrderItem (many)
  │           └─→ Product (one)
  │
  ├─→ Supplier (many)
  │     └─→ PurchaseOrder (many)
  │
  └─→ ToolExecutionLog (many)
        └─→ User (one)
```

---

## Validation Rules

### Product
- `sku`: Unique per company, alphanumeric with hyphens allowed, max 50 chars
- `name`: Required, 1-200 chars
- `sellingPrice`: Positive decimal, max 10 digits with 2 decimal places
- `availableQuantity`: Non-negative integer
- `reorderLevel`: Positive integer, typically 5-50
- `version`: Auto-managed, never set by user input

### Category
- `name`: Unique per company, 1-200 chars
- `description`: Optional, max 1000 chars

### SalesOrder
- `orderNumber`: Auto-generated, unique, format: "SO-YYYYMMDD-XXXXX"
- `status`: Enum validation, see transitions above
- `total`: Must equal sum of item subtotals + tax
- `items`: At least 1 item required
- Each item `quantity`: Positive integer
- Each item `unitPrice`: Must match product's selling price at order time

### PurchaseOrder
- `poNumber`: Auto-generated, unique, format: "PO-YYYYMMDD-XXXXX"
- `status`: Enum validation
- `total`: Must equal sum of item subtotals + tax
- `items`: At least 1 item required
- Each item `receivedQty`: 0 ≤ receivedQty ≤ quantity

### ToolExecutionLog
- `toolName`: Must match registered tool name (validated at runtime)
- `parameters`: Valid JSON
- `result`: Valid JSON
- `executionTimeMs`: Non-negative integer

---

## State Transitions

### Order Status (SalesOrder)
```
DRAFT
  ↓ (user confirms order)
PENDING
  ↓ (inventory reserved, payment authorized)
CONFIRMED
  ↓ (shipped to customer)
SHIPPED
  ↓ (customer confirms receipt)
DELIVERED

// Cancellation paths:
DRAFT/PENDING/CONFIRMED → CANCELLED
// Cannot cancel once SHIPPED
```

### Purchase Order Status
```
DRAFT
  ↓ (sent to supplier)
SENT
  ↓ (supplier confirms)
CONFIRMED
  ↓ (first partial shipment received)
PARTIALLY_RECEIVED
  ↓ (all items received)
RECEIVED

// Cancellation:
DRAFT/SENT/CONFIRMED → CANCELLED
```

---

## Performance Considerations

### Indexes
All critical query patterns have appropriate indexes:
- **Product**: sku, companyId, categoryId, status
- **SalesOrder**: orderNumber, customerId, companyId, status, createdAt
- **PurchaseOrder**: poNumber, supplierId, companyId, status
- **ToolExecutionLog**: toolName+createdAt, userId+createdAt, success+createdAt

### Query Optimization
- Use `select` to fetch only needed fields
- Use `include` for relationships (avoid N+1)
- Aggregate at database level (COUNT, SUM, AVG)
- Cache category statistics (refresh hourly)
- Batch operations in transactions

### Audit Log Retention
- Keep logs for 90 days (configurable)
- Archive older logs to cold storage if needed
- Partition table by month for faster queries
- Consider separate read replica for analytics queries

---

## Migration Strategy

### Phase 1: Schema Updates
```bash
# Add Product.version field
npx prisma migrate dev --name add-product-version

# Add ToolExecutionLog model
npx prisma migrate dev --name add-tool-execution-log
```

### Phase 2: Data Migration
```typescript
// Backfill existing Product versions (if needed)
await prisma.product.updateMany({
  where: { version: { equals: null } },
  data: { version: 1 }
})
```

### Phase 3: Application Updates
1. Update Prisma client: `npx prisma generate`
2. Deploy tools with version checking
3. Update frontend to pass versions
4. Monitor for version conflicts

**Rollback Plan**: Version field is optional, can remove without data loss

---

## Summary

- ✅ **2 Schema Modifications**: Product.version, new ToolExecutionLog model
- ✅ **7 Existing Entities**: Product, Category, SalesOrder, SalesOrderItem, PurchaseOrder, PurchaseOrderItem, Supplier
- ✅ **Validation Rules**: Defined for all user-input fields
- ✅ **State Machines**: Order and PO status transitions documented
- ✅ **Performance**: Indexes and optimization strategies identified
- ✅ **Migration**: Phased approach with rollback plan

**Next Step**: Generate API contracts (tool definitions in YAML format)
