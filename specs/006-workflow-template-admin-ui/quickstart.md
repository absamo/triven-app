# Quickstart Guide: Workflow Template and Admin UI Visibility

**Date**: November 13, 2025  
**Feature**: 006-workflow-template-admin-ui  
**Purpose**: Developer guide for implementation, testing, and verification

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Development Workflow](#development-workflow)
5. [Testing Strategy](#testing-strategy)
6. [Verification Checklist](#verification-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This feature makes workflow template management pages accessible by:
1. Ensuring Admin roles have workflow permissions
2. Verifying navigation visibility based on permissions
3. Adding permission checks to route loaders
4. Enforcing permission-based UI element visibility

**Key Finding**: Navigation is already implemented! We just need to:
- Add workflow permissions to Admin role
- Verify permission checks in routes
- Add permission-based visibility to UI buttons

---

## Prerequisites

### Required Knowledge
- TypeScript and React
- React Router 7 (loaders, actions, data hooks)
- Mantine UI components
- Prisma ORM
- Better Auth authentication
- Test-Driven Development (TDD)

### Required Tools
- Node.js 20+ or Bun runtime
- PostgreSQL database
- Git
- Code editor (VS Code recommended)

### Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd triven-app

# Checkout feature branch
git checkout 006-workflow-template-admin-ui

# Install dependencies
bun install

# Setup database
bun run db:gen
bun run db:push

# Run seed (includes 16 workflow templates)
bunx prisma db seed

# Start development server
bun run dev
```

---

## Setup Instructions

### Step 1: Verify Database State

**Check Admin role permissions**:
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Query Admin role permissions
SELECT id, name, permissions 
FROM "Role" 
WHERE name = 'Admin';
```

**Expected Result**: Admin role should have workflow permissions:
```json
{
  "permissions": [
    "read:workflows",
    "create:workflows",
    "update:workflows",
    "delete:workflows",
    // ... other permissions
  ]
}
```

**If missing**, run migration script (see Step 2).

---

### Step 2: Run Admin Permission Migration

Create migration script:

```bash
# Create migration file
mkdir -p scripts/migrations
touch scripts/migrations/add-admin-workflow-permissions.ts
```

**Migration Script** (`scripts/migrations/add-admin-workflow-permissions.ts`):
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Admin workflow permissions migration...')
  
  const adminRoles = await prisma.role.findMany({
    where: { name: 'Admin' }
  })
  
  console.log(`Found ${adminRoles.length} Admin roles`)
  
  const workflowPermissions = [
    'read:workflows',
    'create:workflows',
    'update:workflows',
    'delete:workflows'
  ]
  
  let updatedCount = 0
  
  for (const role of adminRoles) {
    const currentPerms = role.permissions as string[]
    const hasAllPerms = workflowPermissions.every(p => currentPerms.includes(p))
    
    if (hasAllPerms) {
      console.log(`✓ Role ${role.name} (${role.id}) already has workflow permissions`)
      continue
    }
    
    const updatedPermissions = [
      ...new Set([...currentPerms, ...workflowPermissions])
    ]
    
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: updatedPermissions }
    })
    
    console.log(`✓ Updated role ${role.name} (${role.id})`)
    updatedCount++
  }
  
  console.log(`\nMigration complete: ${updatedCount} roles updated`)
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

**Run Migration**:
```bash
bun run scripts/migrations/add-admin-workflow-permissions.ts
```

**Verify Migration**:
```bash
# Check updated permissions
psql $DATABASE_URL -c "SELECT name, permissions FROM \"Role\" WHERE name = 'Admin';"
```

---

### Step 3: Update Seed Script

**Edit** `prisma/seed.ts` to include workflow permissions in Admin role:

```typescript
// Find Admin role creation section
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

---

### Step 4: Verify Navigation Implementation

**Check** `app/layouts/Navbar/Navbar.tsx` lines 209-236:

```typescript
// Verify this code exists
const canViewApprovals = 
  permissions.includes('read:approvals') || permissions.includes('read:workflows')

if (canViewApprovals) {
  const workflowSublinks = []
  
  workflowSublinks.push({
    label: t('navigation:approvals'),
    link: '/approvals',
    active: false,
  })

  workflowSublinks.push({
    label: t('navigation:workflowTemplates'),
    link: '/workflow-templates',
    active: false,
  })

  workflowSublinks.push({
    label: t('navigation:workflowHistory'),
    link: '/workflow-history',
    active: false,
  })

  menuItems.push({
    label: t('navigation:workflows'),
    icon: IconChecklist,
    active: false,
    sublinks: workflowSublinks,
  })
}
```

**Status**: ✅ Already implemented correctly

---

### Step 5: Verify Route Permission Guards

**Check each route loader**:

**File**: `app/routes/workflow-templates/workflow-templates.tsx`
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:workflows']) // ✓ Correct
  // ...
}
```

