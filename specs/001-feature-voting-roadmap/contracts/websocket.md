# WebSocket Contract: Real-Time Roadmap Updates

**Feature**: Feature Voting & Product Roadmap  
**Protocol**: WebSocket  
**Endpoint**: `ws://localhost:3000/api/roadmap/ws` (dev) / `wss://app.triven.com/api/roadmap/ws` (prod)

## Overview

This document defines the WebSocket protocol for real-time updates to the roadmap feature. The WebSocket connection enables bidirectional communication between the server and clients viewing the roadmap page, ensuring vote counts and feature status changes are reflected in near-real-time (<3 seconds per SC-004).

---

## Connection Lifecycle

### 1. Connection Establishment

**Client → Server**:
```typescript
const ws = new WebSocket('ws://localhost:3000/api/roadmap/ws');

ws.onopen = () => {
  console.log('Connected to roadmap WebSocket');
};
```

**Authentication**:
- Session cookie (`better-auth.session_token`) automatically sent with WebSocket upgrade request
- Server validates session before accepting connection
- Invalid/missing session → connection refused with 401 status

**Connection Limit**: 
- Maximum 1000 concurrent connections per server instance
- Clients reconnect with exponential backoff if limit reached

### 2. Heartbeat/Keep-Alive

**Server → Client** (every 30 seconds):
```json
{
  "type": "PING"
}
```

**Client → Server** (response):
```json
{
  "type": "PONG"
}
```

**Purpose**:
- Detect broken connections
- Prevent idle connection timeouts
- Server closes connection if no PONG received within 10 seconds

### 3. Connection Termination

**Normal Closure** (client navigates away):
```javascript
ws.close(1000, "User left roadmap page");
```

**Server-Initiated Closure**:
- Code 1001: Server shutting down
- Code 1008: Policy violation (e.g., rate limit exceeded)
- Code 4401: Session expired/invalid

**Client Reconnection Strategy**:
```typescript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  const ws = new WebSocket(wsUrl);
  
  ws.onerror = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connect, delay);
      reconnectAttempts++;
    }
  };
  
  ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
  };
}
```

---

## Message Types

### Server → Client Events

#### 1. VOTE_UPDATE

Broadcast when any user votes or unvotes on a feature.

**Message Schema**:
```typescript
{
  type: 'VOTE_UPDATE';
  featureId: string;        // Feature that received vote change
  voteCount: number;        // New total vote count
  voterId?: string;         // User who voted (for optimistic update reconciliation)
  action: 'add' | 'remove'; // Whether vote was added or removed
  timestamp: string;        // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "type": "VOTE_UPDATE",
  "featureId": "clxyz123456789",
  "voteCount": 43,
  "voterId": "clusr987654321",
  "action": "add",
  "timestamp": "2025-10-20T15:30:45.123Z"
}
```

**Client Handling**:
```typescript
if (message.type === 'VOTE_UPDATE') {
  // Update feature vote count in local state
  setFeatures(prev => prev.map(f => 
    f.id === message.featureId 
      ? { ...f, voteCount: message.voteCount }
      : f
  ));
  
  // If this was current user's vote, update hasVoted flag
  if (message.voterId === currentUserId) {
    setFeatures(prev => prev.map(f => 
      f.id === message.featureId 
        ? { ...f, hasVoted: message.action === 'add' }
        : f
    ));
  }
}
```

**Broadcast Rules**:
- Sent to all connected clients viewing roadmap
- Excludes the client who triggered the vote (they get immediate API response)
- Batched if multiple votes occur within 100ms window

---

#### 2. FEATURE_UPDATE

Broadcast when admin updates feature details or status.

**Message Schema**:
```typescript
{
  type: 'FEATURE_UPDATE';
  featureId: string;
  changes: {
    title?: string;
    description?: string;
    status?: 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED';
  };
  timestamp: string;
}
```

**Example**:
```json
{
  "type": "FEATURE_UPDATE",
  "featureId": "clxyz123456789",
  "changes": {
    "status": "IN_PROGRESS"
  },
  "timestamp": "2025-10-20T15:35:22.456Z"
}
```

