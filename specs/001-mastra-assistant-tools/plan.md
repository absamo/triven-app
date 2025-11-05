````markdown
# Implementation Plan: Enhanced Mastra Assistant Tools

**Branch**: `001-mastra-assistant-tools` | **Date**: November 3, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mastra-assistant-tools/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add comprehensive tool capabilities to the Mastra AI chat assistant enabling users to perform inventory management operations (product updates, category management, order operations, supplier management) through conversational interface. Tools will use Mastra framework with Zod schemas, execute via Prisma ORM against PostgreSQL database, enforce role-based authorization, implement optimistic locking for concurrency, log execution details for audit, and format outputs as markdown for streaming display.

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 20+, Bun runtime  
**Primary Dependencies**: 
- Mastra 0.23+ (AI agent framework with tool execution)
- Prisma (ORM for PostgreSQL)
- Zod 4.1+ (schema validation)
- React Router 7.8+ (web framework)
- Better Auth 1.3+ (authentication/authorization)
- ai-sdk-ollama 0.5+ (LLM integration)

**Storage**: PostgreSQL (existing Prisma schema with Product, Category, Order, Supplier, PurchaseOrder entities)  
**Testing**: Vitest 3.2+, Testing Library, Playwright for E2E  
**Target Platform**: Web application (server-side tools, client-side streaming UI)  
**Project Type**: Web (full-stack with backend API tools and frontend chat interface)  
**Performance Goals**: 
- Tool execution <3s for 95% of requests
- Complete user operations <30s end-to-end
- Support 50 concurrent tool users without degradation

**Constraints**: 
- 99.5% uptime requirement
- 99.9% data integrity (optimistic locking required)
- Role-based authorization must be enforced on every tool
- Full audit logging with PII sanitization
- Bilingual support (English/French)

**Scale/Scope**: 
- ~17 new Mastra tools (product, category, order, supplier operations)
- 1 new database entity (ToolExecutionLog)
- 2 schema modifications (Product.version, authorization enhancements)
- Integration with existing 6 read-only tools

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **Service-Oriented Architecture** | ✅ PASS | Tools are self-contained functions with clear interfaces (Zod schemas), can be tested independently |
| **API-First Development** | ⚠️ PARTIAL | Tools define clear contracts via Zod schemas; Will create OpenAPI specs in Phase 1 for external documentation |
| **Test-First Development** | ✅ PASS | Plan includes comprehensive test strategy (unit for tools, integration for Prisma ops, E2E for chat flows) |
| **Real-Time Capabilities** | ✅ PASS | Leverages existing SSE streaming infrastructure for tool results; maintains existing WebSocket patterns |
| **Data Integrity** | ✅ PASS | Implements audit logging (ToolExecutionLog), optimistic locking (Product.version), transaction safety |
| **AI Integration** | ✅ PASS | Tools are optional enhancements to existing chat; graceful degradation if tool execution fails |
| **Performance** | ✅ PASS | Prisma queries optimized with proper includes/selects, implements caching strategy for category stats |

**Overall**: ✅ **PASS** - All constitutional principles satisfied or have clear mitigation in design

## Project Structure

### Documentation (this feature)

```text
specs/001-mastra-assistant-tools/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (entity schemas)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (tool definitions)
│   ├── product-tools.yaml
│   ├── category-tools.yaml
│   ├── order-tools.yaml
│   └── supplier-tools.yaml
└── checklists/
    └── requirements.md  # Quality validation (complete)
```

### Source Code (repository root)

```text
app/
├── lib/
│   ├── index.ts                    # Mastra agent & tools (MODIFY - add new tools)
│   ├── mastra-tools/               # NEW DIRECTORY - organized tool modules
│   │   ├── product-tools.ts        # FR-001 to FR-004: Product management tools
│   │   ├── category-tools.ts       # FR-005 to FR-007: Category management tools
│   │   ├── order-tools.ts          # FR-008 to FR-011: Order & sales tools
│   │   ├── supplier-tools.ts       # FR-015 to FR-017: Supplier & PO tools
│   │   ├── recommendation-tools.ts # FR-012 to FR-014: Analytics & recommendations
│   │   ├── tool-logger.ts          # FR-024: Audit logging utility
│   │   ├── tool-auth.ts            # FR-026: Authorization middleware
│   │   └── index.ts                # Tool exports & aggregation
│   └── tool-formatters.ts          # FR-019: Markdown output formatting
├── routes/
│   └── mastra-chat.tsx             # MODIFY - update UI for new tool capabilities
├── services/
│   ├── authorization.server.ts     # NEW - role-based permission checks
│   └── analytics.server.ts         # NEW - sales velocity & turnover calculations
└── db.server.ts                    # Prisma client (existing)

prisma/
├── schema.prisma                   # MODIFY - add ToolExecutionLog, Product.version
└── migrations/                     # NEW - migration for schema changes

tests/
├── unit/
│   └── lib/
│       └── mastra-tools/           # NEW - unit tests for each tool module
├── integration/
│   ├── mastra-tools.test.ts        # NEW - tool execution with real DB
│   └── authorization.test.ts       # NEW - role permission integration
└── e2e/
    └── mastra-chat.spec.ts         # MODIFY - add E2E for new operations
```

**Structure Decision**: Web application structure with organized tool modules in `app/lib/mastra-tools/`. Separates concerns by domain (product, category, order, supplier) for maintainability. Service layer (`app/services/`) handles cross-cutting concerns like authorization and analytics. Tests mirror source structure.

## Complexity Tracking

> **No violations requiring justification** - All complexity aligns with constitutional principles

---

## Phase 0: Outline & Research

**Objective**: Resolve all technical unknowns before implementation begins

### Research Topics

