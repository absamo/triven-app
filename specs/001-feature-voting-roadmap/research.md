# Research & Technology Decisions: Feature Voting Roadmap

**Created**: 20 October 2025  
**Feature**: Feature Voting & Product Roadmap  
**Status**: Complete

## Overview

This document consolidates research findings and technology decisions for implementing the feature voting roadmap. All decisions align with existing Triven App architecture and constitutional principles.

---

## 1. Access Control Strategy

### Decision: Better Auth Role-Based Access Control (RBAC)

**Rationale**:
- Triven App already uses Better Auth with Prisma adapter
- User model includes `roleId` foreign key linking to `Role` table
- Consistent with existing authentication patterns across the app
- Minimal new dependencies required

**Implementation Approach**:
1. Leverage existing `Role` table with admin permissions
2. Create middleware to verify admin role for roadmap routes
3. Check permissions at three levels: route loader, API endpoints, component visibility
4. Use Better Auth session management for user context

**Alternatives Considered**:
- **Custom permission system**: Rejected due to duplication of existing Role infrastructure
- **Hard-coded admin user list**: Rejected due to poor maintainability and scalability
- **Third-party RBAC library**: Rejected as Better Auth + existing Role model sufficient

**Implementation Notes**:
```typescript
// Route loader pattern
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw redirect('/auth/login');
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: true }
  });
  
  if (!user?.role?.permissions.includes('ROADMAP_ACCESS')) {
    throw new Response('Forbidden', { status: 403 });
  }
  
  return json({ user });
}
```

---

## 2. Real-Time Vote Updates

### Decision: WebSocket with ws library + React Context

**Rationale**:
- Constitutional requirement for real-time capabilities (FR-013: update within 3 seconds)
- `ws` library already available in dependencies (used for other real-time features)
- Server-Sent Events (SSE) considered but WebSocket preferred for bidirectional communication
- React Context provides clean client-side state management

**Implementation Approach**:
1. Create WebSocket server endpoint at `/api/roadmap/ws`
2. Broadcast vote events to all connected clients viewing roadmap
3. Client subscribes to WebSocket on roadmap page mount
4. Optimistic UI updates with server reconciliation

**Alternatives Considered**:
- **Polling (setInterval)**: Rejected due to poor performance and unnecessary server load
- **Server-Sent Events**: Considered but WebSocket provides better bidirectional support
- **Third-party service (Pusher/Ably)**: Rejected to avoid external dependencies and costs

**WebSocket Event Schema**:
```typescript
// Server → Client events
type VoteUpdateEvent = {
  type: 'VOTE_UPDATE';
  featureId: string;
  voteCount: number;
  voterId?: string; // For optimistic update reconciliation
};

type FeatureUpdateEvent = {
  type: 'FEATURE_UPDATE';
  featureId: string;
  status: FeatureStatus;
  title?: string;
  description?: string;
};

// Client → Server events
type VoteCastEvent = {
  type: 'VOTE_CAST';
  featureId: string;
  action: 'add' | 'remove';
};
```

**Performance Considerations**:
- Connection pooling for multiple concurrent users
- Heartbeat/ping mechanism every 30 seconds
- Automatic reconnection with exponential backoff
- Graceful degradation to manual refresh if WebSocket fails

---

## 3. Kanban Board UI Implementation

### Decision: Mantine Grid + react-beautiful-dnd for Drag & Drop

**Rationale**:
- Mantine UI is the established design system for Triven App
- `react-beautiful-dnd` already in dependencies (`@types/react-beautiful-dnd`)
- Provides accessible drag-and-drop with keyboard support
- Mobile-friendly with touch support

**Implementation Approach**:
1. Use Mantine Grid for responsive 4-column layout (collapsible on mobile)
2. `react-beautiful-dnd` DragDropContext for admin drag-to-move functionality
3. Regular users see static cards with vote buttons (no drag capability)
4. CSS Grid with flexbox for card layout within columns

**Alternatives Considered**:
- **Custom drag-and-drop**: Rejected due to complexity and accessibility concerns
- **dnd-kit**: Considered but `react-beautiful-dnd` already available
- **HTML5 drag API**: Rejected due to poor mobile/touch support

**Responsive Strategy**:
```
Desktop (>1200px): 4 columns side-by-side
Tablet (768-1200px): 2x2 grid or horizontal scroll
Mobile (375-768px): Single column with status filter tabs
```

