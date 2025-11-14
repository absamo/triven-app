# Data Model: Workflow Template and Admin UI Visibility

**Date**: November 13, 2025  
**Feature**: 006-workflow-template-admin-ui  
**Purpose**: Document entities, relationships, and validation rules

## Overview

This feature uses **existing** database entities. No schema changes or migrations required except for updating Admin role permissions.

---

## Entities

### 1. Role (Existing)

**Purpose**: Store user roles with associated permissions

**Schema** (from `prisma/schema.prisma`):
```prisma
model Role {
  id          String    @id @default(cuid())
  name        String
  description String?
  editable    Boolean   @default(false)
  companyId   String?
  permissions String[]  // <-- Array of permission strings
  createdById String?
  updatedById String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime? @updatedAt
  
  // Relations
  company     Company?  @relation(fields: [companyId], references: [id])
  createdBy   User?     @relation("roleCreatedBy", fields: [createdById], references: [id])
  updatedBy   User?     @relation("roleUpdatedBy", fields: [updatedById], references: [id])
  users       User[]
  
  // Workflow Relations
  assignedWorkflowSteps WorkflowStep[]    @relation("WorkflowStepAssigneeRole")
  assignedApprovals     ApprovalRequest[] @relation("ApprovalRequestAssignedRole")
  
  @@unique([name, companyId])
}
```

**Key Fields**:
- `permissions` (String[]): Array of permission strings like `['read:workflows', 'create:workflows']`
- `name` (String): Role name (e.g., "Admin", "Manager", "User")
- `editable` (Boolean): Whether role can be modified by users

**Workflow Permissions** (managed in this feature):
- `read:workflows` - View workflow templates and history
- `create:workflows` - Create new workflow templates
- `update:workflows` - Edit existing workflow templates  
- `delete:workflows` - Delete workflow templates
- `read:approvals` - View and manage approval requests (separate from template management)

**Validation Rules**:
- Role name must be unique per company
- Permissions array must contain valid permission strings
- Admin role should have all workflow permissions by default

**State Transitions**: N/A (no workflow states)

---

### 2. User (Existing)

**Purpose**: Store user accounts with role assignments

**Schema** (relevant fields):
```prisma
model User {
  id                       String                   @id @default(cuid())
  active                   Boolean                  @default(true)
  email                    String                   @unique
  companyId                String?
  roleId                   String?
  status                   UserStatus
  createdAt                DateTime                 @default(now())
  updatedAt                DateTime?                @updatedAt
  name                     String?
  emailVerified            Boolean                  @default(false)
  
  // Relations
  company                  Company?                 @relation(fields: [companyId], references: [id])
  role                     Role?                    @relation(fields: [roleId], references: [id])
  
  // Workflow Relations
  createdWorkflowTemplates WorkflowTemplate[]      @relation("WorkflowTemplateCreatedBy")
  assignedWorkflowSteps    WorkflowStep[]          @relation("WorkflowStepAssigneeUser")
  triggeredWorkflows       WorkflowInstance[]      @relation("WorkflowInstanceTriggeredBy")
  // ... other relations
  
  @@map("user")
}
```

**Key Fields**:
- `roleId` (String): Foreign key to Role (determines permissions)
- `companyId` (String): Foreign key to Company (data isolation)
- `active` (Boolean): Whether user account is active

**Permission Resolution Flow**:
```
User.roleId → Role.permissions → Permission checks in code
```

**Validation Rules**:
- User must belong to exactly one role
- User must belong to exactly one company
- Email must be unique across all users

---

### 3. WorkflowTemplate (Existing)

**Purpose**: Store workflow approval template definitions

**Schema** (from `prisma/schema.prisma`):
```prisma
model WorkflowTemplate {
  id                String              @id @default(cuid())
  name              String
  description       String?
  triggerType       WorkflowTriggerType
  entityType        WorkflowEntityType
  triggerConditions Json?
  isActive          Boolean             @default(true)
  companyId         String
  createdById       String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime?           @updatedAt
  
  // Relations
  company   Company            @relation(fields: [companyId], references: [id])
  createdBy User               @relation("WorkflowTemplateCreatedBy", fields: [createdById], references: [id])
  steps     WorkflowStep[]
  instances WorkflowInstance[]
  
  @@index([companyId, isActive])
  @@index([entityType, isActive])
}
```

**Key Fields**:
- `name` (String): Template name (e.g., "Purchase Order Approval")
- `triggerType` (Enum): When workflow triggers (manual, automatic)
- `entityType` (Enum): What entity type workflow applies to (purchase_order, sales_order, etc.)
- `isActive` (Boolean): Whether template is currently in use

**Enums**:
```prisma
enum WorkflowTriggerType {
  MANUAL
  AUTOMATIC
  SCHEDULED
}

enum WorkflowEntityType {
  PURCHASE_ORDER
  SALES_ORDER
  INVOICE
  BILL
  INVENTORY_ADJUSTMENT
  TRANSFER_ORDER
}
```

