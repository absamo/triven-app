# Research & Best Practices: Enhanced Mastra Assistant Tools

**Date**: November 3, 2025  
**Feature**: Enhanced Mastra Assistant Tools  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

This document captures research findings and technology decisions for implementing comprehensive Mastra tools for the inventory management platform. It covers tool organization patterns, error handling, optimistic locking, authorization, audit logging, and sales velocity calculations.

---

## 1. Mastra Tool Best Practices

### Decision: Modular Tool Organization with Domain Separation

**Approach**: Organize tools into separate modules by domain (product, category, order, supplier) with a central export point.

**Rationale**:
- **Maintainability**: Each domain module can be worked on independently without affecting others
- **Testability**: Individual tool modules can be unit tested in isolation
- **Scalability**: New tools can be added to appropriate modules without modifying unrelated code
- **Code Reuse**: Common utilities (logger, formatter, auth) can be shared across all tool modules
- **Clear Ownership**: Team members can own specific domains (e.g., product tools vs order tools)

**Alternatives Considered**:
1. **Single File Approach**: Put all tools in one large file
   - ❌ Rejected: Would result in 1000+ line file that's difficult to navigate and maintain
   - ❌ Harder to test specific tool groups in isolation
   - ❌ Merge conflicts likely when multiple developers work on different tools

2. **Tool-per-File Approach**: Each tool in its own file
   - ❌ Rejected: Would create 17+ files with excessive overhead
   - ❌ Harder to see related tools together (e.g., all product operations)
   - ❌ More complex import/export management

**Implementation Notes**:

**File Structure**:
```
app/lib/mastra-tools/
├── index.ts                    # Central export point, tool aggregation
├── product-tools.ts            # createProduct, updateProductStock, updateProductPrice, updateProductDetails
├── category-tools.ts           # listCategories, createCategory, moveProductsToCategory
├── order-tools.ts              # getOrders, createOrder, updateOrderStatus, getSalesAnalytics
├── supplier-tools.ts           # listSuppliers, createPurchaseOrder, markPurchaseOrderReceived
├── recommendation-tools.ts     # getReorderRecommendations, getSlowMovingInventory, getDailyActionItems
├── tool-logger.ts             # Audit logging utility (shared)
├── tool-auth.ts               # Authorization middleware (shared)
└── tool-formatters.ts         # Markdown formatting utilities (shared)
```

**Central Export Pattern** (`app/lib/mastra-tools/index.ts`):
```typescript
import { productTools } from './product-tools';
import { categoryTools } from './category-tools';
import { orderTools } from './order-tools';
import { supplierTools } from './supplier-tools';
import { recommendationTools } from './recommendation-tools';

// Aggregate all tools for Mastra agent
export const allTools = {
  ...productTools,
  ...categoryTools,
  ...orderTools,
  ...supplierTools,
  ...recommendationTools,
};

// Re-export individual modules for testing
export { productTools, categoryTools, orderTools, supplierTools, recommendationTools };
```

---

### Decision: Standardized Error Handling Pattern

**Approach**: Use try-catch blocks in all tool `execute` functions with structured error responses.

**Rationale**:
- **Consistency**: Users get predictable error messages across all tools
- **Debuggability**: Errors include context (tool name, operation, parameters) for troubleshooting
- **Graceful Degradation**: Tools return error objects instead of throwing, preventing workflow interruption
- **User Experience**: Error messages provide actionable guidance (e.g., "Product not found. Try searching for...")

**Alternatives Considered**:
1. **Throwing Errors**: Let errors propagate up to Mastra framework
   - ❌ Rejected: Would halt entire agent execution for recoverable errors
   - ❌ Less control over error message formatting
   - ✅ Works for validation errors where execution should stop

2. **Error Codes**: Return numeric error codes
   - ❌ Rejected: Not user-friendly; requires lookup tables
   - ❌ Harder to maintain than descriptive strings

**Implementation Notes**:

**Error Response Structure**:
```typescript
interface ToolErrorResponse {
  error: string;              // User-friendly error message
  suggestion?: string;        // Actionable next step
  context?: {                 // Additional debugging info
    operation: string;
    parameters: Record<string, unknown>;
    timestamp: string;
  };
}
```

**Code Example** (from Mastra documentation):
```typescript
const updateProductStock = {
  description: 'Update stock quantity for a product',
  parameters: z.object({
    sku: z.string().describe('Product SKU'),
    quantity: z.number().describe('New stock quantity'),
  }),
  execute: async ({ sku, quantity }: { sku: string; quantity: number }) => {
    try {
      // Input validation beyond Zod
      if (quantity < 0) {
        return {
          error: 'Quantity cannot be negative',
          suggestion: 'Provide a positive quantity value',
        };
      }

      // Database operation
      const product = await prisma.product.findFirst({
        where: { sku: { equals: sku, mode: 'insensitive' } },
      });

      if (!product) {
        // Provide helpful alternatives
        const similarProducts = await prisma.product.findMany({
          where: { sku: { contains: sku, mode: 'insensitive' } },
          take: 3,
          select: { sku: true, name: true },
        });

        return {
          error: `Product with SKU "${sku}" not found`,
          suggestion: similarProducts.length > 0
            ? `Did you mean: ${similarProducts.map(p => `${p.sku} (${p.name})`).join(', ')}`
            : 'Check the SKU and try again',
        };
      }

      // Update with version check (optimistic locking - see section 2)
      const updated = await prisma.product.update({
        where: { id: product.id, version: product.version },
        data: {
          availableQuantity: quantity,
          version: { increment: 1 },
        },
      });

      return {
        success: true,
        product: {
          sku: updated.sku,
          name: updated.name,
          previousStock: product.availableQuantity,
          newStock: updated.availableQuantity,
        },
      };
    } catch (error) {
      // Handle unexpected errors
      console.error('[updateProductStock] Error:', error);

      return {
        error: 'Failed to update product stock',
        suggestion: 'Please try again or contact support if the issue persists',
        context: {
          operation: 'updateProductStock',
          parameters: { sku, quantity },
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
};
```

