import { SITE_TYPES } from '~/app/common/constants'

export function getSiteTypeLabel(type: string | undefined, t?: (key: string) => string) {
  switch (type) {
    case SITE_TYPES.WAREHOUSE:
      return { label: t ? t('sites:warehouse') : 'Warehouse', color: 'blue' }
    case SITE_TYPES.STORE:
      return { label: t ? t('sites:store') : 'Store', color: 'green' }
    default:
      return { label: t ? t('sites:unknown') : 'Unknown', color: 'gray' }
  }
}