**Card Sorting**:
- Within each column, sort by vote count DESC (FR-008)
- Use stable sort to maintain creation order for ties
- Index on `(status, voteCount, createdAt)` for efficient queries

---

## 4. Database Schema Design

### Decision: Two new Prisma models (FeatureRequest, FeatureVote)

**Rationale**:
- Follows existing Prisma schema patterns in the project
- FeatureRequest captures feature metadata and status
- FeatureVote implements many-to-many relationship with uniqueness constraint
- Denormalized `voteCount` for performance (avoid COUNT queries)

**Schema Design**:

```prisma
enum FeatureStatus {
  TODO
  PLANNED
  IN_PROGRESS
  SHIPPED
}

model FeatureRequest {
  id          String        @id @default(cuid())
  title       String        @db.VarChar(200)
  description String        @db.Text
  status      FeatureStatus @default(TODO)
  voteCount   Int           @default(0) // Denormalized for performance
  createdById String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  createdBy   User           @relation("FeatureCreatedBy", fields: [createdById], references: [id])
  votes       FeatureVote[]
  auditLogs   FeatureAuditLog[]
  
  @@index([status, voteCount(sort: Desc), createdAt])
  @@index([createdById])
}

model FeatureVote {
  id         String   @id @default(cuid())
  featureId  String
  userId     String
  votedAt    DateTime @default(now())
  
  feature    FeatureRequest @relation(fields: [featureId], references: [id], onDelete: Cascade)
  user       User           @relation("FeatureVotes", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([featureId, userId]) // One vote per user per feature (FR-010)
  @@index([userId])
  @@index([featureId])
}

model FeatureAuditLog {
  id          String   @id @default(cuid())
  featureId   String
  userId      String
  action      String   // 'CREATED', 'STATUS_CHANGED', 'UPDATED', 'DELETED'
  oldValue    Json?
  newValue    Json?
  timestamp   DateTime @default(now())
  
  feature     FeatureRequest @relation(fields: [featureId], references: [id], onDelete: Cascade)
  user        User           @relation("FeatureAuditLogs", fields: [userId], references: [id])
  
  @@index([featureId, timestamp])
  @@index([userId])
}
```

**Alternatives Considered**:
- **Store votes in JSON array**: Rejected due to poor query performance and no relational integrity
- **Single votes table without denormalization**: Rejected due to performance (frequent COUNT queries)
- **Separate table per status**: Rejected as unnecessary complexity

**Migration Strategy**:
1. Create migration with new models
2. Seed initial feature requests for demonstration (optional)
3. Add foreign key relations to User model
4. Create indexes for query optimization

---

## 5. API Design Patterns

### Decision: RESTful API + OpenAPI Documentation

**Rationale**:
- Constitutional requirement for API-first development
- Consistent with existing Triven App API patterns
- Follows REST conventions for resource management
- OpenAPI spec enables automatic documentation and client generation

**Endpoint Design**:

```
GET    /api/roadmap/features          # List features (with query params for filtering)
GET    /api/roadmap/features/:id      # Get single feature
POST   /api/roadmap/features          # Create feature (admin only)
PATCH  /api/roadmap/features/:id      # Update feature (admin only)
DELETE /api/roadmap/features/:id      # Delete feature (admin only)

POST   /api/roadmap/features/:id/vote # Cast vote
DELETE /api/roadmap/features/:id/vote # Remove vote

WS     /api/roadmap/ws                # WebSocket connection
```

**Request Validation**: Zod schemas for all inputs
**Response Format**: JSON with standard error structures
**Authentication**: Better Auth session validation on all endpoints
**Authorization**: Admin-only endpoints protected by role check

**Alternatives Considered**:
- **GraphQL**: Rejected as REST is project standard and simpler for this use case
- **tRPC**: Rejected to maintain consistency with existing API patterns
- **Consolidated vote endpoint**: Rejected in favor of explicit POST/DELETE for clarity

---

## 6. Testing Strategy

### Decision: Multi-layer testing (Unit → Integration → E2E)

**Rationale**:
- Constitutional requirement for test-first development
- Existing Vitest + Testing Library + Playwright setup
- Comprehensive coverage at all levels

**Test Layers**:

