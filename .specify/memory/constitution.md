# Triven App Constitution

## Core Principles

### I. Service-Oriented Architecture
Each major feature (inventory, orders, customers, etc.) must be implemented as a standalone service with clear boundaries. Services must be self-contained, independently testable, and well-documented. Each service should have a single responsibility and clear API contracts.

### II. API-First Development
All business logic must be exposed through well-defined API endpoints. REST APIs must follow consistent patterns, use proper HTTP status codes, and include comprehensive OpenAPI specifications. Support both JSON and human-readable formats for debugging.

### III. Test-First Development (NON-NEGOTIABLE)
TDD is mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Integration tests required for all API endpoints and database operations.

### IV. Real-Time Capabilities
Inventory updates, order status changes, and critical business events must support real-time updates through WebSocket connections. All real-time features must gracefully degrade when WebSocket connections fail.

### V. Data Integrity & Audit Trail
All business-critical data changes must be auditable. Inventory movements, order modifications, and customer changes require complete audit trails. Database transactions must ensure ACID properties for financial operations.

### VI. AI Integration Standards
AI features (analytics, recommendations, automation) must be implemented as optional enhancements that don't break core functionality. AI models must be versioned, and fallback mechanisms required for when AI services are unavailable.

### VII. Performance & Scalability
Database queries must be optimized, with proper indexing for inventory lookups. Pagination required for all list endpoints. Caching strategies must be implemented for frequently accessed data (products, categories, customer info).

## Technology Stack Requirements

### Frontend Standards
- React Router v7 for navigation and routing
- Mantine UI for consistent component library
- TypeScript for type safety
- Vitest for testing
- Real-time updates via WebSocket or Server-Sent Events

### Backend Standards
- Node.js with TypeScript
- Prisma ORM for database operations
- Better Auth for authentication
- Zod for runtime validation
- Structured logging for observability

### Database & Infrastructure
- PostgreSQL as primary database
- Docker for containerization
- Environment-specific configurations
- Database migrations via Prisma

### Integration Requirements
- Stripe for payment processing
- ImageKit for image management
- Resend for email notifications
- Ollama for local AI capabilities

## Development Workflow

### Code Quality Gates
- TypeScript compilation without errors
- All tests passing (unit, integration, E2E)
- Linting and formatting compliance
- Database migration validation
- Security vulnerability scanning

### Feature Development Process
1. Feature specification using Spec Kit templates
2. Implementation planning with technical design
3. Test-driven development with contract testing
4. Integration testing with real database
5. Performance validation for data-heavy operations
6. Security review for authentication/authorization

### Review Requirements
- Code review required for all changes
- Database schema changes require DBA review
- API changes require contract validation
- Performance impact assessment for inventory operations

## Governance

This constitution supersedes all other development practices. All feature development must comply with these principles. Complexity must be justified with business value. Deviations require explicit documentation and approval.

Use `.github/copilot-instructions.md` for runtime development guidance and GitHub Copilot integration.

**Version**: 1.0.0 | **Ratified**: 2025-09-13 | **Last Amended**: 2025-09-13