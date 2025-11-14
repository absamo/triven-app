# Feature Specification: Workflow Template and Admin UI Visibility

**Feature Branch**: `006-workflow-template-admin-ui`  
**Created**: November 13, 2025  
**Status**: Draft  
**Input**: User description: "I cannot see workflow template and admin ui for workflows"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin User Accesses Workflow Templates (Priority: P1)

Admin users need to create, view, edit, and delete workflow templates to manage approval processes across the organization. Currently, the fully functional workflow templates pages are implemented but hidden from navigation, making them inaccessible to users who need them most.

**Why this priority**: Core functionality exists but is completely hidden from users. This is a critical visibility issue blocking administrators from managing approval workflows that are central to business processes.

**Independent Test**: Admin logs in, navigates to workflows section in sidebar, clicks on "Workflow Templates", and sees list of existing templates with full CRUD capabilities including the 16 seeded templates.

**Acceptance Scenarios**:

1. **Given** user is logged in with admin role and has 'read:workflows' permission, **When** user views the navigation sidebar, **Then** user sees "Workflows" section with "Approvals", "Workflow Templates", and "Workflow History" sublinks
2. **Given** admin user clicks on "Workflow Templates" navigation item, **When** page loads, **Then** user sees complete list of workflow templates with filters, search, and create button
3. **Given** admin user has 'create:workflows' permission, **When** user clicks "Create Template" button, **Then** user is directed to template creation form at `/workflow-templates/create`
4. **Given** admin user has 'update:workflows' permission, **When** user clicks on a template card, **Then** user is directed to template edit form at `/workflow-templates/:id`
5. **Given** admin user has 'delete:workflows' permission, **When** user opens template actions menu and clicks delete, **Then** confirmation modal appears and template can be deleted

---

### User Story 2 - Navigation Permissions Configuration (Priority: P1)

System must enforce proper permission-based access control so that only authorized users can view and manage workflow templates. Permission checks must be granular (read/create/update/delete) to support different user roles.

**Why this priority**: Security and access control are fundamental requirements. Without proper permission enforcement, unauthorized users could modify business-critical approval workflows.

**Independent Test**: User with only 'read:workflows' permission can view templates but cannot see create/edit/delete actions. User without any workflow permissions sees no workflow navigation section.

**Acceptance Scenarios**:

1. **Given** user has 'read:workflows' permission, **When** user views workflow templates page, **Then** user can view all templates but cannot see create/edit/delete buttons
2. **Given** user lacks any workflow-related permissions, **When** user views navigation sidebar, **Then** workflows section is not displayed at all
3. **Given** user has 'read:workflows' but not 'create:workflows', **When** viewing templates list, **Then** "Create Template" button is hidden
4. **Given** user has 'read:workflows' and 'update:workflows', **When** viewing a template, **Then** edit actions are visible but delete actions are hidden (requires 'delete:workflows')

---

### User Story 3 - Workflow Instances Visibility (Priority: P2)

Users need to view workflow execution history to track approval progress, audit decisions, and troubleshoot issues. The workflow history page exists but needs to be accessible via navigation.

**Why this priority**: After templates are visible (P1), users will naturally want to see how those templates are being executed in real approval workflows.

**Independent Test**: User navigates to "Workflow History" and sees list of all workflow executions with status tracking, step progress, and assignee information.

**Acceptance Scenarios**:

1. **Given** user has 'read:workflows' permission, **When** user clicks "Workflow History" in navigation, **Then** user sees list of all workflow instances with execution status
2. **Given** workflow instance exists for a template, **When** user views instance details, **Then** user sees step execution progress, assignees, and completion status
3. **Given** user views workflow history, **When** filtering by status, **Then** only instances matching selected status (pending, in-progress, completed, failed) are displayed

---

### User Story 4 - Admin Role Auto-Permission Assignment (Priority: P3)

Admin role users should automatically receive all workflow management permissions without requiring manual configuration. This reduces setup friction and ensures admins can always manage workflows.

**Why this priority**: Quality-of-life improvement that reduces administrative overhead and ensures consistent permission setup across deployments.

**Independent Test**: New admin user is created and can immediately access workflow management features without additional permission grants. Role change from non-admin to admin automatically grants workflow permissions.

**Acceptance Scenarios**:

1. **Given** user role is "Admin", **When** user logs in, **Then** user automatically has 'read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows' permissions
2. **Given** admin user exists before permission update, **When** permission system is updated, **Then** admin's workflow permissions are retroactively applied
3. **Given** user role changes from non-admin to admin, **When** role change takes effect, **Then** workflow permissions are automatically granted

---

### Edge Cases

