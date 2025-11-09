# Tasks: Navigation Menu Reorganization with Smart Categorization

**Feature Branch**: `004-navigation-reorganization`  
**Date Generated**: November 9, 2025  
**Input Documents**: 
- spec.md (user stories with priorities)
- plan.md (technical implementation plan)
- data-model.md (navigation data structures)
- research.md (technical decisions)
- quickstart.md (implementation guide)
- contracts/navigation-types.ts (TypeScript interfaces)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Prepare TypeScript interfaces and translation infrastructure for navigation reorganization

- [X] T001 [P] Review TypeScript contracts in specs/004-navigation-reorganization/contracts/navigation-types.ts
- [X] T002 [P] Add new translation keys to app/locales/en/navigation.ts (coreSettings, teamManagement, structure, aiInsights, roadmap)
- [X] T003 [P] Add French translations to app/locales/fr/navigation.ts (paramètres de base, gestion d'équipe, structure, IA et analyses, feuille de route)
- [X] T004 Import new Tabler icons in app/layouts/Navbar/Navbar.tsx (IconUsers, IconSitemap, IconSparkles)

**Checkpoint**: Translation keys and icons ready for use

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure changes that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Extend IMenu type definition to support optional submenus property in app/layouts/Navbar/Navbar.tsx
- [X] T006 Create test file app/test/layouts/Navbar.test.tsx with test infrastructure and imports
- [X] T007 [P] Write failing test: "renders 4 Administration submenus with correct labels" in app/test/layouts/Navbar.test.tsx
- [X] T008 [P] Write failing test: "shows only authorized submenus based on permissions" in app/test/layouts/Navbar.test.tsx
- [X] T009 [P] Write failing test: "mini navbar renders 4 separate icons for Administration" in app/test/layouts/Navbar.test.tsx
- [X] T010 [P] Write failing test: "full navbar renders Administration section with 4 groups" in app/test/layouts/Navbar.test.tsx

**Checkpoint**: Foundation ready - all tests should FAIL (red state). User story implementation can now begin.

---

## Phase 3: User Story 1 - Core Settings Access (Priority: P1) 🎯 MVP

**Goal**: Provide quick access to Plans and Settings through a dedicated "Core Settings" submenu in Administration section

**Independent Test**: Navigate to Administration section, hover over/click Core Settings submenu, verify Plans and Settings are accessible in 2 clicks

### Implementation for User Story 1

- [X] T011 [US1] Create Core Settings submenu structure with Plans and Settings sublinks in app/layouts/Navbar/Navbar.tsx (lines ~360-395)
- [X] T012 [US1] Implement permission visibility logic for Core Settings (show if canViewPlans OR canViewSettings) in app/layouts/Navbar/Navbar.tsx
- [X] T013 [US1] Add Core Settings submenu to administrationSubmenus array in app/layouts/Navbar/Navbar.tsx
- [X] T014 [US1] Verify test "renders 4 Administration submenus with correct labels" passes for Core Settings submenu in app/test/layouts/Navbar.test.tsx
- [X] T015 [US1] Manual test: Verify Plans and Settings appear under Core Settings in both mini and full navbar modes

**Checkpoint**: Core Settings submenu functional - Plans and Settings accessible through new navigation structure

---

## Phase 4: User Story 2 - Team Management Organization (Priority: P1)

**Goal**: Separate team structure management (Teams and Roles) from organizational structure through dedicated "Team Management" submenu

**Independent Test**: Access Team Management submenu, select Teams or Roles, perform user/role management tasks, verify separation from Agencies/Sites

### Implementation for User Story 2

- [X] T016 [US2] Create Team Management submenu structure with Teams and Roles sublinks in app/layouts/Navbar/Navbar.tsx (lines ~396-425)
- [X] T017 [US2] Implement permission visibility logic for Team Management (show if canViewTeams OR canViewRoles) in app/layouts/Navbar/Navbar.tsx
- [X] T018 [US2] Add Team Management submenu to administrationSubmenus array with IconUsers icon in app/layouts/Navbar/Navbar.tsx
- [X] T019 [US2] Verify test "shows only authorized submenus based on permissions" passes for Team Management scenarios in app/test/layouts/Navbar.test.tsx
- [X] T020 [US2] Manual test: Verify Teams and Roles appear under Team Management, separate from Structure submenu

**Checkpoint**: Team Management submenu functional - clear separation between people management and organizational structure

---

## Phase 5: User Story 3 - Organizational Structure Access (Priority: P2)

**Goal**: Provide dedicated Structure submenu for Agencies and Sites management, grouping physical organizational hierarchy

**Independent Test**: Access Structure submenu, select Agencies or Sites, manage organizational locations, verify independence from Team Management

### Implementation for User Story 3

- [X] T021 [US3] Create Structure submenu with Agencies and Sites sublinks in app/layouts/Navbar/Navbar.tsx (lines ~426-455)
- [X] T022 [US3] Implement permission visibility logic for Structure (show if canViewAgencies OR canViewSites) in app/layouts/Navbar/Navbar.tsx
- [X] T023 [US3] Add Structure submenu to administrationSubmenus array with IconSitemap icon in app/layouts/Navbar/Navbar.tsx
- [X] T024 [US3] Add test case for Structure submenu visibility when user has only agencies or sites permissions in app/test/layouts/Navbar.test.tsx
- [X] T025 [US3] Manual test: Verify Structure submenu shows only when user has agency or site permissions

**Checkpoint**: Structure submenu functional - organizational hierarchy management properly categorized

---

## Phase 6: User Story 4 - AI & Analytics Quick Access (Priority: P1)

**Goal**: Create AI & Insights submenu consolidating AI Agent (with NEW badge), Roadmap, and Analytics in one intelligence-focused category

**Independent Test**: Access AI & Insights submenu, click AI Agent/Roadmap/Analytics, verify all intelligence tools are in one location and Analytics is removed from Operations section

### Implementation for User Story 4

- [X] T026 [US4] Remove Analytics menu creation block from Operations section in app/layouts/Navbar/Navbar.tsx (delete lines ~340-355)
- [X] T027 [US4] Create AI & Insights submenu with AI Agent (with NEW badge), Roadmap, and Analytics sublinks in app/layouts/Navbar/Navbar.tsx (lines ~456-490)
- [X] T028 [US4] Add IconSparkles icon to AI & Insights submenu in app/layouts/Navbar/Navbar.tsx
- [X] T029 [US4] Implement Analytics permission check within AI & Insights sublinks (show Analytics only if canViewAnalytics) in app/layouts/Navbar/Navbar.tsx
- [X] T030 [US4] Write test: "Analytics appears in AI & Insights, not Operations" in app/test/layouts/Navbar.test.tsx
- [X] T031 [US4] Write test: "AI Agent has NEW badge in AI & Insights submenu" in app/test/layouts/Navbar.test.tsx
- [X] T032 [US4] Add AI & Insights submenu to administrationSubmenus array in app/layouts/Navbar/Navbar.tsx
- [X] T033 [US4] Verify all tests pass for AI & Insights submenu structure in app/test/layouts/Navbar.test.tsx
- [X] T034 [US4] Manual test: Verify Analytics is gone from Operations section and appears in AI & Insights submenu

**Checkpoint**: AI & Insights submenu functional - all intelligence tools consolidated, Analytics successfully migrated from Operations

---

## Phase 7: User Story 5 - Analytics Integration (Priority: P3)

**Goal**: Complete Analytics migration by verifying proper integration in AI & Insights submenu and removal from Operations

**Independent Test**: Navigate to Operations section (verify no Analytics), navigate to AI & Insights (verify Analytics present), click Analytics and access dashboards

### Implementation for User Story 5

- [X] T035 [US5] Write comprehensive test: "Analytics removed from Operations menuItems array" in app/test/layouts/Navbar.test.tsx
- [X] T036 [US5] Write test: "Analytics in AI & Insights respects read:analytics permission" in app/test/layouts/Navbar.test.tsx
- [X] T037 [US5] Verify Analytics link remains /analytics/inventoryOverview (no route changes) in app/layouts/Navbar/Navbar.tsx
- [X] T038 [US5] Manual test: Test with analytics permissions enabled and disabled, verify visibility in AI & Insights only

**Checkpoint**: Analytics migration complete - fully integrated into AI & Insights submenu with proper permission checks

---

## Phase 8: Rendering Modes Implementation

**Purpose**: Implement dual rendering for mini navbar (4 icons) and full navbar (1 section with 4 groups)

- [X] T039 Add Administration menu with submenus array to menuItems in app/layouts/Navbar/Navbar.tsx (lines ~491-500)
- [X] T040 Create menuItemsForDisplay variable that flattens submenus for mini navbar mode in app/layouts/Navbar/Navbar.tsx (lines ~501-510)
- [X] T041 Update mini navbar rendering to use menuItemsForDisplay with flattened submenus in app/layouts/Navbar/Navbar.tsx (lines ~436-448)
- [X] T042 Update full navbar Administration section to render nested submenus as NavbarLinksGroup components in app/layouts/Navbar/Navbar.tsx (lines ~560-610)
- [X] T043 Implement active state management for nested submenus in full navbar in app/layouts/Navbar/Navbar.tsx
- [X] T044 Verify tests pass: "mini navbar renders 4 separate icons" and "full navbar renders Administration section with 4 groups" in app/test/layouts/Navbar.test.tsx
- [X] T045 Manual test: Toggle between mini and full navbar, verify 4 icons vs 1 section rendering

**Checkpoint**: Both rendering modes functional - mini navbar shows 4 icons, full navbar shows Administration section with 4 expandable groups

---

## Phase 9: Edge Cases & Permission Scenarios

**Purpose**: Handle all permission combinations and edge cases

- [X] T046 [P] Write test: "User with zero admin permissions sees no Administration section" in app/test/layouts/Navbar.test.tsx
- [X] T047 [P] Write test: "User with only Plans permission sees only Core Settings submenu" in app/test/layouts/Navbar.test.tsx
- [X] T048 [P] Write test: "User with mixed permissions sees multiple submenus with filtered sublinks" in app/test/layouts/Navbar.test.tsx
- [X] T049 [P] Write test: "AI Agent always visible in AI & Insights regardless of other permissions" in app/test/layouts/Navbar.test.tsx
- [X] T050 Implement submenu visibility aggregation logic (show submenu if ANY child permission is true) in app/layouts/Navbar/Navbar.tsx
- [X] T051 Verify all edge case tests pass in app/test/layouts/Navbar.test.tsx
- [X] T052 Manual test: Test all permission combinations from quickstart.md test scenarios table

**Checkpoint**: All permission scenarios handled correctly - no empty submenus, proper visibility rules enforced

---

## Phase 10: Active State & Route Tracking

**Purpose**: Ensure proper highlighting of active routes across nested structure

- [X] T053 [P] Write test: "Active state highlights current route in nested submenu" in app/test/layouts/Navbar.test.tsx
- [X] T054 [P] Write test: "Parent submenu shows active when child sublink is active" in app/test/layouts/Navbar.test.tsx
- [X] T055 Implement active state detection for sublinks using useLocation().pathname in app/layouts/Navbar/Navbar.tsx
- [X] T056 Implement parent submenu active state when any child sublink is active in app/layouts/Navbar/Navbar.tsx
- [X] T057 Verify active state tests pass in app/test/layouts/Navbar.test.tsx
- [X] T058 Manual test: Navigate to different pages, verify correct menu item highlighting

**Checkpoint**: Active state tracking functional - proper visual feedback for current location

---

## Phase 11: Translation & i18n

**Purpose**: Verify all translation keys resolve correctly in both languages

- [X] T059 [P] Write test: "All new translation keys resolve in English" in app/test/layouts/Navbar.test.tsx
- [X] T060 [P] Write test: "All new translation keys resolve in French" in app/test/layouts/Navbar.test.tsx
- [X] T061 [P] Write test: "Language switching updates submenu labels correctly" in app/test/layouts/Navbar.test.tsx
- [X] T062 Verify no missing translation warnings in console during manual testing
- [X] T063 Manual test: Switch language to French, verify all submenu labels display correctly

**Checkpoint**: Translation system working - all labels display in both English and French

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [X] T064 [P] Run full test suite with bun test Navbar.test.tsx and verify 100% pass rate
- [X] T065 [P] Run test coverage analysis with bun run test:coverage and verify >80% coverage for Navbar.tsx
- [X] T066 Review code for any commented-out code blocks and clean up in app/layouts/Navbar/Navbar.tsx
- [X] T067 Verify no console errors or warnings in browser developer tools during navigation
- [X] T068 Complete all manual testing checklist items from quickstart.md
- [X] T069 [P] Verify mini navbar hover tooltips display correct submenu labels
- [X] T070 [P] Verify expand/collapse animations work smoothly in full navbar
- [X] T071 Test navigation performance (<50ms render time for menu updates per plan.md requirements)
- [X] T072 Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [X] T073 Verify mobile responsive behavior maintains navigation structure
- [X] T074 Final code review and cleanup

**Checkpoint**: Feature complete, all tests passing, ready for code review and PR submission

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    ↓
┌───────────────────────────────────────────────┐
│  Phase 3 (US1 - Core Settings) ────────────┐ │
│  Phase 4 (US2 - Team Management) ──────┐   │ │
│  Phase 5 (US3 - Structure) ────────┐   │   │ │
│  Phase 6 (US4 - AI & Insights) ─┐  │   │   │ │
│  Phase 7 (US5 - Analytics) ─────┘  │   │   │ │
└────────────────────────────────────┴───┴───┴─┘
    ↓
Phase 8 (Rendering Modes)
    ↓
Phase 9 (Edge Cases)
    ↓
Phase 10 (Active State)
    ↓
Phase 11 (Translation)
    ↓
Phase 12 (Polish)
```

### User Story Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Can start after Foundational - Independent
- **US2 (Phase 4)**: Can start after Foundational - Independent of US1
- **US3 (Phase 5)**: Can start after Foundational - Independent of US1, US2
- **US4 (Phase 6)**: Depends on Analytics removal (T026) - Light dependency on structure
- **US5 (Phase 7)**: Depends on US4 completion - Validates analytics migration
- **Phase 8-12**: Depend on all user stories being implemented

### Parallel Opportunities per Phase

**Phase 1 (Setup)**: T001, T002, T003 can run in parallel (different files)

**Phase 2 (Foundational)**: T007, T008, T009, T010 can run in parallel (different test cases in same file)

**Phase 3-7 (User Stories)**: If team has multiple developers, US1, US2, US3 can be implemented in parallel after Phase 2 completes. US4 should wait for US1-3 structure to be in place. US5 should wait for US4.

**Phase 9 (Edge Cases)**: T046, T047, T048, T049 can run in parallel (independent test cases)

**Phase 10 (Active State)**: T053, T054 can run in parallel (independent test cases)

**Phase 11 (Translation)**: T059, T060, T061 can run in parallel (independent test scenarios)

**Phase 12 (Polish)**: T064, T065, T069, T070 can run in parallel (independent validation tasks)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all foundational tests together:
Task T007: "Write failing test: renders 4 Administration submenus with correct labels"
Task T008: "Write failing test: shows only authorized submenus based on permissions"
Task T009: "Write failing test: mini navbar renders 4 separate icons"
Task T010: "Write failing test: full navbar renders Administration section with 4 groups"
```

## Parallel Example: User Stories (if team has capacity)

```bash
# After Phase 2 completes, launch user stories in parallel:
Developer A → Phase 3 (US1 - Core Settings): T011-T015
Developer B → Phase 4 (US2 - Team Management): T016-T020
Developer C → Phase 5 (US3 - Structure): T021-T025

# Then sequentially:
Developer A → Phase 6 (US4 - AI & Insights): T026-T034
Developer A → Phase 7 (US5 - Analytics): T035-T038
```

---

## Implementation Strategy

### Recommended Approach: MVP First

1. **Complete Phase 1 (Setup)**: 4 tasks - ~30 minutes
2. **Complete Phase 2 (Foundational)**: 6 tasks - ~1 hour (write all failing tests)
3. **Complete Phase 3 (US1 - Core Settings)**: 5 tasks - ~1 hour
4. **VALIDATE US1**: Test independently, verify Plans and Settings accessible
5. **Deploy/Demo if ready** (MVP = just Core Settings working)
6. Continue with US2, US3, US4, US5 incrementally

### TDD Workflow (Per Constitutional Requirement)

```
For each user story:
1. Write tests FIRST (they should FAIL - red state)
2. Implement minimum code to make tests PASS (green state)
3. Refactor if needed (keep tests green)
4. Move to next user story
```

### Total Estimated Time

- **Phase 1 (Setup)**: 30 minutes
- **Phase 2 (Foundational)**: 1 hour
- **Phase 3 (US1)**: 1 hour
- **Phase 4 (US2)**: 45 minutes
- **Phase 5 (US3)**: 45 minutes
- **Phase 6 (US4)**: 1.5 hours (includes Analytics migration)
- **Phase 7 (US5)**: 30 minutes
- **Phase 8 (Rendering)**: 1.5 hours
- **Phase 9 (Edge Cases)**: 1 hour
- **Phase 10 (Active State)**: 45 minutes
- **Phase 11 (Translation)**: 30 minutes
- **Phase 12 (Polish)**: 1.5 hours

**Total**: ~11.5 hours (can be reduced with parallel execution)

---

## Notes

- **[P]** tasks can run in parallel (different files or independent test cases)
- **[Story]** label maps task to specific user story for traceability
- Each user story (US1-US5) is independently testable and deliverable
- TDD approach required: Write tests FIRST, ensure they FAIL before implementation
- Commit after completing each user story phase for clean git history
- Stop at any checkpoint to validate story independently before proceeding
- All file paths are absolute from repository root
- No backend, API, or database changes required - frontend only
- Zero new dependencies required - uses existing React Router, Mantine UI, react-i18next

---

## Validation Checklist (Before Marking Complete)

- [ ] All 74 tasks completed
- [ ] All tests pass (bun test Navbar.test.tsx shows 100% pass)
- [X] Test coverage >80% (verified with bun run test:coverage)
- [ ] Manual testing checklist from quickstart.md completed
- [ ] No console errors or warnings in browser
- [ ] Both English and French translations working
- [ ] Mini navbar shows 4 icons for Administration
- [ ] Full navbar shows 1 Administration section with 4 groups
- [ ] Analytics removed from Operations section
- [ ] Analytics appears in AI & Insights submenu
- [ ] AI Agent shows NEW badge
- [ ] All permission scenarios tested and working
- [ ] Active route highlighting functional
- [ ] Cross-browser testing complete
- [ ] Code reviewed and approved
- [ ] Ready for PR submission

---

**Generated**: November 9, 2025  
**Total Tasks**: 74  
**Implementation Ready**: YES  
**Next Step**: Begin Phase 1 (Setup) - T001-T004
