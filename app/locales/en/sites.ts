export default {
  // Page titles and headings
  title: 'Sites',
  addSite: 'Add a site',
  editSite: 'Edit a site',

  // Table headers and labels
  name: 'Name',
  type: 'Type',
  location: 'Location',
  agency: 'Agency',
  siteType: 'Site type',

  // Form fields and labels
  selectSiteType: 'Select site type',
  warehouse: 'Warehouse',
  store: 'Store',
  unknown: 'Unknown',

  // Messages and descriptions
  description: 'Manage your business sites including warehouses and stores.',
  emptyState: 'No sites found. Create your first site to get started.',
  notAssociatedWithAgency: 'This site is not associated with any agency',

  // Filter options
  allSites: 'All Sites',
  noSitesMatchFilter: 'No sites match the selected filter.', // Success/error messages
  created: 'Site created successfully',
  updated: 'Site updated successfully',
  deleted: 'Site deleted successfully',

  // Validation messages
  nameRequired: 'Site name is required',
  typeRequired: 'Site type is required',
  locationRequired: 'Location is required',
} as const
