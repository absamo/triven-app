export default {
  // Page Title
  title: 'Commandes de vente',

  // Actions
  createSalesOrder: 'Créer une commande de vente',
  editSalesOrder: 'Modifier la commande de vente',
  sendOrderToCustomer: 'Envoyer la commande au client',
  viewInvoices: 'Voir les factures',
  cancelOrder: 'Annuler la commande',
  addSalesOrder: 'Ajouter une commande de vente',
  edit: 'Modifier une commande de vente',
  addSalesOrderItem: 'Ajouter un article de commande de vente',
  editSalesOrderItem: 'Modifier un article de commande de vente',

  // Form Fields
  orderDate: 'Date de commande',
  salesOrderReference: 'Référence de commande de vente',
  customerName: 'Nom du client',
  customer: 'Client',
  agency: 'Agence',
  orderStatus: 'Statut de la commande',
  amount: 'Montant',
  rate: 'Taux',
  tax: 'Taxe',
  salesOrderItem: 'Article de commande de vente',

  // Form placeholders and options
  selectPaymentTerm: 'Sélectionner un terme de paiement',
  dueOnDate: 'Dû à la date',
  paymentInAdvance: "Paiement à l'avance",
  net15: 'Net 15',
  net30: 'Net 30',
  net60: 'Net 60',
  dueEndOfMonth: 'Dû en fin de mois',
  dueEndOfNextMonth: 'Dû en fin du mois prochain',
  dueOnReceipt: 'Dû à la réception',

  // Status Labels
  pending: 'En attente',
  issued: 'Émise',
  shipped: 'Expédiée',
  partiallyShipped: 'Partiellement expédiée',
  delivered: 'Livrée',
  partiallyDelivered: 'Partiellement livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',

  // Search and Filters
  search: 'Rechercher des commandes de vente...',
  filterByOrderStatuses: 'Filtrer par statut de commande',
  filterBySalesOrder: 'Filtrer par commande de vente',
  filterByOrderDate: 'Filtrer par date de commande',

  // Messages and Validation
  noSalesOrdersFound: 'Aucune commande de vente trouvée',
  noSalesItemsFound: 'Aucun article de vente trouvé',
  selectProduct: 'Sélectionner un produit',
  noProductsAvailable: 'Aucun produit disponible',
  atLeastOneSalesOrderItemRequired:
    'Au moins un article de commande de vente est requis pour créer une commande de vente',
  salesOrderItemErrors: "Erreurs d'articles de commande de vente:",
  item: 'Article',

  // Backorder Integration
  createBackorder: 'Créer une commande en rupture',
  viewBackorders: 'Voir les commandes en rupture',
  backorderRequired:
    'Certains articles sont en rupture de stock et nécessitent des commandes en rupture',
}
