import { ActionIcon, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'subtle' | 'filled' | 'outline' | 'light' | 'default' | 'gradient'
  className?: string
}

export function ThemeToggle({ size = 'md', variant = 'subtle', className }: ThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <ActionIcon
      variant={variant}
      color={isDark ? 'yellow' : 'blue'}
      onClick={toggleColorScheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      size={size}
      className={className}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  )
}
