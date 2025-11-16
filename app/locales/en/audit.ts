export default {
  title: 'Product History',
  loading: 'Loading history...',
  error: 'Failed to load audit history',
  emptyState: 'No changes yet',
  noResultsFound: 'No results found for the selected filters',
  unknownUser: 'Unknown user',
  loadMore: 'Load more',
  retry: 'Retry',

  totalEvents: '{{count}} event',
  totalEvents_other: '{{count}} events',

  eventTypes: {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    duplicate: 'Duplicated',
    all: 'All Events',
  },

  eventDesc: {
    create: '{{user}} created this product',
    update: '{{user}} updated this product',
    updateFields: '{{user}} updated {{count}} field: {{fields}}',
    updateFields_other: '{{user}} updated {{count}} fields: {{fields}}',
    delete: '{{user}} deleted this product',
    default: '{{user}} performed {{eventType}}',
  },

  timeAgo: {
    justNow: 'Just now',
    minutes: '{{count}} minute ago',
    minutes_other: '{{count}} minutes ago',
    hours: '{{count}} hour ago',
    hours_other: '{{count}} hours ago',
    days: '{{count}} day ago',
    days_other: '{{count}} days ago',
  },

  filters: {
    title: 'Filters',
    eventType: 'Event Type',
    allEvents: 'All events',
    dateRange: 'Date Range',
    selectDates: 'Select date range',
    clear: 'Clear',
    apply: 'Apply Filters',
  },

  comparison: {
    viewChanges: 'View field changes',
    before: 'Before',
    after: 'After',
  },

  fields: {
    product: {
      name: 'Name',
      sku: 'SKU',
      price: 'Price',
      cost: 'Cost',
      quantity: 'Quantity',
      description: 'Description',
      categoryId: 'Category',
      supplierId: 'Supplier',
      minimumStockLevel: 'Minimum Stock Level',
      maximumStockLevel: 'Maximum Stock Level',
      reorderPoint: 'Reorder Point',
      reorderQuantity: 'Reorder Quantity',
      unit: 'Unit',
      barcode: 'Barcode',
      weight: 'Weight',
      dimensions: 'Dimensions',
      expiryDate: 'Expiry Date',
      location: 'Location',
      notes: 'Notes',
    },
  },
}
