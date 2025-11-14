# Admin Role Workflow Permissions

**Feature**: 006-workflow-template-admin-ui  
**Date**: November 13, 2025  
**Status**: Implemented

## Overview

As part of the workflow template admin UI visibility feature, the Admin role automatically receives all workflow management permissions. This ensures administrators can access and manage workflow templates without requiring manual permission configuration.

## Workflow Permissions

The following permissions are automatically granted to the Admin role:

| Permission | Description | Enables |
|------------|-------------|---------|
| `read:workflows` | View workflow templates and instances | - Access to "Workflows" navigation section<br>- View workflow templates list<br>- View workflow history<br>- View workflow instance details |
| `create:workflows` | Create new workflow templates | - "Create Template" button<br>- Create workflow form access |
| `update:workflows` | Edit existing workflow templates | - Edit workflow templates<br>- Update workflow steps<br>- Activate/deactivate templates |
| `delete:workflows` | Delete workflow templates | - Delete template action<br>- Remove workflow templates |

## Auto-Permission Assignment

### New Admin Users

When a new user is created with the Admin role through the seed script or user registration:

1. User is assigned the Admin role
2. Admin role includes workflow permissions by default
3. User immediately has access to workflow features without additional configuration

### Existing Admin Users

For existing deployments with Admin users before this feature was implemented:

1. Run the migration script: `bun run scripts/migrations/add-admin-workflow-permissions.ts`
2. Script automatically adds workflow permissions to all Admin roles
3. Admin users will see workflow navigation on next login

## Implementation Details

### Seed Script

Location: `prisma/seed.ts` (lines 683-690)

```typescript
{
  name: 'Admin',
  description: 'Full system access',
  companyId: companyId,
  editable: false,
  permissions: [
    // ... other permissions
    'read:workflows',
    'create:workflows',
    'update:workflows',
    'delete:workflows',
    'read:approvals',
    'create:approvals',
    'update:approvals',
    'delete:approvals',
  ],
}
```

### Migration Script

Location: `scripts/migrations/add-admin-workflow-permissions.ts`

The migration script:
- Finds all roles with name 'Admin'
- Checks if workflow permissions already exist
- Adds missing workflow permissions
- Reports summary of updates

## Navigation Visibility

Users with `read:workflows` OR `read:approvals` permission will see the "Workflows" section in the navigation sidebar with the following sublinks:

- **Approvals** (if has `read:approvals`)
- **Workflow Templates** (if has `read:workflows`)
- **Workflow History** (if has `read:workflows`)

## Permission Enforcement

### Route-Level Protection

All workflow routes enforce permission requirements:

| Route | Required Permission |
|-------|-------------------|
| `/workflow-templates` | `read:workflows` |
| `/workflow-templates/create` | `create:workflows` |
| `/workflow-templates/:id` (edit) | `update:workflows` |
| `/workflow-history` | `read:workflows` |
| `/workflow-instances` | `read:workflows` |

### UI-Level Protection

Action buttons are conditionally rendered based on permissions:

- **Create Template** button: Requires `create:workflows`
- **Edit** actions: Requires `update:workflows`
- **Delete** actions: Requires `delete:workflows`

## Testing

### Verify Admin Permissions

Check if Admin role has workflow permissions:

```bash
psql $DATABASE_URL -c "SELECT name, permissions FROM \"Role\" WHERE name = 'Admin';"
```

### Verify User Access

Check admin user's permissions:

```bash
psql $DATABASE_URL -c "
SELECT u.email, r.name as role, r.permissions 
FROM \"User\" u 
JOIN \"Role\" r ON u.\"roleId\" = r.id 
WHERE r.name = 'Admin' 
LIMIT 1;
"
```

### Test Workflow Navigation

1. Login as admin user (admin@flowtech.com / password123)
2. Verify "Workflows" section visible in sidebar
3. Verify all three sublinks present:
   - Approvals
   - Workflow Templates
   - Workflow History
4. Click "Workflow Templates" - page should load successfully
5. Verify "Create Template" button visible

## Rollback Procedure

If workflow permissions need to be removed from Admin role:

```bash
# Create rollback script
cat > scripts/migrations/rollback-admin-workflow-permissions.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminRoles = await prisma.role.findMany({
    where: { name: 'Admin' }
  })
  
  const workflowPermissions = [
    'read:workflows',
    'create:workflows',
    'update:workflows',
    'delete:workflows'
  ]
  
  for (const role of adminRoles) {
    const currentPerms = role.permissions as string[]
    const updatedPermissions = currentPerms.filter(
      p => !workflowPermissions.includes(p)
    )
    
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: updatedPermissions }
    })
  }
}

main()
  .finally(() => prisma.$disconnect())
EOF

# Run rollback
bun run scripts/migrations/rollback-admin-workflow-permissions.ts
```

## Related Features

- **005-workflow-approvals**: Approval request management system
- **Navbar Navigation**: Permission-based navigation visibility (lines 209-236 in `app/layouts/Navbar/Navbar.tsx`)

## Support

For issues or questions about workflow permissions:

1. Check Admin role has workflow permissions in database
2. Verify user is assigned Admin role
3. Ensure user has logged out and back in to refresh session
4. Run migration script if permissions are missing

## Version History

- **v1.0.0** (2025-11-13): Initial implementation
  - Added workflow permissions to Admin role in seed script
  - Created migration script for existing deployments
  - Documented auto-permission behavior
