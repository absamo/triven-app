# Feature Specification: Enhanced Mastra Assistant Tools

**Feature Branch**: `001-mastra-assistant-tools`  
**Created**: November 3, 2025  
**Status**: Draft  
**Input**: User description: "useful tools for the mastra chat implementation. so assistant is very useful"

## Clarifications

### Session 2025-11-03

- Q: What level of authorization granularity should tools enforce? → A: Role-based permissions with operation-level checks (e.g., "Manager" can update prices, "Staff" cannot)
- Q: What time period should be used to calculate sales velocity for reorder recommendations? → A: 30 days (rolling monthly average - balances trend detection and stability)
- Q: How should the system handle concurrent modifications to the same product? → A: Optimistic locking with version conflicts (detect conflicts, notify user, require retry with fresh data)
- Q: What level of detail should be logged for each tool execution? → A: Full execution record with sanitized sensitive data (all parameters, full results, user context, errors - but mask passwords/tokens/PII)
- Q: What is the minimum acceptable system availability target? → A: 99.5% uptime (~3.6 hours downtime/month - standard for business SaaS applications)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Product Management Operations (Priority: P1)

Users need to perform direct product management actions through the chat interface without navigating to separate pages. They should be able to update stock levels, modify prices, create new products, and update product details conversationally.

**Why this priority**: Core inventory operations are fundamental to the platform's value proposition. Enabling these through the AI assistant dramatically improves workflow efficiency and reduces context switching.

**Independent Test**: Can be fully tested by having a user ask to "update the stock of product XYZ to 50 units" or "change the price of product ABC to $29.99" and verifying the database changes persist and the assistant provides confirmation.

**Acceptance Scenarios**:

1. **Given** a user has products in their inventory, **When** they ask "Update the stock of SKU-123 to 50 units", **Then** the assistant calls the updateProductStock tool, updates the database, and confirms the change with current stock level
2. **Given** a user wants to adjust pricing, **When** they request "Change the price of Blue Widget to $29.99", **Then** the assistant updates the selling price and displays the previous and new prices
3. **Given** a user needs to add inventory, **When** they say "Add a new product called Red Gadget, category Electronics, price $49.99, stock 25", **Then** the assistant creates the product and confirms with the generated SKU and product ID
4. **Given** a product needs multiple updates, **When** the user requests "Update product SKU-456: change category to Home Goods and set stock to 75", **Then** the assistant applies all changes in one operation and confirms each update

---

### User Story 2 - Category and Organization Management (Priority: P2)

Users need to manage their product categories, create new ones, view category statistics, and reorganize products between categories through natural conversation.

**Why this priority**: Category management supports product organization but isn't required for immediate inventory tracking. It enhances the user experience after core operations are functional.

**Independent Test**: Can be tested independently by asking "Show me all my categories" or "Create a new category called Office Supplies" and verifying the assistant displays/creates categories correctly.

**Acceptance Scenarios**:

1. **Given** a user wants to see their organizational structure, **When** they ask "What categories do I have?", **Then** the assistant displays all categories with product counts and total inventory value per category
2. **Given** a user needs a new category, **When** they request "Create a category called Seasonal Items", **Then** the assistant creates the category and confirms with the category ID
3. **Given** products need reorganization, **When** the user says "Move all Electronics products with stock below 5 to the Clearance category", **Then** the assistant identifies matching products, moves them, and reports the number of products affected
4. **Given** a user wants category insights, **When** they ask "Which category has the most products?", **Then** the assistant analyzes categories and provides ranked statistics

---

### User Story 3 - Order and Sales Operations (Priority: P2)

Users want to check recent orders, create new orders, update order status, and get sales analytics through the chat interface without accessing separate order management pages.

**Why this priority**: Order management is critical for business operations but can initially be handled through existing UI while core inventory tools are developed. Adding it to the assistant streamlines the complete workflow.

**Independent Test**: Can be tested by asking "Show me orders from the last 7 days" or "Create an order for customer John Smith with 5 units of product ABC" and verifying order data is retrieved or created correctly.

**Acceptance Scenarios**:

1. **Given** a user needs to review recent activity, **When** they ask "Show me orders from the last 7 days", **Then** the assistant displays orders with customer names, order totals, statuses, and dates
2. **Given** a customer calls to place an order, **When** the user says "Create an order for Jane Doe: 3 units of SKU-123 and 2 units of SKU-456", **Then** the assistant creates the order, calculates the total, reserves inventory, and provides the order number
3. **Given** an order needs status update, **When** the user requests "Mark order #12345 as shipped", **Then** the assistant updates the status, records the timestamp, and confirms the change
4. **Given** a user wants sales insights, **When** they ask "What were my top selling products this month?", **Then** the assistant analyzes sales data and displays products ranked by revenue and quantity sold

