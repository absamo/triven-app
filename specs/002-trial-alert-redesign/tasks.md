---
description: "Task list for Trial Alert Display Redesign implementation"
---

# Tasks: Trial Alert Display Redesign

**Feature Branch**: `002-trial-alert-redesign`  
**Input**: Design documents from `/specs/002-trial-alert-redesign/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: This feature follows Test-Driven Development (TDD) - tests are written BEFORE implementation code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`
- **Checkbox**: `- [ ]` - Markdown task checkbox
- **[ID]**: Task identifier (T001, T002, etc.)
- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- **File paths**: Exact paths included in descriptions

## Path Conventions
- Web app structure: `app/` for source, `prisma/` for database
- Tests mirror source: `app/test/utils/`, `app/test/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and translation infrastructure

- [X] T001 Create `app/locales/en/trial.ts` with English translations for trial alert messages
- [X] T002 [P] Create `app/locales/fr/trial.ts` with French translations for trial alert messages

**Checkpoint**: Translation infrastructure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utility functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Utilities (TDD - Write First)

- [X] T003 [P] Create test file `app/test/utils/subscription.test.ts` with all test cases for trial calculations
- [X] T004 [P] Verify all foundational tests FAIL (expected - no implementation yet)

### Implementation for Foundational Utilities

- [X] T005 Create `app/utils/subscription.ts` with type definitions (TrialStatus, TrialAlertConfig, TrialUrgencyLevel, etc.)
- [X] T006 [P] Implement `calculateTrialDaysRemaining()` function in `app/utils/subscription.ts`
- [X] T007 [P] Implement `getTrialUrgencyLevel()` function in `app/utils/subscription.ts`
- [X] T008 [P] Implement `shouldShowTrialAlert()` function in `app/utils/subscription.ts`
- [X] T009 Implement `calculateTrialStatus()` function in `app/utils/subscription.ts` (depends on T006, T007)
- [X] T010 Implement `getTrialAlertConfig()` function in `app/utils/subscription.ts` (depends on T009)
- [X] T011 Run tests for `app/test/utils/subscription.test.ts` and verify ALL PASS

**Checkpoint**: Foundation ready - all utility functions tested and working. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Active Trial Alert Display (Priority: P1) 🎯 MVP

**Goal**: Display trial status with urgency-based styling (low/medium/high) and upgrade CTA

**Independent Test**: Log in with a trial account (7+ days, 3-6 days, 1-2 days remaining) and verify alert displays with correct styling, message, and upgrade button. Each urgency level should render distinctly.

### Tests for User Story 1 (TDD - Write First)

- [X] T012 [P] [US1] Create test file `app/test/components/TrialAlert.test.tsx` with component tests for all urgency levels
- [X] T013 [US1] Verify TrialAlert component tests FAIL (expected - component not created yet)

### Implementation for User Story 1

- [X] T014 [P] [US1] Create TrialAlert component directory `app/components/TrialAlert/` with index.ts export
- [X] T015 [P] [US1] Create `app/components/TrialAlert/TrialAlert.module.css` with responsive styles
- [X] T016 [US1] Create `app/components/TrialAlert/TrialAlert.tsx` with component implementation (low urgency badge)
- [X] T017 [US1] Add medium urgency banner rendering to `app/components/TrialAlert/TrialAlert.tsx`
- [X] T018 [US1] Add high urgency banner rendering to `app/components/TrialAlert/TrialAlert.tsx`
- [X] T019 [US1] Add responsive design logic to `app/components/TrialAlert/TrialAlert.tsx` for mobile/tablet/desktop
- [X] T020 [US1] Add internationalization support using react-i18next in `app/components/TrialAlert/TrialAlert.tsx`
- [X] T021 [US1] Run TrialAlert component tests and verify ALL PASS
- [X] T022 [US1] Integrate TrialAlert component into `app/layouts/Header/Header.tsx` for low urgency (header badge)
- [X] T023 [US1] Integrate TrialAlert banner into `app/layouts/Layout/Layout.tsx` for medium/high urgency (below header)
- [X] T024 [US1] Update Layout component in `app/layouts/Layout/Layout.tsx` to use `calculateTrialStatus()` and `getTrialAlertConfig()` utilities
- [X] T025 [US1] Remove old trial alert logic from Header component in `app/layouts/Header/Header.tsx`
- [X] T026 [US1] Manual testing: Verify low urgency (7+ days) displays blue badge in header
- [X] T027 [US1] Manual testing: Verify medium urgency (3-6 days) displays orange banner with clock icon
- [X] T028 [US1] Manual testing: Verify high urgency (1-2 days) displays red banner with warning icon
- [X] T029 [US1] Manual testing: Verify upgrade button navigates to billing page
- [X] T030 [US1] Manual testing: Verify responsive design on mobile (320px), tablet (768px), desktop (1920px)

**Checkpoint**: User Story 1 complete - trial alerts display with all urgency levels, fully responsive, and testable independently

---

## Phase 4: User Story 2 - Trial Conversion Confirmation (Priority: P2)

**Goal**: Alert automatically disappears when user upgrades from trial to paid plan using real-time subscription status updates

**Independent Test**: Complete a trial-to-paid conversion and verify the alert disappears within 3 seconds without page refresh. Test with Stripe CLI webhook simulation.

### Implementation for User Story 2

- [X] T031 [US2] Verify `SubscriptionStreamManager` SSE infrastructure exists in `app/lib/subscription-stream.ts` (or similar)
- [X] T032 [US2] Add SSE subscription listener in `app/layouts/Layout/Layout.tsx` to update subscription status state
- [X] T033 [US2] Update trial alert visibility logic in Layout to react to subscription status changes
- [X] T034 [US2] Add BroadcastChannel or tab synchronization for multi-tab support (if not already present)
- [ ] T035 [US2] Manual testing: Start Stripe webhook listener with `bun run stripe:listen`
- [ ] T036 [US2] Manual testing: Trigger `invoice.payment_succeeded` webhook with `stripe trigger invoice.payment_succeeded`
- [ ] T037 [US2] Manual testing: Verify trial alert disappears within 3 seconds of webhook
- [ ] T038 [US2] Manual testing: Open multiple browser tabs, trigger conversion, verify all tabs update
- [ ] T039 [US2] Manual testing: Test SSE reconnection by going offline and coming back online
- [ ] T040 [US2] Manual testing: Verify graceful degradation when SSE unavailable (uses loader data)

**Checkpoint**: User Story 2 complete - trial conversion removes alert in real-time across all tabs

---

## Phase 5: User Story 3 - Expired Trial Handling (Priority: P3)

**Goal**: Display appropriate messaging for expired trials with clear upgrade path

**Independent Test**: Access app with an expired trial account and verify appropriate blocking/notification appears with upgrade options.

### Implementation for User Story 3

- [X] T041 [US3] Add expired trial handling to `app/utils/subscription.ts` (already implemented in `calculateTrialStatus()`)
- [X] T042 [US3] Verify expired trial returns `urgencyLevel: 'expired'` and `isExpired: true`
- [X] T043 [US3] Add expired trial UI rendering logic to `app/components/TrialAlert/TrialAlert.tsx` (modal or full-page notice)
- [X] T044 [US3] Add expired trial translations to `app/locales/en/trial.ts` and `app/locales/fr/trial.ts`
- [ ] T045 [US3] Manual testing: Create test user with expired trial (trialEnd in past)
- [ ] T046 [US3] Manual testing: Verify expired trial shows modal or blocking notice
- [ ] T047 [US3] Manual testing: Verify upgrade button navigates to billing page with appropriate plan
- [ ] T048 [US3] Manual testing: Test expired trial UI on mobile/tablet/desktop

**Checkpoint**: User Story 3 complete - expired trials handled with clear upgrade path

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T049 [P] Verify dark mode support for all trial alert urgency levels
- [X] T050 [P] Verify light mode support for all trial alert urgency levels
- [X] T051 [P] Test accessibility: keyboard navigation, screen reader support, ARIA labels
- [X] T052 [P] Performance testing: measure trial status calculation time (< 10ms)
- [X] T053 [P] Performance testing: measure SSE event to UI update latency (< 3s)
- [X] T054 Run complete test suite: `bun run test`
- [X] T055 Code review: ensure constitutional compliance (all 7 principles)
- [X] T056 Update documentation in `specs/002-trial-alert-redesign/quickstart.md` if needed
- [X] T057 Run quickstart.md validation to ensure all steps are accurate

**Checkpoint**: Feature complete, polished, and ready for production

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - Core MVP
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion - Real-time updates
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion - Expired trial handling
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation + translations only - MVP deliverable
- **User Story 2 (P2)**: Requires US1 (alert must exist to remove it) - Real-time enhancement
- **User Story 3 (P3)**: Requires US1 (uses same alert component) - Edge case handling

### Within Each Phase

**Phase 2 (Foundational)**:
- Tests (T003, T004) before implementation (T005-T010) - TDD
- Type definitions (T005) before functions (T006-T010)
- Simple functions (T006, T007, T008) before composite functions (T009, T010)

**Phase 3 (User Story 1)**:
- Tests (T012, T013) before implementation (T014-T030) - TDD
- Component structure (T014, T015) before implementation (T016-T020)
- Component implementation before integration (T022-T025)
- Integration before manual testing (T026-T030)

**Phase 4 (User Story 2)**:
- Infrastructure verification (T031) before new code (T032-T034)
- State management updates (T032-T033) before testing (T035-T040)

**Phase 5 (User Story 3)**:
- Logic verification (T041-T042) before UI (T043-T044)
- Implementation before testing (T045-T048)

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T001 and T002 can run in parallel (different files)

**Foundational Phase (Phase 2)**:
- T003 and T004 can run in parallel (different test files)
- T006, T007, T008 can run in parallel (independent functions, different sections of same file)

**User Story 1 (Phase 3)**:
- T014 and T015 can run in parallel (different files)
- T026-T030 manual tests can run in sequence (same test environment)

**Polish Phase (Phase 6)**:
- T049, T050, T051, T052, T053 can all run in parallel (different testing concerns)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch test file creation in parallel:
Task T003: "Create app/test/utils/subscription.test.ts"
Task T004: "Verify tests fail"

# After types are defined (T005), launch independent function implementations:
Task T006: "Implement calculateTrialDaysRemaining()"
Task T007: "Implement getTrialUrgencyLevel()"
Task T008: "Implement shouldShowTrialAlert()"

# Then composite functions that depend on simple ones:
Task T009: "Implement calculateTrialStatus()" (depends on T006, T007)
Task T010: "Implement getTrialAlertConfig()" (depends on T009)
```

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch component structure in parallel:
Task T014: "Create app/components/TrialAlert/ directory"
Task T015: "Create TrialAlert.module.css"

