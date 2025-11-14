# API Contracts: Workflow Template and Admin UI Visibility

**Date**: November 13, 2025  
**Feature**: 006-workflow-template-admin-ui  
**Purpose**: Document API contracts for workflow template management

## Overview

This feature uses **existing API endpoints**. No new API routes required.

All routes are documented here for reference and to clarify permission requirements.

---

## Authentication

All workflow API endpoints require authentication via Better Auth session.

**Authentication Pattern**:
```typescript
// Server-side route loader/action
const user = await requireBetterAuthUser(request, permissions)
```

**Session Cookie**: `better-auth.session_token`

**Error Responses**:
- `401 Unauthorized` - No valid session
- `403 Forbidden` - User lacks required permissions

---

## Permission Requirements

| Endpoint | Method | Required Permission(s) |
|----------|--------|------------------------|
| GET /workflow-templates | GET | `read:workflows` |
| GET /workflow-templates/create | GET | `create:workflows` |
| POST /workflow-templates/create | POST | `create:workflows` |
| GET /workflow-templates/:id | GET | `update:workflows` |
| POST /workflow-templates/:id | POST | `update:workflows` |
| DELETE /workflow-templates/:id | DELETE | `delete:workflows` |
| GET /workflow-history | GET | `read:workflows` |
| GET /workflow-history/:instanceId | GET | `read:workflows` |

---

## Endpoints

### 1. List Workflow Templates

**Route**: `GET /workflow-templates`

**Purpose**: List all workflow templates for user's company

**Required Permission**: `read:workflows`

**Request**: None (no query parameters)