1. **Unit Tests** (Vitest):
   - Service layer functions (feature CRUD, voting logic)
   - Utility functions (permissions, validators)
   - Component rendering (FeatureCard, VoteButton)
   - Target: >80% code coverage

2. **Integration Tests** (Vitest):
   - API endpoint contracts
   - Database operations with test database
   - WebSocket message handling
   - Authentication/authorization flows

3. **E2E Tests** (Playwright):
   - Full user flows (admin creates feature → user votes → vote count updates)
   - Access control validation (non-admin blocked)
   - Drag-and-drop status changes
   - Mobile responsive behavior

**Test Data Management**:
- Factory functions for test data generation
- Database seeding for integration/E2E tests
- Cleanup after each test suite

**Mocking Strategy**:
- Mock WebSocket connections in unit tests
- Mock external services (email notifications)
- Use test database for integration tests
- Real browser for E2E tests

---

## 7. Performance Optimization

### Decision: Database indexes + Pagination + Caching

**Rationale**:
- Success criteria requires <2s load for 100 features (SC-006)
- Efficient queries critical for real-time experience
- Future-proof for growth beyond 100 features

**Optimizations**:

1. **Database Indexes**:
   ```prisma
   @@index([status, voteCount(sort: Desc), createdAt])
   ```
   Enables fast sorted queries by status and vote count

2. **Pagination**:
   - Cursor-based pagination for infinite scroll
   - Load 20-30 features per page initially
   - Lazy load additional features on scroll

3. **Vote Count Denormalization**:
   - Store `voteCount` directly on FeatureRequest
   - Update via Prisma transaction when vote added/removed
   - Avoid expensive COUNT aggregations

4. **Caching Strategy**:
   - Client-side: React Query for feature data caching
   - Server-side: Consider Redis for frequently accessed features (future enhancement)

**Monitoring**:
- Log query performance in development
- Track page load times in production
- Alert on p95 latency > 2 seconds

---

## 8. Notification System

### Decision: Resend email integration for shipped features

**Rationale**:
- Triven App already uses Resend for transactional emails
- User Story 3 acceptance scenario: notify voters when feature ships (US3-AS5)
- Consistent with existing email infrastructure

**Implementation**:
1. When admin moves feature to "SHIPPED" status
2. Query all users who voted on that feature
3. Send batch email via Resend using existing templates
4. Track notification status in FeatureAuditLog

**Email Template**:
```
Subject: [Feature Name] is now live!
Body: The feature you voted for has been shipped...
CTA: View Roadmap / Try Feature
```

**Alternatives Considered**:
- **In-app notifications only**: Considered but email provides better reach
- **Third-party notification service**: Rejected as Resend already integrated
- **Push notifications**: Future enhancement for mobile apps

---

## Summary of Key Decisions

| Decision Area | Technology/Pattern | Rationale |
|---------------|-------------------|-----------|
| Access Control | Better Auth + Role model | Existing infrastructure, minimal dependencies |
| Real-Time Updates | WebSocket (ws library) | Constitutional requirement, bidirectional support |
| UI Framework | Mantine UI + react-beautiful-dnd | Project standard, accessible drag-drop |
| Database | Prisma with denormalized vote counts | Performance, existing patterns |
| API Design | REST + OpenAPI | Constitutional API-first requirement |
| Testing | Vitest + Testing Library + Playwright | TDD requirement, existing setup |
| Performance | Indexes + pagination + denormalization | Success criteria compliance |
| Notifications | Resend email integration | Existing email infrastructure |

---

## Open Questions & Future Enhancements

### Resolved in This Phase
- ✅ Authentication method (Better Auth)
- ✅ Real-time technology (WebSocket)
- ✅ UI framework (Mantine + react-beautiful-dnd)
- ✅ Database schema design (Prisma models)

### Future Enhancements (Out of Scope)
- **Feature comments/discussion**: Allow users to discuss feature requests
- **Feature upvote limits**: Limit votes per user to encourage prioritization
- **Public roadmap**: Make roadmap visible to non-admins (view-only)
- **AI-powered feature suggestions**: Analyze vote patterns for recommendations
- **Email digest**: Weekly roadmap updates for subscribed users
- **Feature dependencies**: Link related features
- **Roadmap analytics**: Track voting trends over time

---

**Research Complete**: All technical decisions documented and justified. Ready for Phase 1 (Design & Contracts).
