export const roles = {
  // Page titles and labels
  title: 'Roles',
  addRole: 'Add a role',
  editRole: 'Edit a role',
  viewRole: 'View a role',
  pageDescription: 'Manage user roles and permissions for your organization',

  // Table headers
  nameHeader: 'NAME',

  // Status badges
  default: 'Default',

  // Messages
  cannotEditDefaultRoles: 'Cannot edit default roles',
  noDescription: 'No description provided',
  noPermissionsWarning: 'This role has no permissions assigned',
  systemRole: 'System role',
  builtInRole: 'Built-in role',
  customRole: 'Custom role',
  readOnly: 'Read-only',
  noRoles: 'No roles found',
  createFirstRole: 'Create your first role to get started',
  expandAll: 'Expand All',

  // Permission sections
  inventories: 'Inventories',
  inventoryDescription: 'Manage products, stock adjustments, and categories',
  selectInventoryPermissions: 'Select permissions for inventory management',

  workflows: 'Workflows',
  workflowsDescription: 'Manage approval workflows and view workflow history',

  purchases: 'Purchases',
  purchasesDescription: 'Control supplier relationships, orders, receiving, and payments',
  selectPurchasePermissions: 'Select permissions for purchases',

  sales: 'Sales',
  salesDescription: 'Manage customer orders, invoicing, and payment collection',
  selectSalesPermissions: 'Select permissions for sales',

  reports: 'Reports',
  reportsDescription: 'Access analytics and business intelligence reports',
  selectReportPermissions: 'Select permissions for reports and analytics',

  settings: 'Settings',
  settingsDescription: 'Configure plans, settings, roles, team members, agencies, and sites',
  selectSettingsPermissions: 'Select permissions for settings',

  // Permission types
  permissions: {
    fullAccess: 'Full access',
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
  },

  // Module labels (these appear in the RolesForm)
  modules: {
    products: 'Products',
    stockAdjustments: 'Stock adjustments',
    categories: 'Categories',
    transferOrders: 'Transfer Orders',
    approvals: 'Approvals',
    workflows: 'Templates',
    suppliers: 'Suppliers',
    purchaseOrders: 'Purchase orders',
    purchaseReceives: 'Purchase receives',
    bills: 'Bills',
    paymentsMade: 'Payments Made',
    customers: 'Customers',
    salesOrders: 'Sales orders',
    backorders: 'Backorders',
    invoices: 'Invoices',
    paymentsReceived: 'Payments Received',
    analytics: 'Analytics',
    plans: 'Plans',
    settings: 'Settings',
    roles: 'Roles',
    team: 'Team',
    agencies: 'Agencies',
    sites: 'Sites',
    subscriptions: 'Subscriptions',
  },
}

export default roles
