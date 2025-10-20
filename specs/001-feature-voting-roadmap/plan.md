````markdown
# Implementation Plan: Feature Voting & Product Roadmap

**Branch**: `001-feature-voting-roadmap` | **Date**: 20 October 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-feature-voting-roadmap/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements an admin-only product roadmap page with a kanban board interface displaying feature requests across four stages (To Do, Planned, In Progress, Shipped). Users can vote on features to influence prioritization, while administrators manage the roadmap lifecycle. The implementation uses React Router v7 with Mantine UI for the frontend, Prisma ORM for data persistence, Better Auth for access control, and WebSockets for real-time vote updates. The feature integrates seamlessly with the existing Triven App architecture.

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 20+  
**Primary Dependencies**: React Router v7, Mantine UI 8.x, Prisma ORM, Better Auth, WebSocket (ws)  
**Storage**: PostgreSQL (via existing Prisma setup)  
**Testing**: Vitest, Testing Library, Playwright for E2E  
**Target Platform**: Web (responsive design, mobile-first from 375px)
**Project Type**: Web application (existing React Router v7 full-stack app)  
**Performance Goals**: <2s page load for 100 features, <1s vote response, <3s real-time sync  
**Constraints**: Admin-only access enforced at route/component/API levels, mobile responsive (375px+)  
**Scale/Scope**: Expected 50-200 feature requests, 10-1000 concurrent voters, moderate admin activity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

Based on the Triven App constitutional principles:

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| **Service-Oriented Architecture** | Features as standalone services | ✅ PASS | Roadmap feature implemented as isolated service module with clear boundaries |
| **API-First Development** | OpenAPI specs before implementation | ✅ PASS | API contracts defined in Phase 1 before implementation |
| **Test-First Development** | Tests before implementation | ✅ PASS | TDD enforced: Phase 2 tasks include test writing before implementation |
| **Real-Time Capabilities** | WebSockets for live updates | ✅ PASS | WebSocket integration for vote count updates (FR-013) |
| **Data Integrity** | Audit trails for critical operations | ✅ PASS | Audit trail for feature status changes (FR-023) |
| **AI Integration** | AI features optional/fault-tolerant | ⚠️ N/A | No AI features in this roadmap feature |
| **Performance** | Optimized queries & caching | ✅ PASS | Database indexes planned, pagination for large datasets |

**Overall Gate Status**: ✅ **PASSED** - All applicable principles satisfied

**Justification for N/A**: This feature does not require AI integration. Future enhancement could add AI-powered feature suggestion analysis.

---

### Post-Phase 1 Re-Check

After completing research, data model, and API contract design:

| Principle | Requirement | Status | Verification |
|-----------|-------------|--------|--------------|
| **Service-Oriented Architecture** | Features as standalone services | ✅ PASS | ✓ Isolated in `app/services/roadmap/`<br>✓ Clear service boundaries (FeatureService, VoteService)<br>✓ No tight coupling with other features |
| **API-First Development** | OpenAPI specs before implementation | ✅ PASS | ✓ OpenAPI 3.1 spec created (`contracts/openapi.yml`)<br>✓ WebSocket contract documented (`contracts/websocket.md`)<br>✓ All endpoints defined before implementation |
| **Test-First Development** | Tests before implementation | ✅ PASS | ✓ Test structure defined in quickstart.md<br>✓ Unit tests for services required<br>✓ Integration tests for API endpoints<br>✓ E2E tests for user flows |
| **Real-Time Capabilities** | WebSockets for live updates | ✅ PASS | ✓ WebSocket protocol fully specified<br>✓ Event types defined (VOTE_UPDATE, FEATURE_UPDATE)<br>✓ Broadcast mechanism designed<br>✓ <3 second update target (SC-004) |
| **Data Integrity** | Audit trails for critical operations | ✅ PASS | ✓ FeatureAuditLog model created<br>✓ All status changes logged<br>✓ Transactional vote operations<br>✓ Denormalized vote count with consistency checks |
| **AI Integration** | AI features optional/fault-tolerant | ⚠️ N/A | No AI features in scope (confirmed after design) |
| **Performance** | Optimized queries & caching | ✅ PASS | ✓ Composite index on (status, voteCount, createdAt)<br>✓ Cursor-based pagination designed<br>✓ Vote count denormalization for query performance<br>✓ <2s page load target (SC-006) |

**Overall Gate Status**: ✅ **PASSED** - All applicable principles satisfied after Phase 1 design

**Design Integrity Confirmed**: 
- Architecture aligns with constitutional principles
- No principle violations introduced during design
- All performance and data integrity requirements addressed
- API-first approach successfully applied
- Ready for Phase 2 (Task Breakdown)

## Project Structure

### Documentation (this feature)

```
specs/001-feature-voting-roadmap/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── openapi.yml      # API contract definitions
│   └── websocket.md     # WebSocket event specifications
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── routes/
│   ├── roadmap.tsx                    # Main roadmap page route (admin-only)
│   └── api/
│       ├── api.roadmap.features.ts    # Feature CRUD endpoints
│       ├── api.roadmap.votes.ts       # Voting endpoints
│       └── api.roadmap.ws.ts          # WebSocket handler for real-time updates
├── components/
│   └── Roadmap/
│       ├── index.tsx                  # Roadmap page container
│       ├── KanbanBoard.tsx            # Kanban board layout
│       ├── KanbanColumn.tsx           # Individual column component
│       ├── FeatureCard.tsx            # Feature card display
│       ├── FeatureForm.tsx            # Create/edit feature form
│       ├── VoteButton.tsx             # Vote/unvote button
│       ├── RoadmapIcon.tsx            # Header icon component
│       └── Roadmap.module.css         # Component styles
├── services/
│   └── roadmap/
│       ├── feature.service.ts         # Feature business logic
│       ├── vote.service.ts            # Voting business logic
│       └── websocket.service.ts       # WebSocket connection management
├── lib/
│   └── roadmap/
│       ├── validators.ts              # Zod schemas for request validation
│       ├── permissions.ts             # Admin access control utilities
│       └── types.ts                   # TypeScript type definitions
└── test/
    └── roadmap/
        ├── feature.service.test.ts    # Feature service unit tests
        ├── vote.service.test.ts       # Vote service unit tests
        ├── roadmap.api.test.ts        # API integration tests
        └── roadmap.e2e.test.ts        # End-to-end Playwright tests

prisma/
├── schema.prisma                      # Updated with FeatureRequest, FeatureVote models
└── migrations/
    └── XXXXXX_add_roadmap_tables/     # Migration for new tables
        └── migration.sql

public/
└── assets/
    └── icons/
        └── roadmap-icon.svg           # Roadmap header icon
```

**Structure Decision**: This is a web application feature integrated into the existing React Router v7 architecture. The structure follows the established Triven App patterns:
- **Routes**: Page components and API endpoints in `app/routes/`
- **Components**: Reusable UI components in `app/components/Roadmap/`
- **Services**: Business logic layer in `app/services/roadmap/`
- **Database**: Prisma schema extensions for new entities
- **Tests**: Co-located test files in `app/test/roadmap/`

This organization maintains consistency with existing features like agencies, invoices, and products while isolating roadmap functionality for maintainability.

## Complexity Tracking

*This feature does not introduce constitutional violations. No complexity justification required.*

All architectural decisions align with Triven App principles:
- Service isolation maintained
- API-first approach followed
- TDD workflow enforced
- Real-time capabilities implemented per standards
- Data integrity preserved with audit trails
- Standard PostgreSQL + Prisma patterns used

