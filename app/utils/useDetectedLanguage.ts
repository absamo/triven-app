import { useMatches } from 'react-router'

/**
 * Hook to access root loader data for navbar state
 * (Language is now handled automatically by react-i18next)
 */
export function useRootLoaderData(): { showMiniNavbar: boolean } {
  const matches = useMatches()
  const rootMatch = matches.find((match) => match.id === 'root')

  if (rootMatch?.data) {
    return rootMatch.data as { showMiniNavbar: boolean }
  }

  // Fallback if root data is not available
  return { showMiniNavbar: false }
}
