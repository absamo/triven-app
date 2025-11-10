export default {
  // Page title and headers
  title: "Demandes d'Approbation",
  subtitle: "Gérez les demandes d'approbation en attente",

  // Status labels
  statuses: {
    pending: 'En Attente',
    in_review: 'En Révision',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    escalated: 'Escaladé',
    expired: 'Expiré',
  },

  // Priority labels
  priorities: {
    critical: 'Critique',
    urgent: 'Urgent',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  },

  // Entity types
  entityTypes: {
    purchase_order: "Commande d'Achat",
    sales_order: 'Commande de Vente',
    stock_adjustment: 'Ajustement Stock',
    transfer_order: 'Ordre de Transfert',
    customer: 'Client',
    supplier: 'Fournisseur',
    product: 'Produit',
  },

  // Summary cards
  summary: {
    pending: 'En Attente',
    inReview: 'En Révision',
    total: 'Total',
    pendingRequests: 'Demandes en attente',
    inReviewRequests: 'Demandes en révision',
    approvedRequests: 'Demandes approuvées',
    rejectedRequests: 'Demandes rejetées',
  },

  // Step progress
  stepProgress: 'Étape {{current}} de {{total}}',

  // Filters
  filters: {
    title: 'Filtrer les Demandes',
    filterByStatus: 'Filtrer par statut',
    filterByType: 'Filtrer par type',
    filterByPriority: 'Filtrer par priorité',
    clearFilters: 'Tout Effacer',
  },

  // Request details
  request: {
    requestedDate: 'Date de demande',
    requestedBy: 'Demandé par',
    assignedTo: 'Assigné à',
    expiresOn: 'Expire le',
    unassigned: 'Non assigné',
    expiresIn: 'Expire dans',
    day: 'jour',
    days: 'jours',
    expired: 'Demande expirée',
    comments: 'commentaire',
    commentsPlural: 'commentaires',
  },

  // Actions
  actions: {
    approve: 'Approuver',
    reject: 'Rejeter',
    review: 'Réviser',
    viewDetails: 'Voir les détails',
    addComment: 'Ajouter Commentaire',
    refresh: 'Actualiser',
    reopenRequest: 'Rouvrir la Demande',
  },

  // Request details modal
  modal: {
    requestDetails: 'Détails de la Demande',
    details: 'Détails',
    comments: 'Commentaires',
    action: 'Action',

    // Action titles
    approveRequest: 'Approuver la Demande',
    rejectRequest: 'Rejeter la Demande',
    reviewRequest: 'Réviser la Demande',
    reopenRequest: 'Rouvrir la Demande',
    approvalRequest: "Demande d'Approbation",

    // Section headers
    requestInformation: 'Informations de la Demande',
    requestDetailsSection: 'Détails de la Demande',
    items: 'Articles',
    products: 'Produits',
    approvalReason: "Raison de l'Approbation (Facultatif)",
    rejectionReason: 'Raison du Rejet',
    reasonForReopening: 'Raison de la Réouverture',

    // Fields
    requestedBy: 'Demandé par',
    requested: 'Demandé le',
    expires: 'Expire le',
    amount: 'Montant',
    supplier: 'Fournisseur',
    company: 'Entreprise',
    from: 'De',
    to: 'Vers',
    quantity: 'Qté',
    price: 'Prix',
    adjustment: 'Ajustement',
    reason: 'Raison',

    // Item counts
    itemsCount: '{{count}} articles',
    productsCount: '{{count}} produits',
    moreItems: '... et {{count}} articles de plus',
    moreProducts: '... et {{count}} produits de plus',

    // Comments section
    noComments: 'Aucun commentaire pour le moment',
    internal: 'Interne',

    // Form labels
    rejectionReasonRequired: 'Raison du Rejet *',
    reasonForReopeningRequired: 'Raison de la Réouverture *',
    decisionReason: 'Raison de la Décision',
    additionalNotes: 'Notes Additionnelles',
    comment: 'Commentaire',
    reviewCommentRequired: 'Commentaire de Révision *',
    commentVisibility: 'Visibilité du Commentaire',

    // Form placeholders
    approvalReasonPlaceholder: 'Veuillez expliquer pourquoi vous approuvez cette demande...',
    rejectionReasonPlaceholder: 'Veuillez expliquer pourquoi vous rejetez cette demande...',
    reopeningReasonPlaceholder: 'Veuillez expliquer pourquoi cette demande doit être rouverte...',
    decisionReasonPlaceholder: 'Optionnel : Expliquez votre décision...',
    additionalNotesPlaceholder: 'Ajoutez des commentaires ou instructions supplémentaires...',
    commentPlaceholder: 'Ajoutez votre commentaire...',
    reviewCommentPlaceholder: 'Ajoutez vos commentaires de révision...',

    // Visibility options
    publicComment: 'Public - Visible par toutes les parties',
    internalComment: "Interne - Visible uniquement par les membres de l'équipe",

    // Alerts
    approveAlert:
      "Vous êtes sur le point d'approuver cette demande. Cette action ne peut pas être annulée.",
    rejectAlert:
      'Vous êtes sur le point de rejeter cette demande. Veuillez fournir une raison claire pour le rejet.',
    reviewAlert:
      'Ajoutez vos commentaires de révision. Cela marquera la demande comme "En Révision" et notifiera les parties concernées.',
    reopenAlert:
      'Vous êtes sur le point de rouvrir cette demande pour révision supplémentaire. Veuillez fournir une raison pour la réouverture.',

    // Buttons
    cancel: 'Annuler',
    approveRequestButton: 'Approuver la Demande',
    rejectRequestButton: 'Rejeter la Demande',
    addReviewComment: 'Ajouter Commentaire de Révision',
    reopenRequestButton: 'Rouvrir la Demande',

    // Validation messages
    rejectionReasonRequiredError: 'La raison du rejet est requise',
    reopeningReasonRequiredError: 'La raison de la réouverture est requise',
    commentRequiredError: 'Un commentaire est requis lors de la révision',

    // Priority and status
    priority: 'Priorité',
    status: 'Statut',
  },

  // Messages and notifications
  messages: {
    noRequests: "Aucune demande d'approbation trouvée",
    noRequestsDescription: "Il n'y a aucune demande d'approbation à afficher pour le moment.",
    noMatchingRequests:
      "Aucune demande ne correspond aux filtres actuels. Essayez d'ajuster vos critères de recherche.",
    noPermission: "Vous n'avez pas la permission d'agir sur cette demande d'approbation.",
    actionFailed: "Échec du traitement de l'action d'approbation. Veuillez réessayer.",
    genericError: "Une erreur s'est produite lors du traitement de votre demande.",
    requestActionSuccess: 'Demande {{action}} avec succès !',
    commentedOn: 'commentée',
    approved: 'approuvée',
    rejected: 'rejetée',
    reopened: 'rouverte',
    processed: 'traitée',
    requestApproved: 'Demande Approuvée',
    requestApprovedMessage: "La demande d'approbation a été approuvée avec succès.",
    requestRejected: 'Demande Rejetée',
    requestRejectedMessage: "La demande d'approbation a été rejetée.",
    commentAdded: 'Commentaire Ajouté',
    commentAddedMessage: 'Votre commentaire a été ajouté avec succès.',
    brokenScreen: 'Écran cassé',
    batteryDefect: 'Défaut batterie',
  },

  // Additional fields
  entityDetails: 'Détails {{entityType}}',
  itemsCount: '{{count}} produits',
  productsCount: '{{count}} articles',

  // Comment visibility
  commentVisibility: {
    public: 'Public',
    internal: 'Interne',
  },

  // Comments section
  comments: {
    title: 'Commentaires',
    subtitle: "Discussion et notes sur cette demande d'approbation",
    noComments: 'Aucun commentaire pour le moment',
    noCommentsDescription: 'Soyez le premier à ajouter un commentaire à cette demande',
    addComment: 'Ajouter un Commentaire',
    internal: 'Interne',
    public: 'Public',
    visibility: 'Visibilité',
    placeholder: 'Ajoutez votre commentaire...',
    submit: 'Publier le Commentaire',
    shortcuts: {
      label: 'Raccourcis clavier',
      submit: 'Soumettre le commentaire',
    },
    commentAdded: 'Commentaire Ajouté',
    commentAddedSuccess: 'Votre commentaire a été ajouté avec succès',
    commentError: "Échec de l'ajout du commentaire. Veuillez réessayer.",
  },

  // Reassignment section
  reassign: {
    title: "Réassigner l'Approbation",
    subtitle: "Transférer cette demande d'approbation à un autre utilisateur ou rôle",
    currentAssignee: 'Assigné Actuellement',
    reassignTo: 'Réassigner À',
    selectType: 'Sélectionner le type de réassignation',
    assignToUser: 'Assigner à un Utilisateur',
    assignToRole: 'Assigner à un Rôle',
    selectUser: 'Sélectionner un utilisateur',
    selectUserPlaceholder: 'Rechercher un utilisateur...',
    selectRole: 'Sélectionner un rôle',
    selectRolePlaceholder: 'Rechercher un rôle...',
    reason: 'Raison de la Réassignation',
    reasonPlaceholder: 'Expliquez pourquoi vous réassignez cette demande...',
    reasonRequired: 'La raison est requise',
    cancel: 'Annuler',
    submit: 'Réassigner la Demande',
    success: 'Demande Réassignée',
    successMessage: "La demande d'approbation a été réassignée avec succès",
    error: 'Échec de la Réassignation',
    errorMessage: 'Échec de la réassignation de la demande. Veuillez réessayer.',
  },

  // History section
  history: {
    title: "Historique d'Approbation",
    subtitle: 'Chronologie de toutes les actions et modifications',
    events: {
      created: 'Demande créée',
      commented: 'Commentaire ajouté',
      reassigned: 'Réassignée',
      reviewed: 'En révision',
      approved: 'Approuvée',
      rejected: 'Rejetée',
      expired: 'Expirée',
    },
    reassignedFrom: 'Réassignée de {{from}} à {{to}}',
    commentVisibility: {
      internal: 'Commentaire interne',
      public: 'Commentaire public',
    },
    timestamps: {
      justNow: "À l'instant",
      minutesAgo: 'Il y a {{count}} minute',
      minutesAgo_other: 'Il y a {{count}} minutes',
      hoursAgo: 'Il y a {{count}} heure',
      hoursAgo_other: 'Il y a {{count}} heures',
      daysAgo: 'Il y a {{count}} jour',
      daysAgo_other: 'Il y a {{count}} jours',
    },
  },

  // Metrics section
  metrics: {
    title: "Métriques d'Approbation",
    subtitle: 'Tableau de bord des performances et statistiques',
    cards: {
      pending: 'Demandes en Attente',
      pendingDescription: 'En attente de révision',
      approved: 'Demandes Approuvées',
      approvedDescription: 'Approuvées avec succès',
      avgResolution: 'Temps Moyen de Résolution',
      avgResolutionDescription: 'Temps pour compléter',
      completionRate: 'Taux de Complétion',
      completionRateDescription: 'Approuvées ou rejetées',
    },
    byPriority: {
      title: 'Répartition par Priorité',
      critical: 'Critique',
      urgent: 'Urgent',
      high: 'Élevée',
      medium: 'Moyenne',
      low: 'Faible',
    },
    statusDistribution: {
      title: 'Distribution des Statuts',
      pending: 'En Attente',
      inReview: 'En Révision',
      approved: 'Approuvée',
      rejected: 'Rejetée',
      escalated: 'Escaladée',
      expired: 'Expirée',
    },
    last30Days: {
      title: 'Tendances des 30 Derniers Jours',
      total: 'Total des Demandes',
      approved: 'Approuvées',
      rejected: 'Rejetées',
      pending: 'Encore en Attente',
    },
    timeUnits: {
      minutes: 'minutes',
      hours: 'heures',
      days: 'jours',
      notAvailable: 'N/D',
    },
    noData: 'Aucune donnée disponible',
    loading: 'Chargement des métriques...',
    error: 'Échec du chargement des métriques',
  },

  // Demo data - example requests
  demo: {
    purchaseOrderTitle: "Approbation Commande d'Achat PO-00001 - 8 500€",
    purchaseOrderDescription:
      "Commande d'achat dépassant le seuil d'approbation automatique (5 000€)",
    stockAdjustmentTitle: 'Ajustement de Stock ADJ-000001',
    stockAdjustmentDescription: 'Ajustement de stock pour articles endommagés',
    customerTitle: 'Nouveau Client - Entreprise Durand & Fils',
    customerDescription: "Demande de création d'un nouveau compte client",
    transferOrderTitle: 'Transfert TO-000001 - Lyon vers Marseille',
    transferOrderDescription: 'Transfert de stock entre entrepôt Lyon et magasin Marseille',

    // Sample comments
    managerReviewComment:
      'Je révise cette commande. Le montant est élevé mais justifié par nos besoins actuels en équipement.',
    salesRecommendationComment:
      'Client recommandé par un partenaire de confiance. Historique de paiement excellent.',
    managerApprovalComment: 'Merci pour ces informations. Je valide la création du compte client.',
  },
} satisfies typeof import('../en/approvals').default
