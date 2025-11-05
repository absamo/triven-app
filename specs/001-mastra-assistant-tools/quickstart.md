# Developer Quickstart: Enhanced Mastra Assistant Tools

**Feature**: 001-mastra-assistant-tools  
**Audience**: Backend developers implementing new tools  
**Time to Complete**: 30-45 minutes for first tool

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Creating a New Tool](#creating-a-new-tool)
5. [Authorization & Permissions](#authorization--permissions)
6. [Testing Tools](#testing-tools)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Dependencies

```json
{
  "@mastra/core": "^0.23.0",
  "zod": "^4.1.0",
  "@prisma/client": "latest",
  "ai-sdk-ollama": "^0.5.0"
}
```

### Database Setup

```bash
# Run migrations to add new schema
npx prisma migrate dev --name add-mastra-tool-support

# Regenerate Prisma client
npx prisma generate

# Seed test data (optional)
npm run seed
```

### Environment Variables

Ensure these are set in `.env`:

```env
DATABASE_URL="postgresql://..."
OLLAMA_BASE_URL="http://localhost:11434"
```

---

## Project Structure

```
app/
├── lib/
│   ├── index.ts                      # Main Mastra agent configuration
│   └── mastra-tools/                 # NEW: Tool modules
│       ├── product-tools.ts          # Product management (FR-001 to FR-004)
│       ├── category-tools.ts         # Category operations (FR-005 to FR-007)
│       ├── order-tools.ts            # Order management (FR-008 to FR-011)
│       ├── supplier-tools.ts         # Supplier & PO tools (FR-015 to FR-017)
│       ├── recommendation-tools.ts   # Analytics & recommendations (FR-012 to FR-014)
│       ├── tool-logger.ts            # Audit logging utilities (FR-024)
│       └── tool-auth.ts              # Authorization wrapper (FR-026)
│
├── services/
│   ├── authorization.server.ts       # NEW: Permission checking
│   └── analytics.server.ts           # NEW: Sales velocity calculations
│
└── routes/
    └── mastra-chat.tsx               # Chat UI with tool streaming

prisma/
└── schema.prisma                     # Updated with ToolExecutionLog model

specs/
└── 001-mastra-assistant-tools/
    ├── spec.md                       # Feature requirements
    ├── plan.md                       # Implementation plan
    ├── research.md                   # Technical research
    ├── data-model.md                 # Entity schemas
    ├── contracts/                    # Tool API contracts (YAML)
    └── quickstart.md                 # This file
```

---

## Development Workflow

### Step 1: Choose a Tool to Implement

Refer to `contracts/*.yaml` files for complete specifications. Each YAML defines:
- Input schema (Zod validation)
- Output schema (success and error cases)
- Authorization requirements
- Side effects and performance targets

**Recommended Implementation Order**:
1. `updateProductStock` (simplest, demonstrates optimistic locking)
2. `createProduct` (demonstrates validation and defaults)
3. `listCategories` (demonstrates aggregations)
4. `createOrder` (demonstrates transactions)
5. Other tools as needed

### Step 2: Write Tests First (TDD)

Create test file: `app/test/mastra-tools/product-tools.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateProductStock } from '~/lib/mastra-tools/product-tools';
import { db } from '~/lib/db.server';

describe('updateProductStock', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.product.deleteMany({ where: { sku: { startsWith: 'TEST-' } } });
  });

  it('should update product stock with optimistic locking', async () => {
    // Arrange
    const product = await db.product.create({
      data: {
        sku: 'TEST-001',
        name: 'Test Widget',
        sellingPrice: 10.0,
        availableQuantity: 50,
        version: 1,
        companyId: 'test-company',
        status: 'ACTIVE',
      },
    });

    // Act
    const result = await updateProductStock({
      productId: product.id,
      quantity: 100,
      version: 1,
      userId: 'test-user',
      companyId: 'test-company',
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.product.availableQuantity).toBe(100);
    expect(result.product.version).toBe(2);
  });

  it('should throw VERSION_CONFLICT on concurrent update', async () => {
    // Test optimistic locking failure...
  });
});
```

### Step 3: Implement the Tool

Create `app/lib/mastra-tools/product-tools.ts`:

```typescript
import { z } from 'zod';
import { db } from '~/lib/db.server';
import { withAuth, Permission } from './tool-auth';
import { logToolExecution } from './tool-logger';

// Input validation schema
export const updateProductStockSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0),
  version: z.number().int().min(1),
  reason: z.string().max(200).optional(),
});

// Tool implementation with authorization
export const updateProductStock = withAuth(
  Permission.MANAGE_PRODUCTS,
  async (input: z.infer<typeof updateProductStockSchema>, context) => {
    const { productId, quantity, version, reason } = input;
    const { userId, companyId } = context;

    try {
      // Optimistic locking: update only if version matches
      const result = await db.product.updateMany({
        where: {
          id: productId,
          version: version,
          companyId: companyId,
        },
        data: {
          availableQuantity: quantity,
          version: { increment: 1 },
          updatedById: userId,
        },
      });

      if (result.count === 0) {
        // Check if product exists or version mismatch
        const existing = await db.product.findUnique({
          where: { id: productId },
          select: { version: true },
        });

        if (!existing) {
          throw new Error('PRODUCT_NOT_FOUND');
        }
        throw new Error('VERSION_CONFLICT');
      }

      // Fetch updated product
      const product = await db.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          sku: true,
          name: true,
          availableQuantity: true,
          version: true,
          updatedAt: true,
        },
      });

      const response = {
        success: true,
        product,
        message: `Stock updated successfully to ${quantity} units`,
      };

      // Log tool execution
      await logToolExecution({
        toolName: 'updateProductStock',
        userId,
        companyId,
        parameters: input,
        result: response,
        success: true,
        executionTimeMs: 0, // Tracked by wrapper
      });

      return response;
    } catch (error) {
      await logToolExecution({
        toolName: 'updateProductStock',
        userId,
        companyId,
        parameters: input,
        result: null,
        success: false,
        errorMessage: error.message,
        executionTimeMs: 0,
      });
      throw error;
    }
  }
);

// Mastra tool definition
export const updateProductStockTool = {
  name: 'updateProductStock',
  description: 'Update the available quantity of a product with optimistic locking',
  schema: updateProductStockSchema,
  execute: updateProductStock,
};
```

### Step 4: Register Tool in Agent

Update `app/lib/index.ts`:

```typescript
import { updateProductStockTool } from './mastra-tools/product-tools';

export const inventoryAgent = new Agent({
  name: 'inventory-assistant',
  instructions: `You are an AI assistant for inventory management...`,
  model: {
    provider: 'ollama',
    name: 'llama3.2',
    toolChoice: 'auto',
  },
  tools: {
    // Existing read-only tools
    getProducts,
    searchProducts,
    // NEW: Write-capable tools
    updateProductStock: updateProductStockTool,
    // ... other tools
  },
});
```

### Step 5: Run Tests

```bash
npm run test -- app/test/mastra-tools/product-tools.test.ts
```

### Step 6: Test in Chat UI

```bash
npm run dev
```

Navigate to `/mastra-chat` and test:

```
User: Update stock for product prod_abc123 to 150 units
Assistant: [Calls updateProductStock tool]
Assistant: ✅ Stock updated successfully to 150 units for Widget A (SKU-001)
```

---

## Creating a New Tool

### Template

```typescript
import { z } from 'zod';
import { db } from '~/lib/db.server';
import { withAuth, Permission } from './tool-auth';
import { logToolExecution } from './tool-logger';

// 1. Define input schema
export const myToolSchema = z.object({
  // ... fields with validation
});

type MyToolInput = z.infer<typeof myToolSchema>;
type MyToolContext = { userId: string; companyId: string };

// 2. Implement tool logic
export const myTool = withAuth(
  Permission.REQUIRED_PERMISSION,
  async (input: MyToolInput, context: MyToolContext) => {
    const startTime = Date.now();

    try {
      // Business logic here
      const result = await db.someModel.create({ data: input });

      const response = {
        success: true,
        data: result,
        message: 'Operation successful',
      };

      // Log success
      await logToolExecution({
        toolName: 'myTool',
        userId: context.userId,
        companyId: context.companyId,
        parameters: input,
        result: response,
        success: true,
        executionTimeMs: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      // Log failure
      await logToolExecution({
        toolName: 'myTool',
        userId: context.userId,
        companyId: context.companyId,
        parameters: input,
        result: null,
        success: false,
        errorMessage: error.message,
        executionTimeMs: Date.now() - startTime,
      });
      throw error;
    }
  }
);

// 3. Export Mastra tool definition
export const myToolDefinition = {
  name: 'myTool',
  description: 'Brief description for LLM',
  schema: myToolSchema,
  execute: myTool,
};
```

---

## Authorization & Permissions

### Permission Enum

```typescript
// app/services/authorization.server.ts
export enum Permission {
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  MANAGE_PRODUCTS = 'MANAGE_PRODUCTS',
  VIEW_ORDERS = 'VIEW_ORDERS',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  VIEW_SUPPLIERS = 'VIEW_SUPPLIERS',
  MANAGE_PURCHASE_ORDERS = 'MANAGE_PURCHASE_ORDERS',
  VIEW_REPORTS = 'VIEW_REPORTS',
}
```

### Role-Permission Matrix

| Role    | Permissions                                                                 |
|---------|-----------------------------------------------------------------------------|
| Admin   | All permissions                                                             |
| Manager | VIEW_*, MANAGE_PRODUCTS, MANAGE_ORDERS, MANAGE_PURCHASE_ORDERS, VIEW_REPORTS |
| Staff   | VIEW_INVENTORY, MANAGE_PRODUCTS, VIEW_ORDERS, MANAGE_ORDERS, VIEW_SUPPLIERS, MANAGE_PURCHASE_ORDERS |
| Viewer  | VIEW_INVENTORY, VIEW_ORDERS, VIEW_SUPPLIERS                                |

### Using Authorization Wrapper

```typescript
import { withAuth, Permission } from './tool-auth';

export const myProtectedTool = withAuth(
  Permission.MANAGE_PRODUCTS,
  async (input, context) => {
    // context.userId, context.companyId, context.role are available
    // Permission check already passed
  }
);
```

### Manual Permission Check

```typescript
import { checkPermission, Permission } from '~/services/authorization.server';

const canManageProducts = checkPermission(userRole, Permission.MANAGE_PRODUCTS);
if (!canManageProducts) {
  throw new Error('INSUFFICIENT_PERMISSIONS');
}
```

---

## Testing Tools

### Unit Tests

Test business logic in isolation:

```typescript
describe('calculateSalesVelocity', () => {
  it('should calculate 30-day average', () => {
    const salesData = [/* mock data */];
    const velocity = calculateSalesVelocity(salesData);
    expect(velocity).toBeCloseTo(5.2);
  });
});
```

### Integration Tests

Test database interactions:

```typescript
describe('createOrder', () => {
  it('should create order and decrement inventory in transaction', async () => {
    // Use test database
    const order = await createOrder({/* ... */});
    
    const product = await db.product.findUnique({
      where: { id: 'prod_001' },
    });
    
    expect(product.availableQuantity).toBe(90); // Was 100, sold 10
  });
});
```

### E2E Tests (Playwright)

Test complete user workflows:

```typescript
test('user can create product via chat', async ({ page }) => {
  await page.goto('/mastra-chat');
  await page.fill('textarea', 'Create product: SKU-999, Widget XYZ, $25, category Electronics');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.tool-result')).toContainText('Product created successfully');
});
```

### Running Tests

```bash
# Unit + integration tests
npm run test

# Specific test file
npm run test -- app/test/mastra-tools/product-tools.test.ts

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

---

## Common Patterns

### Pattern 1: Optimistic Locking

```typescript
// Update with version check
const result = await db.product.updateMany({
  where: { id, version },
  data: { field: newValue, version: { increment: 1 } },
});

if (result.count === 0) {
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) throw new Error('NOT_FOUND');
  throw new Error('VERSION_CONFLICT');
}
```

### Pattern 2: Transaction with Rollback

```typescript
await db.$transaction(async (tx) => {
  const order = await tx.salesOrder.create({ data: orderData });
  
  for (const item of items) {
    await tx.salesOrderItem.create({ data: item });
    await tx.product.update({
      where: { id: item.productId },
      data: { availableQuantity: { decrement: item.quantity } },
    });
  }
  
  return order;
});
```

### Pattern 3: Aggregations with Prisma

```typescript
const categories = await db.category.findMany({
  include: {
    _count: { select: { products: true } },
    products: {
      select: {
        availableQuantity: true,
        costPrice: true,
      },
    },
  },
});

const categoriesWithStats = categories.map(cat => ({
  ...cat,
  productCount: cat._count.products,
  inventoryValue: cat.products.reduce(
    (sum, p) => sum + (p.availableQuantity * p.costPrice),
    0
  ),
}));
```

### Pattern 4: Sales Velocity Calculation

```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const sales = await db.salesOrderItem.aggregate({
  where: {
    productId,
    createdAt: { gte: thirtyDaysAgo },
    salesOrder: {
      status: { notIn: ['DRAFT', 'CANCELLED'] },
    },
  },
  _sum: { quantity: true },
});

const totalSold = sales._sum.quantity || 0;
const velocity = totalSold / 30; // Units per day
```

### Pattern 5: PII Sanitization

```typescript
import { sanitizeObject } from './tool-logger';

const sanitizedParams = sanitizeObject(input, [
  'password',
  'creditCard',
  'ssn',
  'email', // Partially mask
]);

// Result: { email: 'jo**@example.com', password: '[REDACTED]' }
```

---

## Troubleshooting

### Issue: "Tool not found" in Chat

**Cause**: Tool not registered in agent  
**Fix**: Ensure tool is imported and added to `tools` object in `app/lib/index.ts`

### Issue: Version Conflict Errors

**Cause**: Optimistic locking detected concurrent update  
**Fix**: Implement retry logic or show user-friendly conflict resolution UI

```typescript
let retries = 3;
while (retries > 0) {
  try {
    return await updateProductStock(input);
  } catch (error) {
    if (error.message === 'VERSION_CONFLICT' && retries > 0) {
      retries--;
      // Fetch latest version and retry
      const latest = await db.product.findUnique({ where: { id } });
      input.version = latest.version;
    } else {
      throw error;
    }
  }
}
```

### Issue: Slow Tool Execution

**Causes**:
- Missing database indexes
- N+1 query problems
- Large aggregations without caching

**Fixes**:
```typescript
// Add indexes
@@index([companyId, status, createdAt])

// Use include/select to avoid N+1
const orders = await db.salesOrder.findMany({
  include: { items: { include: { product: true } } },
});

// Cache expensive aggregations
const cacheKey = `sales-analytics:${startDate}:${endDate}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### Issue: Transaction Deadlocks

**Cause**: Multiple transactions updating same rows in different order  
**Fix**: Always acquire locks in consistent order (e.g., products before orders)

```typescript
// Bad: Order locks in different sequence
await tx.product.update({ where: { id: 'A' } });
await tx.product.update({ where: { id: 'B' } });

// Good: Sort IDs to ensure consistent lock order
const sortedIds = productIds.sort();
for (const id of sortedIds) {
  await tx.product.update({ where: { id } });
}
```

### Issue: Audit Logs Missing

**Cause**: Async logging fire-and-forget can fail silently  
**Fix**: Add error handling to logging calls

```typescript
try {
  await logToolExecution({ /* ... */ });
} catch (logError) {
  console.error('Failed to log tool execution:', logError);
  // Continue execution - don't fail tool because logging failed
}
```

---

## Next Steps

1. **Implement Core Tools**: Start with `product-tools.ts` (4 tools)
2. **Add Authorization**: Set up `tool-auth.ts` and `authorization.server.ts`
3. **Enable Logging**: Implement `tool-logger.ts` with PII sanitization
4. **Build Analytics**: Create `analytics.server.ts` for sales velocity
5. **Test Thoroughly**: Write unit, integration, and E2E tests
6. **Deploy Incrementally**: Release tools in phases (read-only → write → analytics)

---

## Resources

- **Spec Document**: `specs/001-mastra-assistant-tools/spec.md`
- **API Contracts**: `specs/001-mastra-assistant-tools/contracts/*.yaml`
- **Research**: `specs/001-mastra-assistant-tools/research.md`
- **Data Model**: `specs/001-mastra-assistant-tools/data-model.md`
- **Mastra Docs**: https://mastra.ai/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Questions?** Check the research document or contract specifications for detailed implementation guidance.