**Validation Rules**:
- Template name must be unique per company
- Must have at least one workflow step
- Active templates cannot be deleted (must be deactivated first)

**State Transitions**: 
- Draft → Active (when template is published)
- Active → Inactive (when template is deactivated)

---

### 4. WorkflowStep (Existing)

**Purpose**: Define individual approval steps within a workflow template

**Schema**:
```prisma
model WorkflowStep {
  id                 String               @id @default(cuid())
  workflowTemplateId String
  stepNumber         Int
  name               String
  description        String?
  stepType           WorkflowStepType
  assigneeType       ApprovalAssigneeType
  assigneeRoleId     String?
  assigneeUserId     String?
  conditions         Json?
  autoApprove        Boolean              @default(false)
  timeoutHours       Int?
  isRequired         Boolean              @default(true)
  allowParallel      Boolean              @default(false)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime?            @updatedAt
  
  // Relations
  workflowTemplate WorkflowTemplate        @relation(fields: [workflowTemplateId], references: [id], onDelete: Cascade)
  assigneeRole     Role?                   @relation("WorkflowStepAssigneeRole", fields: [assigneeRoleId], references: [id])
  assigneeUser     User?                   @relation("WorkflowStepAssigneeUser", fields: [assigneeUserId], references: [id])
  executions       WorkflowStepExecution[]
  
  @@unique([workflowTemplateId, stepNumber])
  @@index([workflowTemplateId, stepNumber])
}
```

**Enums**:
```prisma
enum WorkflowStepType {
  APPROVAL
  NOTIFICATION
  WEBHOOK
  CUSTOM
}

enum ApprovalAssigneeType {
  ROLE
  USER
  DYNAMIC
}
```

**Validation Rules**:
- Step numbers must be sequential within a template
- If assigneeType is ROLE, assigneeRoleId must be set
- If assigneeType is USER, assigneeUserId must be set
- Steps are deleted cascade when template is deleted

---

### 5. WorkflowInstance (Existing)

**Purpose**: Track execution of workflow templates for specific entities

**Schema**:
```prisma
model WorkflowInstance {
  id                 String             @id @default(cuid())
  workflowTemplateId String
  entityType         WorkflowEntityType
  entityId           String
  status             WorkflowStatus
  currentStepNumber  Int?
  triggeredBy        String
  data               Json
  metadata           Json?
  startedAt          DateTime           @default(now())
  completedAt        DateTime?
  cancelledAt        DateTime?
  notes              String?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime?          @updatedAt
  
  // Relations
  workflowTemplate WorkflowTemplate        @relation(fields: [workflowTemplateId], references: [id])
  triggeredByUser  User                    @relation("WorkflowInstanceTriggeredBy", fields: [triggeredBy], references: [id])
  stepExecutions   WorkflowStepExecution[]
  approvalRequests ApprovalRequest[]
  
  @@index([entityType, entityId])
  @@index([status, startedAt])
}
```

**Enum**:
```prisma
enum WorkflowStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
  FAILED
}
```

**Validation Rules**:
- Entity type must match template entity type
- Instance cannot be modified once completed/cancelled
- All required steps must be completed before marking complete

---

## Entity Relationships

```
Company (1) ──< (many) Role
Role (1) ──< (many) User
User (1) ──< (many) WorkflowTemplate (as creator)
Company (1) ──< (many) WorkflowTemplate
WorkflowTemplate (1) ──< (many) WorkflowStep
WorkflowTemplate (1) ──< (many) WorkflowInstance
Role (1) ──< (many) WorkflowStep (as assignee)
User (1) ──< (many) WorkflowStep (as assignee)
User (1) ──< (many) WorkflowInstance (as triggeredBy)
```

---

## Permission Model

### Permission Strings

All workflow-related permissions follow the format: `{action}:{resource}`

**Workflow Template Permissions**:
- `read:workflows` - View workflow templates and instances
- `create:workflows` - Create new workflow templates
- `update:workflows` - Edit existing workflow templates
- `delete:workflows` - Delete workflow templates

**Approval Permissions** (separate concern):
- `read:approvals` - View approval requests
- `create:approvals` - Request approvals
- `update:approvals` - Approve/reject approval requests

### Permission Storage

Permissions are stored in the `Role.permissions` field as a `String[]` array:

```typescript
// Example Role data
{
  id: "role_abc123",
  name: "Admin",
  permissions: [
    "read:workflows",
    "create:workflows",
    "update:workflows",
    "delete:workflows",
    "read:approvals",
    "create:approvals",
    "update:approvals",
    // ... other permissions
  ]
}
```

### Permission Checks

Permission checks are performed in two layers:

