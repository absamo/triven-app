# Implementation Plan: Navigation Menu Reorganization with Smart Categorization

**Branch**: `004-navigation-reorganization` | **Date**: November 9, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-navigation-reorganization/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Reorganize the Administration section navigation from a flat list of 7+ items into 4 logical submenus: "Company (Core Settings)" (Plans, Settings), "Team Management" (Teams, Roles), "Structure" (Agencies, Sites), and "AI & Insights" (AI Agent with NEW badge, Roadmap, Analytics). This frontend-only change improves information architecture by grouping related functions while maintaining all existing permissions, routes, and functionality. Analytics will be moved from Operations to Administration. The mini navbar will display 4 separate icons for Administration submenus with individual hover dropdowns.

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 20+, Bun runtime  
**Primary Dependencies**: React 19.1.1, React Router 7.8.2, Mantine UI 8.2.7, react-i18next 15.5.3  
**Storage**: N/A (frontend-only, no database changes)  
**Testing**: Vitest 3.2.3, Testing Library (@testing-library/react 16.3.0), @testing-library/jest-dom 6.6.3  
**Target Platform**: Web application (React Router v7 SPA)  
**Project Type**: Web application (frontend-only feature)  
**Performance Goals**: No performance impact - navigation reorganization should maintain <50ms render time for menu updates  
**Constraints**: 
- Must maintain backward compatibility with existing routes
- Must preserve all permission checking logic
- Must work in both full navbar and mini navbar (icon-only) modes
- Must support i18n (English and French translations)
- Must use existing Mantine UI components without new dependencies  
**Scale/Scope**: 
- Affects 7 navigation menu items being reorganized into 4 submenus
- Impacts 2 components: `Navbar.tsx` and `NavbarLinksGroup.tsx`
- Requires updates to 2 translation files (en, fr)
- Zero backend changes, zero API changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on project constitutional principles from `.github/copilot-instructions.md`:

### 1. Service-Oriented Architecture ✅ PASS
**Principle**: Implement features as standalone services  
**Status**: PASS - Navigation reorganization is a UI-only feature with no service implications. No new services needed.

### 2. API-First Development ✅ PASS
**Principle**: Create OpenAPI specs before implementation  
**Status**: PASS - No API changes. This is frontend-only navigation reorganization.

### 3. Test-First Development ⚠️ REQUIRES ATTENTION
**Principle**: Write tests before implementation code (TDD)  
**Status**: REQUIRES ATTENTION - Must write tests for:
- Navigation menu structure rendering
- Permission-based visibility rules
- Active state tracking
- Translation key resolution
- Mini navbar icon rendering and hover behavior

### 4. Real-Time Capabilities ✅ PASS
**Principle**: Use WebSockets for live updates  
**Status**: PASS - Navigation is static configuration. No real-time requirements.

### 5. Data Integrity ✅ PASS
**Principle**: Implement audit trails for business-critical operations  
**Status**: PASS - Navigation structure changes do not affect business data.

### 6. AI Integration ✅ PASS
**Principle**: Make AI features optional and fault-tolerant  
**Status**: PASS - AI Agent menu item already exists. Reorganization only changes its placement.

### 7. Performance ✅ PASS
**Principle**: Optimize database queries and implement caching  
**Status**: PASS - No database operations. Navigation rendering is client-side and performant.

### **GATE DECISION: ✅ PROCEED**
No blocking violations. Feature complies with constitutional principles. TDD requirement noted for implementation phase.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   │   ├── Navbar.tsx           # Main navigation component (PRIMARY EDIT)
│   │   ├── Navbar.module.css    # Navigation styles
│   │   └── index.tsx
│   └── NavbarLinksGroup/
│       ├── NavbarLinksGroup.tsx # Submenu rendering (MINOR EDIT for nested submenus)
│       ├── NavbarLinksGroup.module.css
│       └── index.tsx
├── locales/
│   ├── en/
│   │   └── navigation.ts        # English translations (ADD new keys)
│   └── fr/
│       └── navigation.ts        # French translations (ADD new keys)
└── test/
    └── layouts/
        └── Navbar.test.tsx      # Navigation tests (CREATE - TDD requirement)

specs/004-navigation-reorganization/
├── plan.md                      # This file
├── research.md                  # Phase 0 output (TO BE CREATED)
├── data-model.md                # Phase 1 output (TO BE CREATED)
├── quickstart.md                # Phase 1 output (TO BE CREATED)
└── contracts/
    └── navigation-types.ts      # TypeScript interfaces (TO BE CREATED)
