export const roles = {
  // Page titles and labels
  title: 'Rôles',
  addRole: 'Ajouter un rôle',
  editRole: 'Modifier un rôle',
  viewRole: 'Voir un rôle',
  pageDescription: 'Gérer les rôles utilisateur et les permissions pour votre organisation',

  // Table headers
  nameHeader: 'NOM',

  // Status badges
  default: 'Par défaut',

  // Messages
  cannotEditDefaultRoles: 'Impossible de modifier les rôles par défaut',
  noDescription: 'Aucune description fournie',
  noPermissionsWarning: "Ce rôle n'a aucune permission assignée",
  systemRole: 'Rôle système',
  builtInRole: 'Rôle intégré',
  customRole: 'Rôle personnalisé',
  readOnly: 'Lecture seule',
  noRoles: 'Aucun rôle trouvé',
  createFirstRole: 'Créez votre premier rôle pour commencer',
  expandAll: 'Tout développer',

  // Permission sections
  inventories: 'Inventaires',
  inventoryDescription: 'Gérer les produits, ajustements de stock et catégories',
  selectInventoryPermissions: 'Sélectionner les permissions pour la gestion des inventaires',

  workflows: 'Workflows',
  workflowsDescription: "Gérer les workflows d'approbation et consulter l'historique",

  purchases: 'Achats',
  purchasesDescription: 'Contrôler les relations fournisseurs, commandes, réceptions et paiements',
  selectPurchasePermissions: 'Sélectionner les permissions pour les achats',

  sales: 'Ventes',
  salesDescription: 'Gérer les commandes clients, facturation et encaissement',
  selectSalesPermissions: 'Sélectionner les permissions pour les ventes',

  reports: 'Rapports',
  reportsDescription: "Accéder aux analyses et rapports d'intelligence économique",
  selectReportPermissions: 'Sélectionner les permissions pour les rapports et analyses',

  settings: 'Paramètres',
  settingsDescription:
    "Configurer les plans, paramètres, rôles, membres de l'équipe, agences et sites",
  selectSettingsPermissions: 'Sélectionner les permissions pour les paramètres',

  // Permission types
  permissions: {
    fullAccess: 'Accès complet',
    view: 'Voir',
    create: 'Créer',
    update: 'Modifier',
    delete: 'Supprimer',
  },

  // Module labels (these appear in the RolesForm)
  modules: {
    products: 'Produits',
    stockAdjustments: 'Ajustements de stock',
    categories: 'Catégories',
    transferOrders: 'Ordres de transfert',
    approvals: 'Approbations',
    workflows: 'Modèles',
    suppliers: 'Fournisseurs',
    purchaseOrders: 'Bons de commande',
    purchaseReceives: "Réceptions d'achats",
    bills: "Factures d'achat",
    paymentsMade: 'Paiements effectués',
    customers: 'Clients',
    salesOrders: 'Commandes de vente',
    backorders: 'Commandes en souffrance',
    invoices: 'Factures',
    paymentsReceived: 'Paiements reçus',
    analytics: 'Analyses',
    plans: 'Plans',
    settings: 'Paramètres',
    roles: 'Rôles',
    team: 'Équipe',
    agencies: 'Agences',
    sites: 'Sites',
    subscriptions: 'Abonnements',
  },
}

export default roles
