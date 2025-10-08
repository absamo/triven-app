export default {
  title: 'Équipes',
  invite: 'Inviter',
  name: 'Nom',
  role: 'Rôle',
  agency: 'Agence',
  site: 'Site',
  status: 'Statut',

  // Form labels
  editTeamMember: "Modifier un membre de l'équipe",
  addTeamMember: "Ajouter un membre de l'équipe",
  emailAddress: 'Adresse e-mail',
  phoneNumber: 'Numéro de téléphone',
  selectRole: 'Sélectionner un rôle',

  // Actions
  edit: 'Modifier',
  resendInvitation: "Renvoyer l'invitation",
  reactivateAccount: 'Réactiver le compte',
  deactivateAccount: 'Désactiver le compte',
  cannotDeactivateSelf: 'Vous ne pouvez pas désactiver votre propre compte',
  cannotDeactivateLastAdmin: 'Impossible de désactiver le dernier utilisateur administrateur',
  cannotResendForNonPending:
    'Vous pouvez seulement renvoyer les invitations pour les utilisateurs en attente',

  // Filter options
  showActiveOnly: 'Utilisateurs actifs seulement',
  showingActiveUsers: 'Affichage des utilisateurs actifs',
  inactive: 'Inactif',

  // Online status
  onlineNow: 'En ligne',
  lastOnline: 'Dernière connexion {{time}}',
  neverOnline: 'Jamais en ligne',
  onlineMembers: '{{count}} des {{total}} membres en ligne',
} satisfies typeof import('../en/teams').default