```

**Structure Decision**: React Router v7 web application with frontend-only changes. The navigation reorganization affects only the `app/layouts/Navbar/` component hierarchy and translation files. No backend, API, or database changes required. Test files will be created following Vitest conventions in `app/test/` directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations to justify** - This feature complies with all constitutional principles.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion*

### 1. Service-Oriented Architecture ✅ PASS
No changes from initial check. Navigation remains UI-only with no service implications.

### 2. API-First Development ✅ PASS
No changes from initial check. No API modifications required.

### 3. Test-First Development ✅ PASS
**Status**: READY FOR IMPLEMENTATION
- Test file structure defined in `quickstart.md`
- Test scenarios documented in `data-model.md`
- TDD workflow outlined in implementation guide
- 7 core test cases identified covering all functional requirements

### 4. Real-Time Capabilities ✅ PASS
No changes from initial check. Navigation is static configuration.

### 5. Data Integrity ✅ PASS
No changes from initial check. No business data affected.

### 6. AI Integration ✅ PASS
**Enhanced**: AI Agent placement improved through better categorization in "AI & Insights" submenu, increasing feature discoverability.

### 7. Performance ✅ PASS
No changes from initial check. Design maintains performant client-side rendering approach.

### **FINAL GATE DECISION: ✅ APPROVED**
All constitutional principles satisfied. Design phase complete. Ready to proceed to Phase 2 (Tasks & Implementation).

---

## Planning Summary

### What Was Delivered

**Phase 0: Research & Discovery** ✅ COMPLETED
- Created `research.md` with 6 major technical decisions resolved
- Documented nested submenu patterns for Mantine UI
- Selected appropriate Tabler icons for 4 Administration submenus
- Defined translation key structure for i18n
- Established permission visibility rules
- Analyzed mini vs full navbar rendering differences
- Identified Analytics migration impact

**Phase 1: Design & Contracts** ✅ COMPLETED
- Created `data-model.md` defining navigation data structures
  - Core entities: IMenu, ISublink, ISubmenu
  - State management approach
  - Permission-based visibility rules
  - Translation data model
  - 4 test scenarios for validation
- Created `contracts/navigation-types.ts` with TypeScript interfaces
  - Complete type definitions for navigation structure
  - Type guards for safe property access
  - Helper types for menu building
  - Constants for configuration
- Created `quickstart.md` implementation guide
  - 10-phase step-by-step instructions
  - TDD workflow with test templates
  - Manual testing checklist
  - Troubleshooting guide
- Updated agent context via `update-agent-context.sh` script
  - Added TypeScript 5.8+, React Router 7.8.2, Mantine 8.2.7 to copilot instructions

### Key Design Decisions

1. **Nested Submenus**: Extended `IMenu` type with optional `submenus` property for 2-level hierarchy
2. **Icon Selection**: IconBuilding, IconUsers, IconSitemap, IconSparkles for 4 Administration submenus
3. **Analytics Migration**: Moved from Operations section to AI & Insights submenu
4. **Dual Rendering Modes**: Mini navbar shows 4 icons, full navbar shows 1 section with 4 groups
5. **Permission Rules**: Show submenu only if user has permission for at least one child item
6. **TDD Approach**: 7 core test cases defined, tests written before implementation

### Files Generated

| File | Purpose | Status |
|------|---------|--------|
| `specs/004-navigation-reorganization/plan.md` | Implementation plan (this file) | ✅ Complete |
| `specs/004-navigation-reorganization/research.md` | Technical research & decisions | ✅ Complete |
| `specs/004-navigation-reorganization/data-model.md` | Data structure definitions | ✅ Complete |
| `specs/004-navigation-reorganization/quickstart.md` | Developer implementation guide | ✅ Complete |
| `specs/004-navigation-reorganization/contracts/navigation-types.ts` | TypeScript type contracts | ✅ Complete |
| `.github/copilot-instructions.md` | Updated agent context | ✅ Updated |

### Implementation Impact

**Files to Modify**:
- `app/layouts/Navbar/Navbar.tsx` (primary changes)
- `app/locales/en/navigation.ts` (add 5 new keys)
- `app/locales/fr/navigation.ts` (add 5 new keys)

**Files to Create**:
- `app/test/layouts/Navbar.test.tsx` (TDD requirement)

**Zero Changes Required**:
- Backend code
- API routes
- Database schema
- Prisma models
- Authentication/authorization logic
- Existing routes or links

### Next Steps

1. **Run `/speckit.tasks`** command to generate `tasks.md` with ordered implementation steps
2. **Follow TDD workflow** outlined in `quickstart.md`
3. **Implement changes** per generated tasks
4. **Verify tests pass** and manual testing checklist complete
5. **Submit PR** for code review

### Branch Information

**Current Branch**: `004-navigation-reorganization`  
**Base Branch**: `main` (or `001-mastra-assistant-tools` as shown in repo context)  
**Feature Spec**: `/Users/mas/MAS/triven-app/specs/004-navigation-reorganization/spec.md`  
**Implementation Plan**: `/Users/mas/MAS/triven-app/specs/004-navigation-reorganization/plan.md`

---

## Phase 2 Command

To proceed with implementation, run:

```bash
/speckit.tasks
```

This will generate `specs/004-navigation-reorganization/tasks.md` with granular, ordered implementation tasks based on this plan.

---

**Planning Phase Status**: ✅ **COMPLETE**  
**Date Completed**: November 9, 2025  
**Ready for Implementation**: YES
