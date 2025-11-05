// Landing Page Route
// User Stories 1 & 2: Hero with CTAs and Demo Request
// Constitutional Principle VI: API-First Development

import { Box, Container, Group, Stack, Text } from '@mantine/core'
import { IconHeart } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { redirect, useLoaderData } from 'react-router'
import {
  DemoRequestModal,
  LandingCTA,
  LandingFeatures,
  LandingHero,
  LandingPricing,
  //   LandingSocialProof,
  //   LandingTestimonials,
} from '~/app/components'
import { auth } from '~/app/lib/auth.server'
import PublicLayout from '~/app/pages/PublicLayout'
import { getLandingPageConfig } from '~/app/services/landing-config.server'
import { getActiveSuccessMetrics } from '~/app/services/success-metrics.server'
import { getActiveTestimonials } from '~/app/services/testimonials.server'

export async function loader({ request }: { request: Request }) {
  // Check if user is already authenticated
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (session?.user) {
      // User is authenticated, redirect to dashboard
      return redirect('/dashboard')
    }
  } catch {
    // User not authenticated, continue to landing page
  }

  try {
    const [config, testimonials, successMetrics] = await Promise.all([
      getLandingPageConfig(),
      getActiveTestimonials(),
      getActiveSuccessMetrics(),
    ])

    // If demo requests are disabled, redirect to main app
    if (!config.enableDemoRequests) {
      return redirect('/login')
    }

    return {
      config,
      testimonials,
      successMetrics,
      // Sample dashboard metrics for preview
      dashboardMetrics: {
        totalInventoryValue: 487250,
        itemsTracked: 15234,
        accuracyRate: 98,
        growthPercentage: 23.5,
      },
    }
  } catch (error) {
    console.error('Failed to load landing page:', error)
    // Return defaults on error
    return {
      config: {
        enableDemoRequests: true,
        enableTrialSignup: true,
      },
      testimonials: [],
      successMetrics: [],
      dashboardMetrics: {
        totalInventoryValue: 487250,
        itemsTracked: 15234,
        accuracyRate: 98,
        growthPercentage: 23.5,
      },
    }
  }
}

export default function LandingPage() {
  //   const { testimonials, successMetrics } = useLoaderData<typeof loader>()
  const [demoModalOpened, setDemoModalOpened] = useState(false)
  const { t } = useTranslation(['home'])

  const handleTrialClick = () => {
    // Navigate to trial signup page (to be implemented)
    window.location.href = '/signup'
  }

  const handleDemoClick = () => {
    setDemoModalOpened(true)
  }

  return (
    <PublicLayout>
      <Container fluid p={0}>
        <Stack gap={0}>
          {/* Hero Section with CTAs */}
          <LandingHero>
            <LandingCTA
              onTrialClick={handleTrialClick}
              onDemoClick={handleDemoClick}
              variant="hero"
            />
          </LandingHero>

          {/* Success Metrics */}
          {/* <LandingSocialProof metrics={successMetrics} /> */}

          {/* Customer Testimonials */}
          {/* <LandingTestimonials testimonials={testimonials} /> */}

          {/* Features Section */}
          <LandingFeatures />

          {/* Pricing Section */}
          <LandingPricing />

          {/* Footer Section */}
          <Box
            component="footer"
            style={{
              background: 'var(--mantine-color-default)',
              borderTop: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Container size="xl" py={40} pos="relative">
              {/* Footer Content Layout */}
              <Group justify="center" align="center">
                {/* Copyright */}
                <Text
                  size="sm"
                  c="dimmed"
                  style={{
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('home:footer.copyright', { year: dayjs().year() })}
                </Text>

                {/* Made with Love */}
                <Group justify="center" align="center" gap="xs">
                  <Text
                    size="sm"
                    c="dimmed"
                    style={{
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {t('home:footer.madeWith')}
                  </Text>
                  <IconHeart
                    size={16}
                    style={{
                      color: '#ff6b6b',
                      fill: '#ff6b6b',
                    }}
                  />
                  <Text
                    size="sm"
                    c="dimmed"
                    style={{
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {t('home:footer.inLyon')}
                  </Text>
                </Group>
              </Group>
            </Container>
          </Box>

          {/* Demo Request Modal */}
          <DemoRequestModal opened={demoModalOpened} onClose={() => setDemoModalOpened(false)} />
        </Stack>
      </Container>
    </PublicLayout>
  )
}
