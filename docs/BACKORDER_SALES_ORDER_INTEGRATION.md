# Backorder-Sales Order Integration Plan

## Current Gap
Backorders exist as standalone entities with no link to Sales Orders, which doesn't follow inventory management best practices.

## Recommended Schema Changes

### 1. Add Sales Order Reference to Backorder
```prisma
model Backorder {
  id                  String          @id @default(cuid())
  backorderReference  String
  backorderNumber     String
  customerId          String
  salesOrderId        String?         // NEW: Link to original sales order
  status              BackorderStatus
  originalOrderDate   DateTime
  expectedFulfillDate DateTime?
  agencyId            String
  companyId           String
  siteId              String
  notes               String?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime?       @updatedAt
  
  agency              Agency          @relation(fields: [agencyId], references: [id])
  company             Company         @relation(fields: [companyId], references: [id])
  customer            Customer        @relation(fields: [customerId], references: [id])
  site                Site            @relation(fields: [siteId], references: [id])
  salesOrder          SalesOrder?     @relation(fields: [salesOrderId], references: [id]) // NEW
  backorderItems      BackorderItem[]
}

model SalesOrder {
  // ... existing fields
  backorders          Backorder[]     // NEW: Reverse relation
}
```

### 2. Add Sales Order Item Reference to Backorder Item
```prisma
model BackorderItem {
  id                String              @id @default(cuid())
  backorderId       String
  productId         String
  salesOrderItemId  String?             // NEW: Link to specific sales order item
  orderedQuantity   Int
  fulfilledQuantity Int                 @default(0)
  remainingQuantity Int
  rate              Float
  amount            Float
  status            BackorderItemStatus
  createdAt         DateTime            @default(now())
  updatedAt         DateTime?           @updatedAt
  
  backorder         Backorder           @relation(fields: [backorderId], references: [id])
  product           Product             @relation(fields: [productId], references: [id])
  salesOrderItem    SalesOrderItem?     @relation(fields: [salesOrderItemId], references: [id]) // NEW
}

model SalesOrderItem {
  // ... existing fields
  backorderItems    BackorderItem[]     // NEW: Reverse relation
}
```

## Workflow Integration

### 1. Sales Order Processing
- When creating/confirming a sales order
- Check stock availability for each item
- If insufficient stock: automatically create backorder for shortage

### 2. Backorder Creation from Sales Order
```typescript
// When processing sales order
const createBackorderFromSalesOrder = async (salesOrder: SalesOrder) => {
  const outOfStockItems = await checkStockAvailability(salesOrder.salesOrderItems)
  
  if (outOfStockItems.length > 0) {
    const backorder = await createBackorder({
      salesOrderId: salesOrder.id,
      customerId: salesOrder.customerId,
      agencyId: salesOrder.agencyId,
      siteId: salesOrder.siteId,
      items: outOfStockItems
    })
    
    // Update sales order status to "Partial" or "Backordered"
    await updateSalesOrderStatus(salesOrder.id, "PARTIAL")
  }
}
```

### 3. Backorder Fulfillment → Sales Order Update
```typescript
// When backorder is fulfilled
const fulfillBackorder = async (backorderId: string) => {
  const backorder = await getBackorderWithSalesOrder(backorderId)
  
  // Mark backorder as fulfilled
  await updateBackorderStatus(backorderId, "FULFILLED")
  
  // Check if all backorders for the sales order are fulfilled
  const remainingBackorders = await getSalesOrderBackorders(backorder.salesOrderId)
  
  if (remainingBackorders.every(bo => bo.status === "FULFILLED")) {
    // All backorders fulfilled, complete the sales order
    await updateSalesOrderStatus(backorder.salesOrderId, "COMPLETED")
  }
}
```

## Benefits of Integration

1. **Complete Order Tracking**: See full lifecycle from order to fulfillment
2. **Automatic Status Updates**: Sales orders automatically update when backorders are fulfilled
3. **Customer Visibility**: Customers can see which parts of their order are backordered
4. **Inventory Planning**: Better visibility into what needs to be restocked
5. **Reporting**: Complete analytics on order fulfillment rates

## Implementation Phases

### Phase 1: Database Schema Update
- Add foreign key relationships
- Migration to link existing data (if any)

### Phase 2: Sales Order Integration
- Modify sales order creation to check stock
- Auto-create backorders for out-of-stock items

### Phase 3: Fulfillment Workflow
- Update backorder fulfillment to update sales orders
- Add status synchronization

### Phase 4: UI Updates
- Show linked sales orders in backorder details
- Show backorder status in sales orders
- Integrated reporting and analytics