**Layer 1: Route Loaders** (server-side)
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:workflows'])
  // ... load data
}
```

**Layer 2: UI Components** (client-side)
```typescript
const canCreate = permissions.includes('create:workflows')
{canCreate && <Button>Create Template</Button>}
```

---

## Data Migration

### Required Migration: Admin Role Permissions

**Objective**: Ensure all Admin roles have workflow management permissions

**Migration Type**: Data update (not schema change)

**Migration Script** (to be created in `prisma/migrations/`):
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAdminWorkflowPermissions() {
  // Find all Admin roles
  const adminRoles = await prisma.role.findMany({
    where: { name: 'Admin' }
  })
  
  console.log(`Found ${adminRoles.length} Admin roles to update`)
  
  const workflowPermissions = [
    'read:workflows',
    'create:workflows',
    'update:workflows',
    'delete:workflows'
  ]
  
  for (const role of adminRoles) {
    // Merge with existing permissions (avoid duplicates)
    const updatedPermissions = [
      ...new Set([...role.permissions, ...workflowPermissions])
    ]
    
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: updatedPermissions }
    })
    
    console.log(`Updated role: ${role.name} (${role.id})`)
  }
  
  console.log('Admin workflow permissions migration complete')
}

migrateAdminWorkflowPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Rollback Strategy**:
```typescript
// Remove workflow permissions from Admin roles
const workflowPermissions = [
  'read:workflows',
  'create:workflows',
  'update:workflows',
  'delete:workflows'
]

await prisma.role.update({
  where: { id: roleId },
  data: {
    permissions: role.permissions.filter(p => !workflowPermissions.includes(p))
  }
})
```

---

## Seed Data Updates

### Update `prisma/seed.ts`

Add workflow permissions to Admin role in seed script:

```typescript
// In seed.ts - Admin role creation
const adminRole = await prisma.role.create({
  data: {
    name: 'Admin',
    description: 'Administrator with full access',
    companyId: company.id,
    permissions: [
      // ... existing permissions
      'read:workflows',
      'create:workflows',
      'update:workflows',
      'delete:workflows',
      'read:approvals',
      'create:approvals',
      'update:approvals',
    ]
  }
})
```

**Note**: Seed script already creates 16 workflow templates (verified in spec).

---

## Indexes

### Existing Indexes (Sufficient)

```prisma
// WorkflowTemplate
@@index([companyId, isActive])
@@index([entityType, isActive])

// WorkflowStep
@@index([workflowTemplateId, stepNumber])

// WorkflowInstance
@@index([entityType, entityId])
@@index([status, startedAt])

// Role
@@unique([name, companyId])
```

**Analysis**: No additional indexes required. Permission checks use in-memory array operations, not database queries.

---

## Data Access Patterns

### 1. Check User Permissions
```typescript
// Server-side (route loader)
const user = await requireBetterAuthUser(request, ['read:workflows'])

// Client-side (UI component)
const canCreate = user.role.permissions.includes('create:workflows')
```

### 2. List Workflow Templates
```typescript
const templates = await prisma.workflowTemplate.findMany({
  where: { companyId: user.companyId },
  include: {
    createdBy: { include: { profile: true } },
    steps: {
      orderBy: { stepNumber: 'asc' },
      include: {
        assigneeUser: { include: { profile: true } },
        assigneeRole: true
      }
    }
  },
  orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }]
})
```

### 3. Get Template by ID
```typescript
const template = await prisma.workflowTemplate.findUnique({
  where: { id: templateId },
  include: {
    steps: {
      orderBy: { stepNumber: 'asc' }
    }
  }
})
```

### 4. List Workflow Instances (History)
```typescript
const instances = await prisma.workflowInstance.findMany({
  where: { workflowTemplateId: templateId },
  include: {
    workflowTemplate: true,
    triggeredByUser: { include: { profile: true } },
    stepExecutions: {
      include: {
        workflowStep: true,
        assignedToUser: { include: { profile: true } }
      }
    }
  },
  orderBy: { startedAt: 'desc' }
})
```

---

## Summary

### No Schema Changes Required

All necessary database entities and relationships exist. Only data update needed:
- ✅ Role entity has `permissions` array
- ✅ WorkflowTemplate entity complete
- ✅ WorkflowStep entity complete
- ✅ WorkflowInstance entity complete
- ✅ User-Role relationship established
- ✅ Indexes optimized for queries

### Required Data Updates

1. **Admin Role Migration**: Add workflow permissions to existing Admin roles
2. **Seed Script Update**: Include workflow permissions in Admin role seed data

### Performance Characteristics

- Permission checks: O(n) where n = number of permissions (~10-50)
- Template queries: Indexed by companyId + isActive
- Instance queries: Indexed by entityType + entityId, status + startedAt
- No N+1 query issues (proper use of `include`)

**Conclusion**: Data model is production-ready. Implementation focuses on UI visibility and permission enforcement using existing entities.