**File**: `app/routes/workflow-templates/workflow-templates.create.tsx`
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['create:workflows']) // ✓ Add this
  // ...
}
```

**File**: `app/routes/workflow-templates/workflow-templates.edit.tsx`
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['update:workflows']) // ✓ Add this
  // ...
}
```

**File**: `app/routes/workflow-instances/workflow-instances.tsx`
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:workflows']) // ✓ Verify exists
  // ...
}
```

---

### Step 6: Add Permission-Based UI Visibility

**In workflow template list page**:

```typescript
// Pass permissions from loader
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:workflows'])
  
  const userWithRole = await prisma.user.findUnique({
    where: { id: user.id },
    include: { role: true }
  })
  
  return {
    workflowTemplates,
    permissions: userWithRole?.role?.permissions || [],
    // ... other data
  }
}

// In component
export default function WorkflowTemplatesPage() {
  const { workflowTemplates, permissions } = useLoaderData<typeof loader>()
  
  const canCreate = permissions.includes('create:workflows')
  const canEdit = permissions.includes('update:workflows')
  const canDelete = permissions.includes('delete:workflows')
  
  return (
    <Box>
      <Group justify="space-between">
        <Title>Workflow Templates</Title>
        {canCreate && (
          <Button component={Link} to="/workflow-templates/create">
            Create Template
          </Button>
        )}
      </Group>
      
      {workflowTemplates.map(template => (
        <TemplateCard 
          key={template.id}
          template={template}
          showEditButton={canEdit}
          showDeleteButton={canDelete}
        />
      ))}
    </Box>
  )
}
```

---

## Development Workflow

### TDD Cycle (Red-Green-Refactor)

**Phase 1: Permission Check Tests**

```typescript
// app/test/utils/permissions.test.ts
import { describe, it, expect } from 'vitest'

describe('Workflow Permissions', () => {
  it('should check read:workflows permission', () => {
    const permissions = ['read:workflows', 'create:products']
    expect(permissions.includes('read:workflows')).toBe(true)
  })
  
  it('should return false for missing permission', () => {
    const permissions = ['read:products']
    expect(permissions.includes('read:workflows')).toBe(false)
  })
})
```

**Phase 2: Navigation Visibility Tests**

```typescript
// app/test/layouts/Navbar.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Navbar from '~/app/layouts/Navbar/Navbar'

describe('Navbar - Workflow Section', () => {
  it('should show workflows section when user has read:workflows permission', () => {
    const permissions = ['read:workflows']
    
    render(
      <Navbar 
        permissions={permissions}
        showMiniNavbar={false}
        onClick={() => {}}
      />
    )
    
    expect(screen.getByText('Workflows')).toBeInTheDocument()
  })
  
  it('should hide workflows section when user lacks workflow permissions', () => {
    const permissions = ['read:products', 'create:products']
    
    render(
      <Navbar 
        permissions={permissions}
        showMiniNavbar={false}
        onClick={() => {}}
      />
    )
    
    expect(screen.queryByText('Workflows')).not.toBeInTheDocument()
  })
})
```

**Phase 3: Route Loader Tests**

```typescript
// app/test/routes/workflow-templates.test.ts
import { describe, it, expect, vi } from 'vitest'
import { loader } from '~/app/routes/workflow-templates/workflow-templates'

describe('Workflow Templates Route', () => {
  it('should require read:workflows permission', async () => {
    const request = new Request('http://localhost/workflow-templates')
    
    // Mock user without permission
    vi.mock('~/app/services/better-auth.server', () => ({
      requireBetterAuthUser: vi.fn().mockRejectedValue(new Response('Forbidden', { status: 403 }))
    }))
    
    await expect(loader({ request })).rejects.toThrow()
  })
})
```

**Phase 4: UI Visibility Tests**

```typescript
// app/test/pages/WorkflowTemplates.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorkflowTemplatesPage from '~/app/pages/WorkflowTemplates/WorkflowTemplates'

