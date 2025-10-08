export default {
  // Main notification UI
  title: 'Notifications',
  onlyShowUnread: 'Afficher seulement les non lues',
  markAllAsRead: 'Marquer toutes comme lues',
  noNotifications: 'Aucune notification',
  showAll: 'Afficher toutes les notifications',
  showUnreadOnly: 'Afficher seulement les non lues',
  noUnreadNotifications: 'Aucune notification non lue',
  allCaughtUp: 'Vous êtes à jour !',

  // Notification types
  types: {
    criticalStock: 'Stock Critique',
    lowStock: 'Stock Faible',
    outOfStock: 'Rupture de Stock',
    restockReminder: 'Rappel de Réapprovisionnement',
    expiredProduct: 'Produit Expiré',
    expiringProduct: 'Produit Qui Expire',
  },

  // Error messages
  errors: {
    notificationError: 'Erreur de Notification',
    failedToParse: "Échec de l'analyse des données de notification",
    connectionError: 'Erreur de Connexion',
    temporarilyUnavailable: 'Les notifications sont temporairement indisponibles',
  },
} satisfies typeof import('../en/notifications').default