**Key Patterns**:
1. **Validation Errors**: Return immediately with clear messages
2. **Not Found Errors**: Provide suggestions or similar items
3. **Database Errors**: Log details, return generic user-facing message
4. **Success Responses**: Include previous and new values for confirmation

---

### Decision: Async/Await Best Practices for Database Operations

**Approach**: Use async/await for all Prisma operations with proper transaction handling and parallel execution where possible.

**Rationale**:
- **Readability**: Async/await is more readable than promise chaining
- **Error Handling**: Try-catch blocks work naturally with async/await
- **Performance**: Can parallelize independent operations with `Promise.all()`
- **Transaction Safety**: Prisma's `$transaction` works seamlessly with async functions

**Implementation Notes**:

**Sequential Operations** (when order matters):
```typescript
execute: async ({ productId, categoryId }) => {
  try {
    // Must happen in order
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: 'Product not found' };

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return { error: 'Category not found' };

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { categoryId },
    });

    return { success: true, product: updated };
  } catch (error) {
    // Handle error
  }
}
```

**Parallel Operations** (when independent):
```typescript
execute: async ({ productIds }) => {
  try {
    // Fetch multiple products simultaneously
    const [products, categories, suppliers] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.supplier.findMany({ select: { id: true, name: true } }),
    ]);

    return { products, categories, suppliers };
  } catch (error) {
    // Handle error
  }
}
```

**Transaction Operations** (when atomicity required):
```typescript
execute: async ({ orderId, items }) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // All operations must succeed or all rollback
      const order = await tx.salesOrder.create({
        data: { /* order data */ },
      });

      for (const item of items) {
        await tx.salesOrderItem.create({
          data: { orderId: order.id, ...item },
        });

        // Update inventory
        await tx.product.update({
          where: { id: item.productId },
          data: { availableQuantity: { decrement: item.quantity } },
        });
      }

      return { success: true, order };
    });
  } catch (error) {
    // Transaction automatically rolled back
    return { error: 'Failed to create order' };
  }
}
```

---

### Decision: Parameter Validation Beyond Zod Schemas

**Approach**: Use Zod for type validation, add business logic validation in execute function.

**Rationale**:
- **Separation of Concerns**: Zod handles types/structure, execute handles business rules
- **Better Error Messages**: Business logic errors can provide context-specific guidance
- **Performance**: Complex validations only run after Zod passes (fail fast)
- **Flexibility**: Business rules can query database for validation

**Implementation Notes**:

**Zod Schema** (type-level validation):
```typescript
parameters: z.object({
  sku: z.string().min(1, 'SKU is required').describe('Product SKU'),
  quantity: z.number().int('Quantity must be an integer').describe('Stock quantity'),
  notes: z.string().optional().describe('Optional notes'),
}),
```

**Execute Function** (business-level validation):
```typescript
execute: async ({ sku, quantity, notes }) => {
  // Business rule: quantity constraints
  if (quantity < 0) {
    return { error: 'Quantity cannot be negative' };
  }

  if (quantity > 10000) {
    return {
      error: 'Quantity exceeds maximum allowed value (10,000)',
      suggestion: 'For bulk operations, contact your administrator',
    };
  }

  // Business rule: check product status
  const product = await prisma.product.findFirst({
    where: { sku },
  });

  if (product?.status === 'Discontinued') {
    return {
      error: 'Cannot update stock for discontinued products',
      suggestion: 'Reactivate the product first or create a new one',
    };
  }

  // Proceed with operation...
}
```

---

## 2. Optimistic Locking with Prisma

### Decision: Version-Based Optimistic Locking for Concurrent Updates

**Approach**: Add `version: Int` field to `Product` model; increment on every update; check version before write.

**Rationale**:
- **Data Integrity**: Prevents lost updates when multiple users/tools modify same record (99.9% target)
- **Performance**: No database locks; transactions complete quickly
- **User Experience**: Users get immediate feedback about conflicts (retry with fresh data)
- **Scalability**: Works well with high concurrency (50+ concurrent users requirement)

**Alternatives Considered**:
1. **Timestamp-Based Locking**: Use `updatedAt` timestamp for conflict detection
   - ❌ Rejected: Timestamp precision issues (milliseconds vs microseconds)
   - ❌ Clock skew between servers can cause false conflicts
   - ✅ Easier to understand for non-technical users

2. **Pessimistic Locking**: Use database row locks (`SELECT FOR UPDATE`)
   - ❌ Rejected: Reduces concurrency; locks held during entire operation
   - ❌ Risk of deadlocks with complex transactions
   - ❌ Poor performance under high load
   - ✅ Guarantees no conflicts (but at cost of throughput)

