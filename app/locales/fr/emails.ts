export default {
  // Common
  company: 'Triven',
  support: "L'équipe Triven",
  bestRegards: 'Cordialement,',
  needHelp: "Besoin d'aide ?",
  contactSupport: 'Contacter le Support',
  manageBilling: 'Gérer la Facturation',
  viewDashboard: 'Voir le Tableau de Bord',
  accessDashboard: 'Accéder au Tableau de Bord',

  // Free Trial Welcome
  freeTrialWelcome: {
    subject: "Bienvenue à votre essai gratuit Triven ! Commencez à explorer dès aujourd'hui 🚀",
    preview: "Bienvenue à votre essai gratuit Triven ! Commencez à explorer dès aujourd'hui 🚀",
    title: 'Bienvenue à votre essai gratuit !',
    greeting: 'Bonjour {name},',
    intro:
      "Félicitations ! Vous avez démarré avec succès votre essai gratuit Triven. Vous avez maintenant un accès complet à notre plateforme puissante de gestion d'inventaire pour les prochains {trialEndDate}.",
    trialIncludes: '🎉 Votre essai gratuit inclut :',
    features: {
      inventoryTracking: "✓ Suivi complet de l'inventaire",
      analytics: '✓ Tableau de bord analytique en temps réel',
      orderManagement: '✓ Gestion des commandes',
      supplierManagement: '✓ Gestion des fournisseurs',
      multiLocation: '✓ Support multi-emplacements',
      support: '✓ Support client',
    },
    startManaging: "Commencer la Gestion d'Inventaire",
    quickStart: 'Guide de démarrage rapide :',
    steps: {
      addProducts: "1. Ajoutez vos premiers produits à l'inventaire",
      setupSuppliers: '2. Configurez vos fournisseurs et emplacements',
      createOrder: "3. Créez votre première commande d'achat",
      exploreAnalytics: '4. Explorez les analyses en temps réel',
    },
    trialExpiry:
      'Votre essai expirera le {trialEndDate}. Pour continuer à utiliser Triven sans interruption, vous pouvez passer à un plan payant à tout moment.',
    viewPricing: 'Voir les Plans Tarifaires',
    supportText:
      "Besoin d'aide pour commencer ? Notre équipe de support est là pour vous aider à tirer le meilleur parti de votre essai.",
  },

  // Subscription Confirmation
  subscriptionConfirmation: {
    subject: 'Bienvenue à Triven {planName} ! Votre abonnement est actif 🎉',
    preview: 'Bienvenue à Triven {planName} ! Votre abonnement est actif 🎉',
    title: 'Abonnement Confirmé !',
    greeting: 'Bonjour {name},',
    intro:
      'Merci de vous être abonné à Triven ! Votre plan {planName} est maintenant actif et vous avez un accès complet à toutes les fonctionnalités premium.',
    subscriptionDetails: 'Détails de Votre Abonnement',
    plan: 'Plan :',
    price: 'Prix :',
    nextBilling: 'Prochaine facturation :',
    status: 'Statut :',
    active: 'Actif',
    whatsIncluded: 'Ce qui est inclus dans votre plan {planName} :',
    features: {
      unlimitedTracking: "✓ Suivi d'inventaire illimité",
      advancedAnalytics: '✓ Analyses et rapports avancés',
      multiLocation: '✓ Gestion multi-emplacements',
      apiAccess: '✓ Accès API',
      prioritySupport: '✓ Support client prioritaire',
      customIntegrations: '✓ Intégrations personnalisées',
    },
    billingInfo: 'Informations de Facturation',
    billingText:
      'Votre abonnement se renouvellera automatiquement le {nextBillingDate}. Vous pouvez gérer vos paramètres de facturation, mettre à jour les méthodes de paiement ou annuler votre abonnement à tout moment.',
    supportText:
      'Des questions sur votre abonnement ? Notre équipe de support est là pour vous aider !',
  },

  // Plan Upgrade
  planUpgrade: {
    subject: 'Plan mis à niveau avec succès ! Bienvenue au {newPlan} 🚀',
    preview: 'Plan mis à niveau avec succès ! Bienvenue au {newPlan} 🚀',
    title: 'Plan Mis à Niveau avec Succès !',
    greeting: 'Bonjour {name},',
    intro:
      'Excellente nouvelle ! Vous avez mis à niveau avec succès de {oldPlan} vers {newPlan}. Votre nouveau plan est actif immédiatement et vous avez maintenant accès à toutes les fonctionnalités améliorées.',
    upgradeSummary: '🎉 Résumé de la Mise à Niveau',
    newPrice: 'Nouveau Prix :',
    upgradeDate: 'Date de Mise à Niveau :',
    nextBilling: 'Prochaine Facturation :',
    exploreFeatures: 'Explorer les Nouvelles Fonctionnalités',
    newFeatures: 'Nouvelles fonctionnalités maintenant disponibles :',
    features: {
      advancedAnalytics: "✓ Analyses d'inventaire avancées",
      automatedReorder: '✓ Points de réapprovisionnement automatisés',
      customReporting: '✓ Rapports personnalisés',
      apiAccess: '✓ Accès API pour les intégrations',
      prioritySupport: '✓ Support client prioritaire',
      multiLocation: '✓ Gestion multi-emplacements',
    },
    billingInfo: 'Informations de Facturation',
    billingText:
      "Vous serez facturé {newPrice} pour votre plan {newPlan} à partir de votre prochain cycle de facturation le {nextBillingDate}. Vous pouvez voir votre historique de facturation complet et gérer vos paramètres d'abonnement à tout moment.",
    viewBilling: 'Voir les Détails de Facturation',
    thankYou:
      "Merci d'avoir choisi Triven ! Nous sommes ravis de vous aider à faire passer votre gestion d'inventaire au niveau supérieur.",
  },

  // Payment Method Update
  paymentMethodUpdate: {
    subject: 'Méthode de paiement mise à jour avec succès 💳',
    preview: 'Méthode de paiement mise à jour avec succès 💳',
    title: 'Méthode de Paiement Mise à Jour',
    greeting: 'Bonjour {name},',
    intro:
      'Nous confirmons que votre méthode de paiement a été mise à jour avec succès dans votre compte Triven.',
    updatedPayment: '💳 Méthode de Paiement Mise à Jour',
    cardType: 'Type de Carte :',
    cardNumber: 'Numéro de Carte :',
    updated: 'Mis à Jour :',
    status: 'Statut :',
    active: 'Actif',
    nextSteps: 'Prochaines Étapes',
    nextStepsText:
      'Votre nouvelle méthode de paiement sera utilisée pour votre prochain cycle de facturation le {nextBillingDate}. Votre abonnement continuera sans interruption.',
    viewBilling: 'Voir les Paramètres de Facturation',
    securityNotice: '🔒 Avis de Sécurité',
    securityText:
      "Si vous n'avez pas effectué ce changement, veuillez contacter notre équipe de support immédiatement. La sécurité de votre compte est notre priorité absolue.",
    needHelp: "Besoin d'Aide ?",
    helpText:
      'Vous pouvez gérer tous vos paramètres de facturation, mettre à jour les méthodes de paiement ou voir votre historique de facturation à tout moment depuis votre tableau de bord.',
    supportText:
      'Si vous avez des questions sur votre méthode de paiement ou la facturation, notre équipe de support est là pour vous aider.',
  },

  // Payment Failed
  paymentFailed: {
    subject: 'Action requise : Échec du paiement pour votre abonnement Triven ⚠️',
    preview: 'Action requise : Échec du paiement pour votre abonnement Triven ⚠️',
    title: 'Échec du Paiement - Action Requise',
    greeting: 'Bonjour {name},',
    intro:
      "Nous n'avons pas pu traiter votre paiement pour votre abonnement Triven {planName}. Pour assurer un service ininterrompu, veuillez mettre à jour votre méthode de paiement dès que possible.",
    paymentDetails: '⚠️ Détails du Paiement',
    plan: 'Plan :',
    amount: 'Montant :',
    failureReason: "Raison de l'Échec :",
    nextRetry: 'Prochaine Tentative :',
    updatePayment: 'Mettre à Jour la Méthode de Paiement',
    whatHappensNext: '📅 Ce Qui Se Passe Ensuite',
    timeline: {
      today: "Aujourd'hui : Échec du paiement - mettez à jour votre méthode de paiement",
      retry: '{retryDate} : Nous réessaierons automatiquement le paiement',
      suspension: '{suspensionDate} : Le compte sera suspendu si le paiement échoue encore',
    },
    howToResolve: 'Comment résoudre ceci :',
    steps: {
      updateMethod: '1. Cliquez sur "Mettre à Jour la Méthode de Paiement" ci-dessus',
      addNew: "2. Ajoutez une nouvelle méthode de paiement ou mettez à jour l'existante",
      verifyInfo: '3. Vérifiez que vos informations de facturation sont correctes',
      contactBank: "4. Contactez votre banque si vous avez besoin d'aide",
    },
    needHelp: "Besoin d'Aide ?",
    helpText:
      'Si vous avez des difficultés à mettre à jour votre méthode de paiement ou avez des questions sur cette charge, notre équipe de support est là pour vous aider.',
    viewBilling: "Voir l'Historique de Facturation",
    keepActive:
      'Nous voulons maintenir votre service Triven actif. Veuillez mettre à jour votre méthode de paiement pour éviter toute interruption de service.',
  },

  // Payment Success
  paymentSuccess: {
    subject: 'Paiement reçu - Merci ! Votre abonnement Triven est actif 💳',
    preview: 'Paiement reçu - Merci ! Votre abonnement Triven est actif 💳',
    title: 'Paiement Reçu - Merci !',
    greeting: 'Bonjour {name},',
    intro:
      'Merci ! Nous avons traité avec succès votre paiement pour votre abonnement Triven {planName}. Votre service continue sans interruption.',
    paymentConfirmation: '✅ Confirmation de Paiement',
    amountPaid: 'Montant Payé :',
    plan: 'Plan :',
    paymentDate: 'Date de Paiement :',
    invoiceNumber: 'Numéro de Facture :',
    nextBilling: 'Prochaine Facturation :',
    status: 'Statut :',
    paid: 'Payé',
    downloadInvoice: 'Télécharger la Facture',
    planIncludes: 'Votre plan {planName} inclut :',
    features: {
      unlimitedTracking: "✓ Suivi d'inventaire illimité",
      advancedAnalytics: '✓ Analyses et rapports avancés',
      multiLocation: '✓ Gestion multi-emplacements',
      apiAccess: '✓ Accès API et intégrations',
      prioritySupport: '✓ Support client prioritaire',
      automatedBackup: '✓ Sauvegarde automatisée et sécurité',
    },
    billingInfo: 'Informations de Facturation',
    billingText:
      "Votre prochain paiement de {amount} sera automatiquement prélevé le {nextBillingDate}. Vous pouvez gérer vos paramètres de facturation, voir l'historique des paiements ou mettre à jour votre méthode de paiement à tout moment.",
    thankYou:
      "Merci d'avoir choisi Triven pour vos besoins de gestion d'inventaire. Nous sommes là pour aider votre entreprise à réussir !",
  },

  // Trial Expiring
  trialExpiring: {
    subject: "Votre essai Triven expire {expirationDate} - Ne perdez pas l'accès ! ⏰",
    preview: "Votre essai Triven expire {expirationDate} - Ne perdez pas l'accès ! ⏰",
    title: 'Votre essai expire {expirationDate} !',
    greeting: 'Bonjour {name},',
    intro:
      "Votre essai gratuit Triven touche à sa fin. Il vous reste {daysLeft} jours pour continuer à profiter de toutes les fonctionnalités puissantes de gestion d'inventaire que vous avez utilisées.",
    trialStatus: "⏰ Statut de l'Essai",
    daysRemaining: 'Jours Restants :',
    expirationDate: "Date d'Expiration :",
    recommendedPlan: 'Plan Recommandé :',
    upgradeNow: 'Mettre à Niveau Maintenant - {planPrice}/mois',
    dontLoseAccess: "Ne perdez pas l'accès à :",
    features: {
      inventoryData: "✓ Toutes vos données d'inventaire et produits",
      analytics: '✓ Analyses et insights avancés',
      reorderNotifications: '✓ Notifications de réapprovisionnement automatisées',
      multiLocation: '✓ Gestion multi-emplacements',
      customReports: '✓ Rapports personnalisés et intégrations',
      prioritySupport: '✓ Support client prioritaire',
    },
    trialUsage: '📊 Utilisation de Votre Essai',
    usageText:
      "Pendant votre essai, vous avez expérimenté la puissance de la gestion d'inventaire professionnelle. Voici ce que signifie la mise à niveau :",
    upgradePoints: {
      keepData: '• Conservez toutes vos données et paramètres',
      unlimitedTracking: "• Débloquez le suivi d'inventaire illimité",
      advancedFeatures: '• Accédez aux fonctionnalités avancées et intégrations',
      prioritySupport: '• Obtenez un support prioritaire',
    },
    whatIfDontUpgrade: 'Que se passe-t-il si je ne fais pas la mise à niveau ?',
    suspensionText:
      "Après l'expiration de votre essai, votre compte sera temporairement suspendu. Vous perdrez l'accès à votre tableau de bord et à vos données jusqu'à ce que vous passiez à un plan payant. Ne vous inquiétez pas - vos données sont en sécurité et seront restaurées lorsque vous ferez la mise à niveau.",
    choosePlan: 'Choisir Votre Plan',
    supportText:
      'Des questions sur la mise à niveau ? Notre équipe est là pour vous aider à choisir le bon plan pour votre entreprise.',
  },

  // Subscription Cancelled
  subscriptionCancelled: {
    subject: 'Votre abonnement Triven a été annulé',
    preview: 'Votre abonnement Triven a été annulé',
    title: 'Abonnement Annulé',
    greeting: 'Bonjour {name},',
    intro:
      'Nous sommes désolés de vous voir partir ! Votre abonnement Triven {planName} a été annulé comme demandé. Nous avons confirmé les détails ci-dessous.',
    cancellationDetails: "📋 Détails de l'Annulation",
    plan: 'Plan :',
    cancelled: 'Annulé :',
    accessUntil: "Accès Jusqu'au :",
    reason: 'Raison :',
    status: 'Statut :',
    cancelledStatus: 'Annulé',
    whatThisMeans: 'Ce que cela signifie :',
    implications: {
      accessUntil: "• Vous continuerez à avoir un accès complet jusqu'au {accessUntil}",
      noCharges: '• Aucun frais futur ne sera facturé sur votre méthode de paiement',
      dataStored: "• Vos données seront stockées en sécurité pendant 90 jours après l'annulation",
      reactivate: '• Vous pouvez réactiver votre abonnement à tout moment pendant cette période',
    },
    beforeYouGo: '🔄 Avant Votre Départ',
    beforeText:
      'Souhaitez-vous exporter vos données ou envisager de réactiver ? Nous sommes là pour vous aider avec tout ce dont vous avez besoin.',
    exportData: 'Exporter Mes Données',
    reactivateSubscription: "Réactiver l'Abonnement",
    feedback: 'Nous aimerions vos commentaires',
    feedbackText:
      'Votre expérience nous importe. Si vous avez un moment, veuillez nous dire comment nous aurions pu mieux vous servir. Vos commentaires nous aident à améliorer Triven pour tous.',
    shareFeedback: 'Partager des Commentaires',
    reactivateLater: 'Besoin de réactiver plus tard ?',
    reactivateText:
      'Vous pouvez réactiver votre abonnement à tout moment en vous connectant à votre compte. Vos données et paramètres seront restaurés exactement comme vous les avez laissés.',
    thankYou:
      "Merci d'avoir fait partie de la communauté Triven. Nous espérons vous revoir dans le futur !",
  },
} satisfies typeof import('../en/emails').default
