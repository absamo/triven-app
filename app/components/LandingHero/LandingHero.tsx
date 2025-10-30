// Landing Hero Component
// User Story 1: Immediate Value Recognition
// Goal: Business owner immediately understands what Triven does within 3 seconds

import { Container, Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import classes from './LandingHero.module.css'

interface LandingHeroProps {
  children?: React.ReactNode
}

export function LandingHero({ children }: LandingHeroProps) {
  const { t } = useTranslation('home')

  // Apply gradient to specific words that should be highlighted
  const title = t('hero.title')
  const words = title.split(' ')

  // Define which words should have gradient effect
  const gradientWords = ['Inventory.', 'Growth.', 'Intelligent.', 'Forte.']

  return (
    <section className={classes.hero} aria-label="Hero section">
      <Container size="lg" className={classes.heroContainer}>
        <Stack gap="xl" className={classes.heroContent}>
          {/* Main Headline */}
          <Title className={classes.headline} order={1}>
            {words.map((word, index) => {
              const shouldHaveGradient = gradientWords.includes(word)
              return (
                <span key={`word-${index}-${word}`}>
                  {shouldHaveGradient ? <span className={classes.gradient}>{word}</span> : word}
                  {index < words.length - 1 && ' '}
                </span>
              )
            })}
          </Title>

          {/* Subheadline */}
          <Text className={classes.subheadline} size="xl">
            {t('hero.subtitle')}
          </Text>

          {/* CTA Buttons Slot */}
          {children && <div className={classes.ctaContainer}>{children}</div>}
        </Stack>
      </Container>
    </section>
  )
}
