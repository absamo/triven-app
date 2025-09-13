# GitHub Copilot Instructions for Triven App

## Project Context

Triven App is an AI-powered inventory management platform built with:
- **Frontend**: React Router v7, Mantine UI, TypeScript
- **Backend**: Node.js, Prisma ORM, Better Auth
- **Database**: PostgreSQL
- **Testing**: Vitest, Testing Library
- **Integrations**: Stripe, ImageKit, Resend, Ollama
- **Development**: Spec-Driven Development with GitHub Spec Kit

## Available Commands

When working on this project, you have access to these Spec Kit commands:

### `/specify [feature description]`
Creates a new feature specification and Git branch from natural language description.
Example: `/specify Add inventory low-stock alerts with email notifications`

### `/plan [implementation details]`
Generates detailed implementation plan with technical design, API contracts, and database schemas.
Example: `/plan Use WebSocket for real-time alerts, PostgreSQL for thresholds, Resend for emails`

### `/tasks`
Breaks down the implementation plan into executable, ordered development tasks.

## Constitutional Compliance

Always ensure compliance with the project constitution (`.specify/memory/constitution.md`):

1. **Service-Oriented Architecture**: Implement features as standalone services
2. **API-First Development**: Create OpenAPI specs before implementation
3. **Test-First Development**: Write tests before implementation code
4. **Real-Time Capabilities**: Use WebSockets for live updates
5. **Data Integrity**: Implement audit trails for business-critical operations
6. **AI Integration**: Make AI features optional and fault-tolerant
7. **Performance**: Optimize database queries and implement caching

## Code Generation Guidelines

### Database Operations
- Use Prisma Client for all database operations
- Include proper error handling and transactions
- Add database indexes for performance-critical queries
- Implement audit logging for data changes

### API Development
- Follow REST conventions with proper HTTP status codes
- Implement request validation with Zod schemas
- Add OpenAPI documentation
- Include rate limiting and authentication checks

### Frontend Components
- Use Mantine UI components consistently
- Implement TypeScript interfaces for all props
- Add loading states and error boundaries
- Support real-time data updates

### Testing Requirements
- Write unit tests for all business logic
- Create integration tests for API endpoints
- Add E2E tests for critical user flows
- Mock external services (Stripe, ImageKit, etc.)

## File Organization

- **API Routes**: `app/routes/api/`
- **Components**: `app/components/`
- **Services**: `app/services/`
- **Database**: `prisma/schema.prisma`
- **Tests**: `app/test/`
- **Documentation**: `docs/`
- **Specifications**: `specs/[feature-name]/`

## Integration Patterns

### Stripe Integration
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### ImageKit Integration
```typescript
import ImageKit from 'imagekit';
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});
```

### Prisma Database
```typescript
import { db } from '~/lib/db.server';
// Use db.model.operation() for all database operations
```

### Real-time Updates
```typescript
// Server-side WebSocket handling
import { WebSocketServer } from 'ws';

// Client-side real-time updates
useEffect(() => {
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle real-time updates
  };
}, []);
```

## Error Handling

Always implement comprehensive error handling:

```typescript
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  // Log structured error for observability
  // Return user-friendly error response
}
```

## Environment Variables

Reference these environment variables as needed:
- `DATABASE_URL` - PostgreSQL connection
- `STRIPE_SECRET_KEY` - Stripe integration
- `IMAGEKIT_*` - ImageKit configuration
- `RESEND_API_KEY` - Email service
- `OLLAMA_BASE_URL` - Local AI service

## Development Workflow

1. Use `/specify` to create feature specifications
2. Use `/plan` to generate implementation designs
3. Use `/tasks` to break down work into executable steps
4. Follow TDD: write tests first, then implementation
5. Ensure constitutional compliance throughout
6. Add proper documentation and comments

Remember: This is an inventory management platform focused on real-time updates, data integrity, and AI-enhanced capabilities. All features should support the core business operations of tracking inventory, managing orders, and serving customers efficiently.