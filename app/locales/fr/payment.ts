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
  paymentSuccessful: 'Paiement réussi !',
  welcomeMessage: 'Bienvenue au plan {{planName}} ! Votre compte a été mis à niveau.',
  paymentError: "Une erreur s'est produite avec votre paiement",

  // Subscription info
  price: 'Prix',
  cancelAnytime:
    'Vous pouvez annuler votre abonnement à tout moment depuis les paramètres de votre compte',
  proratedDifference:
    'Vous serez facturé de la différence au prorata pour le reste de votre cycle de facturation.',
  trialEndsBilling:
    "Votre période d'essai se terminera et la facturation commencera immédiatement.",

  // Modale d'essai spécifique
  trialPeriodExpired: "Période d'essai expirée",
  trialExpiring: 'Votre essai expire bientôt',
  trialExpired: 'Votre essai a expiré',
  trialEndedMessage:
    "Votre essai gratuit est terminé. Mettez à niveau pour continuer à profiter de toutes les fonctionnalités puissantes de gestion d'inventaire qui rendent votre entreprise plus efficace.",
  continueWithPlan: 'Continuer avec le plan {{planName}}',
  flexiblePricing:
    'Choisissez parmi des plans tarifaires flexibles qui correspondent aux besoins de votre entreprise',

  // Gestion des erreurs
  setupFailed: 'Configuration échouée',
  unableToSetupPayment: 'Impossible de configurer le paiement. Veuillez réessayer.',
  authenticationRequired: 'Authentification requise. Veuillez actualiser la page et réessayer.',
  invalidPaymentConfig: 'Configuration de paiement invalide. Veuillez contacter le support.',
  userSessionExpired: 'Session utilisateur expirée. Veuillez actualiser la page et réessayer.',

  // Subscription status messages
  subscriptionCancelled: 'Abonnement Annulé',
  subscriptionIncomplete: 'Abonnement Incomplet',
  subscriptionExpired: 'Abonnement Expiré',
  subscriptionUnpaid: 'Abonnement Impayé',
  subscriptionPaused: 'Abonnement En Pause',
  noActiveSubscription: 'Aucun Abonnement Actif',
  paymentPastDue: 'Paiement En Retard',
  cannotAccessTriven: 'Vous ne pouvez pas accéder à Triven pour le moment.',

  // Subscription action messages
  subscriptionCancelledMessage:
    'Votre abonnement a été annulé. Veuillez réactiver votre abonnement pour continuer à utiliser Triven.',
  incompleteSubscriptionMessage:
    'Votre abonnement est en attente de finalisation du paiement. Finalisez votre paiement pour continuer à utiliser toutes les fonctionnalités.',
  incompleteExpiredMessage:
    'La configuration de votre abonnement a expiré. Veuillez commencer un nouvel abonnement pour continuer à utiliser Triven.',
  pausedMessage:
    'Votre abonnement est actuellement en pause. Veuillez reprendre votre abonnement pour continuer à utiliser Triven.',
  noSubscriptionMessage:
    "Vous avez besoin d'un abonnement actif pour accéder à Triven. Veuillez choisir un plan pour continuer.",

  // Action buttons
  reactivateSubscription: "Réactiver l'Abonnement",
  completePayment: 'Finaliser le Paiement',
  startNewSubscription: 'Commencer un Nouvel Abonnement',
  resumeSubscription: "Reprendre l'Abonnement",
  updatePayment: 'Mettre à Jour le Paiement',
  choosePlan: 'Choisir un Plan',

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
  subscriptionCancelledSuccessfully: 'Votre abonnement a été annulé avec succès',
  subscriptionScheduledForCancellation:
    'Votre abonnement est programmé pour être annulé à la fin de votre période de facturation',
  keepSubscription: "Conserver l'abonnement",
  proceedWithCancellation: "Procéder à l'annulation",
  subscriptionEnding: "Fin d'abonnement",
  accessUntil: "Vous aurez accès jusqu'au",
  annualSubscriptionNotice: 'Abonnement Annuel',
  annualSubscriptionCancellationPolicy:
    "Les abonnements annuels ne peuvent être annulés qu'à la fin de la période de facturation. Vous continuerez à avoir accès jusqu'au {{date}}.",

  // Payment method updating
  editPaymentMethod: 'Modifier le mode de paiement',
  paymentMethodUpdated: 'Mode de paiement mis à jour',
  updatePaymentMethodInfo: 'Mettre à jour le mode de paiement',
  updatePaymentMethodDescription:
    'Ajoutez une nouvelle méthode de paiement pour votre abonnement. Votre méthode de paiement actuelle sera remplacée.',
  enterNewPaymentMethod: 'Entrez votre nouvelle méthode de paiement',
  paymentCard: 'Carte de paiement',
  paymentMethod: 'Méthode de paiement',
  useNewCard: 'Utiliser une autre carte',
  cardExpired: 'Carte expirée',
  cardExpiredMessage:
    'Votre carte de paiement a expiré. Veuillez ajouter une nouvelle carte pour continuer.',
  confirmUpgrade: 'Confirmer la mise à niveau',

  // Payment Failures and Card Issues
  paymentFailed: 'Paiement échoué',
  paymentDeclined: 'Paiement refusé',
  updatePaymentMethod: 'Mettre à jour le mode de paiement',
  pastDueMessage:
    "Votre paiement a échoué. Cela peut être dû à des fonds insuffisants, une carte expirée ou d'autres problèmes de paiement. Veuillez mettre à jour votre mode de paiement pour restaurer l'accès.",
  unpaidMessage:
    "Plusieurs tentatives de paiement ont échoué. Votre carte peut avoir des fonds insuffisants, être expirée ou avoir été refusée. Veuillez mettre à jour immédiatement votre mode de paiement pour restaurer l'accès.",
  insufficientFunds: 'Fonds insuffisants',
  cardExpiredTitle: 'Carte expirée',
  cardDeclined: 'Carte refusée',
  paymentMethodRequired: 'Mode de paiement requis',
  accessBlocked: 'Accès bloqué en raison de problèmes de paiement',
  updateCardToRestore: "Mettez à jour votre carte pour restaurer l'accès à votre compte",

  // Settings page translations
  subscription: 'Abonnement',
  subscriptions: 'Abonnements',
  manageSubscription: "Gérer l'abonnement",
  manageSubscriptions: 'Gérer votre abonnement et vos paramètres de facturation',
  yourCurrentPlan: 'Consultez et gérez les détails de votre abonnement',
  plan: 'Plan actuel',
  billedEveryMonth: 'facturé chaque mois',
  noActiveBilling: 'Aucune facturation active',
  status: 'Statut',
  nextBilling: 'Prochaine facturation',
  trialEnds: "Fin de l'essai",
  memberSince: 'Membre depuis',
  recently: 'Récemment',
  free: 'Gratuit',
  securelyStored: 'Stocké en toute sécurité avec Stripe',
  renews: 'Renouvelle',
  trialEndsOn: "L'essai se termine le",
  nextInvoiceDue: 'Prochaine facture due le',
  noRenewalDate: 'Aucune date de renouvellement disponible',
  expires: 'Expire',
  upgrade: 'Mettre à niveau vers',
  subscribe: "S'abonner à",
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