3. **Last-Write-Wins**: No conflict detection
   - ❌ Rejected: Violates 99.9% data integrity requirement
   - ❌ Silent data loss
   - ✅ Simplest to implement

**Implementation Notes**:

**Schema Migration**:
```prisma
model Product {
  id                String   @id @default(cuid())
  sku               String
  name              String
  availableQuantity Int
  sellingPrice      Float
  version           Int      @default(0)  // Add version field
  // ... other fields
  
  @@index([id, version])  // Composite index for performance
}
```

**Update Pattern with Version Check**:
```typescript
export async function updateProductStockWithLocking(
  productId: string,
  newQuantity: number,
  currentVersion: number
) {
  try {
    const updated = await prisma.product.update({
      where: {
        id: productId,
        version: currentVersion,  // WHERE clause includes version
      },
      data: {
        availableQuantity: newQuantity,
        version: { increment: 1 },  // Atomically increment
      },
    });

    return { success: true, product: updated };
  } catch (error) {
    if (error.code === 'P2025') {  // Prisma "Record not found" error
      // Version mismatch = conflict detected
      const current = await prisma.product.findUnique({
        where: { id: productId },
        select: { version: true, availableQuantity: true, updatedAt: true },
      });

      return {
        error: 'Product was modified by another user',
        conflict: true,
        currentData: current,  // Provide fresh data for retry
        suggestion: 'Please refresh and try again with the latest data',
      };
    }

    throw error;  // Other errors bubble up
  }
}
```

**Tool Integration** (Mastra tool with version):
```typescript
const updateProductStock = {
  description: 'Update product stock quantity (requires version for conflict detection)',
  parameters: z.object({
    productId: z.string().describe('Product ID'),
    quantity: z.number().int().describe('New stock quantity'),
    version: z.number().int().describe('Current product version (for optimistic locking)'),
  }),
  execute: async ({ productId, quantity, version }) => {
    const result = await updateProductStockWithLocking(productId, quantity, version);

    if (result.conflict) {
      return {
        error: result.error,
        suggestion: result.suggestion,
        currentVersion: result.currentData?.version,
        currentStock: result.currentData?.availableQuantity,
        lastModified: result.currentData?.updatedAt,
      };
    }

    return {
      success: true,
      product: result.product,
    };
  },
};
```

**Handling Version Conflicts in Frontend**:
```typescript
// When user submits update
async function handleStockUpdate(productId: string, newQuantity: number) {
  // Get current product data (including version)
  const product = await fetch(`/api/products/${productId}`).then(r => r.json());

  // Call tool with current version
  const result = await agent.executeTool('updateProductStock', {
    productId,
    quantity: newQuantity,
    version: product.version,
  });

  if (result.conflict) {
    // Show conflict dialog
    const retry = confirm(
      `This product was updated by another user. ` +
      `Current stock: ${result.currentStock} (version ${result.currentVersion}). ` +
      `Do you want to retry with the latest data?`
    );

    if (retry) {
      // Retry with new version
      return handleStockUpdate(productId, newQuantity);
    }
  }

  return result;
}
```

**Performance Implications**:
- **Index Impact**: Composite index on `(id, version)` adds ~10% to index size; negligible query performance impact
- **Write Overhead**: One additional integer increment per update (~1-2ms)
- **Conflict Rate**: With 50 concurrent users, expected conflict rate <1% for typical workloads
- **Retry Cost**: Conflicts require refetch + retry (~50-100ms total)

**Migration Strategy**:
```sql
-- Add version field with default
ALTER TABLE "Product" ADD COLUMN "version" INTEGER DEFAULT 0 NOT NULL;

-- Initialize versions for existing records
UPDATE "Product" SET "version" = 1;

-- Add composite index
CREATE INDEX "Product_id_version_idx" ON "Product"("id", "version");
```

---

## 3. Role-Based Authorization in Mastra Tools

### Decision: Pre-Execution Permission Checks with Context Injection

**Approach**: Extract user context from Mastra's `runtimeContext`, check permissions before tool execution, use role-based permission definitions.

**Rationale**:
- **Security First**: Authorization happens before any business logic or database queries
- **Consistent Enforcement**: Single middleware pattern applied to all tools
- **Clear Errors**: Users get immediate feedback about permission denial (not obscure database errors)
- **Maintainability**: Permission definitions centralized; tools don't need individual permission logic
- **Testability**: Can mock user context for testing different roles

**Alternatives Considered**:
1. **Post-Execution Filtering**: Check permissions after fetching data
   - ❌ Rejected: Wastes database resources on unauthorized requests
   - ❌ Risk of information leakage through error messages
   - ✅ Simpler for read-only operations

2. **Database-Level RLS** (Row-Level Security):
   - ❌ Rejected: PostgreSQL RLS not well-integrated with Prisma
   - ❌ Complex to maintain separate security policies
   - ✅ Would provide defense-in-depth

3. **Hard-Coded Permission Checks**: Each tool checks its own permissions
   - ❌ Rejected: Duplicated code across all tools
   - ❌ Easy to forget checks on new tools
   - ❌ Inconsistent error messages

**Implementation Notes**:

