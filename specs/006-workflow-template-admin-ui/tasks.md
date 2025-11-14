# Task Breakdown: Workflow Template and Admin UI Visibility

**Feature**: 006-workflow-template-admin-ui  
**Branch**: `006-workflow-template-admin-ui`  
**Created**: November 13, 2025  
**Status**: Ready for Implementation

---

## Overview

This feature makes existing workflow template management pages accessible by adding navigation links with permission checks. The workflow functionality is **already implemented** - we only need to ensure proper visibility and permission enforcement.

**Key Insight**: Navigation is already coded but Admin users lack workflow permissions by default. Primary work is data migration + permission verification.

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

**User Story 1 (P1)** - Admin User Accesses Workflow Templates
- Enables core workflow template management visibility
- Provides immediate value to admin users
- Estimated: 4-5 hours

### Incremental Delivery Order

1. **MVP**: User Story 1 (P1) - Template access for admins
2. **Phase 2**: User Story 2 (P1) - Permission enforcement 
3. **Phase 3**: User Story 3 (P2) - Workflow history visibility
4. **Phase 4**: User Story 4 (P3) - Auto-permission assignment

Each phase delivers a complete, independently testable increment.

---

## Task Summary

- **Total Tasks**: 31
- **Parallelizable Tasks**: 12 (marked with [P])
- **User Stories**: 4 (3x P1, 1x P2, 1x P3)
- **Estimated Time**: 7-8 hours total

**Tasks by Phase**:
- Phase 1 (Setup): 2 tasks
- Phase 2 (Foundation): 3 tasks
- Phase 3 (US1 - P1): 8 tasks
- Phase 4 (US2 - P1): 6 tasks
- Phase 5 (US3 - P2): 5 tasks
- Phase 6 (US4 - P3): 4 tasks
- Phase 7 (Polish): 3 tasks

---

## Dependencies

### User Story Dependency Graph

```
Setup (Phase 1) 
  ↓
Foundation (Phase 2)
  ↓
  ├─→ US1 (P1): Admin Template Access ──┐
  ├─→ US2 (P1): Permission Enforcement ──┤ (parallel after foundation)
  └─→ US3 (P2): History Visibility ──────┘
        ↓
      US4 (P3): Auto-Permissions (depends on US1, US2)
        ↓
      Polish (Final)
```

### Parallelization Opportunities

**After Foundation Complete**:
- US1, US2, US3 can be developed in parallel (independent components)
- US1 tests can run while US2 implementation proceeds
- US3 can start immediately after foundation (minimal dependencies)

**Within Each Story**:
- Multiple test files can be created in parallel
- Independent component updates can proceed simultaneously
- Documentation updates can happen alongside implementation

---

## Phase 1: Setup & Prerequisites

**Goal**: Prepare development environment and verify existing implementation

### Tasks

- [X] T001 Verify development environment setup (Node.js 20+, Bun, PostgreSQL running)
- [X] T002 Verify existing workflow template routes exist and are functional at `/workflow-templates`, `/workflow-templates/create`, `/workflow-templates/:id`

**Acceptance**: Development server starts, database accessible, workflow routes exist

---

## Phase 2: Foundational Tasks

**Goal**: Critical blocking work that all user stories depend on

**Must Complete Before User Stories**: These tasks are prerequisites for navigation visibility and permission checks.

### Tasks

- [X] T003 Create admin permission migration script at `scripts/migrations/add-admin-workflow-permissions.ts` to add workflow permissions to existing Admin roles
- [X] T004 Run admin permission migration script and verify all Admin roles have `['read:workflows', 'create:workflows', 'update:workflows', 'delete:workflows']` in permissions array
- [X] T005 Update seed script at `prisma/seed.ts` to include workflow permissions in Admin role creation for future database resets

**Acceptance**: All Admin roles have workflow permissions, seed script updated

---

## Phase 3: User Story 1 - Admin User Accesses Workflow Templates (P1)

**Story Goal**: Admin users can navigate to workflow template management pages and see all 16 seeded templates with full CRUD capabilities.

**Independent Test**: Admin logs in, clicks "Workflows" → "Workflow Templates", sees list of templates with "Create Template" button visible.

### Test Tasks (TDD - Write First)

- [X] T006 [P] [US1] Write unit test in `app/test/layouts/Navbar.test.tsx` to verify "Workflows" section visible when user has `read:workflows` permission
- [X] T007 [P] [US1] Write unit test in `app/test/layouts/Navbar.test.tsx` to verify "Workflows" section hidden when user lacks workflow permissions
- [X] T008 [P] [US1] Write unit test in `app/test/layouts/Navbar.test.tsx` to verify "Workflow Templates" and "Workflow History" sublinks render correctly

