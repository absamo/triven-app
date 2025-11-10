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

### Core Workflow Commands

#### `/speckit.constitution [principle description]`
Establishes or updates project constitutional principles.
Example: `/speckit.constitution Establish principles for scalable inventory management`

#### `/speckit.specify [feature description]`
Creates a new feature specification and Git branch from natural language description.
Example: `/speckit.specify Add inventory low-stock alerts with email notifications`

#### `/speckit.clarify`
Asks structured questions to de-risk ambiguous areas in the specification.
Use this before `/speckit.plan` to ensure specification completeness.

#### `/speckit.plan [implementation details]`
Generates detailed implementation plan with technical design, API contracts, and database schemas.
Example: `/speckit.plan Use WebSocket for real-time alerts, PostgreSQL for thresholds, Resend for emails`

#### `/speckit.checklist`
Generates quality checklists to validate requirements completeness, clarity, and consistency.
Use this after `/speckit.plan` to ensure quality.

#### `/speckit.tasks`
Breaks down the implementation plan into executable, ordered development tasks.

#### `/speckit.analyze`
Performs cross-artifact consistency and alignment report.
Use this after `/speckit.tasks`, before `/speckit.implement`.

#### `/speckit.implement`
Executes the generated tasks following TDD principles and constitutional guidelines.

### Legacy Commands (Still Supported)

#### `/specify [feature description]`
Creates a new feature specification and Git branch from natural language description.

#### `/plan [implementation details]`
Generates detailed implementation plan with technical design, API contracts, and database schemas.

#### `/tasks`
Breaks down the implementation plan into executable, ordered development tasks.

## Constitutional Compliance

Always ensure compliance with the project constitution (`.specify/memory/constitution.md`):

1. **Service-Oriented Architecture**: Implement features as standalone services with clear boundaries
2. **API-First Development**: Create OpenAPI specs before implementation
3. **Test-First Development**: Write tests before implementation code (NON-NEGOTIABLE)
4. **Real-Time Capabilities**: Use SSE (Server-Sent Events) for live updates - WebSockets are PROHIBITED
5. **Data Integrity**: Implement audit trails for business-critical operations
6. **AI Integration**: Make AI features optional and fault-tolerant
7. **Performance**: Optimize database queries and implement caching

**Constitution Version**: 1.0.0 | **Last Updated**: 2025-11-10

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

### Real-time Updates (Server-Sent Events)
```typescript
// Server-side SSE endpoint (app/routes/api.*-stream.ts)
import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getBetterAuthUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      // Register controller in clients Map
      clients.get(user.id)?.add(controller) || clients.set(user.id, new Set([controller]));
      
      // Send initial connection event
      controller.enqueue('event: connected\ndata: {"status":"connected"}\n\n');
      
      // Setup heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(':heartbeat\n\n');
      }, 30000);
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clients.get(user.id)?.delete(controller);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Broadcasting updates (app/services/*-sse.server.ts)
export function broadcastUpdate(update: Update, filterCriteria: FilterCriteria) {
  const message = `event: ${update.type}\ndata: ${JSON.stringify(update.data)}\n\n`;
  
  for (const [userId, controllers] of clients.entries()) {
    if (shouldReceiveUpdate(userId, filterCriteria)) {
      for (const controller of controllers) {
        try {
          controller.enqueue(message);
        } catch (error) {
          console.error('SSE broadcast error:', error);
          controllers.delete(controller);
        }
      }
    }
  }
}

// Client-side SSE consumer (app/hooks/use*SSE.ts)
import { useEffect, useState } from 'react';
import { useRevalidator } from 'react-router';

export function useSSE({ onUpdate, autoRevalidate = false }) {
  const [isConnected, setIsConnected] = useState(false);
  const revalidator = useRevalidator();

  useEffect(() => {
    const eventSource = new EventSource('/api/*-stream');
    
    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
    });
    
    eventSource.addEventListener('update', (event) => {
      const data = JSON.parse(event.data);
      onUpdate?.(data);
      if (autoRevalidate) revalidator.revalidate();
    });
    
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };
    
    return () => eventSource.close();
  }, [onUpdate, autoRevalidate]);

  return { isConnected };
}

// Component usage
const { isConnected } = useSSE({
  onUpdate: (data) => {
    // Handle update
    fetchData();
  },
  autoRevalidate: false // Set to true for automatic revalidation
});
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

## Active Technologies
- TypeScript 5.8+, Node.js 20+, Bun runtime (001-mastra-assistant-tools)
- PostgreSQL (existing Prisma schema with Product, Category, Order, Supplier, PurchaseOrder entities) (001-mastra-assistant-tools)
- TypeScript 5.8+, Node.js 20+, Bun runtime + React 19.1.1, React Router 7.8.2, Mantine UI 8.2.7, react-i18next 15.5.3 (004-navigation-reorganization)
- N/A (frontend-only, no database changes) (004-navigation-reorganization)
- TypeScript 5.8+, Node.js 20+, Bun runtime + React Router 7.8.2, Prisma (PostgreSQL), Better Auth 1.3.3, Resend 6.0.1, Mantine UI 8.2.7, Zod 4.1.0, react-i18next 15.5.3 (005-workflow-approvals)
- PostgreSQL (existing Prisma schema with WorkflowTemplate, ApprovalRequest, Notification, Role, User, Company entities) (005-workflow-approvals)

## Recent Changes
- 001-mastra-assistant-tools: Added TypeScript 5.8+, Node.js 20+, Bun runtime