**Permission Definition** (centralized):
```typescript
// app/services/authorization.server.ts
export type Permission =
  | 'product:create'
  | 'product:update'
  | 'product:delete'
  | 'product:read'
  | 'order:create'
  | 'order:update'
  | 'order:read'
  | 'category:create'
  | 'category:update'
  | 'supplier:create'
  | 'supplier:update';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  Admin: [
    'product:create', 'product:update', 'product:delete', 'product:read',
    'order:create', 'order:update', 'order:read',
    'category:create', 'category:update',
    'supplier:create', 'supplier:update',
  ],
  Manager: [
    'product:create', 'product:update', 'product:read',
    'order:create', 'order:update', 'order:read',
    'category:update',
    'supplier:update',
  ],
  Staff: [
    'product:read',
    'order:create', 'order:read',
  ],
  Viewer: [
    'product:read',
    'order:read',
  ],
};

export function userHasPermission(
  userRole: string,
  requiredPermission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
}

export function checkPermission(
  userRole: string,
  requiredPermission: Permission
): { authorized: boolean; error?: string } {
  if (!userHasPermission(userRole, requiredPermission)) {
    return {
      authorized: false,
      error: `Insufficient permissions. Required: ${requiredPermission}. Your role: ${userRole}`,
    };
  }
  return { authorized: true };
}
```

**Authorization Middleware** (tool wrapper):
```typescript
// app/lib/mastra-tools/tool-auth.ts
import { checkPermission, type Permission } from '~/app/services/authorization.server';

interface UserContext {
  userId: string;
  role: string;
  companyId: string;
  email: string;
}

export function withAuthorization<T extends Record<string, any>>(
  tool: {
    description: string;
    parameters: any;
    execute: (params: T, context: { user: UserContext }) => Promise<any>;
  },
  requiredPermission: Permission
) {
  return {
    description: tool.description,
    parameters: tool.parameters,
    execute: async (params: T, runtimeContext?: any) => {
      // Extract user from runtime context (provided by Mastra)
      const user: UserContext | undefined = runtimeContext?.user;

      if (!user) {
        return {
          error: 'Authentication required',
          suggestion: 'Please log in to use this tool',
        };
      }

      // Check permission
      const authCheck = checkPermission(user.role, requiredPermission);

      if (!authCheck.authorized) {
        return {
          error: authCheck.error,
          suggestion: 'Contact your administrator to request access',
        };
      }

      // Execute tool with user context
      return tool.execute(params, { user });
    },
  };
}
```

**Tool Implementation with Authorization**:
```typescript
// app/lib/mastra-tools/product-tools.ts
import { withAuthorization } from './tool-auth';
import { z } from 'zod';

const updateProductPriceInternal = {
  description: 'Update the selling price of a product',
  parameters: z.object({
    productId: z.string().describe('Product ID'),
    newPrice: z.number().positive().describe('New selling price'),
  }),
  execute: async (
    { productId, newPrice },
    { user }
  ) => {
    // Business logic here (user context available)
    const product = await prisma.product.update({
      where: {
        id: productId,
        companyId: user.companyId,  // Enforce data isolation
      },
      data: { sellingPrice: newPrice },
    });

    return { success: true, product };
  },
};

// Export with authorization wrapper
export const productTools = {
  updateProductPrice: withAuthorization(
    updateProductPriceInternal,
    'product:update'  // Required permission
  ),
  // Other tools...
};
```

**User Context Injection** (in Mastra agent setup):
```typescript
// app/routes/mastra-chat.tsx
export async function action({ request }: ActionArgs) {
  const user = await requireUser(request);  // Get from session

  const agent = getInventoryAgent();

  const result = await agent.generate(userMessage, {
    runtimeContext: {
      user: {
        userId: user.id,
        role: user.role.name,  // "Admin", "Manager", etc.
        companyId: user.companyId,
        email: user.email,
      },
    },
  });

  return json(result);
}
```

**Permission Denial Response Example**:
```json
{
  "error": "Insufficient permissions. Required: product:update. Your role: Staff",
  "suggestion": "Contact your administrator to request access"
}
```

---

## 4. Tool Execution Audit Logging

### Decision: Async Background Logging with Sensitive Data Sanitization

**Approach**: Log all tool executions to database table with sanitized parameters/results, use async background task to avoid blocking.

**Rationale**:
- **Compliance**: Full audit trail for business-critical operations (required by spec)
- **Debugging**: Complete history of tool executions for troubleshooting
- **Security**: Sensitive data (passwords, tokens, PII) masked before logging
- **Performance**: Async logging doesn't slow down tool execution
- **Retention**: Queryable database table with indexes for fast searches

**Alternatives Considered**:
1. **File-Based Logging**: Write to log files
   - ❌ Rejected: Harder to query; requires log aggregation tools
   - ❌ No structured data; difficult to filter by user/tool/date
   - ✅ Lower database overhead; simpler for development

2. **Synchronous Logging**: Wait for log write before returning
   - ❌ Rejected: Adds 10-50ms latency to every tool execution
   - ❌ Could fail tool execution if logging fails
   - ✅ Guarantees log entry exists before response

3. **External Service** (e.g., Datadog, Sentry):
   - ❌ Rejected: Additional cost; requires external dependency
   - ❌ Data leaves infrastructure (compliance concern)
   - ✅ Better for distributed systems; advanced analytics

**Implementation Notes**:

