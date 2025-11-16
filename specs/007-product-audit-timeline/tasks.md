# Implementation Tasks: Product Audit Timeline

**Feature**: 007-product-audit-timeline  
**Branch**: `007-product-audit-timeline`  
**Date**: 2025-11-14  
**Generated From**: plan.md, spec.md, data-model.md, contracts/, quickstart.md

## Overview

This document provides a detailed, ordered task list for implementing the Product Audit Timeline feature. Tasks are organized by user story to enable independent implementation and testing following TDD principles.

**Total Tasks**: 47  
**Parallelizable Tasks**: 18  
**User Stories**: 4 (P1, P2, P3, P3)

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
**Recommended for initial delivery**: User Story 1 only (View Product Change History)
- Delivers core value: visibility into product changes
- Independently testable and deployable
- Foundation for additional stories

### Incremental Delivery
1. **MVP**: User Story 1 - Core audit timeline (P1)
2. **V1.1**: User Story 2 - Deletion tracking (P2)
3. **V1.2**: User Story 3 + 4 - Filters and detailed comparison (P3)

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project dependencies, configure environment, and set up foundational infrastructure.

**Tasks**:

- [X] T001 Verify project dependencies in package.json (TypeScript 5.8+, React 19.1.1, React Router 7.8.2, Mantine UI 8.2.7, Prisma ORM, Better Auth 1.3.3, Zod 4.1.0, react-i18next 15.5.3)
- [X] T002 Run `bun install` to ensure all dependencies are installed
- [X] T003 Verify PostgreSQL database connection in .env file (DATABASE_URL)
- [X] T004 Verify Better Auth configuration for user context extraction
- [X] T005 [P] Query Context7 MCP for latest Prisma schema patterns documentation
- [X] T006 [P] Query Context7 MCP for latest Mantine UI Drawer and Timeline component documentation
- [X] T007 [P] Query Context7 MCP for latest React Router v7 loader patterns documentation

**Duration Estimate**: 30-45 minutes  
**Parallel Opportunities**: T005, T006, T007 can run simultaneously

---

## Phase 2: Foundational Layer (Database & Core Services)

**Goal**: Implement database schema, core audit services, and API infrastructure that all user stories depend on.

**Blocking**: Must complete before any user story implementation begins.

### Database Schema

- [X] T008 Add AuditEvent model to prisma/schema.prisma with fields: id, entityType, entityId, eventType, userId, userName, timestamp, changedFields, beforeSnapshot, afterSnapshot, createdAt
- [X] T009 Add indexes to AuditEvent model: composite (entityType, entityId, timestamp DESC), userId, timestamp
- [X] T010 Add auditEvents relation to existing User model in prisma/schema.prisma
- [X] T011 Run `bunx prisma migrate dev --name add_audit_events` to create migration
- [X] T012 Run `bunx prisma generate` to update Prisma client types
- [X] T013 Verify schema in Prisma Studio (`bunx prisma studio`)

### Core Services (TDD)

- [X] T014 [P] Write unit tests for audit service in app/test/services/audit.server.test.ts (logCreate, logUpdate, logDelete, detectChangedFields)
- [X] T015 [P] Write unit tests for audit query service in app/test/services/audit-query.server.test.ts (getAuditHistory with pagination)
- [X] T016 Create app/services/audit.server.ts with auditService object (logCreate, logUpdate, logDelete, createAuditEvent, detectChangedFields methods)
- [X] T017 Create app/services/audit-query.server.ts with auditQueryService object (getAuditHistory method with cursor pagination)
- [X] T018 Run tests and verify all unit tests pass (`bun test app/test/services/`)

### Type Definitions

- [X] T019 [P] Create app/types/audit.ts exporting Zod schemas from contracts/schemas.ts (EventTypeSchema, EntityTypeSchema, AuditEventSchema, etc.)
- [X] T020 [P] Add i18n translations for audit field labels in app/locales/en.json under "audit.fields.product"

