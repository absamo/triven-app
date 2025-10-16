export default {
  // Main inventory navigation
  inventory: 'Inventaire',
  inventoryManagement: "Gestion d'Inventaire",
  inventoryOverview: "Aperçu de l'Inventaire",

  // Stock operations
  stockAdjustments: 'Ajustements de Stock',
  stockMovements: 'Mouvements de Stock',
  stockTransfers: 'Transferts de Stock',
  stockTakes: "Prises d'Inventaire",
  stockLevels: 'Niveaux de Stock',

  // Transfer operations
  transferOrders: 'Ordres de Transfert',
  inboundTransfers: 'Transferts Entrants',
  outboundTransfers: 'Transferts Sortants',
  pendingTransfers: 'Transferts en Attente',
  completedTransfers: 'Transferts Terminés',

  // Stock status and tracking
  stockStatus: 'Statut du Stock',
  inStock: 'En Stock',
  lowStock: 'Stock Faible',
  outOfStock: 'Rupture de Stock',
  criticalStock: 'Stock Critique',
  excessStock: 'Stock Excédentaire',
  deadStock: 'Stock Mort',

  // Stock movement types
  stockIn: 'Entrée de Stock',
  stockOut: 'Sortie de Stock',
  adjustment: 'Ajustement',
  transfer: 'Transfert',
  receive: 'Réception',
  dispatch: 'Expédition',

  // Inventory metrics
  totalValue: 'Valeur Totale',
  totalItems: 'Total des Articles',
  stockValue: 'Valeur du Stock',
  stockQuantity: 'Quantité en Stock',
  reorderLevel: 'Niveau de Réapprovisionnement',
  reorderQuantity: 'Quantité de Réapprovisionnement',
  leadTime: 'Délai de Livraison',
  turnoverRate: 'Taux de Rotation',

  // Locations and warehouses
  location: 'Emplacement',
  locations: 'Emplacements',
  warehouse: 'Entrepôt',
  warehouses: 'Entrepôts',
  site: 'Site',
  sites: 'Sites',
  zone: 'Zone',
  zones: 'Zones',
  bin: 'Casier',
  bins: 'Casiers',

  // Inventory actions
  adjustStock: 'Ajuster le Stock',
  transferStock: 'Transférer le Stock',
  receiveStock: 'Recevoir le Stock',
  dispatchStock: 'Expédier le Stock',
  countStock: 'Compter le Stock',
  reserveStock: 'Réserver le Stock',
  allocateStock: 'Allouer le Stock',

  // Adjustment reasons
  adjustmentReason: "Raison de l'Ajustement",
  damaged: 'Endommagé',
  expired: 'Expiré',
  lost: 'Perdu',
  stolen: 'Volé',
  found: 'Trouvé',
  correction: 'Correction',
  promotion: 'Promotion',
  writeOff: 'Dépréciation',

  // Forms and fields
  fromLocation: 'Emplacement Source',
  toLocation: 'Emplacement Destination',
  quantity: 'Quantité',
  adjustedQuantity: 'Quantité Ajustée',
  currentQuantity: 'Quantité Actuelle',
  newQuantity: 'Nouvelle Quantité',
  difference: 'Différence',
  reason: 'Raison',
  notes: 'Notes',
  reference: 'Référence',
  status: 'Statut',
  fromSite: 'Site Source',
  toSite: 'Site Destination',
  noTransferOrdersFound: 'Aucun ordre de transfert trouvé',

  // Reports and analytics
  inventoryReport: "Rapport d'Inventaire",
  stockReport: 'Rapport de Stock',
  movementReport: 'Rapport de Mouvement',
  adjustmentReport: "Rapport d'Ajustement",
  transferReport: 'Rapport de Transfert',
  stockValuation: 'Évaluation du Stock',
  inventoryAnalysis: "Analyse d'Inventaire",

  // Status messages
  stockAdjusted: 'Stock ajusté avec succès',
  transferCompleted: 'Transfert terminé avec succès',
  inventoryUpdated: 'Inventaire mis à jour avec succès',
  lowStockAlert: 'Alerte stock faible',
  outOfStockAlert: 'Alerte rupture de stock',

  // Errors
  insufficientStock: 'Stock insuffisant',
  invalidQuantity: 'Quantité invalide',
  locationRequired: "L'emplacement est requis",
  reasonRequired: 'La raison est requise',

  // Products
  products: 'Produits',
  product: 'Produit',
  title: 'Produits',
  description: 'Gérez votre catalogue de produits et articles en stock',
  productDescription: 'Description',
  nameHeader: 'Nom',
  inStockQtyHeader: 'Qté en Stock',
  sellingPriceHeader: 'Prix de Vente',
  statusHeader: 'Statut',
  warehouseHeader: 'Entrepôt',
  agencyHeader: 'Agence',
  noProductsFound: 'Aucun produit trouvé',
  showingProducts: 'Affichage de {{count}} produits',

  // Product actions
  exportProducts: 'Exporter',
  edit: 'Modifier',
  duplicate: 'Dupliquer',
  delete: 'Supprimer',

  // Import related keys
  selectFile: 'Sélectionner un Fichier',
  chooseDataSource: 'Choisissez votre source de données',
  selectFileDescription:
    'Sélectionnez le fichier CSV contenant les données produit à importer. Vous pouvez télécharger notre modèle pour commencer.',
  downloadTemplate: 'Télécharger le Modèle CSV',
  dragDropFiles: 'Glissez le fichier CSV ici ou cliquez pour sélectionner',
  fileRequirements:
    'Joignez un fichier CSV avec les données produit. Le fichier ne doit pas dépasser 5 Mo',
  fileSelected: 'Fichier sélectionné',
  mapFields: 'Mapper les Champs',
  configureFieldMapping: 'Configurer le mappage des champs',
  mapFieldsDescription:
    "Examinez le format de votre fichier CSV. Le processus d'importation validera vos données et fournira des messages d'erreur détaillés si des problèmes sont détectés.",
  requiredFields: 'Champs Obligatoires',
  productName: 'Nom du Produit',
  categoryValidationRule: 'Les catégories doivent exister dans votre système',
  reviewImport: 'Réviser et Importer',
  confirmAndComplete: 'Confirmer et terminer',
  reviewDescription:
    "Examinez vos paramètres et terminez le processus d'importation. Cela ajoutera de nouveaux produits à votre inventaire.",
  importSummary: "Résumé d'Importation",
  fileName: 'Nom du fichier',
  fileSize: 'Taille du fichier',
  importing: 'Importation des produits...',
  complete: 'terminé',
  importSuccessful: 'Importation Réussie',
  productsImported: '{{count}} produits importés avec succès',
  categoriesImported: '{{count}} catégories importées avec succès',
  importCompleteWithIssues: 'Importation Terminée avec des Problèmes',
  partialImport: '{{success}} sur {{total}} produits importés avec succès',
  partialCategoryImport: '{{success}} sur {{total}} catégories importées avec succès',
  importFailed: "Échec de l'Importation",
  startImport: "Démarrer l'Importation",

  // Additional import strings
  validationRules: 'Règles de Validation',
  importErrors: "Erreurs d'Importation",
  validationErrors: 'Erreurs de Validation',
  noProductsImported:
    "Aucun produit n'a été importé. Tous les produits ont échoué à la validation.",
  noCategoriesImported:
    "Aucune catégorie n'a été importée. Toutes les catégories ont échoué à la validation.",
  productsFailedValidation: '{{count}} produit(s) ont échoué à la validation :',
  categoriesFailedValidation: '{{count}} catégorie(s) ont échoué à la validation :',
  importedProducts: 'Produits Importés',
  importedCategories: 'Catégories Importées',
  successfullyImportedProducts: 'Produits Importés avec Succès',
  successfullyImportedCategories: 'Catégories Importées avec Succès',
  removeFile: 'Supprimer',
  csvFile: 'Fichier CSV',
  productNamesMustBeUnique: 'Les noms de produits doivent être uniques dans votre entreprise',
  categoryNamesMustBeUnique: 'Les noms de catégories doivent être uniques dans votre entreprise',
  categoryMustExist: 'La catégorie doit exister dans votre système',
  sellingPriceMustBePositive: 'Le prix de vente doit être un nombre positif',
  duplicateProductNamesRejected:
    "Les noms de produits en double seront rejetés lors de l'importation",
  duplicateCategoryNamesRejected:
    "Les noms de catégories en double seront rejetés lors de l'importation",
  invalidFieldsRejected: 'Les champs invalides ou manquants entraîneront le rejet des lignes',
  detailedValidationResults:
    'Les résultats de validation détaillés seront affichés après traitement',

  // Product statuses
  available: 'Disponible',
  critical: 'Critique',
  discontinued: 'Discontinué',
  inTransit: 'En Transit',
  reserved: 'Réservé',
  archived: 'Archivé',
  onOrder: 'En Commande',

  // Filters and search
  filterByLocation: 'Filtrer par Emplacement',
  filterByStatus: 'Filtrer par Statut',
  filterByCategory: 'Filtrer par Catégorie',
  searchProducts: 'Rechercher des Produits',
  searchPlaceholder: 'Rechercher par nom de produit, SKU ou code-barres...',
  selectStatus: 'Sélectionner un statut...',
  selectCategories: 'Sélectionner des catégories...',
  resetAllFilters: 'Réinitialiser tous les filtres',
  showLowStock: 'Afficher Seulement le Stock Faible',
  showOutOfStock: 'Afficher Seulement les Ruptures de Stock',

  // Stock adjustment filters
  searchByReference: 'Rechercher par référence...',
  selectReasons: 'Sélectionner des raisons...',
  selectSites: 'Sélectionner des sites...',
  toggleRangeMode: 'Basculer le mode plage de dates',
  selectDateRange: 'Sélectionner une plage de dates...',
  selectDate: 'Sélectionner une date...',

  // Stock adjustment form fields
  editStockAdjustment: "Modifier l'Ajustement de Stock",
  addStockAdjustment: 'Ajouter un Ajustement de Stock',
  selectSite: 'Sélectionner un site',
  selectReason: 'Sélectionner une raison',
  selectOrScanProduct: 'Sélectionner ou scanner un produit',
  date: 'Date',

  // Stock adjustment table headers
  productHeader: 'Produit',
  availableQtyHeader: 'Qté Disponible',
  adjustedQtyHeader: 'Qté Ajustée',
  newQtyOnHandHeader: 'Nouvelle Qté Disponible',
  stockOnHandHeader: 'Stock Disponible',
  userHeader: 'Utilisateur',
  viewProductHistory: "Voir l'historique du produit",
  removeProductFromAdjustment: "Retirer le produit de l'ajustement",
  productHistory: 'Historique Produit',

  // Additional adjustment reasons
  demo: 'Démo',
  internalTransfer: 'Transfert Interne',
  purchase: 'Achat',
  qualityControl: 'Contrôle Qualité',
  refund: 'Remboursement',
  return: 'Retour',
  returnSupplier: 'Retour au Fournisseur',
  sale: 'Vente',
  unaccountedInventory: 'Inventaire Non Comptabilisé',

  // Product form fields
  unit: 'Unité',
  selectUnit: 'Sélectionner une Unité',
  category: 'Catégorie',
  selectCategory: 'Sélectionner une Catégorie',
  openingStock: "Stock d'Ouverture",
  openingValue: "Valeur d'Ouverture",
  reorderPoint: 'Point de Réapprovisionnement',
  safetyStockLevel: 'Niveau de Stock de Sécurité',
  costPrice: 'Prix de Revient',
  sellingPrice: 'Prix de Vente',
  itemName: "Nom de l'Article",
  overview: 'Aperçu',
  physicalStock: 'Stock Physique',
  stockOnHand: 'Stock Disponible',
  committedStock: 'Stock Engagé',
  availableStockForSale: 'Stock Disponible à la Vente',
  accountingStock: 'Stock Comptable',
  quantityToBeInvoiced: 'Quantité à Facturer',
  quantityToBeReceived: 'Quantité à Recevoir',
  quantityToBeBilled: 'Quantité à Facturer Achat',
  barcode: 'Code-barres',
  generateBarcode: 'Générer un code-barres',
  addProduct: 'Ajouter un Produit',
  details: 'Détails',
  inventoryAdjustments: "Ajustements d'Inventaire",
  salesOrders: 'Commandes de Vente',
  purchaseOrders: "Commandes d'Achat",
  noStockAdjustmentsFound: 'Aucun ajustement de stock trouvé',
  noSalesOrdersFound: 'Aucune commande de vente trouvée',
  noPurchaseOrdersFound: "Aucune commande d'achat trouvée",

  // Table headers for product details
  dateHeader: 'Date',
  referenceHeader: 'Référence',
  reasonHeader: 'Raison',
  siteHeader: 'Site',
  salesOrderHeader: 'Commande de Vente',
  customerNameHeader: 'Nom du Client',
  orderStatusHeader: 'Statut de la Commande',
  amountHeader: 'Montant',
  purchaseOrderHeader: "Commande d'Achat",
  supplierNameHeader: 'Nom du Fournisseur',

  // Categories
  categories: 'Catégories',
  categoryName: 'Nom',
  categoryTitle: 'Catégories',
  createCategory: 'Créer une Catégorie',
  editCategory: 'Modifier la Catégorie',
  addCategory: 'Ajouter une Catégorie',
  categoryCreated: 'Catégorie créée avec succès',
  categoryUpdated: 'Catégorie mise à jour avec succès',
  categoryDeleted: 'Catégorie supprimée avec succès',
  name: 'Nom',
  categoryDescription: 'Description',

  // Image management
  primary: 'Primaire',
  main: 'Principal',
  confirmDeleteImage: 'Confirmer',
  confirmDeleteImageMessage: 'Êtes-vous sûr de vouloir supprimer',
  imageDeleted: 'Image Supprimée',
  hasBeenDeleted: 'a été supprimée',
  thisActionCannotBeUndone: 'Cette action ne peut pas être annulée',
  cancel: 'Annuler',
  productUpdated: 'Produit mis à jour avec succès',
  productUpdateError: "Une erreur s'est produite lors de la mise à jour du produit",
  addMainImage: "Ajouter l'image principale",
  dragDropOrClick: 'Glisser-déposer ou cliquer pour parcourir',
  addMainImageFirst: "Ajouter d'abord l'image principale",
  setAsMainImage: 'Définir comme image principale',
  useHighQualityImages: 'Utiliser des images de haute qualité (minimum 800x800px)',
  supportedFormats: 'Formats supportés : JPEG, PNG, WebP, GIF',
  maxFileSize: 'Taille de fichier maximale : 5 Mo par image',
  clickImagesToSetPrimary: 'Cliquer sur les images pour les définir comme primaires',
  uploadGuidelines: 'Directives de téléchargement',
  productImages: 'Images du produit',
  editProduct: 'Modifier le produit',

  // Batch operations
  batchAdjustment: 'Ajustement par Lot',
  batchTransfer: 'Transfert par Lot',
  bulkUpdate: 'Mise à Jour en Masse',
  selectAll: 'Sélectionner Tout',
  selectedItems: 'Articles Sélectionnés',

  // Transfer order reasons (additional unique keys not in adjustment reasons)
  damagedItems: 'Articles Endommagés',
  lostItems: 'Articles Perdus',
  other: 'Autre',
  unknown: 'Inconnu',

  // Transfer order statuses
  pending: 'En Attente',
  confirmed: 'Confirmé',
  delivered: 'Livré',
  returned: 'Retourné',
  cancelled: 'Annulé',

  // Form placeholders and labels
  selectAReason: 'Sélectionner une raison',
  transferOrderDate: "Date de l'ordre de transfert",
  editTransferOrder: "Modifier l'Ordre de Transfert",
  addTransferOrder: 'Ajouter un Ordre de Transfert',
  sourceSite: 'Site Source',
  destinationSite: 'Site de Destination',

  // Form placeholders and labels (additional keys)
  selectSourceSite: 'Sélectionner un site source',
  selectDestinationSite: 'Sélectionner un site de destination',
} satisfies typeof import('../en/inventory').default
