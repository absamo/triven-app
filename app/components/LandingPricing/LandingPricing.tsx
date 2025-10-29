import {
  Badge,
  Button,
  Container,
  Grid,
  Group,
  List,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useState } from 'react'
import classes from './LandingPricing.module.css'

interface PricingTier {
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: {
    salesOrders: string
    purchaseOrders: string
    users: string
    agencies: string
    sites: string
    reporting: string
    additionalFeatures: string[]
  }
  mostPopular?: boolean
  cta: string
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Standard',
    monthlyPrice: 29,
    yearlyPrice: 19,
    description: 'Perfect for small businesses getting started',
    features: {
      salesOrders: 'Up to 100/month',
      purchaseOrders: 'Up to 50/month',
      users: '1 user',
      agencies: '1 agency',
      sites: '1 site',
      reporting: 'Basic reports',
      additionalFeatures: [
        'Inventory tracking',
        'Order management',
        'Email notifications',
        'Mobile access',
      ],
    },
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    monthlyPrice: 39,
    yearlyPrice: 26,
    description: 'Best for growing businesses with multiple sites',
    features: {
      salesOrders: 'Up to 500/month',
      purchaseOrders: 'Up to 200/month',
      users: 'Up to 5 users',
      agencies: 'Up to 3 agencies',
      sites: 'Up to 3 sites',
      reporting: 'Advanced reports + exports',
      additionalFeatures: [
        'Everything in Standard',
        'AI-powered insights',
        'Real-time alerts',
        'Advanced analytics',
        'Priority support',
        'Audit trails',
      ],
    },
    mostPopular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Premium',
    monthlyPrice: 99,
    yearlyPrice: 66,
    description: 'For enterprises needing unlimited capabilities',
    features: {
      salesOrders: 'Unlimited',
      purchaseOrders: 'Unlimited',
      users: 'Unlimited',
      agencies: 'Unlimited',
      sites: 'Unlimited',
      reporting: 'Custom reports + API access',
      additionalFeatures: [
        'Everything in Professional',
        'Automated workflows',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'SLA guarantee',
        'Custom training',
      ],
    },
    cta: 'Start Free Trial',
  },
]

export function LandingPricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const calculateSavings = (tier: PricingTier) => {
    const monthlyTotal = tier.monthlyPrice * 12
    const yearlyTotal = tier.yearlyPrice * 12
    const savings = Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100)
    return savings
  }

  return (
    <section className={classes.section}>
      <Container size="xl">
        <Stack gap={50}>
          {/* Header */}
          <Stack gap="md" align="center">
            <Title className={classes.title}>Simple, Transparent Pricing</Title>
            <Text className={classes.subtitle} maw={600}>
              Choose the plan that fits your business. All plans include a 14-day free trial. No
              credit card required.
            </Text>

            {/* Billing Toggle */}
            <Group gap="sm" mt="md">
              <SegmentedControl
                value={billingCycle}
                onChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
                data={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
                size="md"
                className={classes.toggle}
              />
              {billingCycle === 'yearly' && (
                <Badge color="green" size="lg" variant="filled" className={classes.savingsBadge}>
                  Save up to 33%
                </Badge>
              )}
            </Group>
          </Stack>

          {/* Pricing Cards */}
          <Grid gutter="lg">
            {pricingTiers.map((tier) => (
              <Grid.Col key={tier.name} span={{ base: 12, sm: 6, md: 4 }}>
                <Paper
                  className={`${classes.card} ${tier.mostPopular ? classes.popular : ''}`}
                  shadow="md"
                  radius="md"
                  p="xl"
                >
                  <Stack gap="lg" h="100%">
                    {/* Header */}
                    <div>
                      <Group justify="space-between" align="flex-start" mb="xs">
                        <Title order={3} className={classes.tierName}>
                          {tier.name}
                        </Title>
                        {tier.mostPopular && (
                          <Badge color="green" variant="filled" size="lg">
                            Most Popular
                          </Badge>
                        )}
                      </Group>
                      <Text c="dimmed" size="sm">
                        {tier.description}
                      </Text>
                    </div>

                    {/* Pricing */}
                    <div>
                      <Group align="baseline" gap={4}>
                        <Text className={classes.price}>
                          ${billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                        </Text>
                        <Text c="dimmed" size="sm">
                          /month
                        </Text>
                      </Group>
                      {billingCycle === 'yearly' && (
                        <Text size="xs" c="dimmed" mt={4}>
                          ${tier.yearlyPrice * 12}/year · Save {calculateSavings(tier)}%
                        </Text>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      component="a"
                      href={`/signup?plan=${tier.name.toLowerCase()}`}
                      size="md"
                      fullWidth
                      variant={tier.mostPopular ? 'filled' : 'outline'}
                      color={tier.mostPopular ? 'green' : 'gray'}
                      className={classes.cta}
                    >
                      {tier.cta}
                    </Button>

                    {/* Features */}
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text size="sm" fw={600} mb="xs">
                        What's included:
                      </Text>
                      <List
                        spacing="xs"
                        size="sm"
                        icon={
                          <ThemeIcon color="green" size={20} radius="xl" variant="light">
                            <IconCheck size={14} />
                          </ThemeIcon>
                        }
                      >
                        <List.Item>
                          <Text size="sm">
                            <strong>Sales Orders:</strong> {tier.features.salesOrders}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Purchase Orders:</strong> {tier.features.purchaseOrders}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Users:</strong> {tier.features.users}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Agencies:</strong> {tier.features.agencies}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Sites:</strong> {tier.features.sites}
                          </Text>
                        </List.Item>
                        <List.Item>
                          <Text size="sm">
                            <strong>Reporting:</strong> {tier.features.reporting}
                          </Text>
                        </List.Item>
                        {tier.features.additionalFeatures.map((feature) => (
                          <List.Item key={feature}>
                            <Text size="sm">{feature}</Text>
                          </List.Item>
                        ))}
                      </List>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>

          {/* Enterprise Card */}
          <Paper className={classes.enterpriseCard} shadow="sm" radius="md" p="xl">
            <Grid align="center" gutter="lg">
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="sm">
                  <Title order={3}>Enterprise</Title>
                  <Text c="dimmed">
                    Need custom limits, dedicated infrastructure, or on-premise deployment? We'll
                    create a custom plan tailored to your organization's needs.
                  </Text>
                  <List
                    spacing="xs"
                    size="sm"
                    mt="md"
                    icon={
                      <ThemeIcon color="blue" size={20} radius="xl" variant="light">
                        <IconCheck size={14} />
                      </ThemeIcon>
                    }
                  >
                    <List.Item>Custom usage limits</List.Item>
                    <List.Item>On-premise deployment options</List.Item>
                    <List.Item>White-label capabilities</List.Item>
                    <List.Item>Dedicated success team</List.Item>
                    <List.Item>Custom SLA agreements</List.Item>
                  </List>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Button
                  component="a"
                  href="#demo"
                  size="lg"
                  fullWidth
                  variant="outline"
                  className={classes.enterpriseCta}
                >
                  Contact Sales
                </Button>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </section>
  )
}