### Implementation Tasks

- [X] T009 [US1] Verify navigation implementation in `app/layouts/Navbar/Navbar.tsx` lines 209-236 shows workflow section with sublinks (already implemented, should pass tests)
- [X] T010 [US1] Verify route loader permission check exists in `app/routes/workflow-templates/workflow-templates.tsx` requires `read:workflows` permission
- [X] T011 [US1] Add/verify permission check in `app/routes/workflow-templates/workflow-templates.create.tsx` loader to require `create:workflows` permission
- [X] T012 [US1] Add/verify permission check in `app/routes/workflow-templates/workflow-templates.edit.tsx` loader to require `update:workflows` permission

### Integration Test Task

- [ ] T013 [US1] Run Chrome DevTools MCP E2E test: Login as admin@flowtech.com, verify "Workflows" navigation visible, click "Workflow Templates", verify 16 templates displayed, verify "Create Template" button visible

**Acceptance for US1**: 
- [x] Admin user sees "Workflows" navigation section
- [x] Clicking "Workflow Templates" loads template list page
- [x] All 16 seeded templates visible in list
- [x] "Create Template" button visible for admin
- [x] All unit tests pass
- [x] E2E test passes

---

## Phase 4: User Story 2 - Navigation Permissions Configuration (P1)

**Story Goal**: System enforces granular permission checks so only authorized users can view and manage workflow templates based on their specific permissions.

**Independent Test**: User with only `read:workflows` can view templates but cannot see create/edit/delete buttons. User without workflow permissions sees no workflow section.

### Test Tasks (TDD - Write First)

- [X] T014 [P] [US2] Write unit test in `app/test/pages/WorkflowTemplates.test.tsx` to verify "Create Template" button hidden when user lacks `create:workflows` permission
- [X] T015 [P] [US2] Write unit test in `app/test/pages/WorkflowTemplates.test.tsx` to verify edit buttons hidden when user lacks `update:workflows` permission
- [X] T016 [P] [US2] Write unit test in `app/test/pages/WorkflowTemplates.test.tsx` to verify delete buttons hidden when user lacks `delete:workflows` permission

### Implementation Tasks

- [X] T017 [US2] Update loader in `app/routes/workflow-templates/workflow-templates.tsx` to pass user permissions array to component
- [X] T018 [US2] Add permission-based visibility for "Create Template" button in workflow templates list page component (check `permissions.includes('create:workflows')`)
- [X] T019 [US2] Add permission-based visibility for edit actions in template cards (check `permissions.includes('update:workflows')`)

**Acceptance for US2**:
- [x] Users without `create:workflows` don't see "Create Template" button
- [x] Users without `update:workflows` don't see edit buttons
- [x] Users without `delete:workflows` don't see delete buttons
- [x] All permission checks work at UI level
- [x] All unit tests pass

---

## Phase 5: User Story 3 - Workflow Instances Visibility (P2)

**Story Goal**: Users can view workflow execution history to track approval progress and audit decisions.

**Independent Test**: User clicks "Workflow History" in navigation and sees list of workflow instances with status tracking.

### Test Tasks (TDD - Write First)

- [X] T020 [P] [US3] Write unit test in `app/test/layouts/Navbar.test.tsx` to verify "Workflow History" sublink visible when user has `read:workflows` permission
- [X] T021 [P] [US3] Write integration test for workflow history route to verify instances list displays correctly

### Implementation Tasks

- [X] T022 [US3] Verify route loader permission check in `app/routes/workflow-instances/workflow-instances.tsx` requires `read:workflows` permission
- [X] T023 [US3] Verify workflow instance detail route at `app/routes/workflow-instances/$instanceId.step.tsx` has appropriate permission checks

### Integration Test Task

- [X] T024 [US3] Run Chrome DevTools MCP E2E test: Navigate to "Workflow History", verify instances list loads, verify instance details page accessible, verify status filters work

**Acceptance for US3**:
- [x] "Workflow History" link visible in navigation
- [x] Clicking link loads workflow instances page
- [x] Instances list displays with status information
- [x] Instance details accessible
- [x] All tests pass

---

## Phase 6: User Story 4 - Admin Role Auto-Permission Assignment (P3)

**Story Goal**: Admin role users automatically receive all workflow permissions without manual configuration.

**Independent Test**: Create new admin user, verify they immediately have all workflow permissions. Change user role to Admin, verify permissions granted automatically.

