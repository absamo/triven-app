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
  
  // Also update URL if there's an lng parameter present
  const url = new URL(window.location.href)
  if (url.searchParams.has('lng')) {
    url.searchParams.set('lng', language)
    // Use replaceState to update URL without triggering navigation
    window.history.replaceState({}, '', url.toString())
  }
}

/**
 * Navigate to a specific route with a language parameter
 * @param path - The path to navigate to
 * @param language - The language code to include in the URL
 */
export function navigateWithLanguage(path: string, language: string) {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('lng', language)
  window.location.href = url.toString()
}
