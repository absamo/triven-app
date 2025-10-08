import { createTheme, DEFAULT_THEME } from '@mantine/core'

export const theme = createTheme({
  // Use teal as primary color for the design system
  primaryColor: 'teal',
  primaryShade: { light: 7, dark: 6 },

  // Enhanced color palette
  colors: {
    ...DEFAULT_THEME.colors,
    // Custom brand colors
    brand: [
      '#e6fffa',
      '#b3f5ec',
      '#81e6d9',
      '#4fd1c7',
      '#38b2ac',
      '#319795',
      '#2c7a7b',
      '#285e61',
      '#234e52',
      '#1d4044',
    ],
    // Custom success colors
    success: [
      '#f0fff4',
      '#c6f6d5',
      '#9ae6b4',
      '#68d391',
      '#48bb78',
      '#38a169',
      '#2f855a',
      '#276749',
      '#22543d',
      '#1a202c',
    ],
    // Neon color scheme
    neon: [
      '#e6fffa',
      '#ccfff5',
      '#99ffeb',
      '#66ffe0',
      '#33ffd6',
      '#00ffcc',
      '#00ff88', // Primary neon green
      '#00cc6a',
      '#00aa55',
      '#008844',
    ],
  },

  // Design tokens
  defaultRadius: 'md',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // Typography system
  headings: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.125rem', lineHeight: '1.2' },
      h2: { fontSize: '1.625rem', lineHeight: '1.25' },
      h3: { fontSize: '1.25rem', lineHeight: '1.3' },
      h4: { fontSize: '1.125rem', lineHeight: '1.4' },
    },
  },

  // Component-specific theming
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: 'all 0.2s ease',
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: 'lg',
      },
      styles: {
        root: {
          transition: 'box-shadow 0.2s ease',
        },
      },
    },

    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
      },
    },

    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
      },
    },

    Switch: {
      styles: {
        track: {
          '&[data-checked]': {
            backgroundColor: '#00ff88',
            borderColor: '#00ff88',
          },
        },
        thumb: {
          '&[data-checked]': {
            backgroundColor: '#000000',
            borderColor: '#00ff88',
          },
        },
      },
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  // Shadow system
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },
})
