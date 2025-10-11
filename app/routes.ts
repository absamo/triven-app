import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  // Public routes (outside main layout)
  index('routes/home.tsx'),
  route('login', 'routes/auth/login.tsx'),
  route('logout', 'routes/auth/logout.tsx'),
  route('signup', 'routes/auth/signup.tsx'),
  route('pricing', 'routes/pricing.tsx'),
  route('request-demo', 'routes/request-demo.tsx'),
  route('join-team', 'routes/join-team.tsx'),
  route('invite', 'routes/invite.tsx'),
  route('verify-email', 'routes/verify-email.tsx'),
  route('auth/business-setup', 'routes/auth/business-setup.tsx'),
  route('forgot-password', 'routes/auth/forgot-password.tsx'),
  route('reset-password', 'routes/auth/reset-password.tsx'),
  route('auth-error', 'routes/auth/auth-error.tsx'),
  route('inactive-user', 'routes/inactive-user.tsx'),

  // Protected routes (inside main layout)
  layout('layouts/main.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),

    //api
    // Better-auth wildcard route to handle all auth endpoints
    route('api/auth/*', 'routes/api/auth/$.tsx'),
    route('api/demo-request', 'routes/api/demo-request.tsx'),
    route('api/config', 'routes/api/api.config.ts'),
    route('api/payment-intent', 'routes/api/api.payment-intent.ts'),
    route('api/payment-method-update', 'routes/api.payment-method-update.ts'),
    route('api/subscription-create', 'routes/api.subscription-create.ts'),
    route('api/subscription-cancel', 'routes/api.subscription-cancel.ts'),
    route('api/subscription-status', 'routes/api.subscription-status.ts'),
    route('api/webhook', 'routes/api.webhook.tsx'),
    route('api/check-user-status', 'routes/api/check-user-status.ts'),
    route('api/update-online-status', 'routes/api/update-online-status.ts'),
    route('api/team-online-status', 'routes/api/team-online-status.ts'),
    route('api/debug-online-status', 'routes/api/debug-online-status.ts'),
    route('api/cleanup-offline-users', 'routes/api/cleanup-offline-users.ts'),
    route('api/dashboard-stream', 'routes/api/dashboard-stream.ts'),
    route('api/notifications', 'routes/api/notifications.ts'),
    route('api/notifications-stream', 'routes/api/notifications-stream.ts'),
    route('api/suppliers/:id', 'routes/api/suppliers.ts'),
    route('api/suppliers-search', 'routes/api/suppliersSearch.ts'),
    route('api/sites/:id', 'routes/api/sites.ts'),
    route('api/purchaseOrders/:id', 'routes/api/purchaseOrder.ts'),
    route('/api/purchase-orders-search', 'routes/api/purchaseOrderSearch.ts'),
    route('/api/purchase-receives-search', 'routes/api/purchaseReceivesSearch.ts'),
    route('/api/bills-search', 'routes/api/billsSearch.ts'),
    route('/api/payments-made-search', 'routes/api/paymentMadeSearch.ts'),
    route('/api/sales-orders-search', 'routes/api/salesOrderSearch.ts'),
    route('/api/invoices-search', 'routes/api/invoicesSearch.ts'),
    route('/api/payments-received-search', 'routes/api/paymentReceivedSearch.ts'),
    route('/api/backorders-search', 'routes/api.backorders-search.tsx'),
    route('/api/salesorders', 'routes/api.salesorders.ts'),
    route('/api/products-search', 'routes/api/productSearch.ts'),
    route('/api/products', 'routes/api/products.ts'),
    route('/api/products-export', 'routes/api/productsExport.tsx'),
    route('/api/productsImport', 'routes/api/productsImport.tsx'),
    route('/api/categories', 'routes/api/categories.ts'),
    route('/api/categoriesImport', 'routes/api/categoriesImport.tsx'),
    route('/api/stock-adjustments-search', 'routes/api/stockAdjustmentSearch.ts'),
    route('api/locales/:lng/:ns', 'routes/locales.ts'),
    route('api/approvals', 'routes/api.approvals.ts'),
    route('api/workflows', 'routes/api.workflows.ts'),
    route('api/workflow-templates', 'routes/api/workflow-templates.ts'),
    route('api/workflow-step-execution', 'routes/api/workflow-step-execution.ts'),
    route('api/workflow-trigger', 'routes/api/workflow-trigger.ts'),

    // ImageKit API routes
    route('api/imagekit/upload', 'routes/api.imagekit.upload.tsx'),
    route('api/imagekit/auth', 'routes/api.imagekit.auth.tsx'),
    route('api/imagekit/delete', 'routes/api.imagekit.delete.tsx'),
    route('api/imagekit/config', 'routes/api.imagekit.config.tsx'),

    //products
    route('products', 'routes/products/products.tsx'),
    route('products/create', 'routes/products/products.create.tsx'),
    route('products/:id/edit', 'routes/products/products.edit.tsx'),

    //categories
    route('categories', 'routes/categories/categories.tsx'),
    route('categories/create', 'routes/categories/categories.create.tsx'),
    route('categories/:id/edit', 'routes/categories/categories.edit.tsx'),

    //stock adjustments
    route('stock-adjustments', 'routes/stockAdjustments/stockAdjustments.tsx'),
    route('stock-adjustments/create', 'routes/stockAdjustments/stockAdjustments.create.tsx'),
    route('stock-adjustments/:id/edit', 'routes/stockAdjustments/stockAdjustments.edit.tsx'),

    //suppliers
    route('suppliers', 'routes/suppliers/suppliers.tsx'),
    route('suppliers/create', 'routes/suppliers/suppliers.create.tsx'),
    route('suppliers/:id/edit', 'routes/suppliers/suppliers.edit.tsx'),

    //purchase orders
    route('purchase-orders', 'routes/purchaseOrders/purchaseOrders.tsx'),
    route('purchase-orders/create', 'routes/purchaseOrders/purchaseOrders.create.tsx'),
    route('purchase-orders/:id/edit', 'routes/purchaseOrders/purchaseOrders.edit.tsx'),

    //purchase receives
    route('purchase-receives', 'routes/purchaseReceives/purchaseReceives.tsx'),
    route('purchase-receives/create', 'routes/purchaseReceives/purchaseReceives.create.tsx'),
    route('purchase-receives/:id/edit', 'routes/purchaseReceives/purchaseReceives.edit.tsx'),

    //bills
    route('bills', 'routes/bills/bills.tsx'),
    route('bills/create', 'routes/bills/bills.create.tsx'),
    route('bills/:id/edit', 'routes/bills/bills.edit.tsx'),

    //payments made
    route('payments-made', 'routes/paymentsMade/paymentsMade.tsx'),
    route('payments-made/create', 'routes/paymentsMade/paymentsMade.create.tsx'),
    route('payments-made/:id/edit', 'routes/paymentsMade/paymentsMade.edit.tsx'),

    //customers
    route('customers', 'routes/customers/customers.tsx'),
    route('customers/create', 'routes/customers/customers.create.tsx'),
    route('customers/:id/edit', 'routes/customers/customers.edit.tsx'),

    //sales orders
    route('sales-orders', 'routes/salesOrders/salesOrders.tsx'),
    route('sales-orders/create', 'routes/salesOrders/salesOrders.create.tsx'),
    route('sales-orders/:id/edit', 'routes/salesOrders/salesOrders.edit.tsx'),

    //backorders
    route('backorders', 'routes/backorders.tsx'),
    route('backorders/create', 'routes/backorders.create.tsx'),
    route('backorders/:id/edit', 'routes/backorders.$id.edit.tsx'),

    //invoices
    route('invoices', 'routes/invoices/invoices.tsx'),
    route('invoices/create', 'routes/invoices/invoices.create.tsx'),
    route('invoices/:id/edit', 'routes/invoices/invoices.edit.tsx'),

    //payments received
    route('payments-received', 'routes/paymentsReceived/paymentsReceived.tsx'),
    route('payments-received/create', 'routes/paymentsReceived/paymentsReceived.create.tsx'),
    route('payments-received/:id/edit', 'routes/paymentsReceived/paymentsReceived.edit.tsx'),
    // settings
    route('settings', 'routes/settings/settings.tsx'),

    // integrations
    route('integrations', 'routes/integrations/integrations.tsx'),

    // teams
    route('teams', 'routes/teams/teams.tsx'),
    route('teams/create', 'routes/teams/teams.create.tsx'),
    route('teams/:id/edit', 'routes/teams/teams.edit.tsx'),

    // roles
    route('roles', 'routes/roles/roles.tsx'),
    route('roles/create', 'routes/roles/roles.create.tsx'),
    route('roles/:id/edit', 'routes/roles/roles.edit.tsx'),

    // agencies
    route('agencies', 'routes/agencies/agencies.tsx'),
    route('agencies/create', 'routes/agencies/agencies.create.tsx'),
    route('agencies/:id/edit', 'routes/agencies/agencies.edit.tsx'),

    //sites
    route('sites', 'routes/sites/sites.tsx'),
    route('sites/create', 'routes/sites/sites.create.tsx'),
    route('sites/:id/edit', 'routes/sites/sites.edit.tsx'),

    //transferOrders
    route('transfer-orders', 'routes/transferOrders/transferOrders.tsx'),
    route('transfer-orders/create', 'routes/transferOrders/transferOrders.create.tsx'),
    route('transfer-orders/:id/edit', 'routes/transferOrders/transferOrders.edit.tsx'),

    //analytics
    route('analytics/inventoryOverview', 'routes/analytics/inventoryOverview.tsx'),

    //workflows and approvals
    route('approvals', 'routes/approvals/approvals.tsx'),
    route('workflow-templates', 'routes/workflow-templates/workflow-templates.tsx'),
    route('workflow-templates/create', 'routes/workflow-templates/workflow-templates.create.tsx'),
    route('workflow-templates/:id', 'routes/workflow-templates/workflow-templates.edit.tsx'),
    route('workflow-instances', 'routes/workflow-instances/workflow-instances.tsx'),
    route('workflow-instances/:instanceId/step', 'routes/workflow-instances/$instanceId.step.tsx'),
    route('workflow-history', 'routes/workflows/workflow-history.tsx'),

    //assistant
    route('ai-assistant', 'routes/ai-assistant/assistant.tsx'),
    route('assistant/chat', 'routes/assistant/chat.tsx'),

    // Simple chat
    route('simple-chat', 'routes/simple-chat.tsx'),
  ]),
] satisfies RouteConfig