# Manual tests can be grouped:
Task T026-T030: Run together in single test session with different trial configurations
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - Recommended)

1. ✅ Complete Phase 1: Setup (translations)
2. ✅ Complete Phase 2: Foundational (utilities with TDD)
3. ✅ Complete Phase 3: User Story 1 (trial alert display)
4. **STOP and VALIDATE**: Test User Story 1 independently with all urgency levels
5. Deploy/demo if ready - core value delivered

**Benefits**: Fastest path to value, user can see trial status immediately

### Incremental Delivery (Full Feature)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! ✅)
3. Add User Story 2 → Test independently → Deploy/Demo (Real-time enhancement ✅)
4. Add User Story 3 → Test independently → Deploy/Demo (Edge case coverage ✅)
5. Add Polish → Full feature complete

**Benefits**: Each increment adds value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (critical path)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T012-T030) - MVP
   - Wait for US1 completion, then:
     - **Developer B**: User Story 2 (T031-T040) - Real-time updates
     - **Developer C**: User Story 3 (T041-T048) - Expired trial handling
3. All team: Polish phase together (T049-T057)

**Benefits**: Parallel work after foundation, stories integrate cleanly

---

## Validation Checkpoints

### After Phase 2 (Foundational)
- [ ] All utility functions have passing tests
- [ ] Type definitions are complete and exported
- [ ] No TypeScript errors in `app/utils/subscription.ts`
- [ ] Test coverage for all calculation edge cases

