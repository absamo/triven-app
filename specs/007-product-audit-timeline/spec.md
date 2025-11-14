# Feature Specification: Product Audit Timeline

**Feature Branch**: `007-product-audit-timeline`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "audit with timeline for the products. Action button should be visible on the /products page. showdrawer on the right. I want to all changes (modified, deleted. when and by who) happening on the products. Later on we will add the audit for other pages. think generic when designing this feature. just show which field has been changed.. store the value.. if multiple fields have beend changed.. propose a delightful design with awesome UX for showing it"

## Clarifications

### Session 2025-11-14

- Q: Pagination Strategy → A: Load first 20 events, lazy load more on scroll
- Q: Audit Logging for System Observability → A: Log audit write operations only
- Q: Product Creation Event Tracking → A: Track creation as audit event with summary only (e.g., "Product A created by X"), not all initial field values

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Product Change History (Priority: P1)

An inventory manager needs to understand what changes have been made to a specific product over time. They click an "Audit History" button on the products page, which opens a timeline drawer showing all modifications with details about what changed, when, and by whom.

**Why this priority**: This is the core value proposition - giving users visibility into product changes for accountability, troubleshooting, and compliance purposes.

**Independent Test**: Can be fully tested by creating a product, modifying it, and viewing the audit timeline. Delivers immediate value by showing complete change history.

**Acceptance Scenarios**:

1. **Given** I am viewing the products list page, **When** I click the audit history button for a product, **Then** a drawer opens on the right side displaying the product's change timeline
2. **Given** the audit timeline drawer is open, **When** I view the timeline, **Then** I see all changes in reverse chronological order (newest first)
3. **Given** a product has been modified multiple times, **When** I view its audit history, **Then** I see each change event with timestamp, user who made the change, and which fields were modified
4. **Given** I am viewing a change event, **When** the event contains multiple field changes, **Then** I can clearly distinguish each field change with old and new values
5. **Given** I am viewing the audit timeline, **When** I scroll through the history, **Then** older events load smoothly with pagination or infinite scroll

---

### User Story 2 - Track Deleted Products (Priority: P2)

A supervisor needs to investigate why certain products are no longer in the system. They access the audit timeline to see deletion events, including who deleted the product and when.

**Why this priority**: Provides accountability for deletion actions and helps recover from accidental deletions or policy violations.

**Independent Test**: Can be tested by deleting a product and verifying the deletion event appears in the audit history with proper details.

**Acceptance Scenarios**:

1. **Given** a product has been soft-deleted, **When** I view its audit history, **Then** I see the deletion event with timestamp and user information
2. **Given** a deletion event is displayed, **When** I view the event details, **Then** I can see the product state before deletion
3. **Given** I am viewing deleted product changes, **When** the drawer displays the deletion, **Then** it is visually distinguished from regular modifications (e.g., with a different color or icon)

---

### User Story 3 - Filter and Search Audit History (Priority: P3)

A compliance officer needs to find specific changes within a product's history. They use filters to narrow down events by date range, user, or type of change (modification vs deletion).

**Why this priority**: Enhances usability for products with extensive change history and supports compliance audits.

**Independent Test**: Can be tested by creating multiple change events and verifying filter controls work independently to narrow results.

**Acceptance Scenarios**:

1. **Given** the audit timeline drawer is open, **When** I apply a date range filter, **Then** only changes within that timeframe are displayed
2. **Given** multiple users have modified the product, **When** I filter by a specific user, **Then** only that user's changes are shown
3. **Given** the product has both modifications and deletions, **When** I filter by event type, **Then** only the selected event types appear
4. **Given** I have applied filters, **When** I clear all filters, **Then** the complete audit history is restored

---

### User Story 4 - Compare Field Changes (Priority: P3)

An analyst needs to understand exactly what changed in a product update. They expand a change event to see a detailed comparison showing old vs new values for each modified field.

**Why this priority**: Provides granular detail for understanding the nature of changes, especially useful for troubleshooting pricing or inventory discrepancies.

**Independent Test**: Can be tested by modifying multiple fields on a product and verifying the change event shows clear before/after comparison.

**Acceptance Scenarios**:

1. **Given** I am viewing a change event with multiple field modifications, **When** I expand the event details, **Then** I see a clear comparison layout showing old and new values side-by-side
2. **Given** a numeric field has changed, **When** I view the comparison, **Then** I see the delta/difference highlighted
3. **Given** a text field has changed, **When** I view the comparison, **Then** I see a diff-style visualization if the text is long
4. **Given** a relationship field has changed (e.g., category), **When** I view the comparison, **Then** I see meaningful labels (category names) rather than IDs

---

### Edge Cases

