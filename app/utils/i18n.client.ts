import type { i18n as I18nInstance } from 'i18next'

/**
 * Changes the language and persists it to a cookie
 * i18next-browser-languagedetector handles cookie persistence automatically
 * @param i18n - The i18next instance
 * @param language - The language code to change to (e.g., 'en', 'fr')
 */
export function changeLanguageWithPersistence(i18n: I18nInstance, language: string) {
  // Don't do anything if already on the selected language
  if (i18n.language === language) {
    return
  }

  // Change the language - i18next will automatically save to cookie
  i18n.changeLanguage(language)
}
