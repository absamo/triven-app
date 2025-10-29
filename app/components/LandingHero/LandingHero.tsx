// Landing Hero Component
// User Story 1: Immediate Value Recognition
// Goal: Business owner immediately understands what Triven does within 3 seconds

import { Container, Stack, Text, Title } from '@mantine/core'
import classes from './LandingHero.module.css'

interface LandingHeroProps {
  children?: React.ReactNode
}

export function LandingHero({ children }: LandingHeroProps) {
  return (
    <section className={classes.hero} aria-label="Hero section">
      <Container size="lg" className={classes.heroContainer}>
        <Stack gap="xl" className={classes.heroContent}>
          {/* Main Headline */}
          <Title className={classes.headline} order={1}>
            AI-Powered Inventory Management
          </Title>

          {/* Subheadline */}
          <Text className={classes.subheadline} size="xl">
            Stop wasting time on manual tracking. Triven automates your inventory, predicts demand,
            and prevents stockouts—so you can focus on growing your business.
          </Text>

          {/* CTA Buttons Slot */}
          {children && <div className={classes.ctaContainer}>{children}</div>}
        </Stack>
      </Container>
    </section>
  )
}
