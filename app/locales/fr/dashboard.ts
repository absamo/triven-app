export default {
  title: 'Tableau de Bord',
  welcome: 'Ravi de vous revoir,',
  overview: 'Obtenez des informations en temps réel sur les performances de votre entreprise',
  analyticsOverview: 'Tableau de Bord',
  realtimeInsights: 'Informations en temps réel et métriques de performance',
  lastUpdated: 'Dernière mise à jour',
  recentActivity: 'Activité Récente',
  quickActions: 'Actions Rapides',
  agency: 'Agence',
  selectAgency: 'Sélectionner une agence',
  allAgencies: 'Toutes les agences',
  selectDateRange: 'Sélectionner une plage de dates',
  clearAllFilters: 'Effacer tous les filtres',
  last7Days: '7 derniers jours',
  last30Days: '30 derniers jours',
  last90Days: '90 derniers jours',

  // Stats components
  financialOverview: 'Aperçu Financier',
  pendingInvoices: 'Factures en Attente',
  pendingBills: 'Factures à Payer',
  ordersOverview: 'Aperçu des Commandes',
  pendingSalesOrders: 'Commandes de Vente en Attente',
  pendingPurchaseOrders: 'Bons de Commande en Attente',
  totalInventory: 'Inventaire Total',
  inventoryValue: "Valeur de l'Inventaire",
  totalInventoryTooltip: 'Nombre total de produits actuellement en stock',
  inventoryValueTooltip: 'Valeur totale de tous les articles en stock basée sur le prix de vente',
  inventoryOverview: "Aperçu de l'Inventaire",
  inventoryOverviewTooltip: "Aperçu combiné du total des articles d'inventaire et de leur valeur",
  totalItems: 'Total des Articles',
  totalValue: 'Valeur Totale',
  inventoryAccuracy: "Précision de l'Inventaire",
  inventoryAccuracyTooltip:
    "Mesure à quel point votre stock physique correspond à vos enregistrements système. Calculé en comparant le Stock Physique en Main vs le Stock Comptable en Main pour chaque produit. Des pourcentages plus élevés indiquent un meilleur contrôle de l'inventaire.",
  accurate: 'précis',
  reorderPointAlerts: 'Alertes Point de Réapprovisionnement',
  reorderPointAlertsTooltip:
    "Affiche le nombre de produits qui sont à ou en dessous de leur seuil de point de réapprovisionnement. Ces produits peuvent avoir besoin d'être réapprovisionnés bientôt pour éviter les ruptures de stock.",
  deadStockValue: 'Valeur du Stock Mort',
  deadStockValueTooltip:
    "Affiche la valeur totale des produits qui n'ont eu aucune vente, achat ou ajustement au cours des 90 derniers jours. Ces articles peuvent être candidats à la liquidation ou à la tarification promotionnelle.",
  currentStockLevels: 'Niveaux de Stock Actuels',
  physicalStock: 'Stock Physique',
  accountingStock: 'Stock Comptable',
  increase: 'augmentation',
  decrease: 'diminution',
  comparedToLastMonth: 'par rapport au mois dernier',
  calculationDetails: 'Détails du Calcul :',
  totalProducts: 'Total des Produits :',
  accurateItems: 'Articles Précis :',
  inaccurateItems: 'Articles Imprécis :',
  accuracyPercentage: 'Pourcentage de Précision :',
  actionRequired: 'Action Requise',
  allGood: 'Tout Va Bien',
  details: 'Détails :',
  deadStockItems: 'Articles de Stock Mort :',
  noSalesAdjustmentsLast90Days: 'Aucune vente, achat ou ajustement dans les 90 derniers jours',
  items: 'articles',
  wherePhysicalEqualsAccounting: 'où le stock physique égale exactement le stock comptable',
  whereTheresDifference: 'où il y a une différence',
  products: 'produits',

  // Trending and insights
  trendingProducts: 'Produits Tendances (30 Derniers Jours)',
  noTrendingProducts: 'Aucun produit tendance disponible',
  product: 'Produit',
  unitsSold: 'Unités Vendues',
  currentStock: 'Stock Actuel',
  revenue: 'Revenus',
  salesTrends: 'Tendances des Ventes',
  monthlySalesData:
    'Données de ventes mensuelles montrant les tendances du nombre de commandes et des revenus',
  noSalesData: 'Aucune donnée de vente disponible pour la période sélectionnée',
  orders: 'Commandes',

  // Customer insights
  customerInsights: 'Insights Clients',
  customerAcquisitionMetrics: "Métriques d'acquisition et d'engagement des clients",
  newCustomers30Days: 'Nouveaux Clients (30 jours)',
  activeCustomers: 'Clients Actifs',
  customerTypes: 'Types de Clients',
  engagementLevels: "Niveaux d'Engagement",
  customers: 'Clients',
  activity: 'Activité',
  noCustomerData: "Aucune donnée client disponible pour l'agence sélectionnée",

  // Finance Stats
  totalReceivables: 'Total des Créances',
  paymentsReceived: 'Paiements Reçus',
  paymentsMade: 'Paiements Effectués',
  netCashflow: 'Flux de Trésorerie Net',
  cashFlowRatio: 'Ratio de Flux de Trésorerie',
  incoming: 'entrants',

  // Order Stats
  salesTotal: 'Revenus des Ventes',
  purchaseTotal: "Coûts d'Achat",

  // Stock Status Stats
  stockStatusOverview: 'Aperçu du statut des stocks',
  currentInventoryStatus: "Statut actuel de l'inventaire",
  noStockDataAvailable: 'Aucune donnée de stock disponible',
  inStock: 'En stock',
  lowStock: 'Stock faible',
  critical: 'Critique',
  outOfStock: 'Rupture de stock',

  // Inventory Command Center
  inventoryCommandCenter: 'Centre de Commande Inventaire',
  healthScore: 'Score de Santé',
  capitalTiedUp: 'Capital Immobilisé',
  revenueAtRisk: 'Revenus à Risque',
  turnoverRate: 'Taux de Rotation',
  criticalActions: 'Actions Critiques',
  revenueOpportunities: 'Opportunités de Revenus',
  healthScoreBreakdown: 'Répartition du Score de Santé',
  noCriticalAlerts: 'Aucune alerte critique',
  noOpportunitiesDetected: 'Aucune opportunité détectée',
  confidence: 'confiance',

  // Health Score Tooltips
  healthScoreTooltip: "Note de 0 à 100 mesurant la santé de l'inventaire",
  capitalTiedUpTooltip:
    "Valeur totale de l'inventaire sur vos étagères. Plus c'est bas, mieux c'est - cela signifie que vous ne surinvestissez pas dans le stock.",
  revenueAtRiskTooltip:
    'Ventes potentielles perdues dues aux articles en rupture de stock. Montre les revenus que vous pourriez gagner si vous aviez ces produits disponibles.',
  turnoverRateTooltip:
    "Nombre de fois par an que vous vendez votre inventaire. Plus c'est élevé, mieux c'est - cela signifie que l'inventaire se déplace rapidement et génère de la trésorerie.",

  // Health Score Breakdown
  stockLevelAdequacy: 'Niveau de Stock',
  agingInventory: 'Fraîcheur',
  backorderRate: 'Exécution',
  supplierReliability: 'Fiabilité Fournisseur',

  // Health Score Breakdown Tooltip
  healthScoreBreakdownTooltip: 'Cinq facteurs contribuant à votre Score de Santé',
  stockLevelDescription: 'Dans quelle mesure vous êtes bien approvisionné par rapport à la demande',
  turnoverRateDescription: "À quelle vitesse l'inventaire se vend",
  freshnessDescription: "Âge de l'inventaire (plus récent est mieux)",
  fulfillmentDescription: 'Capacité à exécuter les commandes sans délais',
  supplierReliabilityDescription: 'Performance de livraison à temps',
} satisfies typeof import('../en/dashboard').default
