import { rem } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from 'react-router'

interface BackButtonProps {
  to?: string
  onClick?: () => void
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  position?: 'top-left' | 'inline'
  style?: React.CSSProperties
}

export default function BackButton({
  to,
  onClick,
  children,
  size = 'sm',
  color,
  position = 'inline',
  style = {},
}: BackButtonProps) {
  const baseStyle: React.CSSProperties = {
    color: color || 'light-dark(var(--mantine-color-dark-9), var(--mantine-color-gray-0))',
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: rem(4),
    transition: 'none',
    transform: 'none',
    fontSize:
      size === 'xs'
        ? rem(12)
        : size === 'sm'
          ? rem(14)
          : size === 'md'
            ? rem(16)
            : size === 'lg'
              ? rem(18)
              : rem(20),
    ...style,
  }

  const positionStyle: React.CSSProperties =
    position === 'top-left'
      ? {
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
        }
      : {}

  const combinedStyle = { ...baseStyle, ...positionStyle }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={{
          ...combinedStyle,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        <IconArrowLeft size={16} />
        {children}
      </button>
    )
  }

  return (
    <Link to={to || '/'} style={combinedStyle}>
      <IconArrowLeft size={16} />
      {children}
    </Link>
  )
}