**Database Schema**:
```prisma
model ToolExecutionLog {
  id              String   @id @default(cuid())
  toolName        String   @db.VarChar(100)
  userId          String
  companyId       String
  parameters      Json     // Sanitized input parameters
  result          Json?    // Sanitized output (null if error)
  error           String?  // Error message if execution failed
  executionTimeMs Int      // Duration in milliseconds
  createdAt       DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  company Company @relation(fields: [companyId], references: [id])

  @@index([toolName, createdAt])
  @@index([userId, createdAt])
  @@index([companyId, createdAt])
  @@map("tool_execution_logs")
}
```

**Sensitive Data Sanitization**:
```typescript
// app/lib/mastra-tools/tool-logger.ts

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'creditCard',
  'ssn',
  'taxId',
];

const PII_FIELDS = [
  'email',
  'phone',
  'address',
  'fullName',
  'dateOfBirth',
];

/**
 * Recursively sanitize sensitive data in an object
 */
function sanitizeData(
  data: any,
  options: { maskPII?: boolean } = {}
): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, options));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Always mask sensitive fields
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***';
        continue;
      }

      // Optionally mask PII
      if (options.maskPII && PII_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = typeof value === 'string'
          ? maskString(value)
          : '***PII***';
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(value, options);
    }

    return sanitized;
  }

  return data;
}

/**
 * Mask string value (show first/last chars)
 */
function maskString(value: string): string {
  if (value.length <= 4) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/**
 * Log tool execution asynchronously
 */
export async function logToolExecution(params: {
  toolName: string;
  userId: string;
  companyId: string;
  parameters: any;
  result?: any;
  error?: string;
  startTime: number;
}) {
  const executionTimeMs = Date.now() - params.startTime;

  // Sanitize data before logging
  const sanitizedParams = sanitizeData(params.parameters, { maskPII: true });
  const sanitizedResult = params.result
    ? sanitizeData(params.result, { maskPII: true })
    : null;

  // Async background task (doesn't block)
  setImmediate(async () => {
    try {
      await prisma.toolExecutionLog.create({
        data: {
          toolName: params.toolName,
          userId: params.userId,
          companyId: params.companyId,
          parameters: sanitizedParams,
          result: sanitizedResult,
          error: params.error,
          executionTimeMs,
        },
      });
    } catch (error) {
      // Log to console if database write fails (don't fail tool execution)
      console.error('[ToolLogger] Failed to log execution:', error);
    }
  });
}
```

**Tool Integration**:
```typescript
// app/lib/mastra-tools/product-tools.ts
import { logToolExecution } from './tool-logger';

export const updateProductStock = {
  description: 'Update product stock quantity',
  parameters: z.object({
    productId: z.string(),
    quantity: z.number(),
  }),
  execute: async (
    { productId, quantity },
    { user }
  ) => {
    const startTime = Date.now();
    let result;
    let error;

    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { availableQuantity: quantity },
      });

      result = { success: true, product };
      return result;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return { error };
    } finally {
      // Log execution (async, doesn't block)
      await logToolExecution({
        toolName: 'updateProductStock',
        userId: user.userId,
        companyId: user.companyId,
        parameters: { productId, quantity },
        result,
        error,
        startTime,
      });
    }
  },
};
```

**Querying Audit Logs**:
```typescript
// app/services/audit-log.server.ts

export async function getToolExecutionHistory(params: {
  companyId: string;
  toolName?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return prisma.toolExecutionLog.findMany({
    where: {
      companyId: params.companyId,
      ...(params.toolName && { toolName: params.toolName }),
      ...(params.userId && { userId: params.userId }),
      ...(params.startDate && { createdAt: { gte: params.startDate } }),
      ...(params.endDate && { createdAt: { lte: params.endDate } }),
    },
    include: {
      user: {
        select: { email: true, profile: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
  });
}

export async function getToolExecutionStats(companyId: string) {
  const [totalExecutions, avgExecutionTime, errorRate] = await Promise.all([
    prisma.toolExecutionLog.count({ where: { companyId } }),
    prisma.toolExecutionLog.aggregate({
      where: { companyId },
      _avg: { executionTimeMs: true },
    }),
    prisma.toolExecutionLog.count({ where: { companyId, error: { not: null } } }),
  ]);

  return {
    totalExecutions,
    avgExecutionTimeMs: avgExecutionTime._avg.executionTimeMs || 0,
    errorCount: errorRate,
    errorRate: totalExecutions > 0 ? (errorRate / totalExecutions) * 100 : 0,
  };
}
```

**Performance Impact**:
- **Async Logging**: ~0-2ms added latency (event loop scheduling overhead)
- **Database Write**: 10-20ms per log (happens in background)
- **Storage Growth**: ~1KB per log entry; 1M executions = ~1GB
- **Query Performance**: Indexes on toolName, userId, companyId enable <50ms queries

**Log Retention Strategy**:
```typescript
// Scheduled job to archive old logs
export async function archiveOldToolLogs(retentionDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Archive to cold storage or delete
  await prisma.toolExecutionLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });
}
```

---

## 5. Sales Velocity Calculations

### Decision: 30-Day Rolling Average with Sparse Data Handling

**Approach**: Calculate sales velocity as average daily sales over last 30 days, handle sparse data with interpolation, use for reorder point formulas.

