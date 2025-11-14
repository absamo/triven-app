# Implementation Plan: Workflow Template and Admin UI Visibility

**Branch**: `006-workflow-template-admin-ui` | **Date**: November 13, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-workflow-template-admin-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Admin users need access to workflow template management pages that are fully functional but hidden from navigation. This feature adds navigation links for "Workflow Templates" and "Workflow History" to the sidebar with proper permission checks, enabling admins to create, view, edit, and delete approval workflow templates through the existing UI.

**Technical Approach**: Update Navbar component to include workflow-related links when user has `read:workflows` permission. Add permission-based visibility checks for create/edit/delete actions in existing workflow template pages. Ensure Admin role automatically receives all workflow permissions.

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 20+, Bun runtime  
**Primary Dependencies**: React 19.1.1, React Router 7.8.2, Mantine UI 8.2.7, Better Auth 1.3.3, Prisma (PostgreSQL), Zod 4.1.0, react-i18next 15.5.3  
**Storage**: PostgreSQL (existing Prisma schema with WorkflowTemplate, WorkflowInstance, Role, User entities)  
**Testing**: Vitest, Testing Library for React components, Chrome DevTools MCP for UI verification  
**Target Platform**: Web application (React Router SSR with client hydration)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Navigation permission checks <100ms, page loads <3s  
**Constraints**: Must maintain existing workflow template functionality without regression, must work with existing Better Auth authentication, must use existing translation system  
**Scale/Scope**: ~5 navigation components to update, ~3 route permission checks to add, 16 seeded workflow templates to make accessible

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Service-Oriented Architecture
- [x] Feature implemented as standalone service with clear boundaries
  - **Justification**: Navigation visibility and permission checks are self-contained in Navbar component and layout layer
- [x] Service has well-defined API interfaces (documented in contracts/)
  - **Justification**: Existing workflow API endpoints (`/api/workflows`) documented in contracts/
- [x] Service can be tested independently
  - **Justification**: Navigation component tests exist, route permission checks can be tested in isolation

### API-First Development
- [x] OpenAPI 3.0+ specifications created before implementation
  - **Status**: Existing workflow APIs already documented, no new endpoints required
- [x] Request/response schemas defined with Zod validation
  - **Status**: Existing workflow schemas already defined with Zod
- [x] API contracts reviewed and approved
  - **Status**: Using existing approved workflow API contracts

### Test-First Development (NON-NEGOTIABLE)
- [x] Test strategy documented (unit, integration, E2E)
  - **Unit**: Navbar permission logic tests, route loader permission checks
  - **Integration**: Navigation flow with auth context, permission-based UI rendering
  - **E2E**: Chrome DevTools MCP testing with test credentials (admin@flowtech.com / password123)
- [x] Tests will be written BEFORE implementation code
  - **Commitment**: TDD workflow enforced - tests first, then implementation
- [x] Red-Green-Refactor cycle will be followed
  - **Commitment**: Each test written to fail first, then implement to pass
- [x] All tests must pass before merge
  - **Commitment**: CI/CD gates enforced

### Real-Time Communication (if applicable)
- [x] N/A - No real-time updates required for navigation visibility
  - **Rationale**: Navigation updates on permission changes require login/refresh (acceptable UX)

### Data Integrity and Audit Trails (if applicable)
- [x] N/A - No data modifications, only UI visibility changes
  - **Rationale**: Feature only reveals existing functionality, doesn't modify data

### AI Integration (if applicable)
- [x] N/A - No AI features in this implementation
  - **Rationale**: Pure navigation/permission feature

### Performance and Caching
- [x] Query optimization strategy defined (select, indexes)
  - **Status**: Permission checks use in-memory array.includes() - no DB queries
- [x] Pagination implemented for large result sets (20-100 items)
  - **Status**: Workflow template list already implements pagination
- [x] Caching strategy documented for static/frequently-accessed data
  - **Status**: Permissions cached in session, no additional caching needed
- [x] Performance targets documented (<500ms p95 API, <100ms DB queries)
  - **Target**: Navigation permission checks <100ms (in-memory operations)

### Development Tooling & Quality Assurance
- [x] Context7 MCP used to fetch latest documentation for frameworks/libraries before implementation
  - **Plan**: Query React Router 7.8+ docs for route loaders, Mantine UI 8.2+ docs for navigation patterns
- [x] Implementation follows patterns from fetched documentation
  - **Commitment**: Use latest best practices from Context7 docs
- [x] Chrome DevTools MCP testing plan documented for UI verification
  - **Plan**: Test login flow, navigation visibility, permission-based action buttons, workflow template CRUD
- [x] Test credentials documented for authentication testing (if applicable)
  - **Credentials**: admin@flowtech.com / password123
- [x] MCP workflow integrated: Pre-implementation docs → Implementation → Post-implementation testing
  - **Commitment**: Follow MCP workflow pattern

## Project Structure

### Documentation (this feature)