**Response** (React Router loader data):
```typescript
{
  workflowTemplates: Array<{
    id: string
    name: string
    description: string | null
    triggerType: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED'
    entityType: 'PURCHASE_ORDER' | 'SALES_ORDER' | 'INVOICE' | 'BILL' | 'INVENTORY_ADJUSTMENT' | 'TRANSFER_ORDER'
    triggerConditions: object | null
    isActive: boolean
    companyId: string
    createdById: string
    createdAt: string (ISO 8601)
    updatedAt: string (ISO 8601) | null
    createdBy: {
      id: string
      name: string | null
      email: string
      profile: {
        firstName: string | null
        lastName: string | null
      } | null
    }
    steps: Array<{
      id: string
      stepNumber: number
      name: string
      description: string | null
      stepType: 'APPROVAL' | 'NOTIFICATION' | 'WEBHOOK' | 'CUSTOM'
      assigneeType: 'ROLE' | 'USER' | 'DYNAMIC'
      assigneeRoleId: string | null
      assigneeUserId: string | null
      assigneeUser: {
        id: string
        name: string | null
        profile: { firstName: string | null, lastName: string | null } | null
      } | null
      assigneeRole: {
        id: string
        name: string
      } | null
      autoApprove: boolean
      timeoutHours: number | null
      isRequired: boolean
      allowParallel: boolean
    }>
  }>
  users: Array<{
    id: string
    name: string | null
    email: string
    profile: {
      firstName: string | null
      lastName: string | null
    } | null
  }>
  roles: Array<{
    id: string
    name: string
    description: string | null
  }>
  permissions: string[]
  user: {
    id: string
    name: string | null
    email: string
    role: {
      id: string
      name: string
      permissions: string[]
    } | null
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `read:workflows` permission

---

### 2. Create Workflow Template (Form)

**Route**: `GET /workflow-templates/create`

**Purpose**: Load form data for creating a new workflow template

**Required Permission**: `create:workflows`

**Request**: None

**Response** (React Router loader data):
```typescript
{
  users: Array<{
    id: string
    name: string | null
    email: string
    profile: {
      firstName: string | null
      lastName: string | null
    } | null
  }>
  roles: Array<{
    id: string
    name: string
    description: string | null
  }>
  permissions: string[]
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `create:workflows` permission

---

### 3. Create Workflow Template (Submit)

**Route**: `POST /workflow-templates/create`

**Purpose**: Create a new workflow template

**Required Permission**: `create:workflows`

**Request Body** (FormData):
```typescript
{
  name: string              // Required, max 200 chars
  description?: string      // Optional
  triggerType: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED'
  entityType: 'PURCHASE_ORDER' | 'SALES_ORDER' | 'INVOICE' | 'BILL' | 'INVENTORY_ADJUSTMENT' | 'TRANSFER_ORDER'
  triggerConditions?: object  // Optional JSON
  isActive: boolean
  
  // Steps array (at least 1 step required)
  steps: Array<{
    stepNumber: number      // Sequential starting from 1
    name: string
    description?: string
    stepType: 'APPROVAL' | 'NOTIFICATION' | 'WEBHOOK' | 'CUSTOM'
    assigneeType: 'ROLE' | 'USER' | 'DYNAMIC'
    assigneeRoleId?: string   // Required if assigneeType = 'ROLE'
    assigneeUserId?: string   // Required if assigneeType = 'USER'
    autoApprove: boolean
    timeoutHours?: number
    isRequired: boolean
    allowParallel: boolean
  }>
}
```

**Validation Rules** (Zod schema):
```typescript
const workflowTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  triggerType: z.enum(['MANUAL', 'AUTOMATIC', 'SCHEDULED']),
  entityType: z.enum(['PURCHASE_ORDER', 'SALES_ORDER', 'INVOICE', 'BILL', 'INVENTORY_ADJUSTMENT', 'TRANSFER_ORDER']),
  triggerConditions: z.record(z.any()).optional(),
  isActive: z.boolean(),
  steps: z.array(z.object({
    stepNumber: z.number().int().positive(),
    name: z.string().min(1),
    description: z.string().optional(),
    stepType: z.enum(['APPROVAL', 'NOTIFICATION', 'WEBHOOK', 'CUSTOM']),
    assigneeType: z.enum(['ROLE', 'USER', 'DYNAMIC']),
    assigneeRoleId: z.string().optional(),
    assigneeUserId: z.string().optional(),
    autoApprove: z.boolean(),
    timeoutHours: z.number().int().positive().optional(),
    isRequired: z.boolean(),
    allowParallel: z.boolean()
  })).min(1)
})
```

**Response** (React Router redirect):
```typescript
redirect('/workflow-templates')
```

**Status Codes**:
- `302 Found` - Success (redirect to list)
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `create:workflows` permission

**Error Response** (validation failure):
```typescript
{
  errors: {
    name?: string[]
    description?: string[]
    steps?: string[]
    // ... field-specific errors
  }
}
```

---

### 4. Edit Workflow Template (Form)

**Route**: `GET /workflow-templates/:id`

**Purpose**: Load existing template for editing

**Required Permission**: `update:workflows`

**Request Parameters**:
- `id` (path): Workflow template ID (cuid)

**Response** (React Router loader data):
```typescript
{
  template: {
    id: string
    name: string
    description: string | null
    triggerType: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED'
    entityType: 'PURCHASE_ORDER' | 'SALES_ORDER' | etc.
    triggerConditions: object | null
    isActive: boolean
    companyId: string
    createdById: string
    createdAt: string
    updatedAt: string | null
    steps: Array<{
      id: string
      stepNumber: number
      name: string
      // ... full step data
    }>
  }
  users: Array<{ id, name, email, profile }>
  roles: Array<{ id, name, description }>
  permissions: string[]
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `update:workflows` permission
- `404 Not Found` - Template not found or belongs to different company

---

### 5. Update Workflow Template

**Route**: `POST /workflow-templates/:id`

**Purpose**: Update existing workflow template

**Required Permission**: `update:workflows`

**Request Parameters**:
- `id` (path): Workflow template ID (cuid)

**Request Body** (FormData): Same as create endpoint

**Response** (React Router redirect):
```typescript
redirect('/workflow-templates')
```

**Status Codes**:
- `302 Found` - Success (redirect to list)
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `update:workflows` permission
- `404 Not Found` - Template not found

---

### 6. Delete Workflow Template

**Route**: `DELETE /workflow-templates/:id`

**Purpose**: Delete workflow template (soft delete by setting isActive = false)

**Required Permission**: `delete:workflows`

**Request Parameters**:
- `id` (path): Workflow template ID (cuid)

**Request Body**: None

**Response**:
```typescript
{
  success: boolean
  message: string
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `delete:workflows` permission
- `404 Not Found` - Template not found
- `409 Conflict` - Template has active workflow instances (cannot delete)

---

### 7. List Workflow Instances (History)

**Route**: `GET /workflow-history`

**Purpose**: List all workflow instance executions

**Required Permission**: `read:workflows`

**Request**: None

**Response** (React Router loader data):
```typescript
{
  instances: Array<{
    id: string
    workflowTemplateId: string
    entityType: string
    entityId: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
    currentStepNumber: number | null
    triggeredBy: string
    startedAt: string
    completedAt: string | null
    cancelledAt: string | null
    workflowTemplate: {
      id: string
      name: string
      entityType: string
    }
    triggeredByUser: {
      id: string
      name: string | null
      email: string
      profile: { firstName, lastName } | null
    }
    stepExecutions: Array<{
      id: string
      workflowStepId: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED'
      assignedTo: string | null
      startedAt: string
      completedAt: string | null
      decision: 'APPROVED' | 'REJECTED' | null
      workflowStep: {
        stepNumber: number
        name: string
      }
      assignedToUser: {
        id: string
        name: string | null
        profile: { firstName, lastName } | null
      } | null
    }>
  }>
  permissions: string[]
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `read:workflows` permission

---

### 8. View Workflow Instance Details

**Route**: `GET /workflow-history/:instanceId/step`

**Purpose**: View detailed execution history for a specific workflow instance

**Required Permission**: `read:workflows`

**Request Parameters**:
- `instanceId` (path): Workflow instance ID (cuid)

**Response** (React Router loader data):
```typescript
{
  instance: {
    id: string
    workflowTemplateId: string
    entityType: string
    entityId: string
    status: string
    currentStepNumber: number | null
    data: object          // Entity snapshot
    metadata: object | null
    startedAt: string
    completedAt: string | null
    cancelledAt: string | null
    notes: string | null
    workflowTemplate: {
      id: string
      name: string
      description: string | null
    }
    triggeredByUser: {
      id: string
      name: string | null
      email: string
    }
    stepExecutions: Array<{
      id: string
      workflowStepId: string
      status: string
      assignedTo: string | null
      startedAt: string
      completedAt: string | null
      timeoutAt: string | null
      notes: string | null
      decision: string | null
      metadata: object | null
      workflowStep: {
        stepNumber: number
        name: string
        description: string | null
        stepType: string
      }
      assignedToUser: {
        id: string
        name: string | null
        email: string
      } | null
    }>
  }
  permissions: string[]
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Missing `read:workflows` permission
- `404 Not Found` - Instance not found or belongs to different company

---

## Error Handling

### Standard Error Response Format

```typescript
{
  error: string           // Error message
  code?: string          // Error code (e.g., "PERMISSION_DENIED")
  details?: object       // Additional context
}
```

### Common Error Scenarios

**1. Missing Permission**
```json
{
  "error": "You do not have permission to access this resource",
  "code": "PERMISSION_DENIED",
  "details": {
    "required": ["create:workflows"],
    "current": ["read:workflows"]
  }
}
```

**2. Validation Error**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": {
      "name": ["Template name is required"],
      "steps": ["At least one step is required"]
    }
  }
}
```

**3. Not Found**
```json
{
  "error": "Workflow template not found",
  "code": "NOT_FOUND"
}
```

**4. Conflict**
```json
{
  "error": "Cannot delete template with active workflow instances",
  "code": "CONFLICT",
  "details": {
    "activeInstances": 5
  }
}
```

---

## Testing Endpoints

### Using Chrome DevTools MCP

**Test Sequence**:
```typescript
// 1. Login
mcp_chromedevtool_navigate_page({ url: 'http://localhost:3000/login' })
mcp_chromedevtool_fill_form([
  { uid: 'email', value: 'admin@flowtech.com' },
  { uid: 'password', value: 'password123' }
])
mcp_chromedevtool_click({ uid: 'login-btn' })