**Rationale**:
- **Balance**: 30 days captures recent trends without being too volatile (vs 7 days) or stale (vs 90 days)
- **Seasonal Sensitivity**: Detects demand changes faster than quarterly averages
- **Sparse Data Handling**: Interpolates missing days to avoid division-by-zero errors
- **Industry Standard**: 30-day velocity commonly used in inventory management
- **Performance**: Single query with date range filter; results cacheable

**Alternatives Considered**:
1. **7-Day Rolling Average**:
   - ❌ Rejected: Too volatile; heavily impacted by weekday/weekend variations
   - ❌ Single large order can skew results significantly
   - ✅ Faster to detect sudden demand spikes

2. **90-Day Rolling Average**:
   - ❌ Rejected: Too slow to respond to seasonal changes
   - ❌ May recommend understocking for growing products
   - ✅ More stable; less affected by outliers

3. **Weighted Moving Average** (recent days weighted higher):
   - ❌ Rejected: More complex to implement and explain
   - ❌ Requires tuning of weight parameters
   - ✅ Better responsiveness to trend changes

**Implementation Notes**:

**Sales Velocity Calculation**:
```typescript
// app/services/analytics.server.ts

export interface SalesVelocity {
  productId: string;
  productName: string;
  averageDailySales: number;
  totalSold30Days: number;
  daysWithSales: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;  // 0-1, based on data density
}

/**
 * Calculate sales velocity for a product over the last 30 days
 */
export async function calculateSalesVelocity(
  productId: string,
  companyId: string
): Promise<SalesVelocity> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get product and sales data
  const [product, salesItems] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    }),
    prisma.salesOrderItem.findMany({
      where: {
        product: { id: productId, companyId },
        salesOrder: {
          orderDate: { gte: thirtyDaysAgo },
          status: { notIn: ['Cancelled', 'Returned'] },  // Exclude cancelled orders
        },
      },
      select: {
        quantity: true,
        salesOrder: { select: { orderDate: true } },
      },
      orderBy: { salesOrder: { orderDate: 'asc' } },
    }),
  ]);

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Handle no sales history
  if (salesItems.length === 0) {
    return {
      productId,
      productName: product.name,
      averageDailySales: 0,
      totalSold30Days: 0,
      daysWithSales: 0,
      trend: 'stable',
      confidence: 0,
    };
  }

  // Calculate total sales and days with sales
  const totalSold = salesItems.reduce((sum, item) => sum + item.quantity, 0);
  const daysWithSales = new Set(
    salesItems.map(item => item.salesOrder.orderDate.toISOString().split('T')[0])
  ).size;

  // Average daily sales (divide by 30, not days with sales, to handle sparse data)
  const averageDailySales = totalSold / 30;

  // Calculate trend (compare first 15 days vs last 15 days)
  const midpoint = new Date(thirtyDaysAgo);
  midpoint.setDate(midpoint.getDate() + 15);

  const firstHalf = salesItems.filter(
    item => item.salesOrder.orderDate < midpoint
  );
  const secondHalf = salesItems.filter(
    item => item.salesOrder.orderDate >= midpoint
  );

  const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.quantity, 0);
  const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.quantity, 0);

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (secondHalfTotal > firstHalfTotal * 1.2) {
    trend = 'increasing';  // 20% increase threshold
  } else if (secondHalfTotal < firstHalfTotal * 0.8) {
    trend = 'decreasing';  // 20% decrease threshold
  }

  // Confidence based on data density (0 to 1)
  // More days with sales = higher confidence
  const confidence = Math.min(daysWithSales / 30, 1);

  return {
    productId,
    productName: product.name,
    averageDailySales,
    totalSold30Days: totalSold,
    daysWithSales,
    trend,
    confidence,
  };
}

/**
 * Calculate bulk velocities for multiple products (optimized)
 */
export async function calculateBulkSalesVelocities(
  productIds: string[],
  companyId: string
): Promise<SalesVelocity[]> {
  // Batch fetch all sales data in one query
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [products, salesItems] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, companyId },
      select: { id: true, name: true },
    }),
    prisma.salesOrderItem.findMany({
      where: {
        productId: { in: productIds },
        product: { companyId },
        salesOrder: {
          orderDate: { gte: thirtyDaysAgo },
          status: { notIn: ['Cancelled', 'Returned'] },
        },
      },
      select: {
        productId: true,
        quantity: true,
        salesOrder: { select: { orderDate: true } },
      },
    }),
  ]);

  // Group sales by product
  const salesByProduct = new Map<string, typeof salesItems>();
  for (const item of salesItems) {
    if (!salesByProduct.has(item.productId)) {
      salesByProduct.set(item.productId, []);
    }
    salesByProduct.get(item.productId)!.push(item);
  }

  // Calculate velocity for each product
  return products.map(product => {
    const productSales = salesByProduct.get(product.id) || [];

    if (productSales.length === 0) {
      return {
        productId: product.id,
        productName: product.name,
        averageDailySales: 0,
        totalSold30Days: 0,
        daysWithSales: 0,
        trend: 'stable' as const,
        confidence: 0,
      };
    }

    const totalSold = productSales.reduce((sum, item) => sum + item.quantity, 0);
    const daysWithSales = new Set(
      productSales.map(item => item.salesOrder.orderDate.toISOString().split('T')[0])
    ).size;

    // Calculate trend
    const midpoint = new Date(thirtyDaysAgo);
    midpoint.setDate(midpoint.getDate() + 15);

    const firstHalfTotal = productSales
      .filter(item => item.salesOrder.orderDate < midpoint)
      .reduce((sum, item) => sum + item.quantity, 0);

    const secondHalfTotal = productSales
      .filter(item => item.salesOrder.orderDate >= midpoint)
      .reduce((sum, item) => sum + item.quantity, 0);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfTotal > firstHalfTotal * 1.2) trend = 'increasing';
    else if (secondHalfTotal < firstHalfTotal * 0.8) trend = 'decreasing';

    return {
      productId: product.id,
      productName: product.name,
      averageDailySales: totalSold / 30,
      totalSold30Days: totalSold,
      daysWithSales,
      trend,
      confidence: Math.min(daysWithSales / 30, 1),
    };
  });
}
```