---

### User Story 4 - Inventory Alerts and Recommendations (Priority: P3)

Users receive proactive recommendations, reorder suggestions based on sales velocity, alerts about expiring products, and automated insights about inventory health without explicitly asking.

**Why this priority**: Proactive features provide advanced value but require the foundation of core tools. They enhance the assistant from reactive to intelligent advisor.

**Independent Test**: Can be tested by triggering conditions (low stock, high sales velocity) and verifying the assistant proactively suggests actions or responds with smart recommendations when asked "What should I do today?"

**Acceptance Scenarios**:

1. **Given** products have low stock with high sales velocity, **When** the user asks "What should I reorder?", **Then** the assistant analyzes recent sales trends and suggests reorder quantities based on predicted demand
2. **Given** inventory has been stagnant, **When** the user requests "Show me slow-moving inventory", **Then** the assistant identifies products with low turnover over the past 90 days and suggests actions (discount, bundle, discontinue)
3. **Given** products have optimal stock levels, **When** the user asks "What needs my attention?", **Then** the assistant provides a daily digest of actionable insights (low stock, overstock, pending orders, price anomalies)
4. **Given** sales patterns exist, **When** the user says "Predict what I'll need next week", **Then** the assistant uses historical data to forecast demand for top products

---

### User Story 5 - Supplier and Purchase Order Management (Priority: P3)

Users can view supplier information, create purchase orders, track incoming shipments, and manage supplier relationships through conversational interactions.

**Why this priority**: Supplier management completes the inventory lifecycle but is least urgent for initial assistant value. Most valuable once core inventory and order tools are established.

**Independent Test**: Can be tested by asking "Show me my suppliers" or "Create a purchase order for 100 units of SKU-789 from Acme Corp" and verifying supplier data and purchase orders are managed correctly.

**Acceptance Scenarios**:

1. **Given** a user needs to restock, **When** they say "Create a purchase order for 100 units of SKU-789 from Acme Suppliers", **Then** the assistant creates the PO, calculates the expected cost, and provides a PO number
2. **Given** a user wants supplier insights, **When** they ask "Which supplier is most reliable?", **Then** the assistant analyzes delivery times, order accuracy, and provides ranked supplier performance
3. **Given** a shipment is expected, **When** the user requests "Mark purchase order #PO-456 as received", **Then** the assistant updates inventory quantities, records receipt date, and updates the PO status
4. **Given** supplier information needs updating, **When** the user says "Update contact email for Acme Suppliers to newcontact@acme.com", **Then** the assistant updates the supplier record and confirms the change

---

### Edge Cases

- What happens when a user tries to update a product that doesn't exist (by SKU or name)?
- How does the system handle requests to set negative stock quantities or invalid prices?
- What occurs when creating a product with a duplicate SKU?
- How does the assistant respond when asked to create an order for products that don't have sufficient stock?
- What happens when a user requests to move products to a category that doesn't exist?
- How does the system handle ambiguous product names (e.g., "update the blue product" when multiple blue products exist)?
- What occurs when date ranges for queries are invalid or too large?
- How does the assistant handle concurrent updates to the same product from multiple users? (System detects version conflicts and prompts user to retry with fresh data)
- What happens when a tool operation fails due to database connection issues?
- How does the system respond to requests involving products in archived or deleted status?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a tool to update product stock quantities by SKU, name, or product ID
- **FR-002**: System MUST provide a tool to update product selling prices with validation for positive values
- **FR-003**: System MUST provide a tool to create new products with required fields (name, SKU, category, price, initial stock)
- **FR-004**: System MUST provide a tool to update product details (name, description, category, status)
- **FR-005**: System MUST provide a tool to list all categories with product counts and inventory values
- **FR-006**: System MUST provide a tool to create new product categories
- **FR-007**: System MUST provide a tool to move products between categories
- **FR-008**: System MUST provide a tool to retrieve orders with filtering by date range, status, and customer
- **FR-009**: System MUST provide a tool to create new orders with automatic inventory reservation
- **FR-010**: System MUST provide a tool to update order status with valid status transitions
- **FR-011**: System MUST provide a tool to get sales analytics by date range, product, or category
- **FR-012**: System MUST generate reorder recommendations by calculating sales velocity over a 30-day rolling average, comparing against current stock levels and configurable reorder points
- **FR-013**: System MUST identify slow-moving inventory based on turnover rates over a 90-day period
- **FR-014**: System MUST provide a tool to get daily action items (low stock, pending orders, issues)
- **FR-015**: System MUST provide a tool to list suppliers with contact information and performance metrics
- **FR-016**: System MUST provide a tool to create purchase orders linked to suppliers
- **FR-017**: System MUST provide a tool to mark purchase orders as received and update inventory
- **FR-018**: System MUST validate all tool inputs and return clear error messages for invalid data
- **FR-019**: System MUST format all tool outputs in a consistent, markdown-compatible structure
- **FR-020**: System MUST support both English and French language responses from all tools
- **FR-021**: Assistant MUST remain silent after calling tools and let the system format the output
- **FR-022**: All tools MUST return standardized success/error response structures
- **FR-023**: System MUST handle ambiguous product references by requesting clarification or showing matches
- **FR-024**: System MUST log all tool executions with full execution records including tool name, all parameters, complete results, user context, execution time, and any errors, while sanitizing sensitive data (passwords, tokens, PII) before storage
- **FR-025**: Tools MUST handle concurrent access using optimistic locking with version tracking; when conflicts are detected, the system must reject the update and return a clear error message prompting the user to retry with current data
- **FR-026**: System MUST enforce role-based authorization checks before executing any tool, verifying user role has permission for the specific operation (e.g., price updates, order creation, supplier management)

