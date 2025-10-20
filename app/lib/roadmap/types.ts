// Use string literal union types to avoid CommonJS/ESM enum issues
export type FeatureStatus = 'TODO' | 'PLANNED' | 'IN_PROGRESS' | 'SHIPPED'

/**
 * Feature with vote information
 */
export interface FeatureWithVotes {
  id: string
  title: string
  description: string
  status: FeatureStatus
  voteCount: number
  commentCount?: number
  createdById: string
  createdAt: Date
  updatedAt: Date
  userHasVoted?: boolean // Populated based on current user
  createdBy: {
    id: string
    name: string | null
    email: string
  }
}

/**
 * Feature Vote information
 */
export interface FeatureVoteInfo {
  id: string
  featureId: string
  userId: string
  votedAt: Date
}

/**
 * Feature Audit Log entry
 */
export interface FeatureAuditLogEntry {
  id: string
  featureId: string
  userId: string
  action: string
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  timestamp: Date
}

/**
 * Paginated feature list response
 */
export interface PaginatedFeatures {
  features: FeatureWithVotes[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Feature creation request
 */
export interface CreateFeatureInput {
  title: string
  description: string
  status?: FeatureStatus
}

/**
 * Feature update request
 */
export interface UpdateFeatureInput {
  title?: string
  description?: string
  status?: FeatureStatus
}

/**
 * Vote action result
 */
export interface VoteResult {
  success: boolean
  voteCount: number
  userHasVoted: boolean
}

/**
 * Feature comment
 */
export interface FeatureComment {
  id: string
  featureId: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
}

/**
 * Comment creation input
 */
export interface CreateCommentInput {
  content: string
}

/**
 * WebSocket event types for real-time updates
 */
export enum WebSocketEventType {
  VOTE_UPDATE = 'VOTE_UPDATE',
  FEATURE_CREATED = 'FEATURE_CREATED',
  FEATURE_UPDATED = 'FEATURE_UPDATED',
  FEATURE_DELETED = 'FEATURE_DELETED',
  ERROR = 'ERROR',
}

/**
 * WebSocket message payload for vote updates
 */
export interface VoteUpdatePayload {
  type: WebSocketEventType.VOTE_UPDATE
  featureId: string
  voteCount: number
}

/**
 * WebSocket message payload for feature creation
 */
export interface FeatureCreatedPayload {
  type: WebSocketEventType.FEATURE_CREATED
  feature: FeatureWithVotes
}

/**
 * WebSocket message payload for feature updates
 */
export interface FeatureUpdatedPayload {
  type: WebSocketEventType.FEATURE_UPDATED
  feature: FeatureWithVotes
}

/**
 * WebSocket message payload for feature deletion
 */
export interface FeatureDeletedPayload {
  type: WebSocketEventType.FEATURE_DELETED
  featureId: string
}

/**
 * WebSocket error payload
 */
export interface WebSocketErrorPayload {
  type: WebSocketEventType.ERROR
  message: string
}

/**
 * Union type for all WebSocket messages
 */
export type WebSocketMessage =
  | VoteUpdatePayload
  | FeatureCreatedPayload
  | FeatureUpdatedPayload
  | FeatureDeletedPayload
  | WebSocketErrorPayload