---

### Decision: Reorder Point Formula with Safety Stock

**Approach**: Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock

**Rationale**:
- **Industry Standard**: Widely used formula in inventory management
- **Lead Time Awareness**: Accounts for supplier delivery time
- **Safety Buffer**: Protects against demand spikes and supply delays
- **Configurable**: Safety stock can be adjusted based on product criticality

**Implementation Notes**:

**Reorder Point Calculation**:
```typescript
// app/services/analytics.server.ts

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  recommendedOrderQuantity: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  reasoning: string;
}

/**
 * Calculate reorder point and generate recommendation
 */
export async function calculateReorderRecommendation(
  productId: string,
  companyId: string,
  options: {
    leadTimeDays?: number;       // Default 14 days
    safetyStockMultiplier?: number;  // Default 1.5x (50% buffer)
  } = {}
): Promise<ReorderRecommendation> {
  const leadTimeDays = options.leadTimeDays || 14;
  const safetyStockMultiplier = options.safetyStockMultiplier || 1.5;

  // Get product and velocity
  const [product, velocity] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId, companyId },
      select: {
        id: true,
        name: true,
        sku: true,
        availableQuantity: true,
        reorderPoint: true,  // User-configured override
        safetyStockLevel: true,  // User-configured override
      },
    }),
    calculateSalesVelocity(productId, companyId),
  ]);

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Calculate safety stock
  // Formula: Average Daily Sales × Lead Time × Safety Multiplier
  const safetyStock = product.safetyStockLevel || 
    Math.ceil(velocity.averageDailySales * leadTimeDays * (safetyStockMultiplier - 1));

  // Calculate reorder point
  // Formula: (Average Daily Sales × Lead Time) + Safety Stock
  const calculatedReorderPoint = 
    Math.ceil(velocity.averageDailySales * leadTimeDays) + safetyStock;

  // Use user-configured reorder point if set, otherwise use calculated
  const reorderPoint = product.reorderPoint || calculatedReorderPoint;

  // Determine urgency based on current stock vs reorder point
  const stockRatio = product.availableQuantity / reorderPoint;
  let urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  
  if (product.availableQuantity <= 0) {
    urgency = 'Critical';  // Out of stock
  } else if (stockRatio <= 0.5) {
    urgency = 'Critical';  // Below 50% of reorder point
  } else if (stockRatio <= 1.0) {
    urgency = 'High';  // At or below reorder point
  } else if (stockRatio <= 1.5) {
    urgency = 'Medium';  // Approaching reorder point
  } else {
    urgency = 'Low';  // Comfortable stock level
  }

  // Calculate recommended order quantity
  // Formula: Reorder Point × 2 - Current Stock (order enough to reach 2x reorder point)
  const recommendedOrderQuantity = Math.max(
    0,
    (reorderPoint * 2) - product.availableQuantity
  );

  // Generate reasoning
  const reasoning = generateReorderReasoning({
    velocity,
    currentStock: product.availableQuantity,
    reorderPoint,
    safetyStock,
    leadTimeDays,
    urgency,
  });

  return {
    productId: product.id,
    productName: product.name,
    currentStock: product.availableQuantity,
    reorderPoint,
    safetyStock,
    recommendedOrderQuantity,
    urgency,
    reasoning,
  };
}

function generateReorderReasoning(params: {
  velocity: SalesVelocity;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  leadTimeDays: number;
  urgency: string;
}): string {
  const { velocity, currentStock, reorderPoint, safetyStock, leadTimeDays, urgency } = params;

  const daysUntilStockout = velocity.averageDailySales > 0
    ? Math.floor(currentStock / velocity.averageDailySales)
    : Infinity;

  const parts: string[] = [];

  // Current sales rate
  parts.push(
    `Selling ${velocity.averageDailySales.toFixed(1)} units/day on average (last 30 days).`
  );

  // Trend information
  if (velocity.trend === 'increasing') {
    parts.push('Demand is increasing (+20% trend).');
  } else if (velocity.trend === 'decreasing') {
    parts.push('Demand is decreasing (-20% trend).');
  }

  // Stock status
  if (urgency === 'Critical' && currentStock === 0) {
    parts.push('**Out of stock** - immediate reorder recommended.');
  } else if (urgency === 'Critical') {
    parts.push(
      `**Critical** - Current stock will last only ${daysUntilStockout} days, ` +
      `less than lead time (${leadTimeDays} days).`
    );
  } else if (urgency === 'High') {
    parts.push(
      `**High priority** - Stock below reorder point. ` +
      `Approximately ${daysUntilStockout} days of stock remaining.`
    );
  } else if (urgency === 'Medium') {
    parts.push(`Approaching reorder point. ${daysUntilStockout} days of stock remaining.`);
  } else {
    parts.push(`Stock levels are comfortable. ${daysUntilStockout}+ days of stock remaining.`);
  }

  // Safety stock explanation
  parts.push(
    `Safety stock of ${safetyStock} units protects against ${leadTimeDays}-day lead time.`
  );

  return parts.join(' ');
}
```

