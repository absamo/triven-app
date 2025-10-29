// Landing Features Component
// User Story 4: Feature Discovery and Differentiation
// Showcases key features with AI differentiation

import { Container, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconBell,
  IconBrain,
  IconChartBar,
  IconClock,
  IconEye,
  IconRobot,
  IconShieldCheck,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react'
import classes from './LandingFeatures.module.css'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  highlight?: boolean
}

const heroFeatures: Feature[] = [
  {
    icon: <IconBrain size={32} />,
    title: 'AI-Powered Insights',
    description:
      'Smart algorithms analyze your inventory patterns, predict demand, and suggest optimal reorder points automatically.',
    highlight: true,
  },
  {
    icon: <IconEye size={32} />,
    title: 'Real-Time Visibility',
    description:
      'See every item, every location, every movement. Live updates ensure your data is always accurate and up-to-date.',
    highlight: true,
  },
  {
    icon: <IconTrendingUp size={32} />,
    title: 'Growth Optimization',
    description:
      'Identify opportunities, eliminate waste, and maximize profitability with data-driven recommendations.',
    highlight: true,
  },
]

const secondaryFeatures: Feature[] = [
  {
    icon: <IconRobot size={24} />,
    title: 'Automated Workflows',
    description:
      'Set up smart workflows that trigger actions based on inventory levels and business rules.',
  },
  {
    icon: <IconBell size={24} />,
    title: 'Smart Alerts',
    description:
      'Get notified about low stock, expiring items, and unusual patterns before they become problems.',
  },
  {
    icon: <IconChartBar size={24} />,
    title: 'Advanced Analytics',
    description:
      'Deep insights into turnover rates, profitability, and trends with customizable dashboards.',
  },
  {
    icon: <IconShieldCheck size={24} />,
    title: 'Audit Trails',
    description:
      'Complete visibility into who changed what and when, ensuring accountability and compliance.',
  },
  {
    icon: <IconClock size={24} />,
    title: 'Time Savings',
    description:
      'Automate manual tasks and reduce time spent on inventory management by up to 75%.',
  },
  {
    icon: <IconUsers size={24} />,
    title: 'Team Collaboration',
    description:
      'Multi-user access with role-based permissions keeps everyone aligned and productive.',
  },
]

export function LandingFeatures() {
  return (
    <section className={classes.section} aria-label="Product features">
      <Container size="lg">
        <Stack gap="xl">
          {/* Section Header */}
          <div className={classes.header}>
            <Title className={classes.title} order={2} ta="center">
              Everything You Need to Master Inventory
            </Title>
            <Text className={classes.subtitle} size="lg" c="dimmed" ta="center" maw={700} mx="auto">
              Powerful features that work together to give you complete control over your inventory
            </Text>
          </div>

          {/* Hero Features */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" className={classes.heroGrid}>
            {heroFeatures.map((feature, index) => (
              <Paper
                key={feature.title}
                className={classes.heroFeatureCard}
                p="xl"
                radius="md"
                withBorder
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Stack gap="md">
                  <ThemeIcon size={64} radius="md" className={classes.heroIcon}>
                    {feature.icon}
                  </ThemeIcon>

                  <div>
                    <Text className={classes.heroFeatureTitle} fw={700} size="lg">
                      {feature.title}
                    </Text>
                    <Text className={classes.featureDescription} size="sm" mt="xs">
                      {feature.description}
                    </Text>
                  </div>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>

          {/* Secondary Features */}
          <div className={classes.secondarySection}>
            <Title className={classes.secondaryTitle} order={3} ta="center" mt={60} mb={40}>
              Plus All These Powerful Capabilities
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {secondaryFeatures.map((feature, index) => (
                <Paper
                  key={feature.title}
                  className={classes.secondaryFeatureCard}
                  p="lg"
                  radius="md"
                  withBorder
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Stack gap="sm">
                    <ThemeIcon size={48} radius="md" className={classes.secondaryIcon}>
                      {feature.icon}
                    </ThemeIcon>

                    <div>
                      <Text className={classes.secondaryFeatureTitle} fw={600}>
                        {feature.title}
                      </Text>
                      <Text className={classes.featureDescription} size="sm" mt={4}>
                        {feature.description}
                      </Text>
                    </div>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </div>
        </Stack>
      </Container>
    </section>
  )
}