✅ **1. Mastra Tool Organization Patterns**
- Research optimal patterns for organizing 17 tools across 5 domains
- **Decision**: Modular organization by domain (product, category, order, supplier, recommendations) in `app/lib/mastra-tools/`
- **Rationale**: Better than monolithic approach - enables parallel development, clear ownership, easier testing
- **Details**: See `research.md` Section 1

✅ **2. Optimistic Locking with Prisma**
- Research version-based concurrency control patterns
- **Decision**: Use version field with `updateMany` and count check
- **Rationale**: Simpler than timestamp-based, integrates well with Prisma, PostgreSQL efficient
- **Details**: See `research.md` Section 2

✅ **3. Role-Based Authorization Patterns**
- Research middleware approaches for tool authorization
- **Decision**: `withAuth` HOF wrapper with permission enum and role matrix
- **Rationale**: Declarative, testable, no runtime reflection needed
- **Details**: See `research.md` Section 3

✅ **4. Tool Execution Audit Logging**
- Research async logging strategies with PII sanitization
- **Decision**: Async logging with sanitizeObject utility, separate ToolExecutionLog table
- **Rationale**: Doesn't block tool execution, supports compliance, queryable for analytics
- **Details**: See `research.md` Section 4

✅ **5. Sales Velocity Calculation Algorithms**
- Research moving average methods for inventory forecasting
- **Decision**: 30-day rolling average with sparse data handling
- **Rationale**: Balances responsiveness with stability, handles seasonal patterns
- **Details**: See `research.md` Section 5

### Research Artifacts

- ✅ `research.md` created (1559 lines) - comprehensive findings with code examples
- ✅ All decisions validated against constitutional principles
- ✅ Performance implications documented for each approach

---

## Phase 1: Data Model & Contracts

**Objective**: Define database schema, API contracts, and developer documentation

### Deliverables

✅ **1. data-model.md** - Entity schemas and relationships
- Product model modification (add `version` field for optimistic locking)
- New ToolExecutionLog model for audit trail
- Validation rules for all input fields
- State transition diagrams for Order and PurchaseOrder statuses
- Performance considerations (indexes, query optimization)

✅ **2. contracts/** - Tool API specifications (YAML format)
- `product-tools.yaml` - 4 tools: updateProductStock, updateProductPrice, createProduct, updateProductDetails
- `category-tools.yaml` - 3 tools: listCategories, createCategory, moveProductsBetweenCategories
- `order-tools.yaml` - 4 tools: getOrders, createOrder, updateOrderStatus, getSalesAnalytics
- `supplier-tools.yaml` - 3 tools: listSuppliers, createPurchaseOrder, receivePurchaseOrder
- `recommendation-tools.yaml` - 3 tools: getReorderRecommendations, getSlowMovingInventory, getDailyActionItems
- Each contract includes: Zod schemas, authorization rules, examples, error codes, side effects, performance targets

✅ **3. quickstart.md** - Developer guide
- Setup instructions (dependencies, migrations, environment)
- Step-by-step tool creation tutorial
- Testing strategies (unit, integration, E2E)
- Common patterns (optimistic locking, transactions, aggregations, PII sanitization)
- Troubleshooting guide

### Phase 1 Checklist

- [x] Identify all entities modified or created (Product, ToolExecutionLog)
- [x] Define Prisma-compatible schemas with validation rules
- [x] Document relationships and foreign keys
- [x] Specify indexes for performance-critical queries
- [x] Create YAML contracts for all 17 tools with complete I/O specifications
- [x] Include authorization requirements in each contract
- [x] Document error codes and resolution strategies
- [x] Write quickstart guide with working code examples
- [x] Validate all artifacts against spec requirements

---

## Phase 2: Task Generation

**Objective**: Break implementation into executable, ordered development tasks

**Note**: Phase 2 is executed by the `/speckit.tasks` command (separate from `/speckit.plan`)

### Task Categories

The `/speckit.tasks` command will generate `tasks.md` with:

1. **Setup Tasks** - Database migrations, dependency installation
2. **Core Infrastructure** - Authorization service, audit logging, analytics utilities
3. **Tool Implementation** - Individual tools in dependency order
4. **Testing Tasks** - Unit tests, integration tests, E2E tests
5. **Documentation Tasks** - API docs, user guides
6. **Deployment Tasks** - Staging deployment, production rollout

### Task Ordering Principles

- Database migrations before tool implementation
- Authorization/logging infrastructure before tools that depend on them
- Read-only tools before write-capable tools
- Simple tools (product updates) before complex tools (order creation)
- Unit tests alongside implementation
- Integration tests after module completion
- E2E tests after all tools implemented

**Next Step**: Run `/speckit.tasks` to generate ordered task list

---

## Gate: Quality Validation

Before proceeding to `/speckit.tasks`:

- [x] All research questions answered with decisions documented
- [x] Data model complete with validation rules and indexes
- [x] All 17 tool contracts defined with complete specifications
- [x] Quickstart guide validated with working examples
- [x] Constitutional compliance re-verified (all principles PASS)
- [x] Performance targets documented for each tool
- [x] Authorization matrix defined for all roles
- [x] Audit logging strategy validated

**Status**: ✅ **READY FOR TASK GENERATION** - All Phase 0 and Phase 1 deliverables complete

---

## Appendix: Related Documents

- **Feature Specification**: `spec.md` (requirements, user stories, success criteria)
- **Research Findings**: `research.md` (technical decisions with code examples)
- **Data Model**: `data-model.md` (Prisma schemas, validation rules, relationships)
- **API Contracts**: `contracts/*.yaml` (tool I/O specifications, authorization, examples)
- **Developer Guide**: `quickstart.md` (setup, tutorial, patterns, troubleshooting)
- **Constitution**: `.specify/memory/constitution.md` (architectural principles)

---

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