describe('WorkflowTemplatesPage', () => {
  it('should show create button when user has create:workflows permission', () => {
    const data = {
      workflowTemplates: [],
      permissions: ['read:workflows', 'create:workflows'],
      users: [],
      roles: []
    }
    
    render(<WorkflowTemplatesPage {...data} />)
    
    expect(screen.getByText('Create Template')).toBeInTheDocument()
  })
  
  it('should hide create button when user lacks create:workflows permission', () => {
    const data = {
      workflowTemplates: [],
      permissions: ['read:workflows'],
      users: [],
      roles: []
    }
    
    render(<WorkflowTemplatesPage {...data} />)
    
    expect(screen.queryByText('Create Template')).not.toBeInTheDocument()
  })
})
```

---

## Testing Strategy

### Layer 1: Unit Tests (Vitest)

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

**Test Files**:
- `app/test/utils/permissions.test.ts` - Permission helpers
- `app/test/layouts/Navbar.test.tsx` - Navigation visibility
- `app/test/routes/workflow-templates.test.ts` - Route loaders

---

### Layer 2: Integration Tests (Testing Library)

**Test Scenarios**:
1. ✅ Admin user sees workflow navigation
2. ✅ Non-admin user without permissions doesn't see navigation
3. ✅ Create button visible only with create permission
4. ✅ Edit button visible only with update permission
5. ✅ Delete button visible only with delete permission

---

### Layer 3: E2E Tests (Chrome DevTools MCP)

**Test Credentials**:
- Admin: `admin@flowtech.com` / `password123`

**Test Flow**:

```typescript
// 1. Login as admin
mcp_chromedevtool_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:3000/login' 
})

mcp_chromedevtool_fill_form({
  elements: [
    { uid: 'email-input', value: 'admin@flowtech.com' },
    { uid: 'password-input', value: 'password123' }
  ]
})

mcp_chromedevtool_click({ uid: 'login-button' })
mcp_chromedevtool_wait_for({ text: 'Dashboard' })

// 2. Verify workflows navigation visible
mcp_chromedevtool_take_snapshot()
// Expected: "Workflows" section with "Approvals", "Workflow Templates", "Workflow History" sublinks

// 3. Navigate to workflow templates
mcp_chromedevtool_click({ uid: 'workflow-templates-link' })
mcp_chromedevtool_wait_for({ text: 'Workflow Templates' })

// 4. Verify page loaded successfully
mcp_chromedevtool_take_snapshot()
// Expected: List of 16 seeded templates visible

// 5. Verify create button visible
mcp_chromedevtool_take_snapshot()
// Expected: "Create Template" button visible (admin has create:workflows)

// 6. Test create flow
mcp_chromedevtool_click({ uid: 'create-template-button' })
mcp_chromedevtool_wait_for({ text: 'Create Workflow Template' })

// 7. Navigate to workflow history
mcp_chromedevtool_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:3000/workflow-history' 
})
mcp_chromedevtool_wait_for({ text: 'Workflow History' })
mcp_chromedevtool_take_snapshot()

// 8. Verify edit/delete actions on template cards
mcp_chromedevtool_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:3000/workflow-templates' 
})
mcp_chromedevtool_take_snapshot()
// Expected: Edit and delete buttons visible on template cards
```

**Negative Tests** (non-admin user):
```typescript
// Create test user without workflow permissions
// Login as test user
// Verify "Workflows" section NOT visible in navigation
// Attempt direct URL access: /workflow-templates
// Expected: 403 Forbidden or redirect to dashboard
```

---

## Verification Checklist

### Database Setup
- [ ] Admin role exists in database
- [ ] Admin role has `read:workflows` permission
- [ ] Admin role has `create:workflows` permission
- [ ] Admin role has `update:workflows` permission
- [ ] Admin role has `delete:workflows` permission
- [ ] Test user (admin@flowtech.com) exists with Admin role
- [ ] 16 workflow templates seeded in database

### Navigation Visibility
- [ ] "Workflows" section visible in navbar for users with `read:workflows`
- [ ] "Approvals" sublink visible
- [ ] "Workflow Templates" sublink visible
- [ ] "Workflow History" sublink visible
- [ ] "Workflows" section hidden for users without workflow permissions
- [ ] Active route highlighted in navigation

### Route Permission Guards
- [ ] `/workflow-templates` requires `read:workflows`
- [ ] `/workflow-templates/create` requires `create:workflows`
- [ ] `/workflow-templates/:id` (edit) requires `update:workflows`
- [ ] `/workflow-history` requires `read:workflows`
- [ ] Direct URL access blocked when permission missing
- [ ] Proper error/redirect on permission failure

### UI Element Visibility
- [ ] "Create Template" button visible only with `create:workflows`
- [ ] Edit button on template cards visible only with `update:workflows`
- [ ] Delete button on template cards visible only with `delete:workflows`
- [ ] Template list visible to all users with `read:workflows`
- [ ] Workflow history visible to all users with `read:workflows`

### Functionality
- [ ] Clicking "Workflow Templates" navigates to `/workflow-templates`
- [ ] Clicking "Create Template" navigates to `/workflow-templates/create`
- [ ] Create form loads successfully
- [ ] Create form submits and redirects to list
- [ ] Edit form loads existing template data
- [ ] Edit form submits and redirects to list
- [ ] Delete action removes template (or deactivates)
- [ ] Workflow history displays all instances

### Testing
- [ ] All unit tests pass (`bun run test`)
- [ ] Integration tests pass
- [ ] Chrome DevTools MCP E2E tests pass
- [ ] Coverage > 80% on new code
- [ ] No regression in existing tests

### Documentation
- [ ] Code comments added for permission checks
- [ ] README updated with feature description
- [ ] API contracts documented in contracts/
- [ ] Quickstart guide complete (this file)

---

## Troubleshooting

### Issue: "Workflows" section not visible

**Symptoms**: Admin user logged in, but "Workflows" navigation section missing

**Diagnosis**:
```bash
# Check user's role permissions
psql $DATABASE_URL

