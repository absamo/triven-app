# Implementation Plan: Workflow Approval Process Enhancement

**Branch**: `005-workflow-approvals` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-workflow-approvals/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enhance the existing workflow system with permission-based workflow creation, email notifications via Resend for approval requests, in-app notifications for assigned approvers, and automated reminder emails for pending approvals. This feature implements a complete notification system for approval workflows with automatic reassignment for deleted users and orphaned approval handling when assigned to roles with no active members. Key technical approach: extend existing Prisma models, integrate with Resend email service, implement background job system for reminders and retries, and leverage React Router 7 for server-side actions.

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 20+, Bun runtime  
**Primary Dependencies**: React Router 7.8.2, Prisma (PostgreSQL), Better Auth 1.3.3, Resend 6.0.1, Mantine UI 8.2.7, Zod 4.1.0, react-i18next 15.5.3  
**Storage**: PostgreSQL (existing Prisma schema with WorkflowTemplate, ApprovalRequest, Notification, Role, User, Company entities)  
**Testing**: Vitest 3.2.3, Testing Library, Happy DOM (unit + integration tests)  
**Target Platform**: Web application (Node.js server, browser client)  
**Project Type**: Web application (React Router 7 full-stack framework)  
**Performance Goals**: Email delivery <2 min for 99% of cases, in-app notifications <5 sec, reminder processing within 15 min of threshold, approval request reassignment <30 sec  
**Constraints**: Email retry with exponential backoff (3 attempts: 1s, 2s, 4s), failed notification manual review queue, duplicate prevention for multi-path notifications, background job execution for non-blocking email operations  
**Scale/Scope**: Multi-tenant (company-scoped), ~50 active workflow templates per company, ~500 approval requests/day, ~100 users per company, daily reminder batch processing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `.github/copilot-instructions.md` constitutional principles:

| Principle | Status | Notes |
|-----------|--------|-------|
| **Service-Oriented Architecture** | ✅ PASS | Workflow approval notifications implemented as service layer (`app/services/workflow-approvals.server.ts`) |
| **API-First Development** | ✅ PASS | OpenAPI specs created in `contracts/approval-api.yaml` before implementation |
| **Test-First Development** | ✅ PASS | TDD workflow: write tests → implement → verify (test patterns documented in quickstart.md) |
| **Real-Time Capabilities** | ✅ PASS | In-app notifications via React Router revalidation (5-second polling), email notifications async with retry |
| **Data Integrity** | ✅ PASS | Audit trail via EmailLog model, approval request history tracking, reassignment logging, database indexes |
| **AI Integration** | N/A | No AI features in this workflow enhancement |
| **Performance** | ✅ PASS | Background job processing, database indexes on approval status/assignee, email retry logic, deduplication |

**Post-Phase 1 Assessment**: ✅ All applicable constitutional gates pass. Feature ready for implementation.

**Design Completeness**:
- ✅ Data model defined with Prisma schema changes (`data-model.md`)
- ✅ API contracts documented with OpenAPI 3.1 spec (`contracts/approval-api.yaml`)
- ✅ Service architecture designed with clear separation of concerns
- ✅ Email retry strategy with exponential backoff (1s, 2s, 4s)
- ✅ Background job system for reminders and digest processing
- ✅ Orphaned approval detection and admin dashboard access
- ✅ User deletion reassignment with audit trail
- ✅ Email delivery preferences (immediate, digest, disabled)
- ✅ Duplicate notification prevention via Set-based deduplication
- ✅ Performance indexes for query optimization
- ✅ Developer quickstart guide with testing strategies (`quickstart.md`)

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
├── services/
│   ├── workflow-approvals.server.ts      # New: Core approval workflow service
│   ├── email.server.ts                   # Extended: Add approval notification emails
│   └── notifications.server.ts           # New: In-app notification service
├── routes/
│   └── api/
│       ├── approvals.create.ts           # New: Create approval request
│       ├── approvals.$id.review.ts       # New: Review/approve/reject
│       ├── approvals.list.ts             # New: List user's pending approvals
│       ├── workflows.create.ts           # New: Create workflow (permission check)
│       └── admin.orphaned-approvals.ts   # New: Admin dashboard for orphaned
├── components/
│   ├── ApprovalRequestModal/             # New: Review approval UI
│   ├── ApprovalNotification/             # New: In-app notification component
│   └── WorkflowTemplateForm/             # New: Workflow creation form
├── emails/
│   ├── approval-request.tsx              # New: Initial approval request email
│   ├── approval-reminder.tsx             # New: 24h reminder email
│   └── approval-urgent-reminder.tsx      # New: 48h urgent reminder email
├── lib/
│   └── jobs/
│       ├── approval-reminders.ts         # New: Background job for reminders
│       └── email-retry.ts                # New: Background job for failed emails
└── test/
    ├── services/
    │   └── workflow-approvals.test.ts    # New: Unit tests for service
    └── routes/
        └── api/
            └── approvals.test.ts         # New: Integration tests for API

prisma/
├── schema.prisma                          # Extended: Add EmailLog model, update ApprovalRequest
└── migrations/
    └── 005_workflow_approvals/            # New: Migration for this feature
```

**Structure Decision**: Web application structure using React Router 7 full-stack framework. Server-side logic in `app/services/` and `app/routes/api/`, client components in `app/components/`, email templates in `app/emails/`, background jobs in `app/lib/jobs/`, tests colocated with implementation.

## Complexity Tracking

No constitutional violations requiring justification. All principles adhered to.

---

## Plan Completion Status

**Phase 0 - Research**: ✅ COMPLETE
- All NEEDS CLARIFICATION items resolved
- Technology choices documented with rationale
- Implementation patterns researched
- Output: `research.md` (9 research areas, all resolved)

**Phase 1 - Design & Contracts**: ✅ COMPLETE
- Data model designed with Prisma schema changes
- API contracts created with OpenAPI 3.1 specification
- Developer quickstart guide created
- Agent context updated (GitHub Copilot instructions)
- Outputs:
  - `data-model.md` (6 entity changes, migration strategy, query patterns)
  - `contracts/approval-api.yaml` (11 API endpoints, complete schemas)
  - `quickstart.md` (setup guide, code examples, testing strategies)

**Constitutional Re-evaluation**: ✅ PASS
- All applicable principles satisfied
- No violations or complexity justifications needed
- Feature architecture aligns with project standards

## Next Steps

This completes the `/speckit.plan` command execution. To continue implementation:

1. **Generate Tasks**: Run `/speckit.tasks` to break down implementation into executable development tasks
2. **Analyze Consistency**: Run `/speckit.analyze` to verify cross-artifact alignment
3. **Implement Feature**: Run `/speckit.implement` to execute TDD implementation
4. **Manual Testing**: Follow `quickstart.md` for local testing and validation

## Artifacts Generated

| File | Purpose | Lines |
|------|---------|-------|
| `plan.md` | This file - implementation plan overview | ~110 |
| `research.md` | Phase 0 research findings and decisions | ~450 |
| `data-model.md` | Database schema changes and migration strategy | ~620 |
| `contracts/approval-api.yaml` | OpenAPI 3.1 specification for approval APIs | ~760 |
| `quickstart.md` | Developer guide with code examples | ~580 |

**Total Documentation**: ~2,520 lines covering architecture, design, contracts, and implementation guidance.

---

**Plan Status**: ✅ Ready for `/speckit.tasks` command  
**Branch**: `005-workflow-approvals`  
**Last Updated**: 2025-11-09