- What happens when a user loses workflow permissions while viewing the workflow templates page? (User should be redirected or see access denied message)
- How does the system handle navigation when workflow templates exist but user only has approval permissions? (Only "Approvals" link visible, templates/history hidden)
- What happens if workflow permissions are granted but navigation doesn't update until page refresh? (Navigation should reactively update or require minimal refresh)
- How does the system behave when a user has 'create:workflows' but not 'read:workflows'? (Invalid state - should not be possible; read is prerequisite)
- What happens when a template is deleted while another user is viewing or editing it? (Show appropriate error message and redirect to list)
- What happens if user has 'read:workflows' but tries to directly access `/workflow-templates/create` URL? (Should be blocked by route-level permission check)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display "Workflow Templates" navigation link when user has 'read:workflows' permission
- **FR-002**: System MUST display "Workflow History" navigation link when user has 'read:workflows' permission
- **FR-003**: System MUST group workflow-related links ("Approvals", "Workflow Templates", "Workflow History") under "Workflows" section in navigation sidebar
- **FR-004**: System MUST show "Create Template" button only when user has 'create:workflows' permission
- **FR-005**: System MUST show template edit actions only when user has 'update:workflows' permission
- **FR-006**: System MUST show template delete actions only when user has 'delete:workflows' permission
- **FR-007**: System MUST automatically grant all workflow permissions ('read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows') to users with "Admin" role
- **FR-008**: System MUST hide entire "Workflows" navigation section when user lacks any workflow-related permissions ('read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows', or 'read:approvals')
- **FR-009**: Navigation MUST accurately reflect current user permissions without requiring full page refresh after permission changes
- **FR-010**: System MUST display active route highlighting when user is on workflow templates or workflow history pages
- **FR-011**: System MUST maintain existing workflow template CRUD functionality (already implemented at `/workflow-templates`, `/workflow-templates/create`, `/workflow-templates/:id`)
- **FR-012**: System MUST maintain existing workflow instance viewing functionality (already implemented at `/workflow-history`)
- **FR-013**: System MUST check permissions at route level to prevent URL-based access bypass
- **FR-014**: System MUST use consistent permission naming ('read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows') across navigation and routes

### Key Entities *(include if feature involves data)*

- **Role**: User role with associated permissions array
  - Contains permissions like 'read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows'
  - "Admin" role should have all workflow permissions by default
  - Relationships: one-to-many with User

- **WorkflowTemplate**: Existing entity for approval workflow templates
  - Contains name, description, trigger type (purchase_order_create, sales_order_create, etc.), steps, and active status
  - Already has full CRUD operations implemented
  - 16 templates seeded in database (manual, purchase orders, sales orders, invoices, bills, etc.)
  - Relationships: belongs to Company, created by User, has many WorkflowSteps

- **WorkflowInstance**: Existing entity for workflow executions
  - Contains current step number, execution status, and step history
  - Already has viewing functionality implemented at `/workflow-history` route
  - Relationships: belongs to WorkflowTemplate, belongs to Company

- **Permission**: Access control rule assigned to roles
  - Workflow-specific permissions: 'read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows'
  - Controls visibility and actions in navigation and pages
  - Stored as array in Role model

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin users can navigate to workflow templates page within 2 clicks from any authenticated page (dashboard → workflows → templates)
- **SC-002**: 100% of users with 'read:workflows' permission can see workflow navigation section
- **SC-003**: 0% of users without workflow permissions can see workflow navigation section (complete permission enforcement)
- **SC-004**: Workflow template create/edit/delete actions are visible only to users with corresponding permissions (100% permission accuracy across UI)
- **SC-005**: Admin role users automatically have all workflow permissions without manual grant (100% of new admin users)
- **SC-006**: Navigation permission checks execute in under 100ms to avoid UI lag
- **SC-007**: Users can access existing workflow templates functionality - all 16 seeded templates visible to authorized users

## Assumptions

- Existing workflow template pages (`/workflow-templates`, `/workflow-templates/create`, `/workflow-templates/:id`) are fully functional
- Existing workflow history page (`/workflow-history`) is fully functional  
- Permission system is already implemented and working for other features (inventory, sales, purchases)
- Navigation component (Navbar.tsx) already supports permission-based visibility checks
- Database contains `WorkflowTemplate` and `WorkflowInstance` tables with 16 seeded templates
- API routes for workflow templates (`/api/workflow-templates`) are implemented and working
- Role model contains a permissions array field
- Better Auth authentication system is properly configured and working
- Translation keys exist for "workflowTemplates" navigation in i18n files

## Technical Constraints

- Must maintain existing workflow template page functionality without regression
- Navigation permission checks must not impact page load performance (< 100ms)
- Permission updates must be reflected in navigation without requiring full application restart
- Must work with existing Better Auth authentication system
- Must integrate with existing Navbar component structure (submenu pattern similar to Inventory, Sales, Purchases)
- Must use existing translation system (i18next) with keys already defined
- Cannot modify database schema (permissions already stored in Role model)
- Must maintain backward compatibility with existing approval workflows

## Out of Scope

- Creating new workflow template functionality (already exists)
- Implementing new workflow step types beyond the existing types
- Real-time workflow execution monitoring via SSE
- Workflow template versioning or revision history
- Workflow analytics, metrics, or reporting dashboard
- Workflow template import/export functionality
- Workflow notification system enhancements
- Mobile-specific navigation optimization
- Workflow template marketplace, sharing, or public templates
- Changing permission model structure or adding new permission types
- Modifying workflow execution engine or approval logic
- UI/UX redesign of workflow templates pages (already well-designed)
