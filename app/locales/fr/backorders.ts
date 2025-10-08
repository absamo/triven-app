export default {
  // Main title and labels
  title: 'Commandes en Attente',
  backorders: 'Commandes en Attente',
  backorder: 'Commande en Attente',

  // Form fields
  backorderReference: 'Référence de Commande en Attente',
  orderDate: 'Date de Commande',
  originalOrderDate: 'Date de Commande Originale',
  expectedFulfillDate: 'Date de Livraison Prévue',
  customerName: 'Nom du Client',
  agency: 'Agence',
  orderStatus: 'Statut de la Commande',
  amount: 'Montant',
  notes: 'Notes',

  // Status values
  pending: 'En Attente',
  partial: 'Partiel',
  fulfilled: 'Complété',
  cancelled: 'Annulé',

  // Sales Order Integration
  salesOrder: 'Commande de vente',
  salesOrderDescription: 'Lier cette commande en rupture à une commande de vente existante',
  salesOrderReference: 'Référence de commande de vente',
  noSalesOrdersAvailable: 'Aucune commande de vente disponible pour le client sélectionné',

  // Actions
  fulfillOrder: 'Compléter la Commande',
  cancelOrder: 'Annuler la Commande',
  createBackorder: 'Créer une Commande en Attente',
  editBackorder: 'Modifier la Commande en Attente',
  addBackorder: 'Ajouter une Commande en Attente',

  // Filters and search
  search: 'Rechercher des commandes en attente...',
  filterByOrderStatuses: 'Filtrer par statut de commande',
  filterByBackorder: 'Filtrer par commande en attente',
  filterByOrderDate: 'Filtrer par date de commande',

  // Messages
  noBackordersFound: 'Aucune commande en attente trouvée',
  showingCount: 'Affichage de {{count}} commandes en attente',
  showingCountSingular: 'Affichage de {{count}} commande en attente',
  selectOutOfStockProduct: 'Sélectionner un produit en rupture de stock',
  noOutOfStockProductsAvailable: 'Aucun produit en rupture de stock disponible',
  backorderCreated: 'Commande en attente créée avec succès',
  backorderUpdated: 'Commande en attente mise à jour avec succès',
  backorderFulfilled: 'Commande en attente complétée avec succès',
  backorderCancelled: 'Commande en attente annulée avec succès',

  // Table headers
  dateHeader: 'Date',
  referenceHeader: 'Référence',
  statusHeader: 'Statut',
  customerHeader: 'Client',
  agencyHeader: 'Agence',
  amountHeader: 'Montant',

  // Item details
  items: 'Articles',
  orderedQuantity: 'Quantité Commandée',
  fulfilledQuantity: 'Quantité Livrée',
  remainingQuantity: 'Quantité Restante',
  rate: 'Taux',
  itemAmount: "Montant de l'Article",
  productName: 'Nom du Produit',

  // Status descriptions
  pendingDescription: 'En attente de disponibilité du stock',
  partialDescription: 'Certains articles ont été livrés',
  fulfilledDescription: 'Tous les articles ont été livrés',
  cancelledDescription: 'La commande en attente a été annulée',

  // Validation messages
  backorderReferenceRequired: 'La référence de commande en attente est requise',
  customerRequired: 'Le client est requis',
  agencyRequired: "L'agence est requise",
  siteRequired: 'Le site est requis',
  originalOrderDateRequired: 'La date de commande originale est requise',
  itemsRequired: 'Au moins un article est requis',
  backorderItemRequired:
    'Veuillez ajouter un article de commande en attente avant de soumettre le formulaire',
  noProductSelectedError:
    'Veuillez sélectionner un produit pour tous les articles de commande en attente',
  invalidQuantityError:
    'Veuillez entrer une quantité valide pour tous les articles de commande en attente',
  backorderItemErrors: "Erreurs d'articles de commande en attente:",
  item: 'Article',

  // Fulfillment
  fulfillItem: "Livrer l'Article",
  fulfillQuantity: 'Quantité à Livrer',
  availableStock: 'Stock Disponible',
  partialFulfillment: 'Livraison Partielle',
  completeFulfillment: 'Livraison Complète',
}