**Client Handling**:
```typescript
if (message.type === 'FEATURE_UPDATE') {
  setFeatures(prev => prev.map(f => 
    f.id === message.featureId 
      ? { ...f, ...message.changes, updatedAt: message.timestamp }
      : f
  ));
  
  // If status changed, may need to move card between kanban columns
  if (message.changes.status) {
    // Trigger kanban re-render or animation
  }
}
```

**Broadcast Rules**:
- Sent to all connected clients
- Includes only changed fields to minimize payload size

---

#### 3. FEATURE_CREATED

Broadcast when admin creates a new feature.

**Message Schema**:
```typescript
{
  type: 'FEATURE_CREATED';
  feature: {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED';
    voteCount: number;
    createdById: string;
    createdBy: { name: string };
    createdAt: string;
    updatedAt: string;
  };
  timestamp: string;
}
```

**Example**:
```json
{
  "type": "FEATURE_CREATED",
  "feature": {
    "id": "clxyz789012345",
    "title": "Mobile app version",
    "description": "Release native iOS and Android apps",
    "status": "TODO",
    "voteCount": 0,
    "createdById": "clusr111222333",
    "createdBy": { "name": "Jane Admin" },
    "createdAt": "2025-10-20T15:40:00.000Z",
    "updatedAt": "2025-10-20T15:40:00.000Z"
  },
  "timestamp": "2025-10-20T15:40:00.123Z"
}
```

**Client Handling**:
```typescript
if (message.type === 'FEATURE_CREATED') {
  setFeatures(prev => [...prev, { ...message.feature, hasVoted: false }]);
  // Add to appropriate kanban column based on status
}
```

---

#### 4. FEATURE_DELETED

Broadcast when admin deletes a feature.

**Message Schema**:
```typescript
{
  type: 'FEATURE_DELETED';
  featureId: string;
  timestamp: string;
}
```

**Example**:
```json
{
  "type": "FEATURE_DELETED",
  "featureId": "clxyz123456789",
  "timestamp": "2025-10-20T15:45:10.789Z"
}
```

**Client Handling**:
```typescript
if (message.type === 'FEATURE_DELETED') {
  setFeatures(prev => prev.filter(f => f.id !== message.featureId));
  // Remove from kanban board with animation
}
```

---

#### 5. ERROR

Server sends error message to specific client.

**Message Schema**:
```typescript
{
  type: 'ERROR';
  code: string;          // Machine-readable error code
  message: string;       // Human-readable error message
  context?: object;      // Additional error context
  timestamp: string;
}
```

**Example**:
```json
{
  "type": "ERROR",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down.",
  "context": {
    "limit": 10,
    "window": "60s"
  },
  "timestamp": "2025-10-20T15:50:00.000Z"
}
```

**Client Handling**:
```typescript
if (message.type === 'ERROR') {
  console.error('WebSocket error:', message);
  showNotification({
    type: 'error',
    message: message.message
  });
  
  if (message.code === 'SESSION_EXPIRED') {
    // Redirect to login
    window.location.href = '/auth/login';
  }
}
```

---

### Client → Server Events

#### 1. SUBSCRIBE

Client subscribes to updates for specific features (optional optimization).

**Message Schema**:
```typescript
{
  type: 'SUBSCRIBE';
  featureIds: string[];  // List of feature IDs to watch
}
```

**Example**:
```json
{
  "type": "SUBSCRIBE",
  "featureIds": ["clxyz123456789", "clxyz987654321"]
}
```

**Server Response**: None (subscription confirmed by receiving updates)

**Use Case**: For detailed feature view page, only subscribe to updates for that one feature

---

#### 2. UNSUBSCRIBE

Client unsubscribes from feature updates (optional optimization).

**Message Schema**:
```typescript
{
  type: 'UNSUBSCRIBE';
  featureIds: string[];
}
```

**Example**:
```json
{
  "type": "UNSUBSCRIBE",
  "featureIds": ["clxyz123456789"]
}
```

---

## Rate Limiting

**Per Connection**:
- Maximum 10 messages per 10 seconds
- Exceeding limit → ERROR message sent, connection throttled
- Persistent violation → connection closed with code 1008

**Global**:
- Maximum 100 broadcasts per second across all connections
- Batching applied if limit approached

