import { Anchor, rem } from '@mantine/core'
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
  color = '#000000',
  position = 'inline',
  style = {},
}: BackButtonProps) {
  const baseStyle: React.CSSProperties = {
    color,
    fontWeight: 500,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: rem(4),
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
      <Anchor onClick={onClick} size={size} style={{ ...combinedStyle, cursor: 'pointer' }}>
        <IconArrowLeft size={16} />
        {children}
      </Anchor>
    )
  }

  return (
    <Anchor component={Link} to={to || '/'} size={size} style={combinedStyle}>
      <IconArrowLeft size={16} />
      {children}
    </Anchor>
  )
}
