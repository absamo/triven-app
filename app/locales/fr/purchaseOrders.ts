export default {
  // Page title and navigation
  title: 'Bons de Commande',

  // Form titles
  addPurchaseOrder: 'Ajouter un bon de commande',
  editPurchaseOrder: 'Modifier un bon de commande',

  // Form fields
  purchaseOrderReferenceLabel: 'Référence du bon de commande',
  supplier: 'Fournisseur',
  selectSupplier: 'Sélectionner un fournisseur',
  paymentTerms: 'Conditions de Paiement',
  selectPaymentTerm: 'Sélectionner une condition de paiement',
  orderDateLabel: 'Date de commande',
  expectedDeliveryDate: 'Date de Livraison Prévue',

  // Payment terms
  dueOnDate: 'Échéance à la date',
  paymentInAdvance: "Paiement à l'avance",
  net15: 'Net 15',
  net30: 'Net 30',
  net60: 'Net 60',
  dueEndOfMonth: 'Échéance fin de mois',
  dueEndOfNextMonth: 'Échéance fin du mois suivant',
  dueOnReceipt: 'Échéance à réception',

  // Purchase order items
  addPurchaseOrderItem: 'Ajouter un article de commande',
  editPurchaseOrderItem: 'Modifier un article de commande',
  purchaseOrderItem: 'ARTICLE DE COMMANDE',
  productItemToPurchase: 'Article produit à acheter',
  selectProduct: 'Sélectionner un produit',
  quantity: 'QUANTITÉ',
  rate: 'TARIF',
  tax: 'TAXE',
  amount: 'Montant',
  amountHeader: 'MONTANT',
  total: 'Total',

  // Table headers
  orderDate: 'Date de Commande',
  purchaseOrderReference: 'Référence du Bon de Commande',
  supplierName: 'Nom du Fournisseur',
  agency: 'Agence',
  orderStatus: 'Statut de Commande',

  // Statuses
  issued: 'Émis',
  pending: 'En Attente',
  partiallyReceived: 'Partiellement Reçu',
  received: 'Reçu',
  cancelled: 'Annulé',

  // Actions
  sendOrderToSupplier: 'Envoyer la commande au fournisseur',
  viewPurchaseReceives: "Voir les réceptions d'achat",
  viewBills: 'Voir les factures',
  cancelOrder: 'Annuler la commande',

  // Filters
  search: 'Rechercher des bons de commande...',
  filterByOrderStatuses: 'Filtrer par statuts de commande',
  filterByPurchaseOrder: 'Filtrer par bon de commande',
  filterByOrderDate: 'Filtrer par date de commande',

  // Messages
  noPurchaseOrdersFound: 'Aucun bon de commande trouvé',
  noPurchaseItemsFound: 'Aucun article de commande trouvé',
  purchaseOrderItemRequired:
    'Veuillez ajouter un article de commande avant de soumettre le formulaire',
} satisfies typeof import('../en/purchaseOrders').default
