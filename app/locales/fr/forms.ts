export default {
  // Common form labels
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'E-mail',
  companyName: "Nom de l'entreprise",
  password: 'Mot de passe',
  paymentTerms: 'Conditions de paiement',
  expectedShipmentDate: "Date d'expédition prévue",

  // Form placeholders
  firstNamePlaceholder: 'Entrez votre prénom',
  lastNamePlaceholder: 'Entrez votre nom',
  selectCustomer: 'Sélectionner un client',

  // Form validation
  firstNameRequired: 'Le prénom est requis',
  lastNameRequired: 'Le nom est requis',

  // Customer forms
  editCustomer: 'Modifier un client',
  addCustomer: 'Ajouter un nouveau client',

  // Supplier forms
  editSupplier: 'Modifier un fournisseur',
  addSupplier: 'Ajouter un fournisseur',

  // Site forms
  editSite: 'Modifier un site',
  addSite: 'Ajouter un site',
  siteType: 'Type de site',
  selectSiteType: 'Sélectionner un type de site',
  warehouse: 'Entrepôt',
  store: 'Magasin',

  // Agency and Site selection
  agency: 'Agence',
  site: 'Site',
  selectAgency: 'Sélectionner une agence',
  selectSite: 'Sélectionner un site',

  // Payment forms
  editPayment: 'Modifier un paiement',
  addPayment: 'Ajouter un paiement',
  paymentReference: 'Référence de paiement',
  paymentDate: 'Date de paiement',
  paymentMethod: 'Méthode de paiement',
  selectPaymentMethod: 'Sélectionner une méthode de paiement',
  amountReceived: 'Montant reçu',
  selectInvoice: 'Sélectionner une facture',
  notes: 'Notes',

  // Payment methods
  bankTransfer: 'Virement Bancaire',
  cash: 'Espèces',
  creditCard: 'Carte de Crédit',
  debitCard: 'Carte de Débit',
  cheque: 'Chèque',
} satisfies typeof import('../en/forms').default