### Key Entities *(include if feature involves data)*

- **Tool**: Represents an executable function with defined parameters and return schema. Attributes include name, description, parameter schema (Zod), and execute function.
- **Product**: Existing entity that will be modified by tools. Key attributes include SKU, name, stock quantity, selling price, category reference, status, and version field for optimistic locking.
- **Category**: Existing entity for product organization. Attributes include name, description, and relationships to products.
- **Order**: Existing entity representing customer purchases. Attributes include order number, customer reference, line items, total, status, and timestamps.
- **Supplier**: May be existing or new entity for supplier management. Attributes include name, contact information, payment terms, and performance metrics.
- **PurchaseOrder**: Represents orders placed to suppliers. Attributes include PO number, supplier reference, line items, expected delivery date, and status.
- **ToolExecutionLog**: New entity to track tool usage for audit and debugging. Attributes include tool name, sanitized parameters (sensitive data masked), execution time, sanitized result summary, user reference, error details (if any), and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete common inventory operations (update stock, change price, create product) through chat in under 30 seconds compared to 2+ minutes using traditional UI navigation
- **SC-002**: System provides accurate product updates with 99.9% data integrity (no lost updates or incorrect values)
- **SC-003**: 80% of user inventory management tasks can be completed entirely through the chat interface without switching to other pages
- **SC-004**: Assistant responds to tool-based queries in under 3 seconds for 95% of requests
- **SC-005**: Tool error messages are clear enough that users can self-correct 90% of invalid requests without support
- **SC-006**: Daily active users of the chat assistant increase by 50% after tool implementation
- **SC-007**: Average session length with the assistant increases by 40% indicating higher engagement
- **SC-008**: User satisfaction with inventory management workflow improves by 30% based on surveys
- **SC-009**: Support tickets related to "how do I update inventory" or similar reduce by 60%
- **SC-010**: Zero data corruption incidents occur from concurrent tool usage during load testing with 50 concurrent users
- **SC-011**: System maintains 99.5% uptime (maximum 3.6 hours downtime per month) for tool execution availability

## Assumptions

- The Prisma database schema includes Product, Category, Order, and related entities required by the tools
- The Mastra framework supports tool execution with async functions and Zod schema validation
- Users have appropriate permissions to perform actions (authorization checks exist or will be added)
- The existing Ollama LLM model has sufficient capability to understand when to call tools based on user intent
- Database performance can handle the additional query load from tool executions
- The frontend can properly render markdown-formatted tool outputs with tables and lists
- WebSocket or SSE infrastructure for streaming responses is already functional
- Translation infrastructure (i18n) is available for multi-language tool responses

## Dependencies

- Mastra framework must support the tool definition format used
- Prisma ORM and database must be accessible from the Mastra agent context
- Authentication and authorization middleware must protect tool executions
- The streaming response mechanism must support interleaved tool results and text responses

## Out of Scope

- Advanced forecasting using machine learning models (simple velocity-based recommendations only)
- Integration with external ERP or accounting systems
- Barcode scanning or image recognition for inventory
- Multi-location or warehouse management tools
- Mobile-specific tool optimizations or native app features
- Real-time inventory synchronization across multiple users (handled by existing infrastructure)
- Bulk operations through CSV uploads (remain in traditional UI)
