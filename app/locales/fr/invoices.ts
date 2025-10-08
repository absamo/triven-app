export default {
  // Titre principal et navigation
  title: 'Factures',
  addInvoice: 'Ajouter une Facture',
  editInvoice: 'Modifier la Facture',
  viewInvoice: 'Voir la Facture',

  // Champs du formulaire de facture
  invoiceReference: 'Référence de Facture',
  invoiceReferenceLabel: 'Référence de Facture',
  invoiceDate: 'Date de Facture',
  dueDate: "Date d'Échéance",
  salesOrder: 'Bon de Commande',
  salesOrderReference: 'Référence du Bon de Commande',
  notes: 'Notes',

  // Statut de facture
  unpaid: 'Impayée',
  paid: 'Payée',
  partiallyPaid: 'Partiellement Payée',
  cancelled: 'Annulée',
  overdue: 'En Retard',
  pending: 'En Attente',
  overpaid: 'Surpayée',

  // En-têtes du tableau de factures
  date: 'Date',
  amountDue: 'Montant Dû',
  amountPaid: 'Montant Payé',
  salesOrderItem: 'Article du Bon de Commande',
  quantity: 'Quantité',
  rate: 'Taux',
  tax: 'Taxe',
  amount: 'Montant',
  total: 'Total',

  // Placeholders et recherche
  search: 'Rechercher des factures par référence ou client...',
  selectSalesOrder: 'Sélectionner un bon de commande',

  // Options de filtrage
  filterByStatus: 'Filtrer par statut',
  filterBySalesOrders: 'Filtrer par bons de commande',
  filterByCreatedDate: 'Filtrer par date de création',

  // Messages
  noInvoicesFound: 'Aucune facture trouvée',
  noSalesOrdersFound: 'Aucun bon de commande trouvé',
  noSalesItemsFound: 'Aucun article de vente trouvé',

  // Actions
  generatePDF: 'Générer PDF',
  viewPurchaseOrder: "Voir le Bon d'Achat",
  viewPaymentsReceived: 'Voir les Paiements Reçus',
  cancelInvoice: 'Annuler la Facture',

  // Messages de validation du formulaire
  invoiceReferenceRequired: 'La référence de facture est requise',
  salesOrderRequired: 'Le bon de commande est requis',
  invoiceDateRequired: 'La date de facture est requise',
  dueDateRequired: "La date d'échéance est requise",

  // Messages de succès/erreur
  invoiceCreated: 'Facture créée avec succès',
  invoiceUpdated: 'Facture mise à jour avec succès',
  invoiceCancelled: 'Facture annulée avec succès',
  invoiceDeleted: 'Facture supprimée avec succès',
  pdfGenerated: 'PDF généré avec succès',

  // Messages de confirmation
  confirmCancelInvoice: 'Êtes-vous sûr de vouloir annuler cette facture?',
  confirmDeleteInvoice: 'Êtes-vous sûr de vouloir supprimer cette facture?',

  // Traductions de statut pour la fonction helper
  status: {
    pending: 'En Attente',
    unpaid: 'Impayée',
    paid: 'Payée',
    partiallyPaid: 'Partiellement Payée',
    cancelled: 'Annulée',
    overdue: 'En Retard',
    overpaid: 'Surpayée',
  },
}
