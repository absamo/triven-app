export default {
  // Payment modal
  payment: 'Paiement',
  upgradeTo: 'Passer à {{planName}}',
  upgradeToTitle: 'Passer au plan {{planName}}',
  subscribeTo: "S'abonner au plan {{planName}}",
  setupPayment: 'Configuration du paiement...',
  loadingPaymentForm: 'Chargement du formulaire de paiement...',

  // Formulaire de paiement
  processing: 'Traitement...',
  pay: 'Payer',
  paymentInformation: 'Informations de paiement',
  securePayment: 'Vos informations de paiement sont sécurisées et chiffrées par Stripe',

  // États de paiement
  paymentFailed: 'Paiement échoué',
  paymentSuccessful: 'Paiement réussi !',
  welcomeMessage: 'Bienvenue au plan {{planName}} ! Votre compte a été mis à niveau.',
  paymentError: "Une erreur s'est produite avec votre paiement",

  // Informations d'abonnement
  cancelAnytime:
    'Vous pouvez annuler votre abonnement à tout moment depuis les paramètres de votre compte',
  proratedDifference:
    'Vous serez facturé de la différence au prorata pour le reste de votre cycle de facturation.',
  trialEndsBilling: 'Votre essai se terminera et la facturation commencera immédiatement.',

  // Modale d'essai spécifique
  trialPeriodExpired: "Période d'essai expirée",
  trialExpiring: 'Votre essai expire bientôt',
  trialExpired: 'Votre essai a expiré',
  cannotAccessTriven: 'Vous ne pouvez pas accéder à Triven, veuillez mettre à niveau',
  trialEndedMessage:
    "Votre essai gratuit est terminé. Mettez à niveau pour continuer à profiter de toutes les fonctionnalités puissantes de gestion d'inventaire qui rendent votre entreprise plus efficace.",
  choosePlan: 'Choisissez un plan pour continuer à utiliser Triven',
  continueWithPlan: 'Continuer avec le plan {{planName}}',
  flexiblePricing:
    'Choisissez parmi des plans tarifaires flexibles qui correspondent aux besoins de votre entreprise',

  // Gestion des erreurs
  setupFailed: 'Configuration échouée',
  unableToSetupPayment: 'Impossible de configurer le paiement. Veuillez réessayer.',
  authenticationRequired: 'Authentification requise. Veuillez actualiser la page et réessayer.',
  invalidPaymentConfig: 'Configuration de paiement invalide. Veuillez contacter le support.',
  userSessionExpired: 'Session utilisateur expirée. Veuillez actualiser la page et réessayer.',

  // Billing
  monthly: 'Mensuel',
  yearly: 'Annuel',
  billed: 'facturé',
  perMonth: 'par mois',
  perYear: 'par an',

  // Subscription cancellation
  cancelSubscription: "Annuler l'abonnement",
  confirmCancellation: "Confirmer l'annulation",
  cancellationWarning: 'Êtes-vous sûr de vouloir annuler votre abonnement ?',
  cancelAtPeriodEnd: 'Annuler à la fin de la période',
  cancelImmediately: 'Annuler immédiatement',
  cancelAtPeriodEndDescription:
    "Votre abonnement restera actif jusqu'au {{date}}, puis sera annulé",
  cancelImmediatelyDescription:
    "Votre abonnement sera annulé immédiatement et vous perdrez l'accès maintenant",
  cancellationReason: "Raison de l'annulation (optionnel)",
  subscriptionCancelled: 'Abonnement annulé',
  subscriptionCancelledSuccessfully: 'Votre abonnement a été annulé avec succès',
  subscriptionScheduledForCancellation:
    'Votre abonnement est programmé pour être annulé à la fin de votre période de facturation',
  keepSubscription: "Conserver l'abonnement",
  proceedWithCancellation: "Procéder à l'annulation",
  subscriptionEnding: "Fin d'abonnement",
  accessUntil: "Vous aurez accès jusqu'au",

  // Payment method editing
  updatePaymentMethod: 'Mettre à jour le mode de paiement',
  editPaymentMethod: 'Modifier le mode de paiement',
  paymentMethodUpdated: 'Mode de paiement mis à jour',
  updatePaymentMethodInfo: 'Mettre à jour le mode de paiement',
  updatePaymentMethodDescription:
    'Ajoutez un nouveau mode de paiement pour votre abonnement. Votre mode de paiement actuel sera remplacé.',
  enterNewPaymentMethod: 'Entrez votre nouveau mode de paiement',
  paymentCard: 'Carte de paiement',

  // Settings page translations
  subscriptions: 'Abonnements',
  manageSubscriptions: 'Gérez votre abonnement et vos paramètres de facturation',
  yourCurrentPlan: 'Votre plan actuel',
  plan: 'plan',
  billedEveryMonth: 'facturé chaque mois',
  noActiveBilling: 'Aucune facturation active',
  status: 'Statut',
  noActiveSubscription: 'Aucun abonnement actif',
  renews: 'Renouvelle',
  trialEndsOn: "L'essai se termine le",
  nextInvoiceDue: 'Prochaine facture due le',
  noRenewalDate: 'Aucune date de renouvellement disponible',
  expires: 'Expire',
  upgrade: 'Mettre à niveau',
  subscribe: "S'abonner",
  viewPlans: 'Voir les plans',
  currency: 'Devises',
  manageCurrencies: 'Gérez vos devises',

  // Subscription status translations
  subscriptionStatus: {
    active: 'Actif',
    canceled: 'Annulé',
    incomplete: 'Incomplet',
    incomplete_expired: 'Incomplet Expiré',
    past_due: 'Échu',
    paused: 'En Pause',
    trialing: 'Essai',
    unpaid: 'Impayé',
  },
}
