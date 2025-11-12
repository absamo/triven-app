<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Modified Principles: None
Added Sections: 
  - Principle VIII: Development Tooling & Quality Assurance (MCP integration guidance)
  - MCP usage requirements for Chrome DevTools and Context7
Removed Sections: None
Templates Requiring Updates:
  ✅ plan-template.md - Added MCP integration checks
  ✅ spec-template.md - Already supports tech-agnostic requirements
  ✅ tasks-template.md - Added MCP tooling tasks guidance
  ✅ copilot-instructions.md - Added MCP usage patterns
Follow-up TODOs: None
-->

# Triven App Constitution

## Core Principles

### I. Service-Oriented Architecture

All features MUST be implemented as standalone services with clear boundaries and responsibilities. Each service:
- Encapsulates specific business logic or domain functionality
- Maintains its own data models and business rules
- Exposes well-defined interfaces (API endpoints, events)
- Can be tested, deployed, and scaled independently

**Rationale**: Service-oriented design enables parallel development, reduces coupling, improves testability, and facilitates incremental delivery of features without disrupting existing functionality.

### II. API-First Development

All backend functionality MUST be exposed through documented REST APIs before implementation begins:
- OpenAPI 3.0+ specifications created in the planning phase
- API contracts reviewed and approved before coding starts
- Request/response schemas defined with Zod validation
- Error responses standardized across all endpoints
- API versioning strategy applied for breaking changes

**Rationale**: API-first ensures frontend and backend teams can work in parallel, provides clear contracts for integration testing, and creates living documentation that stays synchronized with implementation.

### III. Test-First Development (NON-NEGOTIABLE)

Test-Driven Development (TDD) is mandatory for all business-critical features:
- **Red Phase**: Write tests that fail (validates test correctness)
- **Green Phase**: Implement minimum code to pass tests
- **Refactor Phase**: Improve code quality while maintaining green tests
- Tests MUST be written before implementation code
- Tests MUST be reviewed and approved by user/team before implementation
- All tests MUST pass before merging to main branch

**Coverage Requirements**:
- Unit tests: Business logic, utilities, validation functions
- Integration tests: API endpoints, database operations, service interactions
- E2E tests: Critical user workflows (checkout, approvals, inventory updates)

**Rationale**: TDD catches bugs early, ensures code meets requirements, provides regression safety, and creates executable documentation of system behavior.

### IV. Real-Time Communication via Server-Sent Events (MANDATORY)

When real-time updates are required, Server-Sent Events (SSE) MUST be used instead of WebSockets:
- **SSE Endpoints**: Create dedicated `/api/*-stream` routes using ReadableStream
- **Client Pattern**: Use native EventSource API for consuming SSE updates
- **Connection Management**: Implement per-user connection tracking with limits (e.g., max 10 connections per user)
- **Heartbeat**: Send periodic heartbeat messages (`:heartbeat\n\n`) every 30 seconds to keep connections alive
- **Event Types**: Use named events (`event: <type>\n`) for type-safe client handling
- **Authentication**: Require authentication on SSE endpoints using existing auth patterns
- **Cleanup**: Implement proper cleanup handlers for connection abort signals
- **Broadcasting**: Filter broadcasts by relevant criteria (companyId, userId, role) to avoid unnecessary traffic

**SSE Message Format**:
```
event: <event-type>\n
data: <JSON-payload>\n\n
```

**Prohibited Patterns**:
- WebSocket implementations (adds unnecessary complexity and external dependencies)
- Polling mechanisms for real-time data (inefficient, increased server load)
- Long-polling workarounds (SSE is the standard solution)

**Rationale**: SSE provides unidirectional server-to-client updates with native browser support, automatic reconnection, simpler implementation than WebSockets, and no external dependencies. The pattern is proven in the codebase (subscription-stream, billing) and aligns with modern HTTP/2+ capabilities.

### V. Data Integrity and Audit Trails

Business-critical operations MUST implement comprehensive audit logging:
- **Immutable Records**: Create audit entries that cannot be modified after creation
- **Who/What/When**: Capture userId, action, timestamp, and affected entities
- **Change Tracking**: Store before/after states for data modifications
- **Approval Workflows**: Log all approval requests, reviews, reassignments, and comments
- **Inventory Operations**: Track all stock movements, adjustments, transfers, and corrections
- **Financial Transactions**: Audit all payments, invoices, bills, and refunds

**Implementation Requirements**:
- Use Prisma's `createdAt`, `updatedAt`, `createdBy` patterns
- Store JSON snapshots of entity states before/after changes
- Implement history tables for critical entities (e.g., StockAdjustmentHistory)
- Ensure audit entries survive entity deletion (soft deletes or separate audit tables)

**Rationale**: Audit trails enable regulatory compliance, debugging production issues, resolving disputes, and understanding system behavior over time. They are essential for trust and accountability in business operations.

### VI. AI Integration as Enhancement, Not Dependency

