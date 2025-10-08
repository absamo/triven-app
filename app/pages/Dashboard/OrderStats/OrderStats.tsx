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
    <Paper withBorder p="md" radius="md" mb={0} shadow="sm">
      <Group justify="space-between" align="flex-start" mb="md">
        <Title order={5}>{t('ordersOverview')}</Title>
      </Group>

      <Stack gap="md">
        {data.map((stat) => (
          <Group key={stat.title} justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <ThemeIcon color={stat.color} variant="light" size="lg" radius="md">
                <stat.icon size="1.2rem" stroke={1.5} />
              </ThemeIcon>
              <Text fw={500}>{stat.title}</Text>
            </Group>
            <Text fw={700} size="lg">
              {stat.value}
            </Text>
          </Group>
        ))}

        {/* Always show order totals with dynamic labels */}
        <Group
          justify="space-between"
          wrap="nowrap"
          mt="xs"
          pt="xs"
          style={{ borderTop: '1px solid #e2e8f0' }}
        >
          <Text size="sm" c="dimmed">
            {t('salesTotal')}
          </Text>
          <Text fw={600} size="sm">
            ${orders.recentSalesTotal.toLocaleString()}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {t('purchaseTotal')}
          </Text>
          <Text fw={600} size="sm">
            ${orders.recentPurchasesTotal.toLocaleString()}
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
