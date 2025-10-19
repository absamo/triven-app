// Email translation utilities

export function interpolate(text: string, variables: Record<string, any>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

export async function getEmailTranslations(locale: 'en' | 'fr' = 'en') {
  if (locale === 'fr') {
    const { default: translations } = await import('~/app/locales/fr/emails')
    return translations
  }
  const { default: translations } = await import('~/app/locales/en/emails')
  return translations
}

export type EmailLocale = 'en' | 'fr'

export interface BaseEmailProps {
  locale?: EmailLocale
  name?: string
  dashboardUrl?: string
  billingUrl?: string
  supportUrl?: string
}