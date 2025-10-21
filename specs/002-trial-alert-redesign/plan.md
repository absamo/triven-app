# Implementation Plan: Trial Alert Display Redesign

**Branch**: `002-trial-alert-redesign` | **Date**: October 21, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-trial-alert-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Redesign the trial alert display system to provide clear, non-intrusive visibility of trial status with automatic removal upon conversion to paid subscription. The feature implements urgency-based visual indicators (7+ days = subtle, 3-6 days = moderate, 1-2 days = prominent) and utilizes real-time subscription status updates via Server-Sent Events (SSE) for immediate alert removal after payment completion without requiring page refresh.

## Technical Context

**Language/Version**: TypeScript (v5.8.2), Node.js 20+  
**Primary Dependencies**: React Router v7, Mantine UI v8, Prisma ORM (latest), Better Auth v1.3.3  
**Storage**: PostgreSQL (via Prisma) - Subscription table with status, trialStart, trialEnd fields  
**Testing**: Vitest v3.2.3, Testing Library v16.3.0, Playwright v1.56.0 (E2E)  
**Target Platform**: Web application (browser-based, responsive design for mobile/tablet/desktop)  
**Project Type**: Web application (frontend + backend integrated)  
**Performance Goals**: 
  - Alert state updates via SSE within 3 seconds of payment completion
  - Initial page load with trial status < 200ms
  - Real-time subscription stream reconnection < 5 seconds on disconnect
**Constraints**: 
  - Must support both dark/light themes (Mantine UI theme system)
  - Alert must not block or obscure critical UI elements
  - Responsive design: 320px (mobile) to 3840px (desktop)
  - Graceful degradation when SSE unavailable (use initial loader data)
**Scale/Scope**: 
  - Affects all authenticated pages across application
  - Integration with existing Stripe subscription system
  - Real-time updates via existing SSE infrastructure (SubscriptionStreamManager)
  - ~10-15 component modifications, 3-5 new utility functions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitutional Principle | Compliance Status | Notes |
|-------------------------|-------------------|-------|
| **I. Service-Oriented Architecture** | ✅ PASS | UI component changes only; existing subscription services are already functional programming pattern. New helper functions will follow `export async function` pattern. |
| **II. Dark/Light Mode Support** | ✅ PASS | Using Mantine UI components with theme-aware design. No hardcoded colors. Alert will use Mantine's `Badge`, `Text`, `Button` with appropriate `color` props. |
| **III. Test-First Development** | ✅ PASS | Will write tests for trial status calculation, alert visibility logic, and SSE integration before implementation. |
| **IV. Real-Time Capabilities** | ✅ PASS | Feature uses existing WebSocket/SSE infrastructure (`SubscriptionStreamManager`). Alert removal on trial conversion happens via real-time subscription status updates. |
| **V. Data Integrity & Audit Trails** | ✅ PASS | No new data mutations - reads existing subscription status. Stripe webhooks already audit subscription changes. |
| **VI. API-First Development** | ✅ PASS | Uses existing API endpoints (`/api/subscription-status`, SSE `/api/notifications-stream` pattern). No new endpoints required. |
| **VII. Accessibility & Responsive Design** | ✅ PASS | Alert will use semantic HTML, proper ARIA labels, keyboard navigation via Mantine components. Responsive design with breakpoints for mobile/tablet/desktop. |

**Overall Gate Status**: ✅ **PASS** - No constitutional violations. Feature aligns with all principles.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── components/
│   └── TrialAlert/              # New component for trial alert display
│       ├── TrialAlert.tsx
│       ├── TrialAlert.module.css
│       └── index.ts
├── layouts/
│   ├── Layout/
│   │   └── Layout.tsx           # Modified: trial alert positioning
│   └── Header/
│       └── Header.tsx           # Modified: existing trial banner logic
├── utils/
│   └── subscription.ts          # New: trial status calculations, urgency levels
├── lib/
│   └── subscription-stream.ts   # Existing: SSE manager for real-time updates
└── test/
    ├── components/
    │   └── TrialAlert.test.tsx  # Unit tests for TrialAlert component
    └── utils/
        └── subscription.test.ts  # Unit tests for subscription utilities

prisma/
└── schema.prisma                # Existing: Subscription model (no changes)

app/locales/
├── en/
│   └── trial.ts                 # New: English translations for trial alerts
└── fr/
    └── trial.ts                 # New: French translations for trial alerts
```

**Structure Decision**: Web application structure using existing React Router v7 + Mantine UI architecture. Feature integrates into existing layout system with new TrialAlert component and utility functions. No database schema changes required - uses existing Subscription model with status, trialStart, trialEnd fields. Real-time updates leverage existing SubscriptionStreamManager SSE infrastructure.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations identified** - This section is not applicable for this feature.

## Post-Design Constitution Re-evaluation

**Date**: October 21, 2025  
**Status**: ✅ **PASS** - All constitutional principles maintained

After completing Phase 0 (Research) and Phase 1 (Design & Contracts), the implementation plan continues to fully comply with all constitutional requirements:

| Constitutional Principle | Post-Design Compliance | Evidence |
|-------------------------|------------------------|----------|
| **I. Service-Oriented Architecture** | ✅ PASS | Utility functions follow functional programming pattern (`export function calculateTrialStatus`). No classes introduced. |
| **II. Dark/Light Mode Support** | ✅ PASS | TrialAlert component uses Mantine UI with theme-aware colors (`var(--mantine-color-${color}-*)`) and Mantine components (`Badge`, `Button`, `Text`). Verified in quickstart guide. |
| **III. Test-First Development** | ✅ PASS | Tests written before implementation in quickstart guide. Unit tests for utilities (`subscription.test.ts`) and component tests (`TrialAlert.test.tsx`) documented. TDD workflow enforced. |
| **IV. Real-Time Capabilities** | ✅ PASS | Uses existing `SubscriptionStreamManager` SSE infrastructure. Real-time subscription status updates documented in data-model.md and API dependencies. |
| **V. Data Integrity & Audit Trails** | ✅ PASS | No new data mutations. Reads existing subscription data. Stripe webhooks already provide audit trail for subscription changes. |
| **VI. API-First Development** | ✅ PASS | No new API endpoints required. Uses existing SSE stream and loader data. API dependencies fully documented in `contracts/api-dependencies.md`. |
| **VII. Accessibility & Responsive Design** | ✅ PASS | Mantine UI components provide WCAG compliance. Responsive design documented with breakpoints (320px-3840px). Semantic HTML via Mantine. |

**Additional Compliance Notes**:
- **TypeScript & Type Safety**: All utility functions have complete type definitions (`TrialStatus`, `TrialAlertConfig`, etc.)
- **Code Organization**: Follows project structure conventions (`app/utils/`, `app/components/`, `app/test/`)
- **Internationalization**: English and French translations created (`app/locales/*/trial.ts`)
- **Performance**: Calculations are O(1), SSE connection reused, no polling overhead
- **Security**: User-specific SSE events, authenticated endpoints only

**No New Risks Identified**: Design phase introduced no constitutional violations or complexity concerns.

**Final Verdict**: ✅ **READY FOR IMPLEMENTATION** (/tasks breakdown)

