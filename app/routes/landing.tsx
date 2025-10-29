// Landing Page Route
// User Stories 1 & 2: Hero with CTAs and Demo Request
// Constitutional Principle VI: API-First Development

import {
  ActionIcon,
  Box,
  Container,
  Group,
  Menu,
  rem,
  Stack,
  Text,
  useMantineColorScheme,
} from '@mantine/core'
import { IconHeart, IconMoon, IconSun } from '@tabler/icons-react'
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
import FrIcon from '~/app/components/SvgIcons/FrIcon'
import UsIcon from '~/app/components/SvgIcons/UsIcon'
import PublicLayout from '~/app/pages/PublicLayout'
import { getLandingPageConfig } from '~/app/services/landing-config.server'
import { getActiveSuccessMetrics } from '~/app/services/success-metrics.server'
import { getActiveTestimonials } from '~/app/services/testimonials.server'

export async function loader() {
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
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { t, i18n } = useTranslation(['home'])

  const isDark = colorScheme === 'dark'

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
              background: isDark
                ? 'linear-gradient(135deg, rgba(4, 3, 8, 0.98) 0%, rgba(15, 15, 15, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(249, 249, 253, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Container size="xl" py={40} pos="relative">
              {/* Footer Content Layout */}
              <Group justify="space-between" align="center">
                {/* Copyright - Left side */}
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

                {/* Made with Love - Center */}
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

                {/* Spacer for balance (empty div to maintain center alignment) */}
                <div style={{ width: rem(48) }} />
              </Group>

              {/* Language and Theme Selectors - Absolute positioned right */}
              <Group
                gap="xs"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {/* Language Selector */}
                <Menu shadow="md" width={120} position="top-end">
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      size="lg"
                      aria-label={t('home:footer.selectLanguage')}
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {i18n.language === 'en' ? <UsIcon size={20} /> : <FrIcon size={20} />}
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown
                    style={{
                      background: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      borderRadius: '8px',
                    }}
                  >
                    <Menu.Item
                      onClick={() => {
                        i18n.changeLanguage('en')
                      }}
                      style={{
                        color: isDark ? 'white' : 'black',
                        background:
                          i18n.language === 'en'
                            ? isDark
                              ? 'rgba(32, 254, 107, 0.1)'
                              : 'rgba(32, 254, 107, 0.05)'
                            : 'transparent',
                      }}
                      leftSection={<UsIcon size={18} />}
                      rightSection={
                        i18n.language === 'en' ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null
                      }
                    >
                      English
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => {
                        i18n.changeLanguage('fr')
                      }}
                      style={{
                        color: isDark ? 'white' : 'black',
                        background:
                          i18n.language === 'fr'
                            ? isDark
                              ? 'rgba(32, 254, 107, 0.1)'
                              : 'rgba(32, 254, 107, 0.05)'
                            : 'transparent',
                      }}
                      leftSection={<FrIcon size={18} />}
                      rightSection={
                        i18n.language === 'fr' ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null
                      }
                    >
                      Français
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

                {/* Theme Selector */}
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={toggleColorScheme}
                  aria-label={t('home:footer.toggleTheme')}
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                    cursor: 'pointer',
                  }}
                >
                  {isDark ? (
                    <IconSun
                      style={{
                        width: rem(20),
                        height: rem(20),
                      }}
                    />
                  ) : (
                    <IconMoon
                      style={{
                        width: rem(20),
                        height: rem(20),
                      }}
                    />
                  )}
                </ActionIcon>
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
