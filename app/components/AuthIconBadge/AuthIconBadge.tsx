import { Center } from '@mantine/core'
import type React from 'react'

interface AuthIconBadgeProps {
  icon: React.ComponentType<{ size?: number; color?: string; stroke?: number }>
  theme?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  mb?: number | string
}

const themeConfig = {
  blue: {
    outerBg: '#EFF6FF',
    innerBg: '#93C5FD',
    iconColor: '#1D4ED8',
  },
  green: {
    outerBg: '#F0FDF4',
    innerBg: '#86EFAC',
    iconColor: '#16A34A',
  },
  red: {
    outerBg: '#FEF2F2',
    innerBg: '#FCA5A5',
    iconColor: '#DC2626',
  },
  orange: {
    outerBg: '#FFF7ED',
    innerBg: '#FED7AA',
    iconColor: '#EA580C',
  },
  purple: {
    outerBg: '#F3E8FF',
    innerBg: '#C4B5FD',
    iconColor: '#7C3AED',
  },
}

const sizeConfig = {
  sm: {
    outerSize: 48,
    innerSize: 24,
    iconSize: 14,
  },
  md: {
    outerSize: 64,
    innerSize: 32,
    iconSize: 18,
  },
  lg: {
    outerSize: 80,
    innerSize: 40,
    iconSize: 22,
  },
}

export default function AuthIconBadge({
  icon: Icon,
  theme = 'blue',
  size = 'md',
  mb = 24,
}: AuthIconBadgeProps) {
  const colors = themeConfig[theme]
  const sizes = sizeConfig[size]

  return (
    <Center mb={mb}>
      <div
        style={{
          width: sizes.outerSize,
          height: sizes.outerSize,
          borderRadius: '50%',
          backgroundColor: colors.outerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: sizes.innerSize,
            height: sizes.innerSize,
            borderRadius: '50%',
            backgroundColor: colors.innerBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={sizes.iconSize} color={colors.iconColor} stroke={1.5} />
        </div>
      </div>
    </Center>
  )
}
