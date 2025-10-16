import { Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconShoppingCart, IconTruckDelivery } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

interface OrderStatsProps {
  orders: {
    pendingSalesOrders: number
    pendingPurchaseOrders: number
    recentSalesTotal: number
    recentPurchasesTotal: number
    ordersComparisonPercentage: number
  }
}

export default function OrderStats({ orders }: OrderStatsProps) {
  const { t } = useTranslation('dashboard')
  const [searchParams] = useSearchParams()

  // Check if date filters are applied
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const data = [
    {
      title: t('pendingSalesOrders'),
      value: orders.pendingSalesOrders,
      icon: IconShoppingCart,
      color: 'blue',
    },
    {
      title: t('pendingPurchaseOrders'),
      value: orders.pendingPurchaseOrders,
      icon: IconTruckDelivery,
      color: 'cyan',
    },
  ]

  return (
    <Paper withBorder p="lg" radius="md" shadow="xs">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={4} fw={600}>
          {t('ordersOverview')}
        </Title>
      </Group>

      <Stack gap="lg">
        {data.map((stat) => (
          <Group key={stat.title} justify="space-between" wrap="nowrap" gap="md">
            <Group gap="sm">
              <ThemeIcon color={stat.color} variant="light" size="xl" radius="md">
                <stat.icon size="1.4rem" stroke={1.5} />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" mb={2}>
                  {stat.title}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
            </Group>
          </Group>
        ))}

        {/* Always show order totals with dynamic labels */}
        <Stack
          gap="sm"
          mt="md"
          pt="md"
          style={{ borderTop: '1px solid light-dark(#e2e8f0, var(--mantine-color-dark-4))' }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>
              {t('salesTotal')}
            </Text>
            <Text fw={600} size="md" c="teal">
              ${orders.recentSalesTotal.toLocaleString()}
            </Text>
          </Group>

          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>
              {t('purchaseTotal')}
            </Text>
            <Text fw={600} size="md" c="blue">
              ${orders.recentPurchasesTotal.toLocaleString()}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Paper>
  )
}
