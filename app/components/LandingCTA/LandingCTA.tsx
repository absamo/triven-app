// Landing CTA Component
// User Story 2: Frictionless Trial Signup
// Prominent CTAs for trial signup and demo requests

import { Button, Group } from '@mantine/core'
import { IconCalendar, IconRocket } from '@tabler/icons-react'
import classes from './LandingCTA.module.css'

interface LandingCTAProps {
  onTrialClick?: () => void
  onDemoClick?: () => void
  primaryText?: string
  secondaryText?: string
  variant?: 'hero' | 'section'
}

export function LandingCTA({
  onTrialClick,
  onDemoClick,
  primaryText = 'Start Free Trial',
  secondaryText = 'Request Demo',
  variant = 'hero',
}: LandingCTAProps) {
  return (
    <Group
      gap="md"
      justify="center"
      className={variant === 'hero' ? classes.heroGroup : classes.sectionGroup}
    >
      {/* Primary CTA - Start Free Trial */}
      <Button
        onClick={onTrialClick}
        className={classes.primaryButton}
        size="lg"
        leftSection={<IconRocket size={20} />}
        radius="md"
        aria-label="Start your free trial"
      >
        {primaryText}
      </Button>

      {/* Secondary CTA - Request Demo */}
      <Button
        onClick={onDemoClick}
        className={classes.secondaryButton}
        size="lg"
        variant="outline"
        leftSection={<IconCalendar size={20} />}
        radius="md"
        aria-label="Request a demo"
      >
        {secondaryText}
      </Button>
    </Group>
  )
}
