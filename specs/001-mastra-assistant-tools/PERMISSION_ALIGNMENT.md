# Permission System Alignment

## Overview
The authorization service has been aligned with the existing database permission format used in seed data.

## Permission Format
Database permissions follow the pattern: `action:resource`

### Standard Actions
- `read` - View/retrieve data
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Remove records

### Standard Resources
- `products` - Product inventory items
- `categories` - Product categories
- `suppliers` - Supplier management
- `purchaseOrders` - Purchase order management
- `salesOrders` - Sales order management
- `analytics` - Business analytics and reports

## Permission Hierarchy
The system implements a permission hierarchy where higher permissions imply lower permissions:

```
delete > update > create > read
```

### Examples
- User with `delete:products` can also perform `update:products`, `create:products`, and `read:products`
- User with `update:products` can also perform `create:products` and `read:products`
- User with `create:products` can also perform `read:products`
- User with `read:products` can only read products

## Mastra Tool Permission Mapping

| Tool Operation | Required Permission | Resource |
|---------------|-------------------|----------|
| View inventory | `read:products` | products |
| Update stock | `update:products` | products |
| Update price | `update:products` | products |
| Create product | `create:products` | products |
| Update product | `update:products` | products |
| View categories | `read:categories` | categories |
| Manage categories | `update:categories` | categories |
| View orders | `read:salesOrders` | salesOrders |
| Manage orders | `update:salesOrders` | salesOrders |
| View suppliers | `read:suppliers` | suppliers |
| Manage suppliers | `update:suppliers` | suppliers |
| Manage POs | `update:purchaseOrders` | purchaseOrders |
| View reports | `read:analytics` | analytics |

## Role Permissions (from seed data)

### Admin
Has ALL permissions including:
- All CRUD operations on products, categories, suppliers, purchaseOrders, salesOrders
- Full analytics access
- User and role management

### Inventory Manager
Has extensive inventory permissions:
- Full CRUD on products, stockAdjustments, categories
- Full CRUD on suppliers, purchaseOrders
- Read access to salesOrders, invoices
- Analytics access

### Warehouse Staff
Has limited inventory permissions:
- Read/Update products
- Read/Create/Update stockAdjustments
- Read categories, suppliers
- Read/Create/Update transferOrders

### Sales Staff
Has customer and order focus:
- Full CRUD on customers, salesOrders
- Read products, categories

### Accountant
Has financial focus:
- Read/Update bills, invoices
- Read purchaseOrders, salesOrders

## Implementation Details

### Authorization Service
Location: `app/services/authorization.server.ts`

Key functions:
- `getUserPermissions(userId)` - Fetches user's permissions from database
- `userHasPermission(permissions, required)` - Checks permission with hierarchy
- `checkPermission(userId, required)` - Complete authorization check

### Permission Enum
```typescript
export enum Permission {
  VIEW_INVENTORY = 'read:products',
  MANAGE_PRODUCTS = 'update:products',
  CREATE_PRODUCTS = 'create:products',
  // ... etc
}
```

### Usage in Tools
```typescript
const authCheck = await checkPermission(userId, Permission.MANAGE_PRODUCTS);
if (!authCheck.authorized) {
  return { error: authCheck.error };
}
```

## Testing Considerations

When testing authorization:
1. Test exact permission matches
2. Test permission hierarchy (e.g., delete user can update)
3. Test missing permissions return proper errors
4. Test with different role types from seed data
5. Verify audit logs capture authorization failures

## Migration Notes

Previous system used hardcoded UPPERCASE permissions like `VIEW_INVENTORY`. The new system:
- Uses database-driven permissions from Role model
- Maps Permission enum values to database strings
- Supports permission hierarchy automatically
- Aligns with existing seed data format
- No database migration required (only code changes)
