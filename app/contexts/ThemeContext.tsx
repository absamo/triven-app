import type { MantineColorScheme } from '@mantine/core'
import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  colorScheme: MantineColorScheme
  toggleColorScheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<MantineColorScheme>('light')

  // Load saved theme preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('color-scheme')
    if (saved === 'dark' || saved === 'light') {
      setColorScheme(saved)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setColorScheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Save theme preference when it changes
  useEffect(() => {
    localStorage.setItem('color-scheme', colorScheme)
  }, [colorScheme])

  const toggleColorScheme = () => {
    setColorScheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