SELECT u.email, r.name, r.permissions 
FROM "User" u 
JOIN "Role" r ON u."roleId" = r.id 
WHERE u.email = 'admin@flowtech.com';
```

**Solution**:
1. Run admin permission migration script
2. Logout and login again to refresh session
3. Clear browser cache if necessary

---

### Issue: 403 Forbidden on workflow template pages

**Symptoms**: Navigation visible, but clicking links results in 403 error

**Diagnosis**:
```typescript
// Check route loader permission requirement
// File: app/routes/workflow-templates/workflow-templates.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['read:workflows'])
  // ↑ This should match permission in role
}
```

**Solution**:
1. Verify Admin role has required permission
2. Verify route loader uses correct permission string
3. Check session is valid (logout/login)

---

### Issue: Create button visible but 403 on submit

**Symptoms**: Button appears, but form submission fails with 403

**Diagnosis**:
```typescript
// Check action permission requirement
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireBetterAuthUser(request, ['create:workflows'])
  // ↑ This must match create permission
}
```

**Solution**:
1. Add `create:workflows` to Admin role permissions
2. Verify action handler checks correct permission
3. Clear session and re-authenticate

---

### Issue: Tests failing with "permission not found"

**Symptoms**: Unit tests fail with undefined permission errors

**Diagnosis**:
```typescript
// Check test mocks
vi.mock('~/app/services/better-auth.server', () => ({
  requireBetterAuthUser: vi.fn().mockResolvedValue({
    id: 'user1',
    companyId: 'company1',
    roleId: 'role1',
    role: {
      permissions: ['read:workflows', 'create:workflows']
    }
  })
}))
```

**Solution**:
1. Update test mocks to include role.permissions
2. Mock Better Auth helper correctly
3. Use Testing Library utilities for permission checks

---

### Issue: Chrome DevTools MCP tests timeout

**Symptoms**: E2E tests hang or timeout

**Diagnosis**:
```bash
# Check dev server is running
curl http://localhost:3000/

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Solution**:
1. Ensure dev server running (`bun run dev`)
2. Ensure database is accessible
3. Increase MCP timeout setting
4. Check network connectivity

---

## Next Steps

### After Completing Quickstart

1. **Run Phase 1 Updates** (from `update-agent-context.sh`):
   ```bash
   .specify/scripts/bash/update-agent-context.sh copilot
   ```

2. **Generate Task Breakdown**:
   ```bash
   # This will be done via /speckit.tasks command
   ```

3. **Start Implementation** (TDD):
   - Write failing test
   - Implement minimum code to pass
   - Refactor
   - Repeat

4. **Post-Implementation**:
   - Run Chrome DevTools MCP verification
   - Update documentation
   - Create pull request

---

## Additional Resources

### Documentation Links
- [React Router 7 Docs](https://reactrouter.com/dev/guides)
- [Mantine UI Components](https://mantine.dev/)
- [Better Auth Docs](https://better-auth.com/)
- [Prisma Docs](https://www.prisma.io/docs)

### Internal Docs
- [Constitution](../../.specify/memory/constitution.md)
- [Spec Kit Commands](../../docs/SPEC_KIT_README.md)
- [Copilot Instructions](../../.github/copilot-instructions.md)

### Related Features
- `005-workflow-approvals` - Approval request management
- `004-navigation-reorganization` - Navigation structure

---

## Summary

**Key Takeaways**:
1. Navigation already implemented - just needs permissions
2. Admin role migration is the critical first step
3. Follow TDD workflow religiously
4. Use Chrome DevTools MCP for E2E verification
5. Permission checks at route and UI layers

**Estimated Time**:
- Setup: 30 minutes
- Testing: 2 hours
- Implementation: 4 hours
- Verification: 1 hour
- **Total**: ~7-8 hours

**Critical Path**:
1. Run admin permission migration ⚡ CRITICAL
2. Verify route permission guards
3. Add UI element visibility checks
4. Run comprehensive tests
5. Chrome DevTools MCP verification

Good luck! 🚀