AI-powered features MUST be implemented as optional enhancements that gracefully degrade:
- **Fault Tolerance**: System functions normally when AI service unavailable
- **Explicit Triggers**: AI features activated by user request, not automatically on every operation
- **Fallback Behavior**: Provide manual alternatives when AI fails or is disabled
- **Transparent Results**: Clearly indicate AI-generated vs. user-generated content
- **Local-First**: Prefer Ollama (local AI) over cloud APIs for cost and privacy
- **Error Handling**: Catch and log AI service errors without crashing user workflows

**Examples**:
- Demand forecasting: Show historical data if AI unavailable
- Anomaly detection: Allow manual inventory reviews if AI fails
- Smart recommendations: Provide basic reorder rules as fallback

**Rationale**: AI services are inherently unreliable (network issues, model errors, resource constraints). Making them optional ensures core business operations continue uninterrupted while providing value when available.

### VII. Performance and Caching

Database queries and API responses MUST be optimized for production scale:
- **Query Optimization**: Use Prisma's `select` to fetch only required fields
- **Indexing**: Add database indexes for frequently queried fields (`@@index` in schema)
- **Pagination**: Implement offset/cursor-based pagination for large result sets (limit: 20-100 items)
- **Eager Loading**: Use Prisma's `include` strategically to avoid N+1 queries
- **Caching Strategy**: Cache static data (currencies, categories) and invalidate on updates
- **Response Compression**: Enable gzip/brotli for API responses
- **Batch Operations**: Prefer `createMany`, `updateMany` over individual operations

**Performance Targets**:
- API response time: <500ms p95 for standard queries
- Database queries: <100ms for indexed lookups
- SSE connection overhead: <50ms for initial connection
- Page load time: <3s for dashboard views

**Rationale**: Performance directly impacts user experience, operational efficiency, and infrastructure costs. Proactive optimization prevents technical debt and scaling challenges.

### VIII. Development Tooling & Quality Assurance

Modern development tooling MUST be integrated to ensure code quality and accurate implementation:

**Model Context Protocol (MCP) Integration**:
- **Documentation MCPs**: Use Context7 MCP BEFORE implementation to fetch latest documentation for frameworks and libraries
  - Query for React Router 7.8+ docs when working with routing
  - Query for Mantine UI 8.2+ docs when implementing UI components
  - Query for Prisma, Better Auth, Stripe, or other integration docs as needed
  - Ensures implementation follows current best practices and latest API patterns
- **Testing MCPs**: Use Chrome DevTools MCP AFTER UI implementation for comprehensive testing
  - Take snapshots to verify DOM structure and accessibility
  - Test user interactions (clicks, form fills, navigation)
  - Validate real-time updates and SSE connections
  - Check responsive behavior and component states
  - Test with actual authentication (e.g., admin@flowtech.com / password123)

**MCP Workflow Requirements**:
1. **Pre-Implementation**: Query Context7 for latest docs of relevant frameworks/tools
2. **Implementation**: Build features following fetched documentation patterns
3. **Post-Implementation**: Use Chrome DevTools MCP to test UI interactions and verify behavior
4. **Validation**: Ensure tests pass with real user credentials and production-like scenarios

**Integration with Other Principles**:
- Complements Principle III (Test-First Development) by adding browser-based UI testing
- Supports Principle II (API-First Development) by ensuring latest API documentation is used
- Enhances Principle IV (Real-Time Communication) by enabling SSE connection testing

**Rationale**: MCPs provide programmatic access to current documentation and browser automation capabilities, reducing implementation errors caused by outdated docs and enabling comprehensive UI testing that goes beyond unit and integration tests. This ensures code quality, reduces debugging time, and verifies real-world user experiences.

## Technical Standards

### Technology Stack (Mandatory)

**Frontend**:
- React 19+ with TypeScript 5.8+
- React Router v7 for routing and data loading
- Mantine UI v8+ for component library
- react-i18next for internationalization
- Vite for build tooling

**Backend**:
- Node.js 20+ or Bun runtime
- Prisma ORM for database operations
- Better Auth 1.3+ for authentication
- PostgreSQL for relational data storage
- Zod 4.1+ for request validation

**Development**:
- Vitest for testing (unit, integration, E2E)
- Testing Library for React component tests
- Biome or ESLint for code quality
- Docker Compose for local development environment

**Integrations**:
- Stripe for payment processing
- ImageKit for image management
- Resend for transactional emails
- Ollama for local AI capabilities

### Security Requirements

- **Authentication**: All protected routes use Better Auth with session validation
- **Authorization**: Role-based access control (RBAC) with permission checks
- **Input Validation**: All API inputs validated with Zod schemas before processing
- **SQL Injection Protection**: Use Prisma parameterized queries (never raw SQL with user input)
- **XSS Prevention**: Sanitize user-generated content before rendering
- **CSRF Protection**: Implement CSRF tokens for state-changing operations
- **Rate Limiting**: Apply rate limits to public APIs and authentication endpoints
- **Secrets Management**: Store sensitive config in environment variables, never in code