---

## Error Codes

| Code | Description | Client Action |
|------|-------------|---------------|
| `SESSION_EXPIRED` | Authentication session no longer valid | Redirect to login |
| `RATE_LIMIT_EXCEEDED` | Too many messages sent | Back off, reduce message frequency |
| `INVALID_MESSAGE` | Message format not recognized | Log error, check message schema |
| `SUBSCRIPTION_LIMIT` | Too many feature subscriptions | Reduce subscribed features |
| `SERVER_ERROR` | Internal server error | Retry with exponential backoff |

---

## Security Considerations

### Authentication
- Session validation on connection establishment
- Session re-validated every 5 minutes during active connection
- Invalid session → connection closed immediately

### Authorization
- Admin-only events (FEATURE_CREATED, FEATURE_DELETED) only sent to admin users
- Regular users receive VOTE_UPDATE and FEATURE_UPDATE only
- Server tracks user role on connection

### Data Exposure
- User IDs included in messages for reconciliation
- User names only included for audit context (admin view)
- No sensitive personal data transmitted

### Rate Limiting
- Prevents WebSocket abuse/spam
- Per-connection and global limits enforced
- Automatic connection closure for repeat offenders

---

## Performance Benchmarks

**Latency**: 
- Target: <3 seconds from vote to broadcast (SC-004)
- Measured: Timestamp in message - timestamp of triggering API call

**Throughput**:
- Support 1000 concurrent connections per instance
- Handle 100 broadcasts per second without batching
- Batch messages if rate exceeds threshold

**Memory**:
- ~10KB per active WebSocket connection
- Connection pool scales horizontally

**Reconnection**:
- Clients reconnect within 2-30 seconds on disconnect
- Exponential backoff prevents thundering herd

---

## Client Implementation Example

```typescript
// app/services/roadmap/websocket.service.ts

export class RoadmapWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pingInterval: NodeJS.Timeout | null = null;
  
  constructor(private handlers: {
    onVoteUpdate: (data: VoteUpdateEvent) => void;
    onFeatureUpdate: (data: FeatureUpdateEvent) => void;
    onFeatureCreated: (data: FeatureCreatedEvent) => void;
    onFeatureDeleted: (data: FeatureDeletedEvent) => void;
    onError: (error: ErrorEvent) => void;
  }) {}
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/roadmap/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('[RoadmapWS] Connected');
      this.reconnectAttempts = 0;
      this.startPingPong();
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'VOTE_UPDATE':
          this.handlers.onVoteUpdate(message);
          break;
        case 'FEATURE_UPDATE':
          this.handlers.onFeatureUpdate(message);
          break;
        case 'FEATURE_CREATED':
          this.handlers.onFeatureCreated(message);
          break;
        case 'FEATURE_DELETED':
          this.handlers.onFeatureDeleted(message);
          break;
        case 'ERROR':
          this.handlers.onError(message);
          break;
        case 'PING':
          this.ws?.send(JSON.stringify({ type: 'PONG' }));
          break;
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('[RoadmapWS] Error:', error);
      this.reconnect();
    };
    
    this.ws.onclose = (event) => {
      console.log('[RoadmapWS] Closed:', event.code, event.reason);
      this.stopPingPong();
      
      if (event.code !== 1000) { // Not normal closure
        this.reconnect();
      }
    };
  }
  
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[RoadmapWS] Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[RoadmapWS] Reconnecting in ${delay}ms...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  private startPingPong() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PONG' }));
      }
    }, 30000);
  }
  
  private stopPingPong() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  disconnect() {
    this.stopPingPong();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
  }
  
  subscribe(featureIds: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        featureIds
      }));
    }
  }
  
  unsubscribe(featureIds: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'UNSUBSCRIBE',
        featureIds
      }));
    }
  }
}
```

---

## Testing

### Unit Tests
- Mock WebSocket connection
- Test message handlers
- Verify reconnection logic

### Integration Tests
- Real WebSocket server in test environment
- Multiple client connections
- Broadcast verification

### Load Tests
- 1000 concurrent connections
- 100 messages/second broadcast rate
- Measure latency and memory usage

---

**WebSocket Contract Complete**: Ready for implementation in Phase 2.