```text
specs/006-workflow-template-admin-ui/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── layouts/
│   ├── Navbar/
│   │   └── Navbar.tsx                    # UPDATE: Add workflow navigation section with permissions
│   ├── NavbarLinksGroup/
│   │   └── NavbarLinksGroup.tsx          # VERIFY: Supports nested sublinks for workflows
│   └── main.tsx                          # VERIFY: Passes permissions to Navbar
│
├── routes/
│   ├── workflow-templates/
│   │   ├── workflow-templates.tsx        # UPDATE: Add permission checks for create button
│   │   ├── workflow-templates.create.tsx # UPDATE: Add route loader permission check
│   │   └── workflow-templates.edit.tsx   # UPDATE: Add route loader permission check
│   │
│   └── workflow-instances/
│       ├── workflow-instances.tsx        # UPDATE: Add route loader permission check
│       └── $instanceId.step.tsx          # VERIFY: Existing permissions sufficient
│
├── locales/
│   ├── en/
│   │   └── navigation.json               # VERIFY: Translation keys exist for workflow sections
│   └── es/
│       └── navigation.json               # VERIFY: Translation keys exist for workflow sections
│
└── test/
    └── layouts/
        └── Navbar.test.tsx               # UPDATE: Add tests for workflow navigation visibility

prisma/
└── schema.prisma                         # READ-ONLY: Reference Role.permissions for checks
```

**Structure Decision**: Web application with React Router SSR. Updates focused on navigation layer (Navbar component) and route-level permission guards. No new routes created - only making existing workflow template routes accessible via navigation and enforcing permissions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations. All principles satisfied:
- Service-oriented: Navigation is self-contained component layer
- API-first: Using existing documented workflow APIs
- Test-first: TDD workflow committed with Chrome DevTools MCP verification
- No real-time updates needed for this feature
- No data modifications requiring audit trails
- No AI integration
- Performance optimized with in-memory permission checks
- MCP integration planned for documentation and testing

---

## Phase Completion Summary

### ✅ Phase 0: Research (Complete)

**Artifacts Generated**:
- `research.md` - Comprehensive research findings on all technical unknowns

**Key Findings**:
- Navigation structure already implemented in Navbar.tsx
- Translation keys already exist in locales
- Permission model complete and working
- Admin role migration required as critical first step
- Route loaders need permission verification
- UI elements need permission-based visibility

### ✅ Phase 1: Design & Contracts (Complete)

**Artifacts Generated**:
- `data-model.md` - Entity documentation (no schema changes required)
- `contracts/README.md` - API contract documentation (existing endpoints)
- `quickstart.md` - Developer implementation guide
- `.github/copilot-instructions.md` - Updated with feature technologies

**Design Decisions**:
- Use existing Navbar component (no modifications needed)
- Use existing WorkflowTemplate/WorkflowInstance entities
- Use existing API endpoints (no new routes)
- Admin role migration via data update script
- Permission checks at route loader and UI component layers

**Constitution Re-Check**: ✅ All principles satisfied, no violations

### 🔄 Phase 2: Task Breakdown (Next)

**Command**: `/speckit.tasks`

**Expected Output**: `tasks.md` with ordered, executable development tasks

**Estimated Tasks**:
1. Create admin permission migration script
2. Update seed script with workflow permissions
3. Verify route loader permission guards
4. Add UI element permission visibility
5. Write unit tests (TDD)
6. Write integration tests
7. Run Chrome DevTools MCP E2E tests
8. Update documentation
9. Create pull request

---

## Implementation Readiness

### Pre-Implementation Checklist

- [x] Technical Context documented
- [x] Constitution Check passed
- [x] Research completed (all unknowns resolved)
- [x] Data model documented
- [x] API contracts documented
- [x] Quickstart guide created
- [x] Agent context updated
- [x] Test strategy defined
- [x] Performance targets set
- [x] MCP workflow planned

### Ready for Implementation

**Status**: ✅ **READY**

All planning phases complete. Feature is ready for task breakdown (`/speckit.tasks`) and implementation (`/speckit.implement`).

**Critical Path**:
1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.analyze` to verify cross-artifact consistency
3. Run `/speckit.implement` to begin TDD implementation
4. Use Chrome DevTools MCP for E2E verification

**Estimated Implementation Time**: 7-8 hours (per quickstart.md)

---

## Notes for Implementation Team

### Key Insight

The workflow navigation is **already fully implemented** in the codebase! This is a **visibility and permission enforcement** feature, not a new feature build.

**What's Actually Needed**:
1. ⚡ **CRITICAL**: Admin role permission migration (30 mins)
2. ✅ Verify route loader permission checks (1 hour)
3. ✅ Add UI button permission visibility (2 hours)
4. ✅ Write and run tests (3 hours)
5. ✅ Chrome DevTools MCP verification (1 hour)

**What's NOT Needed**:
- ❌ Building navigation component (exists)
- ❌ Creating workflow APIs (exist)
- ❌ Implementing workflow templates (exist)
- ❌ Database schema changes (none needed)
- ❌ New translation keys (exist)

### Risk Mitigation

**Low Risk Areas**:
- Navigation component stable and tested
- API endpoints battle-tested in production
- Permission model well-established

**Medium Risk Areas**:
- Admin role migration (test thoroughly on staging first)
- Permission checks in all routes (easy to miss one)

**High Risk Areas**:
- None identified

### Success Criteria

Feature is successful when:
1. Admin users see "Workflows" navigation section
2. Non-admin users without permissions don't see it
3. All CRUD operations respect permissions
4. Zero regression in existing workflow functionality
5. All tests pass (unit, integration, E2E)

---

**Plan Complete**: November 13, 2025  
**Next Command**: `/speckit.tasks`  
**Implementation Branch**: `006-workflow-template-admin-ui`