### Code Quality Standards

- **TypeScript Strict Mode**: Enable `strict: true` in tsconfig.json
- **No `any` Types**: Use `unknown` or proper types instead of `any`
- **Error Handling**: Wrap external calls in try-catch with structured error logging
- **Naming Conventions**: camelCase for variables/functions, PascalCase for types/components
- **File Organization**: Co-locate related files (component + styles + tests)
- **Import Order**: External libraries → internal modules → relative imports
- **Comments**: Explain "why" not "what"; avoid obvious comments
- **Code Reviews**: All PRs require review and passing CI checks before merge

## Development Workflow

### Spec-Driven Development (Mandatory)

All features MUST follow the Spec Kit workflow:

1. **Constitution Review** (`/speckit.constitution`): Establish or update project principles
2. **Specification** (`/speckit.specify`): Create feature spec with user stories and acceptance criteria
3. **Clarification** (`/speckit.clarify`): Resolve ambiguities and unclear requirements
4. **Planning** (`/speckit.plan`): Generate implementation plan with technical design and API contracts
5. **Quality Checklist** (`/speckit.checklist`): Validate completeness, clarity, and consistency
6. **Task Breakdown** (`/speckit.tasks`): Generate ordered, executable development tasks
7. **Consistency Analysis** (`/speckit.analyze`): Verify cross-artifact alignment
8. **Implementation** (`/speckit.implement`): Execute tasks following TDD principles

**Rationale**: Spec-driven development ensures requirements are understood before coding begins, reduces rework, facilitates team alignment, and creates documentation that stays synchronized with implementation.

### Git Workflow

- **Feature Branches**: Create from main with format `###-feature-name` (e.g., `005-workflow-approvals`)
- **Atomic Commits**: Each commit represents a single logical change with descriptive message
- **Commit Messages**: Follow conventional commits (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)
- **Pull Requests**: Include spec reference, implementation summary, and test results
- **Code Review**: At least one approval required; reviewer verifies constitution compliance
- **CI/CD**: All tests pass, no linting errors, TypeScript compiles before merge

### Testing Strategy

- **Test Environment**: Use dedicated test database with seed data
- **Test Isolation**: Each test cleans up its data (transactions or manual cleanup)
- **Mock External Services**: Mock Stripe, ImageKit, Resend, Ollama in tests
- **Coverage Goals**: Aim for 80%+ coverage on business logic
- **CI Integration**: Tests run automatically on every PR and commit to main

## Governance

### Constitution Authority

This constitution supersedes all other development practices, style guides, and conventions. When conflicts arise, the constitution takes precedence. Any deviation MUST be:
1. Explicitly documented with justification
2. Reviewed and approved by technical lead or team
3. Accompanied by a migration plan if affecting existing code

### Amendment Process

Constitution amendments require:
1. **Proposal**: Document the proposed change with rationale and impact analysis
2. **Review**: Team discussion and approval (majority vote)
3. **Version Bump**: Increment version following semantic versioning:
   - **MAJOR**: Backward-incompatible changes (e.g., removing a principle, changing mandatory patterns)
   - **MINOR**: New principles or significant expansions (e.g., adding SSE requirement)
   - **PATCH**: Clarifications, wording improvements, typo fixes
4. **Documentation**: Update affected templates, guides, and copilot-instructions.md
5. **Migration**: Update existing code to comply if necessary
6. **Announcement**: Notify team of changes and effective date

### Compliance Verification

All pull requests MUST:
- Pass automated checks (tests, linting, TypeScript compilation)
- Include manual verification checklist confirming constitution compliance
- Address reviewer feedback regarding principle violations
- Document any approved deviations with justification

**Periodic Reviews**:
- Quarterly constitution review to assess effectiveness
- Annual comprehensive review with team feedback
- Ad-hoc reviews when new patterns or technologies emerge

### Complexity Justification

Any complexity introduced MUST be justified and documented:
- **Problem Statement**: What issue does this complexity solve?
- **Simpler Alternatives**: Why were simpler approaches rejected?
- **Trade-offs**: What are the costs (maintenance, learning curve, performance)?
- **Future Impact**: How does this affect future development?

**Examples Requiring Justification**:
- Adding new external dependencies
- Introducing architectural patterns not in constitution
- Creating abstractions before clear need (premature abstraction)
- Complex state management solutions

### Runtime Development Guidance

Developers and AI assistants MUST reference `.github/copilot-instructions.md` for:
- Active command documentation (`/speckit.*` commands)
- Project-specific patterns and conventions
- Integration examples (Stripe, Prisma, Mantine)
- Common pitfalls and solutions
- Recent constitutional amendments

**Version**: 1.1.0 | **Ratified**: 2025-11-10 | **Last Amended**: 2025-11-11