// 2. Navigate to templates
mcp_chromedevtool_navigate_page({ url: 'http://localhost:3000/workflow-templates' })
mcp_chromedevtool_wait_for({ text: 'Workflow Templates' })
mcp_chromedevtool_take_snapshot()

// 3. Test create form
mcp_chromedevtool_click({ uid: 'create-template-btn' })
mcp_chromedevtool_wait_for({ text: 'Create Workflow Template' })

// 4. Test permissions
// - User without create:workflows should not see create button
// - User without update:workflows should not see edit button
// - User without delete:workflows should not see delete button
```

### Manual Testing with curl

**Get templates** (requires session cookie):
```bash
curl -X GET http://localhost:3000/workflow-templates \
  -H "Cookie: better-auth.session_token=<token>" \
  -H "Accept: application/json"
```

---

## Security Considerations

### 1. Permission Validation

- **Server-side only**: Never trust client-side permission checks
- **Route-level guards**: Validate permissions in every loader/action
- **Company isolation**: Always filter by `user.companyId`

### 2. CSRF Protection

- Forms use React Router's native CSRF protection
- Action endpoints automatically validate CSRF tokens

### 3. Rate Limiting

- Apply rate limiting to creation/update endpoints
- Limit: 60 requests per minute per user

### 4. Input Sanitization

- All inputs validated with Zod schemas
- JSON fields sanitized to prevent injection
- File uploads (if added) validated for type and size

---

## API Versioning

**Current Version**: v1 (implicit, no version prefix)

**Backward Compatibility**:
- Existing workflow template structure stable since v0.17.0
- No breaking changes planned
- New fields added as optional to maintain compatibility

**Deprecation Policy**:
- 3-month notice before deprecation
- Support old and new versions concurrently during transition
- Clear migration guides provided

---

## Summary

### Existing API Endpoints (No Changes)

- ✅ All workflow template CRUD endpoints exist
- ✅ Permission checks implemented in route loaders
- ✅ Validation schemas defined with Zod
- ✅ Error handling standardized
- ✅ Company isolation enforced

### Required Updates (Implementation Phase)

1. **Verify** permission checks in all route loaders
2. **Add** permission-based UI element visibility
3. **Test** API contracts with Chrome DevTools MCP

**Conclusion**: API contracts are complete and production-ready. Implementation phase focuses on UI visibility and permission enforcement, not API changes.
