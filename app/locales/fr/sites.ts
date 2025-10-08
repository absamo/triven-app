export default {
  // Page titles and headings
  title: 'Sites',
  addSite: 'Ajouter un site',
  editSite: 'Modifier un site',

  // Table headers and labels
  name: 'Nom',
  type: 'Type',
  location: 'Emplacement',
  agency: 'Agence',
  siteType: 'Type de site',

  // Form fields and labels
  selectSiteType: 'Sélectionner le type de site',
  warehouse: 'Entrepôt',
  store: 'Magasin',
  unknown: 'Inconnu',

  // Messages and descriptions
  description: "Gérez vos sites d'entreprise, y compris les entrepôts et les magasins.",
  emptyState: 'Aucun site trouvé. Créez votre premier site pour commencer.',
  notAssociatedWithAgency: "Ce site n'est associé à aucune agence",

  // Filter options
  allSites: 'Tous les sites',
  noSitesMatchFilter: 'Aucun site ne correspond au filtre sélectionné.', // Success/error messages
  created: 'Site créé avec succès',
  updated: 'Site mis à jour avec succès',
  deleted: 'Site supprimé avec succès',

  // Validation messages
  nameRequired: 'Le nom du site est requis',
  typeRequired: 'Le type de site est requis',
  locationRequired: "L'emplacement est requis",
} as const