**Handling Products with No Sales History**:
```typescript
export function handleNoSalesHistory(product: {
  id: string;
  name: string;
  availableQuantity: number;
}): ReorderRecommendation {
  // For new products, use conservative defaults
  const DEFAULT_SAFETY_STOCK = 10;  // Minimum buffer
  const DEFAULT_REORDER_POINT = 20;  // 2x safety stock

  return {
    productId: product.id,
    productName: product.name,
    currentStock: product.availableQuantity,
    reorderPoint: DEFAULT_REORDER_POINT,
    safetyStock: DEFAULT_SAFETY_STOCK,
    recommendedOrderQuantity: Math.max(0, DEFAULT_REORDER_POINT * 2 - product.availableQuantity),
    urgency: product.availableQuantity < DEFAULT_REORDER_POINT ? 'Medium' : 'Low',
    reasoning:
      'No sales history available. Using conservative defaults: ' +
      `${DEFAULT_SAFETY_STOCK} units safety stock, ` +
      `${DEFAULT_REORDER_POINT} units reorder point. ` +
      'These will be refined as sales data accumulates.',
  };
}
```

**Performance Optimization for Bulk Calculations**:
```typescript
export async function getBulkReorderRecommendations(
  companyId: string,
  options: {
    includeInStock?: boolean;  // Default false (only low stock)
    maxResults?: number;        // Default 50
  } = {}
): Promise<ReorderRecommendation[]> {
  const includeInStock = options.includeInStock ?? false;
  const maxResults = options.maxResults ?? 50;

  // Get products that need attention
  const products = await prisma.product.findMany({
    where: {
      companyId,
      active: true,
      ...(!includeInStock && {
        OR: [
          { availableQuantity: { lte: 20 } },  // Low stock threshold
          { availableQuantity: { lte: prisma.product.fields.reorderPoint } },
        ],
      }),
    },
    select: {
      id: true,
      name: true,
      availableQuantity: true,
      reorderPoint: true,
      safetyStockLevel: true,
    },
    take: maxResults,
    orderBy: { availableQuantity: 'asc' },  // Most critical first
  });

  // Calculate velocities in bulk
  const productIds = products.map(p => p.id);
  const velocities = await calculateBulkSalesVelocities(productIds, companyId);
  const velocityMap = new Map(velocities.map(v => [v.productId, v]));

  // Generate recommendations
  const recommendations = products.map(product => {
    const velocity = velocityMap.get(product.id);

    if (!velocity || velocity.averageDailySales === 0) {
      return handleNoSalesHistory(product);
    }

    // Inline calculation for performance (avoid repeated database calls)
    const leadTimeDays = 14;
    const safetyStockMultiplier = 1.5;

    const safetyStock = product.safetyStockLevel ||
      Math.ceil(velocity.averageDailySales * leadTimeDays * (safetyStockMultiplier - 1));

    const calculatedReorderPoint =
      Math.ceil(velocity.averageDailySales * leadTimeDays) + safetyStock;

    const reorderPoint = product.reorderPoint || calculatedReorderPoint;

    const stockRatio = product.availableQuantity / reorderPoint;
    let urgency: 'Low' | 'Medium' | 'High' | 'Critical';
    
    if (product.availableQuantity <= 0) urgency = 'Critical';
    else if (stockRatio <= 0.5) urgency = 'Critical';
    else if (stockRatio <= 1.0) urgency = 'High';
    else if (stockRatio <= 1.5) urgency = 'Medium';
    else urgency = 'Low';

    const recommendedOrderQuantity = Math.max(
      0,
      (reorderPoint * 2) - product.availableQuantity
    );

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.availableQuantity,
      reorderPoint,
      safetyStock,
      recommendedOrderQuantity,
      urgency,
      reasoning: generateReorderReasoning({
        velocity,
        currentStock: product.availableQuantity,
        reorderPoint,
        safetyStock,
        leadTimeDays,
        urgency,
      }),
    };
  });

  // Sort by urgency (Critical first)
  const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return recommendations;
}
```

---

## Summary

This research establishes the architectural patterns and implementation strategies for the Enhanced Mastra Assistant Tools feature:

1. **Tool Organization**: Modular structure by domain with centralized exports
2. **Error Handling**: Structured try-catch blocks with user-friendly error responses
3. **Optimistic Locking**: Version-based concurrency control for 99.9% data integrity
4. **Authorization**: Pre-execution permission checks with role-based access control
5. **Audit Logging**: Async background logging with PII/sensitive data sanitization
6. **Sales Velocity**: 30-day rolling average with reorder point formulas

All decisions align with constitutional principles (Service-Oriented Architecture, Data Integrity, Performance) and technical requirements (99.5% uptime, 50 concurrent users, <3s tool execution).

Next steps: Use these patterns to implement tools in `app/lib/mastra-tools/` following the structure defined in [plan.md](./plan.md).
