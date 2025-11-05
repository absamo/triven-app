# Tasks: Enhanced Mastra Assistant Tools

**Feature**: 001-mastra-assistant-tools  
**Branch**: `001-mastra-assistant-tools`  
**Generated**: November 3, 2025

**Input Documents**:
- ✅ spec.md (5 user stories with priorities)
- ✅ plan.md (technical design and structure)
- ✅ data-model.md (Product.version, ToolExecutionLog entity)
- ✅ contracts/ (17 tool definitions across 5 domains)
- ✅ research.md (optimistic locking, authorization, audit logging patterns)
- ✅ quickstart.md (developer guide and examples)

**Tests**: Not explicitly requested in spec, therefore test tasks are EXCLUDED per template guidelines.

**Organization**: Tasks are grouped by user story (US1-US5) to enable independent implementation and testing. Each user story can be completed as a standalone increment.

---

## Format: `- [ ] [TaskID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3, US4, US5)
- File paths use repository root as base (app/, prisma/, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Install Mastra dependencies: `bun add @mastra/core@^0.23.0 zod@^4.1.0 ai-sdk-ollama@^0.5.0`
- [ ] T002 [P] Create tool directory structure in app/lib/mastra-tools/ (product-tools.ts, category-tools.ts, order-tools.ts, supplier-tools.ts, recommendation-tools.ts, tool-logger.ts, tool-auth.ts, tool-formatters.ts, index.ts)
- [ ] T003 [P] Create services directory structure in app/services/ (authorization.server.ts, analytics.server.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T004 Create Prisma migration to add Product.version field (default: 1, type: Int) in prisma/schema.prisma
- [X] T005 Create Prisma migration to add ToolExecutionLog model in prisma/schema.prisma (fields: id, toolName, userId, companyId, parameters Json, result Json, success Boolean, errorMessage, executionTimeMs, ipAddress, userAgent, createdAt, indexes on toolName+createdAt, userId+createdAt, companyId+createdAt, success+createdAt)
- [X] T006 Run migrations: `npx prisma migrate dev --name add-mastra-tool-support`
- [X] T007 Regenerate Prisma client: `npx prisma generate`

### Authorization Infrastructure

- [ ] T008 [P] Implement Permission enum in app/services/authorization.server.ts (VIEW_INVENTORY, MANAGE_PRODUCTS, VIEW_ORDERS, MANAGE_ORDERS, VIEW_SUPPLIERS, MANAGE_PURCHASE_ORDERS, VIEW_REPORTS)
- [ ] T009 Implement ROLE_PERMISSIONS matrix in app/services/authorization.server.ts mapping roles (Admin, Manager, Staff, Viewer) to permissions
- [ ] T010 Implement userHasPermission function in app/services/authorization.server.ts
- [ ] T011 Implement checkPermission function returning {authorized: boolean, error?: string} in app/services/authorization.server.ts

### Audit Logging Infrastructure

- [ ] T012 [P] Implement PII sanitization utility (sanitizeData function) in app/lib/mastra-tools/tool-logger.ts with SENSITIVE_FIELDS and PII_FIELDS arrays
- [ ] T013 Implement maskString helper function in app/lib/mastra-tools/tool-logger.ts
- [ ] T014 Implement logToolExecution async function in app/lib/mastra-tools/tool-logger.ts (accepts toolName, userId, companyId, parameters, result, error, startTime; sanitizes data; writes to ToolExecutionLog using setImmediate)

### Authorization Wrapper

- [ ] T015 [P] Define UserContext interface in app/lib/mastra-tools/tool-auth.ts (userId, role, companyId, email)
- [ ] T016 Implement withAuthorization HOF in app/lib/mastra-tools/tool-auth.ts (wraps tool execute function, extracts user from runtimeContext, checks permission, passes user context to tool)

### Output Formatting

- [ ] T017 [P] Implement markdown formatting utilities in app/lib/mastra-tools/tool-formatters.ts (functions for formatting tables, lists, key-value pairs)

### Analytics Infrastructure

- [ ] T018 [P] Implement SalesVelocity interface in app/services/analytics.server.ts (productId, productName, averageDailySales, totalSold30Days, daysWithSales, trend, confidence)
- [ ] T019 Implement calculateSalesVelocity function in app/services/analytics.server.ts (30-day rolling average with sparse data handling)
- [ ] T020 Implement calculateBulkSalesVelocities function in app/services/analytics.server.ts (optimized batch calculation)
- [ ] T021 Implement ReorderRecommendation interface in app/services/analytics.server.ts (productId, productName, currentStock, reorderPoint, safetyStock, recommendedOrderQuantity, urgency, reasoning)
- [ ] T022 Implement calculateReorderRecommendation function in app/services/analytics.server.ts (uses sales velocity, lead time, safety stock multiplier)
- [ ] T023 Implement generateReorderReasoning helper in app/services/analytics.server.ts
- [ ] T024 Implement handleNoSalesHistory helper in app/services/analytics.server.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Product Management Operations (Priority: P1) 🎯 MVP

**Goal**: Enable users to update product stock, prices, create products, and update details through chat

**Independent Test**: User can ask "Update stock for product SKU-123 to 50 units" and verify database changes persist with confirmation message

### Implementation for User Story 1

- [ ] T025 [P] [US1] Implement updateProductStockSchema (Zod) in app/lib/mastra-tools/product-tools.ts (productId string, quantity int min 0, version int min 1, reason string optional max 200)
- [ ] T026 [P] [US1] Implement updateProductPriceSchema (Zod) in app/lib/mastra-tools/product-tools.ts (productId string, sellingPrice decimal min 0.01 optional, costPrice decimal min 0 optional)
- [ ] T027 [P] [US1] Implement createProductSchema (Zod) in app/lib/mastra-tools/product-tools.ts (sku pattern ^[A-Z0-9-]+ max 50, name string 1-200, description max 1000, sellingPrice decimal min 0.01, costPrice decimal min 0, availableQuantity int min 0 default 0, reorderLevel int min 0 default 10, categoryId string, status enum default ACTIVE)
- [ ] T028 [P] [US1] Implement updateProductDetailsSchema (Zod) in app/lib/mastra-tools/product-tools.ts (productId string, name string 1-200 optional, description max 1000 optional, categoryId string optional, status enum optional, reorderLevel int min 0 optional)
- [ ] T029 [US1] Implement updateProductStock tool execute function in app/lib/mastra-tools/product-tools.ts (optimistic locking with version check, updateMany with count check, handle VERSION_CONFLICT and PRODUCT_NOT_FOUND errors, wrap with withAuthorization MANAGE_PRODUCTS, log execution)
- [ ] T030 [US1] Implement updateProductPrice tool execute function in app/lib/mastra-tools/product-tools.ts (update sellingPrice/costPrice, calculate margin, handle errors, wrap with withAuthorization MANAGE_PRODUCTS, log execution)
- [ ] T031 [US1] Implement createProduct tool execute function in app/lib/mastra-tools/product-tools.ts (validate SKU uniqueness, set version=1, create product, handle DUPLICATE_SKU and CATEGORY_NOT_FOUND errors, wrap with withAuthorization MANAGE_PRODUCTS, log execution)
- [ ] T032 [US1] Implement updateProductDetails tool execute function in app/lib/mastra-tools/product-tools.ts (update non-financial fields, validate at least one field provided, handle errors, wrap with withAuthorization MANAGE_PRODUCTS, log execution)
- [ ] T033 [US1] Export productTools object in app/lib/mastra-tools/product-tools.ts with all 4 tool definitions (updateProductStock, updateProductPrice, createProduct, updateProductDetails)

**Checkpoint**: User Story 1 complete - product management tools functional and testable

---

## Phase 4: User Story 2 - Category and Organization Management (Priority: P2)

**Goal**: Enable users to manage categories, view statistics, and reorganize products via chat

**Independent Test**: User can ask "Show me all my categories" or "Create a new category called Office Supplies" and verify correct display/creation

### Implementation for User Story 2

- [ ] T034 [P] [US2] Implement listCategoriesSchema (Zod) in app/lib/mastra-tools/category-tools.ts (includeEmpty boolean default false, sortBy enum default name, sortOrder enum default asc)
- [ ] T035 [P] [US2] Implement createCategorySchema (Zod) in app/lib/mastra-tools/category-tools.ts (name string 1-200 required, description string max 1000 optional)
- [ ] T036 [P] [US2] Implement moveProductsBetweenCategoriesSchema (Zod) in app/lib/mastra-tools/category-tools.ts (productIds array 1-100 items, targetCategoryId string nullable, sourceCategoryId string optional)
- [ ] T037 [US2] Implement listCategories tool execute function in app/lib/mastra-tools/category-tools.ts (query categories with product count aggregation, calculate inventory values, sort by specified field, wrap with withAuthorization VIEW_INVENTORY, log execution)
- [ ] T038 [US2] Implement createCategory tool execute function in app/lib/mastra-tools/category-tools.ts (validate name uniqueness per company, create category, handle DUPLICATE_CATEGORY_NAME error, wrap with withAuthorization MANAGE_PRODUCTS, log execution)
- [ ] T039 [US2] Implement moveProductsBetweenCategories tool execute function in app/lib/mastra-tools/category-tools.ts (batch update products in transaction, verify target category exists, handle partial success, track moved/notFound counts, wrap with withAuthorization MANAGE_PRODUCTS, log execution)
- [ ] T040 [US2] Export categoryTools object in app/lib/mastra-tools/category-tools.ts with all 3 tool definitions

**Checkpoint**: User Story 2 complete - category management tools functional and testable

---

## Phase 5: User Story 3 - Order and Sales Operations (Priority: P2)

**Goal**: Enable users to check orders, create orders, update status, and view analytics through chat

**Independent Test**: User can ask "Show me orders from the last 7 days" or "Create an order for customer John Smith" and verify data retrieval/creation

### Implementation for User Story 3

- [ ] T041 [P] [US3] Implement getOrdersSchema (Zod) in app/lib/mastra-tools/order-tools.ts (startDate date optional, endDate date optional, status enum default ALL, customerId string optional, limit int 1-100 default 20, offset int min 0 default 0)
- [ ] T042 [P] [US3] Implement createOrderSchema (Zod) in app/lib/mastra-tools/order-tools.ts (customerId string required, items array 1-50 with productId and quantity, tax decimal min 0 default 0, notes string max 1000 optional, status enum DRAFT/PENDING default PENDING)
- [ ] T043 [P] [US3] Implement updateOrderStatusSchema (Zod) in app/lib/mastra-tools/order-tools.ts (orderId string required, status enum required, notes string max 500 optional)
- [ ] T044 [P] [US3] Implement getSalesAnalyticsSchema (Zod) in app/lib/mastra-tools/order-tools.ts (startDate date required, endDate date required, groupBy enum default product, categoryId string optional, topN int 1-100 default 10)
- [ ] T045 [US3] Implement getOrders tool execute function in app/lib/mastra-tools/order-tools.ts (query with filters, include customer and items, paginate, validate date range, wrap with withAuthorization VIEW_ORDERS, log execution)
- [ ] T046 [US3] Implement createOrder tool execute function in app/lib/mastra-tools/order-tools.ts (transaction: create order + items + decrement inventory if PENDING/CONFIRMED, generate orderNumber SO-YYYYMMDD-XXXXX, calculate totals, handle INSUFFICIENT_STOCK error, wrap with withAuthorization MANAGE_ORDERS, log execution)
- [ ] T047 [US3] Implement validateStatusTransition helper in app/lib/mastra-tools/order-tools.ts (checks valid state transitions per contract)
- [ ] T048 [US3] Implement updateOrderStatus tool execute function in app/lib/mastra-tools/order-tools.ts (validate transition, update status and timestamps, restore inventory if CANCELLED, wrap with withAuthorization MANAGE_ORDERS, log execution)
- [ ] T049 [US3] Implement getSalesAnalytics tool execute function in app/lib/mastra-tools/order-tools.ts (aggregate by groupBy field, calculate metrics, format results, handle date range validation, wrap with withAuthorization VIEW_REPORTS, log execution)
- [ ] T050 [US3] Export orderTools object in app/lib/mastra-tools/order-tools.ts with all 4 tool definitions

**Checkpoint**: User Story 3 complete - order management and analytics tools functional and testable

---

## Phase 6: User Story 4 - Inventory Alerts and Recommendations (Priority: P3)

**Goal**: Users receive proactive recommendations, reorder suggestions, and inventory insights

**Independent Test**: User can ask "What should I reorder?" or "Show me slow-moving inventory" and verify intelligent recommendations appear

### Implementation for User Story 4

- [ ] T051 [P] [US4] Implement getReorderRecommendationsSchema (Zod) in app/lib/mastra-tools/recommendation-tools.ts (categoryId string optional, minSalesVelocity number min 0 optional, limit int 1-100 default 20, urgencyLevel enum default all)
- [ ] T052 [P] [US4] Implement getSlowMovingInventorySchema (Zod) in app/lib/mastra-tools/recommendation-tools.ts (categoryId string optional, minDaysSinceLastSale int min 1 default 90, minInventoryValue number min 0 optional, limit int 1-100 default 20)
- [ ] T053 [P] [US4] Implement getDailyActionItemsSchema (Zod) in app/lib/mastra-tools/recommendation-tools.ts (date date optional, includeCompleted boolean default false)
- [ ] T054 [US4] Implement getReorderRecommendations tool execute function in app/lib/mastra-tools/recommendation-tools.ts (call calculateBulkSalesVelocities, calculate reorder points using formula from analytics.server.ts, determine urgency levels, format with reasoning, wrap with withAuthorization VIEW_INVENTORY, log execution)
- [ ] T055 [US4] Implement getSlowMovingInventory tool execute function in app/lib/mastra-tools/recommendation-tools.ts (query products with no recent sales, calculate turnover rates and inventory values, assign recommendations per contract rules, wrap with withAuthorization VIEW_INVENTORY, log execution)
- [ ] T056 [US4] Implement getDailyActionItems tool execute function in app/lib/mastra-tools/recommendation-tools.ts (aggregate action items from multiple sources: reorder recommendations, low stock alerts, orders to ship, POs to receive, prioritize by urgency, wrap with withAuthorization VIEW_INVENTORY, log execution)
- [ ] T057 [US4] Export recommendationTools object in app/lib/mastra-tools/recommendation-tools.ts with all 3 tool definitions

**Checkpoint**: User Story 4 complete - recommendation and analytics tools functional and testable

---

## Phase 7: User Story 5 - Supplier and Purchase Order Management (Priority: P3)

**Goal**: Users can manage suppliers, create purchase orders, and track incoming shipments via chat

**Independent Test**: User can ask "Show me my suppliers" or "Create a purchase order for 100 units" and verify supplier data and PO management

### Implementation for User Story 5

- [ ] T058 [P] [US5] Implement listSuppliersSchema (Zod) in app/lib/mastra-tools/supplier-tools.ts (active boolean nullable, sortBy enum default name, sortOrder enum default asc, includeMetrics boolean default true)
- [ ] T059 [P] [US5] Implement createPurchaseOrderSchema (Zod) in app/lib/mastra-tools/supplier-tools.ts (supplierId string required, items array 1-100 with productId/quantity/unitCost, expectedDate date optional, tax decimal min 0 default 0, notes string max 1000 optional, status enum default SENT)
- [ ] T060 [P] [US5] Implement receivePurchaseOrderSchema (Zod) in app/lib/mastra-tools/supplier-tools.ts (purchaseOrderId string required, receivedItems array with purchaseOrderItemId and receivedQuantity, notes string max 500 optional)
- [ ] T061 [US5] Implement calculateSupplierMetrics helper in app/lib/mastra-tools/supplier-tools.ts (avgActualLeadTime, orderAccuracy calculations)
- [ ] T062 [US5] Implement listSuppliers tool execute function in app/lib/mastra-tools/supplier-tools.ts (query suppliers, optionally calculate metrics, sort by field, wrap with withAuthorization VIEW_SUPPLIERS, log execution)
- [ ] T063 [US5] Implement createPurchaseOrder tool execute function in app/lib/mastra-tools/supplier-tools.ts (transaction: create PO + items, generate poNumber PO-YYYYMMDD-XXXXX, auto-calculate expectedDate from leadTimeDays if omitted, calculate totals, wrap with withAuthorization MANAGE_PURCHASE_ORDERS, log execution)
- [ ] T064 [US5] Implement receivePurchaseOrder tool execute function in app/lib/mastra-tools/supplier-tools.ts (transaction: update receivedQty + increment product inventory, update PO status to PARTIALLY_RECEIVED or RECEIVED, validate quantities, wrap with withAuthorization MANAGE_PURCHASE_ORDERS, log execution)
- [ ] T065 [US5] Export supplierTools object in app/lib/mastra-tools/supplier-tools.ts with all 3 tool definitions

**Checkpoint**: User Story 5 complete - supplier and PO tools functional and testable

---

## Phase 8: Integration & Agent Configuration

**Purpose**: Integrate all tools with Mastra agent and update chat UI

- [ ] T066 Implement central tool export in app/lib/mastra-tools/index.ts (import all tool modules, export allTools object combining productTools, categoryTools, orderTools, supplierTools, recommendationTools)
- [ ] T067 Update Mastra agent configuration in app/lib/index.ts (import allTools from mastra-tools/index.ts, add all tools to agent tools object, update agent instructions to describe new capabilities)
- [ ] T068 Update chat route in app/routes/mastra-chat.tsx to inject user context into runtimeContext (extract user from session, pass userId, role, companyId, email to agent.generate)
- [ ] T069 [P] Update chat UI in app/routes/mastra-chat.tsx to handle version conflict errors (show retry dialog with current version/data)
- [ ] T070 [P] Update chat UI in app/routes/mastra-chat.tsx to display tool execution confirmations with formatted markdown results

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Add error handling middleware to catch and format all tool errors consistently
- [ ] T072 [P] Implement rate limiting for tool executions (100 requests/minute per user per contract specs)
- [ ] T073 Add bilingual support for tool responses (English/French) based on user locale
- [ ] T074 [P] Create API documentation from contract YAML files in docs/api/mastra-tools.md
- [ ] T075 Implement cache invalidation logic for category statistics (5 minute TTL)
- [ ] T076 Implement cache invalidation logic for sales analytics (15 minute TTL for completed periods)
- [ ] T077 [P] Add performance monitoring and logging for slow tool executions (>3s)
- [ ] T078 Run quickstart.md validation to ensure all examples work
- [ ] T079 Update project README.md with Mastra tools feature section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3-7 (User Stories)**: All depend on Phase 2 completion
  - Can execute in parallel if multiple developers available
  - Or sequentially in priority order: US1(P1) → US2(P2) → US3(P2) → US4(P3) → US5(P3)
- **Phase 8 (Integration)**: Depends on all desired user stories being complete
- **Phase 9 (Polish)**: Depends on Phase 8 completion

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only depends on Foundation
- **User Story 2 (P2)**: Independent - only depends on Foundation
- **User Story 3 (P2)**: Independent - only depends on Foundation
- **User Story 4 (P3)**: Depends on analytics.server.ts from Foundation, benefits from US1 data
- **User Story 5 (P3)**: Independent - only depends on Foundation

### Within Each User Story

- Schema definitions (Zod) can run in parallel
- Execute functions depend on their schemas
- Tool exports depend on all execute functions in that module
- Logging and authorization wrappers are called within execute functions

### Parallel Opportunities

**Foundation Phase (after T007)**:
```bash
# Can run simultaneously:
T008, T012, T015, T017, T018 (all [P] marked, different files)
```

**User Story 1**:
```bash
# Schemas in parallel:
T025, T026, T027, T028
# Then execute functions sequentially (T029-T032)
```

**User Story 2**:
```bash
# Schemas in parallel:
T034, T035, T036
# Then execute functions sequentially (T037-T039)
```

**User Story 3**:
```bash
# Schemas in parallel:
T041, T042, T043, T044
# Then execute functions sequentially (T045-T049)
```

**User Story 4**:
```bash
# Schemas in parallel:
T051, T052, T053
# Then execute functions sequentially (T054-T056)
```

**User Story 5**:
```bash
# Schemas in parallel:
T058, T059, T060
# Then execute functions sequentially (T062-T064)
```

**All User Stories** (if team has 5 developers):
```bash
# After Foundation complete, work in parallel:
Developer A: T025-T033 (US1)
Developer B: T034-T040 (US2)
Developer C: T041-T050 (US3)
Developer D: T051-T057 (US4)
Developer E: T058-T065 (US5)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T024) **CRITICAL - blocks everything**
3. Complete Phase 3: User Story 1 (T025-T033)
4. Complete Phase 8: Integration (T066-T070)
5. **STOP and VALIDATE**: Test product management tools independently
6. Deploy/demo MVP with product management capabilities

**Estimated Effort**: ~20-25 tasks, 2-3 days for experienced developer

### Incremental Delivery

1. Foundation (Phase 1 + 2) → Foundation ready
2. Add User Story 1 (Phase 3) → Deploy MVP (product management)
3. Add User Story 2 (Phase 4) → Deploy increment (+ category management)
4. Add User Story 3 (Phase 5) → Deploy increment (+ order management)
5. Add User Story 4 (Phase 6) → Deploy increment (+ recommendations)
6. Add User Story 5 (Phase 7) → Deploy increment (+ supplier/PO management)
7. Integration + Polish (Phase 8 + 9) → Full feature complete

**Each user story adds value without breaking previous stories**

### Parallel Team Strategy

With 5 developers:

1. **Team completes Foundation together** (Phase 1 + 2, ~1 day)
2. **Once Foundation done, parallelize**:
   - Dev A: User Story 1 (T025-T033)
   - Dev B: User Story 2 (T034-T040)
   - Dev C: User Story 3 (T041-T050)
   - Dev D: User Story 4 (T051-T057)
   - Dev E: User Story 5 (T058-T065)
3. **Merge and integrate** (Phase 8, ~0.5 day)
4. **Polish together** (Phase 9, ~0.5 day)

**Estimated Timeline**: 3-4 days for full feature

---

## Validation Checklist

- [ ] All 17 tools defined (4 product + 3 category + 4 order + 3 recommendation + 3 supplier)
- [ ] Each tool has Zod schema validation
- [ ] Each tool wrapped with withAuthorization
- [ ] Each tool execution logged with logToolExecution
- [ ] Optimistic locking implemented for updateProductStock (version checking)
- [ ] Transaction safety for order creation and PO receiving
- [ ] Sales velocity calculations use 30-day rolling average
- [ ] Reorder recommendations use formula: (velocity × lead time) + safety stock
- [ ] PII sanitization in audit logs
- [ ] Error messages user-friendly with suggestions
- [ ] All tools return markdown-formatted output
- [ ] Agent instructions updated to describe new capabilities
- [ ] Chat UI handles version conflicts with retry flow
- [ ] Bilingual support (EN/FR) implemented
- [ ] Rate limiting enforced (100 req/min per user)
- [ ] Performance targets met (<3s for 95% of requests)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Foundation phase (Phase 2) is CRITICAL and BLOCKS all user stories
- Commit after each phase completion for rollback safety
- Stop at any phase checkpoint to validate story independently
- MVP = Foundation + User Story 1 + Integration (~25 tasks)
- Full feature = All phases (~79 tasks)

---

## Summary

- **Total Tasks**: 79
- **Task Count per User Story**:
  - Setup: 3 tasks
  - Foundation: 21 tasks (BLOCKING)
  - US1 (Product Management): 9 tasks
  - US2 (Category Management): 7 tasks
  - US3 (Order Management): 10 tasks
  - US4 (Recommendations): 7 tasks
  - US5 (Supplier/PO Management): 8 tasks
  - Integration: 5 tasks
  - Polish: 9 tasks
- **Parallel Opportunities**: 28 tasks marked [P] can run simultaneously within their phases
- **Independent Test Criteria**: Each user story has explicit test scenario in checkpoint
- **Suggested MVP Scope**: Foundation + User Story 1 (Product Management) = 33 tasks
- **Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, labels, file paths)