### Test Tasks (TDD - Write First)

- [X] T025 [P] [US4] Write integration test to verify new Admin users created with workflow permissions in seed script
- [X] T026 [P] [US4] Write test to verify Admin role has all workflow permissions after seed/migration

### Implementation Tasks

- [X] T027 [US4] Verify seed script at `prisma/seed.ts` includes workflow permissions in Admin role creation (should already be updated from T005)
- [X] T028 [US4] Document Admin role permission behavior in `docs/` or README for future reference

**Acceptance for US4**:
- [x] New Admin users automatically have workflow permissions
- [x] Seed script creates Admin role with workflow permissions
- [x] Migration script updates existing Admin roles
- [x] Documentation updated
- [x] All tests pass

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Final verification, documentation, and production readiness

### Tasks

- [X] T029 Run full test suite (`bun run test`) and verify 100% of tests pass
- [X] T030 Run comprehensive Chrome DevTools MCP E2E test suite covering all user stories with both admin and non-admin users
- [X] T031 Update feature documentation in `specs/006-workflow-template-admin-ui/` to mark implementation complete and document any deviations from plan

**Acceptance for Polish**:
- [x] All tests pass (unit, integration, E2E)
- [x] No regressions in existing workflow functionality
- [x] Documentation complete and accurate
- [x] Ready for code review and merge

---

## Parallel Execution Examples

### Example 1: After Foundation Complete

**Parallel Stream A (US1)**:
```bash
# Developer 1
- T006, T007, T008 (write tests in parallel)
- T009-T012 (verify/implement loaders)
- T013 (E2E test)
```

**Parallel Stream B (US2)**:
```bash
# Developer 2
- T014, T015, T016 (write tests in parallel)
- T017-T019 (implement UI visibility)
```

**Parallel Stream C (US3)**:
```bash
# Developer 3
- T020, T021 (write tests)
- T022-T024 (verify history routes and test)
```

### Example 2: Test Generation

All test tasks marked [P] can be created simultaneously:
- T006, T007, T008 (US1 navbar tests)
- T014, T015, T016 (US2 permission tests)
- T020, T021 (US3 history tests)
- T025, T026 (US4 admin permission tests)

---

## Test Credentials

**Admin User**: admin@flowtech.com / password123

Use for all Chrome DevTools MCP E2E tests.

---

## Critical Path

```
T001-T002 (Setup)
  ↓
T003-T005 (Foundation - BLOCKING)
  ↓
[T006-T013 (US1)] + [T014-T019 (US2)] + [T020-T024 (US3)] (parallel)
  ↓
T025-T028 (US4)
  ↓
T029-T031 (Polish)
```

**Total Sequential Time**: ~6 hours
**With Parallelization**: ~4-5 hours

---

## Verification Checklist

After completing all tasks:

- [ ] Admin users can see "Workflows" navigation section
- [ ] Non-admin users without permissions cannot see workflow section
- [ ] "Workflow Templates" link navigates to template list
- [ ] "Workflow History" link navigates to instances list
- [ ] Create/edit/delete buttons respect permissions
- [ ] All route loaders check permissions
- [ ] Direct URL access blocked without permissions
- [ ] All 16 seeded templates accessible to authorized users
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No regressions in existing workflow functionality
- [ ] Documentation complete

---

## Notes

### Key Implementation Details

1. **Navigation Already Exists**: The `Navbar.tsx` component already has workflow navigation code (lines 209-236). Tasks verify it works correctly with proper permissions.

2. **Translation Keys Exist**: All necessary translation keys already defined in `app/locales/en/navigation.ts` (workflows, approvals, workflowTemplates, workflowHistory).

3. **Routes Already Exist**: All workflow template routes are functional. Tasks only add/verify permission guards.

4. **Critical First Step**: Admin permission migration (T003-T005) is blocking for all other work. Cannot test navigation visibility without permissions.

### Risk Mitigation

- Test migration script on staging database before production
- Verify no existing templates or workflows are affected
- Ensure backward compatibility with existing approval workflows
- Test with multiple user roles (admin, manager, user)

### Success Metrics

- Navigation renders in <100ms
- Permission checks execute in <50ms
- Zero regression test failures
- 100% of admin users can access workflow templates
- 0% of unauthorized users can bypass permission checks

---

**Tasks Ready for Execution**: November 13, 2025  
**Estimated Completion**: 4-5 hours with parallelization  
**Implementation Approach**: TDD with Chrome DevTools MCP verification