### After Phase 3 (User Story 1 - MVP)
- [ ] Trial alert displays for all three urgency levels
- [ ] Upgrade button navigates correctly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Dark and light modes both work
- [ ] Internationalization works for English and French
- [ ] Component tests pass

### After Phase 4 (User Story 2)
- [ ] Alert disappears within 3 seconds of payment webhook
- [ ] Multiple browser tabs all update simultaneously
- [ ] SSE reconnection works after network interruption
- [ ] Graceful degradation when SSE unavailable

### After Phase 5 (User Story 3)
- [ ] Expired trials show appropriate blocking/notification
- [ ] Upgrade path is clear for expired users
- [ ] UI works across all device sizes

### Before Production Deployment
- [ ] All tests passing (`bun run test`)
- [ ] All manual test scenarios validated
- [ ] Constitutional compliance verified (7 principles)
- [ ] Performance metrics met (< 200ms load, < 3s SSE latency)
- [ ] Accessibility testing complete
- [ ] Dark/light mode verified
- [ ] No console errors or warnings

---

## Task Summary

**Total Tasks**: 57  
**Setup Tasks**: 2  
**Foundational Tasks**: 9  
**User Story 1 Tasks**: 19 (MVP)  
**User Story 2 Tasks**: 10  
**User Story 3 Tasks**: 8  
**Polish Tasks**: 9

**Parallel Opportunities**: 12 tasks marked [P]  
**Test Tasks**: 7 (TDD approach)  
**Manual Testing Tasks**: 16 (validation)

**Estimated MVP Completion**: Setup + Foundational + User Story 1 = 30 tasks  
**Suggested First Increment**: Tasks T001-T030 (MVP with full trial display)

---

## Notes

- All tasks follow TDD: tests written and failing BEFORE implementation
- [P] tasks are in different files or independent sections
- [Story] labels enable traceability to spec.md user stories
- Each phase has clear checkpoints for validation
- MVP (User Story 1) delivers core value independently
- Constitution compliance verified throughout (see plan.md)
- No database schema changes required
- Uses existing SSE infrastructure (SubscriptionStreamManager)
- Tests use Vitest + Testing Library (existing project setup)

**Feature Ready for Implementation** ✅