**Duration Estimate**: 3-4 hours  
**Parallel Opportunities**: T014+T015 can be written in parallel; T019+T020 can be done in parallel after services

---

## Phase 3: User Story 1 - View Product Change History (P1)

**Story Goal**: Inventory managers can view complete change history for products with timeline UI showing who changed what and when.

**Independent Test**: Create product → modify fields → open audit drawer → verify timeline shows all changes in reverse chronological order.

**Priority**: P1 (Core value proposition - MVP scope)

### API Endpoint (TDD)

- [ ] T021 [US1] Write integration tests for GET /api/audit/products/:productId in app/test/routes/api.audit.test.ts (authentication, pagination, response structure)
- [X] T022 [US1] Create app/routes/api/audit.products.$productId.ts with loader function (authentication, parameter validation, call auditQueryService, return JSON response)
- [ ] T023 [US1] Run integration tests and verify all pass (`bun test app/test/routes/api.audit.test.ts`)

### React Hook

- [X] T024 [US1] Create app/hooks/useAuditHistory.ts with fetcher logic (initial load, state management, loadMore function for infinite scroll)
- [ ] T025 [US1] Write unit tests for useAuditHistory hook in app/test/hooks/useAuditHistory.test.ts

### UI Components (TDD)

- [ ] T026 [US1] Write component tests for ProductAuditDrawer in app/test/components/ProductAuditDrawer.test.tsx (drawer open/close, timeline rendering, loading states)
- [X] T027 [US1] Create app/components/ProductAuditDrawer/ProductAuditDrawer.tsx with Mantine Drawer and Timeline components (opened, onClose, title, event list)
- [X] T028 [US1] Create app/components/ProductAuditDrawer/AuditEvent.tsx component for single event display (icon, user name, timestamp, event summary)
- [X] T029 [US1] Add ProductAuditButton to products list page (icon button that opens drawer for selected product)
- [ ] T030 [US1] Run component tests and verify all pass (`bun test app/test/components/ProductAuditDrawer.test.tsx`)

### Product Service Integration

