export default {
  // Basic Workflow Templates
  title: 'Modèles de flux de travail',
  description: "Créer et gérer des modèles de flux d'approbation réutilisables",

  // Messages
  messages: {
    created: 'créé',
    updated: 'mis à jour',
    cloned: 'cloné',
    processed: 'traité',
    templateActionSuccess: 'Modèle {{action}} avec succès !',
    actionFailed: "Impossible de traiter l'action du modèle. Veuillez réessayer.",
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce modèle de flux de travail ?',
    templateDeleted: 'Modèle supprimé avec succès !',
    deleteFailed: 'Impossible de supprimer le modèle. Veuillez réessayer.',
    statusUpdated: 'Statut du modèle mis à jour avec succès !',
    statusUpdateFailed: 'Impossible de mettre à jour le statut du modèle. Veuillez réessayer.',
  },

  // Actions
  actions: {
    createTemplate: 'Créer un modèle',
    addStep: 'Ajouter une étape',
    updateTemplate: 'Mettre à jour le modèle',
  },

  // Modal section
  modal: {
    createTemplate: 'Créer un modèle de flux de travail',
    editTemplate: 'Modifier le modèle de flux de travail',
    cloneTemplate: 'Cloner le modèle de flux de travail',
    workflowTemplate: 'Modèle de flux de travail',
    basicInformation: 'Informations de base',
    workflowSteps: 'Étapes du flux de travail',
    noSteps:
      'Aucune étape de flux de travail définie. Cliquez sur "Ajouter une étape" pour commencer.',
  },

  // Fields
  fields: {
    templateName: 'Nom du modèle',
    description: 'Description',
    entityType: "Type d'entité",
    priority: 'Priorité',
    stepName: "Nom de l'étape",
    stepType: "Type d'étape",
    assigneeType: 'Type de destinataire',
    timeoutDays: "Délai d'attente (jours)",
  },

  // Placeholders
  placeholders: {
    templateName: 'Saisir le nom du modèle...',
    description: 'Saisir la description du modèle...',
    entityType: "Sélectionner le type d'entité...",
    stepName: "Saisir le nom de l'étape...",
  },

  // Validation messages
  validation: {
    nameRequired: 'Le nom du modèle est requis',
    entityTypeRequired: "Le type d'entité est requis",
    stepsRequired: 'Au moins une étape de flux de travail est requise',
    stepNameRequired: 'Toutes les étapes doivent avoir un nom',
    stepAssigneeRequired: 'Toutes les étapes doivent avoir un destinataire',
  },

  // Step section
  step: {
    stepNumber: 'Étape {{number}}',
  },

  // Priorities (additional case variations)
  priorities: {
    Low: 'Faible',
    low: 'Faible',
    Medium: 'Moyen',
    medium: 'Moyen',
    High: 'Élevé',
    high: 'Élevé',
    Critical: 'Critique',
    critical: 'Critique',
    Urgent: 'Urgent',
    urgent: 'Urgent',
  },

  // Summary section
  summary: {
    totalTemplates: 'Total des modèles',
    activeTemplates: 'Modèles actifs',
    inactiveTemplates: 'Modèles inactifs',
    totalUsage: 'Utilisation totale',
  },

  // Filter section
  filters: {
    title: 'Filtrer les modèles',
    clearFilters: 'Effacer les filtres',
    searchTemplates: 'Rechercher des modèles...',
  },

  // Workflow Statuses
  workflowStatuses: {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    failed: 'Échoué',
    timeout: "Délai d'attente dépassé",
    escalated: 'Escaladé',
  },

  // Workflow Step Types
  stepTypes: {
    pending: 'En attente',
    assigned: 'Assigné',
    in_progress: 'En cours',
    completed: 'Terminé',
    skipped: 'Ignoré',
    failed: 'Échoué',
    timeout: "Délai d'attente dépassé",
    escalated: 'Escaladé',
    approval: 'Approbation',
    review: 'Révision',
    notification: 'Notification',
    data_validation: 'Validation des données',
    automatic_action: 'Action automatique',
    conditional_logic: 'Logique conditionnelle',
    parallel_approval: 'Approbation parallèle',
    sequential_approval: 'Approbation séquentielle',
    escalation: 'Escalade',
    integration: 'Intégration',
    custom: 'Personnalisé',
  },

  // Workflow Trigger Types
  triggerTypes: {
    manual: 'Manuel',
    purchase_order_create: "Commande d'achat créée",
    purchase_order_threshold: "Seuil commande d'achat",
    sales_order_create: 'Commande de vente créée',
    sales_order_threshold: 'Seuil commande de vente',
    stock_adjustment_create: 'Ajustement de stock créé',
    transfer_order_create: 'Ordre de transfert créé',
    invoice_create: 'Facture créée',
    bill_create: 'Facture fournisseur créée',
    customer_create: 'Client créé',
    supplier_create: 'Fournisseur créé',
    product_create: 'Produit créé',
    low_stock_alert: 'Alerte stock bas',
    high_value_transaction: 'Transaction de valeur élevée',
    bulk_operation: 'Opération en lot',
    scheduled: 'Programmé',
    custom_condition: 'Condition personnalisée',
  },

  // Entity Types
  entityTypes: {
    purchase_order: "Commande d'achat",
    sales_order: 'Commande de vente',
    stock_adjustment: 'Ajustement de stock',
    transfer_order: 'Ordre de transfert',
    invoice: 'Facture',
    bill: 'Facture fournisseur',
    customer: 'Client',
    supplier: 'Fournisseur',
    product: 'Produit',
    payment_made: 'Paiement effectué',
    payment_received: 'Paiement reçu',
    backorder: 'Commande en attente',
    budget_change: 'Changement de budget',
    price_change: 'Changement de prix',
    discount_approval: 'Approbation de remise',
    refund_request: 'Demande de remboursement',
    return_authorization: 'Autorisation de retour',
    custom: 'Personnalisé',
  },

  // Approval Assignee Types
  assigneeTypes: {
    user: 'Utilisateur',
    role: 'Rôle',
    creator: 'Créateur',
    manager: 'Gestionnaire',
    department_head: 'Chef de département',
    custom_logic: 'Logique personnalisée',
  },

  // Request Types
  requestTypes: {
    create: 'Créer',
    update: 'Modifier',
    delete: 'Supprimer',
    approve: 'Approuver',
    reject: 'Rejeter',
    threshold_breach: 'Dépassement de seuil',
    exception_handling: "Gestion d'exception",
    custom: 'Personnalisé',
  },

  // Approval Statuses
  approvalStatuses: {
    pending: 'En attente',
    in_review: 'En révision',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    escalated: 'Escaladé',
    expired: 'Expiré',
    cancelled: 'Annulé',
    more_info_required: "Plus d'informations requises",
  },

  // Decisions
  decisions: {
    approved: 'Approuvé',
    rejected: 'Rejeté',
    escalated: 'Escaladé',
    delegated: 'Délégué',
    more_info_required: "Plus d'informations requises",
    conditional_approval: 'Approbation conditionnelle',
  },
}
