export default {
  // Titre principal et navigation
  title: 'Paiements Reçus',
  addPaymentReceived: 'Ajouter un Paiement Reçu',
  editPaymentReceived: 'Modifier le Paiement Reçu',
  viewPaymentReceived: 'Voir le Paiement Reçu',

  // Champs du formulaire de paiement
  paymentReference: 'Référence de Paiement',
  paymentDate: 'Date de Paiement',
  paymentMethod: 'Méthode de Paiement',
  customer: 'Client',
  invoice: 'Facture',
  invoiceReference: 'Référence de Facture',
  amountReceived: 'Montant Reçu',
  amountDue: 'Montant Dû',
  amountPaid: 'Montant Payé',
  balanceDue: 'Solde Dû',
  notes: 'Notes',

  // Statuts de paiement
  status: 'Statut',
  unpaid: 'Impayé',
  paid: 'Payé',
  partiallyPaid: 'Partiellement Payé',
  cancelled: 'Annulé',
  overdue: 'En Retard',
  overpaid: 'Surpayé',

  // Méthodes de paiement
  bankTransfer: 'Virement Bancaire',
  cash: 'Espèces',
  creditCard: 'Carte de Crédit',
  debitCard: 'Carte de Débit',
  cheque: 'Chèque',

  // Placeholders et recherche
  search: 'Rechercher des paiements par référence ou client...',
  selectCustomer: 'Sélectionner un client',
  selectInvoice: 'Sélectionner une facture',
  selectPaymentMethod: 'Sélectionner une méthode de paiement',

  // Options de filtrage
  filterByStatus: 'Filtrer par statut',
  filterByInvoices: 'Filtrer par factures',
  filterByDate: 'Filtrer par date de paiement',
  filterByCustomer: 'Filtrer par client',

  // Messages
  noPaymentsFound: 'Aucun paiement trouvé',
  noInvoicesFound: 'Aucune facture trouvée',
  noCustomersFound: 'Aucun client trouvé',

  // Actions
  generatePDF: 'Générer PDF',
  viewInvoice: 'Voir la Facture',
  cancelPaymentReceived: 'Annuler le Paiement Reçu',

  // Messages de validation du formulaire
  paymentReferenceRequired: 'La référence de paiement est requise',
  paymentDateRequired: 'La date de paiement est requise',
  customerRequired: 'Le client est requis',
  invoiceRequired: 'La facture est requise',
  amountReceivedRequired: 'Le montant reçu est requis',
  paymentMethodRequired: 'La méthode de paiement est requise',
  invalidAmount: 'Veuillez entrer un montant valide',
  amountExceedsBalance: 'Le montant reçu ne peut pas dépasser le solde dû',

  // Messages de succès/erreur
  paymentCreated: 'Paiement reçu créé avec succès',
  paymentUpdated: 'Paiement reçu mis à jour avec succès',
  paymentCancelled: 'Paiement reçu annulé avec succès',
  paymentDeleted: 'Paiement reçu supprimé avec succès',
  pdfGenerated: 'PDF généré avec succès',

  // Messages de confirmation
  confirmCancelPayment: 'Êtes-vous sûr de vouloir annuler ce paiement reçu?',
  confirmDeletePayment: 'Êtes-vous sûr de vouloir supprimer ce paiement reçu?',

  // Champs supplémentaires
  transactionId: 'ID de Transaction',
  bankDetails: 'Détails Bancaires',
  chequeNumber: 'Numéro de Chèque',
  cardLastFour: 'Quatre Derniers Chiffres de la Carte',
}