- What happens when a product has hundreds of change events? (Implement pagination or lazy loading)
- How does the system handle changes made by users who have been deleted from the system? (Display "[Deleted User]" or preserve username at time of change)
- What if multiple users edit the same product simultaneously? (Each change is captured independently with precise timestamps)
- How are bulk operations recorded? (Each product gets its own audit entry, with optional batch identifier)
- What if the audit history drawer is opened for a newly created product with no changes? (Display "No changes yet" message)
- How does the system display field names that are internal/technical? (Map to user-friendly labels defined in field metadata)
- What happens if audit data storage fails? (Log error, continue with operation, notify admin - audit shouldn't block business operations)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture product creation events with product name, timestamp, and user identifier (no field details, summary only)
- **FR-002**: System MUST capture all product modification events including field name, old value, new value, timestamp, and user identifier
- **FR-003**: System MUST capture product deletion events including timestamp, user identifier, and product state at time of deletion
- **FR-004**: System MUST provide an audit history button/icon on the products list page for each product
- **FR-005**: System MUST display audit history in a right-side drawer overlay that doesn't navigate away from the products page
- **FR-006**: System MUST show audit events in reverse chronological order (newest first)
- **FR-007**: System MUST display for each audit event: timestamp (date and time), user who made the change, and event description (for creation: summary format "Product [Name] created by [User]"; for modification: list of fields changed; for deletion: deletion notice)
- **FR-008**: System MUST visually distinguish different event types (creation, modification, deletion) using icons and/or colors
- **FR-009**: System MUST support expanding modification events to show detailed field-by-field comparisons with old and new values (creation events show summary only, not expandable)
- **FR-010**: System MUST handle display of multiple field changes within a single modification event in a scannable, organized layout
- **FR-011**: System MUST persist audit data permanently and independently of the product lifecycle (audit survives product deletion)
- **FR-012**: System MUST be designed generically to support future audit tracking for other entities (orders, customers, suppliers)
- **FR-013**: System MUST initially load the first 20 audit events and lazy load additional events automatically as user scrolls to maintain performance with large audit histories
- **FR-014**: System MUST require authentication to view audit history
- **FR-015**: System MUST allow closing the audit drawer to return to the products list view
- **FR-016**: System MUST log all audit event write operations (create, update, delete captures) for observability and debugging purposes

### Real-Time Requirements

**Note**: This feature does NOT require real-time updates. Audit history is loaded on-demand when the drawer is opened and can be refreshed manually if needed.

### Key Entities

- **Audit Event**: Represents a single change action on a product. Contains: event type (create, update, delete), timestamp, user identifier, entity type (product), entity identifier (product ID), and either a summary description (for creation events) or collection of field changes (for modification/deletion events).

- **Field Change**: Represents a single field modification within an audit event. Contains: field name, old value, new value, field data type for proper display formatting.

- **Product**: Existing entity that will be tracked. The audit system captures changes to product fields including: name, SKU, description, price, cost, quantity, category, supplier, status, and any other tracked attributes.

- **User**: Existing entity that performs changes. User information is captured at time of change to maintain historical accuracy even if user is later modified or deleted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access complete audit history for any product in under 2 seconds from clicking the audit button
- **SC-002**: System successfully captures 100% of product modification and deletion events without data loss
- **SC-003**: Users can identify what changed, when, and by whom within 5 seconds of opening the audit drawer
- **SC-004**: Audit history drawer displays multi-field changes in a scannable format that users can comprehend in under 10 seconds per event
- **SC-005**: System handles products with 1000+ audit events without performance degradation or UI freezing
- **SC-006**: 95% of users successfully use the audit timeline without training or documentation
- **SC-007**: Audit data storage footprint remains under 1KB per change event on average

## Assumptions

- **AS-001**: User authentication system is in place using Better Auth, and authenticated user context is available for capturing who makes changes
- **AS-002**: Products are not hard-deleted; they are soft-deleted (marked as deleted) to preserve referential integrity with audit records
- **AS-003**: Field-level change tracking will hook into existing ORM operations (Prisma) or service layer, not require manual instrumentation at every update point
- **AS-004**: Field names in the database schema have corresponding human-readable labels defined in the application (e.g., "sku" → "SKU", "costPrice" → "Cost Price")
- **AS-005**: The initial implementation focuses on products only, but the audit system architecture supports extending to other entities in the future
- **AS-006**: Timestamp precision of seconds is sufficient; millisecond precision is not required for audit events
- **AS-007**: Audit history is read-only; users cannot edit or delete audit entries
- **AS-008**: The drawer UI component will use Mantine UI library consistent with the rest of the application

## Dependencies

- **DEP-001**: Requires authenticated user context to identify who is making changes
- **DEP-002**: Depends on Prisma ORM for database schema and data access patterns
- **DEP-003**: Requires Mantine UI Drawer component for the audit timeline UI
- **DEP-004**: Depends on existing Product entity and its field definitions
- **DEP-005**: May require database migration to add audit tracking tables

## Out of Scope

- **OOS-001**: Restoring previous versions of products from audit history (view-only in this feature)
- **OOS-002**: Real-time notifications when products are changed by other users
- **OOS-003**: Exporting audit history to PDF or CSV formats
- **OOS-004**: Audit tracking for entities other than products (deferred to future iterations)
- **OOS-005**: Audit history search by field values or change content
- **OOS-006**: Comparing non-adjacent versions (e.g., comparing version from 2 months ago to current)
- **OOS-007**: Administrative tools for archiving or purging old audit data
- **OOS-008**: Granular permissions for who can view audit history (all authenticated users with product access can view audit history)
