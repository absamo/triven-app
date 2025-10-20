# Triven App Constitution

## Core Principles

### I. Service-Oriented Architecture
Every feature must be implemented as a **standalone service** using functional programming patterns:
- **No classes for services** - Use standalone exported functions only
- Services must be self-contained and independently testable
- Follow the pattern: `export async function serviceName(params) { ... }`
- Direct `prisma` imports - no dependency injection or instantiation required
- Reference: `app/services/products.server.ts`, `app/services/categories.server.ts`, `app/services/workflow.server.ts`

### II. Dark/Light Mode Support (NON-NEGOTIABLE)
All UI components **must support both dark and light themes automatically**:
- Use **Mantine UI components** with built-in theme support (never custom styled components for interactive elements)
- Leverage Mantine's theme variables: `--mantine-color-*` for colors
- Use `ActionIcon`, `Button`, `Paper`, `Card` with `variant` prop for theme-aware components
- **No hardcoded colors** - always use theme-aware CSS variables or Mantine components
- Test both themes during development

### III. Test-First Development (NON-NEGOTIABLE)
TDD mandatory for all business logic:
- **Unit tests** for service functions (Vitest)
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- Tests written → User approved → Tests fail → Then implement
- Red-Green-Refactor cycle strictly enforced

### IV. Real-Time Capabilities
Features that benefit from live updates must use **WebSockets**:
- Implement real-time updates for collaborative features (voting, status changes, etc.)
- Use WebSocket server for broadcasting changes
- Client-side reconnection handling required
- Graceful degradation if WebSocket unavailable

### V. Data Integrity & Audit Trails
Business-critical operations require **audit logging**:
- Implement audit logs for: Create, Update, Delete, Status changes
- Store old/new values in JSON format
- Include userId and timestamp for all changes
- Use Prisma transactions for complex operations

### VI. API-First Development
All features expose functionality via **REST API endpoints**:
- Follow REST conventions with proper HTTP status codes
- Request validation with **Zod schemas**
- Response format: `{ data, error, errors }` with proper types
- OpenAPI documentation for all endpoints (future)
- Rate limiting and authentication checks on all endpoints

### VII. Accessibility & Responsive Design
User interfaces must be **accessible and mobile-friendly**:
- WCAG 2.1 AA compliance target
- `aria-label` attributes on all icon-only buttons
- Keyboard navigation support
- Responsive breakpoints: Mobile (375px+), Tablet (768px+), Desktop (1200px+)
- Focus states and proper contrast ratios

## Technical Standards

### TypeScript & Type Safety
- Strict TypeScript configuration enforced
- No `any` types - use proper type annotations
- Zod schemas for runtime validation at boundaries (API, forms)
- Type exports from validators: `z.infer<typeof schema>`

### Code Organization
```
app/
├── services/          # Standalone service functions
│   └── [feature]/     # Feature-specific services
├── routes/            # React Router routes (loaders/actions)
│   └── api/           # API endpoints
├── components/        # UI components (Mantine-based)
│   └── [Feature]/     # Feature-specific components
├── lib/               # Utilities, types, validators
│   └── [feature]/     # Feature-specific types/validators
└── test/              # Test files mirroring app structure
    └── [feature]/     # Feature-specific tests
```

### Database Operations
- Use **Prisma ORM** for all database access
- Migrations required for schema changes: `bun run prisma migrate dev`
- Seed data for development/testing: `prisma/seed.ts`
- Database indexes for performance-critical queries
- Soft deletes where appropriate (audit trail)

### Performance & Optimization
- Implement **cursor-based pagination** for large datasets
- Database query optimization (includes, selects)
- Caching strategy for frequently accessed data
- Image optimization via ImageKit integration
- Bundle size monitoring (future)

## Security Requirements

### Authentication & Authorization
- **Better Auth** for authentication
- Role-based access control (RBAC)
- Permission checks: `isAdmin(user)`, `hasPermission(user, permission)`
- Protected routes with loader authentication checks
- API endpoints validate user permissions

### Input Validation
- Server-side validation with Zod schemas (never trust client)
- SQL injection prevention via Prisma (parameterized queries)
- XSS prevention via React (automatic escaping)
- CSRF protection on state-changing operations

## Development Workflow

### Feature Implementation Process
1. **Specification**: Use Spec Kit to generate feature spec
2. **Planning**: Generate implementation plan with technical design
3. **Tasks**: Break down into ordered development tasks
4. **Database**: Create Prisma schema and migration
5. **Types & Validators**: Define TypeScript types and Zod schemas
6. **Services**: Implement business logic as standalone functions
7. **API**: Create REST endpoints with validation
8. **UI Components**: Build Mantine-based components with theme support
9. **Tests**: Write unit, integration, and E2E tests
10. **Documentation**: Update README, API docs, component docs

### Quality Gates
- ✅ All TypeScript compile errors resolved
- ✅ All tests passing (unit, integration, E2E)
- ✅ Dark/light mode verified for all UI
- ✅ Accessibility checks passed
- ✅ Performance benchmarks met
- ✅ Code review approved

### Integration Stack
- **Frontend**: React Router v7, Mantine UI v8, TypeScript
- **Backend**: Node.js/Bun, Prisma ORM, Better Auth
- **Database**: PostgreSQL
- **Testing**: Vitest, Testing Library, Playwright (E2E)
- **External**: Stripe (payments), ImageKit (images), Resend (email), Ollama (AI)
- **Development**: Spec Kit for specification-driven development

## AI Integration Principles
- AI features must be **optional** and **fault-tolerant**
- Graceful degradation when AI service unavailable
- User control over AI features (opt-in/opt-out)
- Clear indication when AI is being used
- Privacy-conscious: no sensitive data to external AI without consent

## Governance

This constitution supersedes all other development practices and must be followed for all new features and significant changes.

### Amendment Process
1. Identify need for constitutional change
2. Document proposed amendment with rationale
3. Review impact on existing features
4. Update constitution with version bump
5. Communicate changes to all developers
6. Update guidance documents and templates

### Compliance
- All feature specifications must reference applicable constitutional principles
- Code reviews verify constitutional compliance
- Automated checks where possible (linting, type checking)
- Regular constitution reviews (quarterly)

**Version**: 1.0.0 | **Ratified**: 2025-10-20 | **Last Amended**: 2025-10-20
