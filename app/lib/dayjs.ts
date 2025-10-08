import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with plugins
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

/**
 * Set dayjs locale based on the current language
 * @param language - The current language code (e.g., 'en', 'fr')
 */
export function setDayjsLocale(language: string) {
  const locale = language === 'fr' ? 'fr' : 'en'
  dayjs.locale(locale)
}

/**
 * Get a localized dayjs instance with the current locale already set
 * @param language - The current language code (e.g., 'en', 'fr')
 * @returns A dayjs instance with the correct locale
 */
export function getLocalizedDayjs(language: string) {
  setDayjsLocale(language)
  return dayjs
}

/**
 * Format a relative time with proper localization
 * @param date - The date to format
 * @param language - The current language code
 * @returns Localized relative time string (e.g., "2 minutes ago" or "il y a 2 minutes")
 */
export function formatRelativeTime(date: Date | string | dayjs.Dayjs, language: string): string {
  const localizedDayjs = getLocalizedDayjs(language)
  return localizedDayjs(date).fromNow()
}

/**
 * Format a date with proper localization
 * @param date - The date to format
 * @param language - The current language code
 * @param format - The format string (optional, defaults to localized format)
 * @returns Localized date string
 */
export function formatLocalizedDate(
  date: Date | string | dayjs.Dayjs,
  language: string,
  format?: string
): string {
  const localizedDayjs = getLocalizedDayjs(language)
  return format ? localizedDayjs(date).format(format) : localizedDayjs(date).format('LLL')
}

export default dayjs
