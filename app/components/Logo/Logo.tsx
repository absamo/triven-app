import { Image, useMantineColorScheme } from '@mantine/core'
import { useEffect, useState } from 'react'

export interface LogoProps {
  width?: number
  height?: number
  alt?: string
  src?: string
  mb?: number
  ml?: number
  variant?: 'light' | 'dark' | 'auto'
}

export default function Logo({
  width = 130,
  height = undefined,
  alt = 'Logo',
  src = '/assets/triven-logo.png',
  mb = 0,
  ml = -15,
  variant = 'auto',
}: LogoProps) {
  const { colorScheme } = useMantineColorScheme()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, always use light variant to match server
  const resolvedVariant =
    variant === 'auto' && isHydrated
      ? colorScheme === 'dark'
        ? 'dark'
        : 'light'
      : variant === 'auto'
        ? 'light'
        : variant

  const resolvedSrc =
    resolvedVariant === 'dark' ? '/assets/triven_dark.png' : '/assets/triven_light.png'

  return (
    <Image src={resolvedSrc || src} alt={alt} w={width} h={height} fit="contain" mb={mb} ml={ml} />
  )
}