- [X] T031 [US1] Update existing product service (app/services/product.server.ts) to call auditService.logCreate on product creation
- [X] T032 [US1] Update existing product service to call auditService.logUpdate on product updates (wrap in try-catch, don't block on failure)
- [X] T032b [US1] Update existing product service to call auditService.logDelete on product deletion (wrap in try-catch, don't block on failure)
- [ ] T033 [US1] Add integration tests verifying audit events are created when products are modified

### Manual Testing (Chrome DevTools MCP)

- [ ] T034 [US1] Start dev server (`bun run dev`) and navigate to http://localhost:3000/products
- [ ] T035 [US1] Use Chrome DevTools MCP: take snapshot of products page to verify audit button exists
- [ ] T036 [US1] Use Chrome DevTools MCP: click audit button for a product (mcp_chromedevtool_click)
- [ ] T037 [US1] Use Chrome DevTools MCP: verify drawer opens with timeline (mcp_chromedevtool_take_snapshot)
- [ ] T038 [US1] Use Chrome DevTools MCP: verify events display in reverse chronological order
- [ ] T039 [US1] Create a test product, modify it multiple times, verify audit history shows all changes
- [ ] T040 [US1] Test infinite scroll by creating 25+ audit events and scrolling in drawer

**Duration Estimate**: 6-8 hours  
**Parallel Opportunities**: T026 can be written while T024-T025 are being implemented  
**Deliverable**: Fully functional audit timeline for products with basic event display

---

## Phase 4: User Story 2 - Track Deleted Products (P2)

**Story Goal**: Supervisors can investigate product deletions by viewing deletion events in audit history with full product state before deletion.

**Independent Test**: Soft-delete product → open audit drawer → verify deletion event appears with distinct styling and preserved product data.

**Priority**: P2 (Accountability for deletions)

### Service Updates

- [ ] T041 [US2] Update product service to call auditService.logDelete on soft-delete operations (set deletedAt timestamp)
- [ ] T042 [US2] Verify products are soft-deleted (deletedAt field) not hard-deleted in existing product service
- [ ] T043 [US2] Add integration tests for deletion audit events in app/test/services/product.server.test.ts

### UI Enhancements

- [ ] T044 [US2] Update AuditEvent component to show distinct icon for deletion events (IconTrash from @tabler/icons-react)
- [ ] T045 [US2] Add distinct styling for deletion events (red accent color, different background)
- [ ] T046 [US2] Display product snapshot before deletion in event card (product name, SKU, key fields)

### Testing

- [ ] T047 [US2] Use Chrome DevTools MCP: soft-delete a product and verify deletion event appears in audit timeline
- [ ] T048 [US2] Use Chrome DevTools MCP: verify deletion event is visually distinguished from updates
- [ ] T049 [US2] Verify deleted product's audit history is still accessible

**Duration Estimate**: 2-3 hours  
**Parallel Opportunities**: T044-T046 UI updates can be done in parallel  
**Deliverable**: Deletion tracking with visual distinction in timeline

---

## Phase 5: User Story 3 - Filter and Search Audit History (P3)

**Story Goal**: Compliance officers can filter audit history by date range, user, or event type to find specific changes.

**Independent Test**: Create multiple events with different users/dates/types → apply filters → verify only matching events display → clear filters → verify all events return.

**Priority**: P3 (Usability enhancement for large histories)

### API Enhancements

- [ ] T050 [US3] Update GET /api/audit/products/:productId to accept query parameters: startDate, endDate, userId, eventType
- [ ] T051 [US3] Update auditQueryService.getAuditHistory to filter by date range, user, and event type
- [ ] T052 [US3] Add integration tests for filter parameters in app/test/routes/api.audit.test.ts

### UI Components

- [ ] T053 [US3] Create FilterPanel component in app/components/ProductAuditDrawer/FilterPanel.tsx with Mantine DateRangePicker, Select inputs
- [ ] T054 [US3] Add filter state management to ProductAuditDrawer component (useState for filters, pass to useAuditHistory hook)
- [ ] T055 [US3] Update useAuditHistory hook to accept filter parameters and rebuild query URL
- [ ] T056 [US3] Add "Clear Filters" button that resets all filter state
- [ ] T057 [US3] Add visual indicator showing active filters count

### Testing

- [ ] T058 [US3] Write component tests for FilterPanel in app/test/components/FilterPanel.test.tsx
- [ ] T059 [US3] Use Chrome DevTools MCP: apply date range filter and verify filtered results
- [ ] T060 [US3] Use Chrome DevTools MCP: filter by user and verify only that user's events show
- [ ] T061 [US3] Use Chrome DevTools MCP: filter by event type and verify results
- [ ] T062 [US3] Use Chrome DevTools MCP: clear all filters and verify complete history returns

**Duration Estimate**: 3-4 hours  
**Parallel Opportunities**: T053-T055 can progress in parallel with careful state management  
**Deliverable**: Filterable audit history for compliance and investigation

---

## Phase 6: User Story 4 - Compare Field Changes (P3)

**Story Goal**: Analysts can expand update events to see detailed field-by-field comparison with old/new values and deltas for numeric fields.

**Independent Test**: Modify multiple product fields → open audit drawer → expand event → verify side-by-side comparison with deltas for numeric fields.

**Priority**: P3 (Granular detail for troubleshooting)

### UI Components

- [ ] T063 [US4] Create FieldChangeDetail component in app/components/ProductAuditDrawer/FieldChangeDetail.tsx (expandable accordion with field comparison layout)
- [ ] T064 [US4] Implement field value rendering logic: format currency, percentages, dates according to field type
- [ ] T065 [US4] Add delta calculation for numeric fields (show "+5" or "-10" with color coding)
- [ ] T066 [US4] Add diff visualization for long text fields (simple strikethrough old, bold new)
- [ ] T067 [US4] Resolve relationship fields to human-readable labels (categoryId → category name using i18n or lookup)
- [ ] T068 [US4] Update AuditEvent component to show expand/collapse icon for update events
- [ ] T069 [US4] Add expand/collapse state management to ProductAuditDrawer (track which events are expanded)

### Testing

- [ ] T070 [US4] Write component tests for FieldChangeDetail in app/test/components/FieldChangeDetail.test.tsx
- [ ] T071 [US4] Use Chrome DevTools MCP: modify product with multiple field changes (name, price, quantity)
- [ ] T072 [US4] Use Chrome DevTools MCP: expand event and verify side-by-side comparison displays
- [ ] T073 [US4] Use Chrome DevTools MCP: verify numeric deltas show with color coding (green for increase, red for decrease)
- [ ] T074 [US4] Use Chrome DevTools MCP: verify field labels use i18n translations (not database field names)

**Duration Estimate**: 4-5 hours  
**Parallel Opportunities**: T063-T067 component features can be built incrementally  
**Deliverable**: Detailed field comparison with delta visualization

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Finalize UI polish, error handling, loading states, accessibility, and documentation.

### Error Handling & Edge Cases

- [ ] T075 Add error boundary to ProductAuditDrawer component (handle API failures gracefully)
- [ ] T076 Add empty state message when product has no audit history ("No changes yet")
- [ ] T077 Add loading skeleton for initial audit history fetch (Mantine Skeleton component)
- [ ] T078 Add error toast notification for audit service failures (don't block product operations)
- [ ] T079 Handle deleted users in audit events (show "[Deleted User]" or preserved userName)

### Accessibility

- [ ] T080 [P] Add ARIA labels to audit drawer and timeline components (role="complementary", aria-label="Audit history")
- [ ] T081 [P] Verify keyboard navigation works for drawer open/close and event expansion (Tab, Enter, Escape)
- [ ] T082 [P] Add screen reader announcements for loading states and filter changes (aria-live regions)

### Performance Optimization

- [ ] T083 Verify database indexes are created correctly (check with EXPLAIN ANALYZE on audit queries)
- [ ] T084 Add React.memo to AuditEvent component to prevent unnecessary re-renders
- [ ] T085 Test with 1000+ audit events to verify no UI freezing (load test data in dev)
- [ ] T086 Verify cursor pagination maintains O(1) performance regardless of page depth

### Documentation

- [ ] T087 [P] Update README.md or docs/ with audit system overview and usage instructions
- [ ] T088 [P] Document i18n translation keys for adding new product fields to audit tracking
- [ ] T089 [P] Add JSDoc comments to auditService and auditQueryService methods

### Final Verification

- [ ] T090 Run full test suite and verify 100% pass rate (`bun test`)
- [ ] T091 Run Biome linter and fix any issues (`bun run lint`)
- [ ] T092 Verify TypeScript compilation has no errors (`bun run build`)
- [ ] T093 Create end-to-end test scenario: create product → modify → delete → view audit history → apply filters → expand events
- [ ] T094 Use Chrome DevTools MCP: run through complete user journey and verify all acceptance criteria from spec.md

**Duration Estimate**: 3-4 hours  
**Parallel Opportunities**: T080-T082 accessibility, T087-T089 documentation can run in parallel

---

## Task Dependencies

### Critical Path (Sequential)
```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (Polish)
```

### User Story Dependencies
- **US1 (P1)**: Depends on Phase 1 + Phase 2 (database + core services)
- **US2 (P2)**: Depends on US1 (extends deletion handling)
- **US3 (P3)**: Depends on US1 (adds filtering to existing timeline)
- **US4 (P3)**: Depends on US1 (adds detailed expansion to existing events)

### Independent User Stories
- **US3 and US4 can be implemented in parallel** after US1 completes (they don't depend on each other)

---

## Parallel Execution Examples

### Phase 1 (Setup)
```bash
# Can run simultaneously:
# Terminal 1: Query Prisma docs
# Terminal 2: Query Mantine docs  
# Terminal 3: Query React Router docs
# These are independent documentation lookups
```

### Phase 2 (Foundational)
```bash
# Can run simultaneously:
# Developer A: Write audit service tests (T014)
# Developer B: Write audit query tests (T015)
# Developer C: Create type definitions (T019)
# Developer D: Add i18n translations (T020)
```

### Phase 3 (US1)
```bash
# Can run simultaneously after API is implemented:
# Developer A: Build ProductAuditDrawer component (T027)
# Developer B: Build AuditEvent component (T028)
# Developer C: Write component tests (T026)
```

### Phase 5 (US3) + Phase 6 (US4)
```bash
# These user stories can be implemented in parallel:
# Team A: Implements filtering (US3, tasks T050-T062)
# Team B: Implements field comparison (US4, tasks T063-T074)
```

---

## Verification Checklist

Before marking feature complete, verify:

### Functional Requirements
- [ ] FR-001: Product creation events captured with summary (no field details)
- [ ] FR-002: Product modification events captured with field changes
- [ ] FR-003: Product deletion events captured with product state
- [ ] FR-004: Audit history button visible on products list page
- [ ] FR-005: Audit history displays in right-side drawer
- [ ] FR-006: Events shown in reverse chronological order
- [ ] FR-007: Each event shows timestamp, user, and description
- [ ] FR-008: Event types visually distinguished (icons/colors)
- [ ] FR-009: Update events expandable to show field comparison
- [ ] FR-010: Multiple field changes displayed in scannable layout
- [ ] FR-011: Audit data persists after product deletion
- [ ] FR-012: Generic design supports future entity types
- [ ] FR-013: First 20 events load, then lazy load on scroll
- [ ] FR-014: Authentication required to view audit history
- [ ] FR-015: Drawer can be closed to return to products list
- [ ] FR-016: Audit write operations logged for observability

### Success Criteria
- [ ] SC-001: Audit history loads in <2 seconds
- [ ] SC-002: 100% of modifications/deletions captured
- [ ] SC-003: Users identify changes within 5 seconds
- [ ] SC-004: Multi-field changes comprehensible in <10 seconds
- [ ] SC-005: System handles 1000+ events without freezing
- [ ] SC-006: 95% of users can use without training (usability test)
- [ ] SC-007: Audit events <1KB storage per event

### Technical Quality
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Component tests pass
- [ ] Chrome DevTools MCP tests completed
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Accessibility audit passes (WCAG 2.1 Level AA)
- [ ] Performance targets met (<500ms API, <2s load)

---

## Summary

**Total Tasks**: 94  
**Estimated Total Duration**: 25-30 hours  

**Task Breakdown by Phase**:
- Phase 1 (Setup): 7 tasks (0.5-1 hour)
- Phase 2 (Foundational): 13 tasks (3-4 hours)
- Phase 3 (US1): 20 tasks (6-8 hours) - **MVP scope**
- Phase 4 (US2): 9 tasks (2-3 hours)
- Phase 5 (US3): 13 tasks (3-4 hours)
- Phase 6 (US4): 12 tasks (4-5 hours)
- Phase 7 (Polish): 20 tasks (3-4 hours)

**Parallelizable Tasks**: 18 tasks marked with [P]

**MVP Recommendation**: Implement Phase 1 + Phase 2 + Phase 3 (US1) for initial release (10-13 hours total). This delivers core value and can be independently tested and deployed.

**Next Iterations**: Add US2 (deletions), then US3+US4 in parallel (filters and comparison).
