import { Badge, Flex, Group, Paper, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core'
import { IconArrowDownRight, IconArrowUpRight, IconInfoCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'

interface InventoryStats {
  inventory: {
    totalProductsInStock: number
    totalProductsInStockDiff: number
    productsInStockValue: number
    productsInStockValueDiff: number
    accuracyPercentage: number
    accurateItems: number
    inaccurateItems: number
    totalItemsTracked: number
    totalPhysicalStock: number
    totalAccountingStock: number
    reorderPointAlerts: number
    deadStockValue: number
    deadStockItems: number
  }
}

export default function InventoryStats({ inventory }: InventoryStats) {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get current agency ID from dashboard context
  const currentAgency = searchParams.get('agency')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  // Helper function to get accuracy status and color
  const getAccuracyStatus = (percentage: number) => {
    if (percentage >= 95) return { color: 'green', status: 'excellent' }
    if (percentage >= 85) return { color: 'yellow', status: 'good' }
    return { color: 'red', status: 'poor' }
  }

  // Helper function to build products URL with agency context preserved
  const buildProductsUrl = (filterParams: string) => {
    // Only include agency parameter if it's set and not "All"
    if (currentAgency && currentAgency !== 'All') {
      const separator = filterParams.includes('?') ? '&' : '?'
      return `/products${filterParams}${separator}agency=${currentAgency}`
    }
    return `/products${filterParams}`
  }

  // Navigation handlers for different metrics
  const handleTotalValueClick = () => {
    // Navigate to products page showing all products with stock
    navigate(buildProductsUrl('?statuses=["Available","LowStock","Critical"]'))
  }

  const handleAccuracyClick = () => {
    // Navigate to products page showing inaccurate items
    navigate(buildProductsUrl('?accuracyFilter=true'))
  }

  const handleReorderAlertsClick = () => {
    // Navigate to products page showing products that need reordering
    navigate(buildProductsUrl('?reorderAlert=true'))
  }

  const handleDeadStockClick = () => {
    // Navigate to products page showing dead stock items
    navigate(buildProductsUrl('?deadStock=true'))
  }

  // Calculate average percentage for combined metric
  const avgPercentageDiff = Math.round(
    (inventory.totalProductsInStockDiff + inventory.productsInStockValueDiff) / 2
  )
  const DiffIcon = avgPercentageDiff > 0 ? IconArrowUpRight : IconArrowDownRight
  const accuracyStatus = getAccuracyStatus(inventory.accuracyPercentage)

  return (
    <Paper withBorder p="md" radius="md" mb={0} shadow="sm">
      <Group justify="space-between" align="flex-start" mb="md">
        <Title order={5}>{t('inventoryOverview')}</Title>
      </Group>

      <Stack gap="xl" mt={25}>
        <Flex justify="space-between" gap="xl">
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text c="dimmed" fz="sm" tt="uppercase" fw={500}>
                {t('totalValue')}
              </Text>
              {inventory.productsInStockValueDiff !== 0 && (
                <Group gap={4}>
                  <ThemeIcon
                    size="xs"
                    variant="transparent"
                    c={inventory.productsInStockValueDiff > 0 ? 'teal' : 'red'}
                  >
                    {inventory.productsInStockValueDiff > 0 ? (
                      <IconArrowUpRight style={{ width: 12, height: 12 }} />
                    ) : (
                      <IconArrowDownRight style={{ width: 12, height: 12 }} />
                    )}
                  </ThemeIcon>
                  <Text
                    size="xs"
                    c={inventory.productsInStockValueDiff > 0 ? 'teal' : 'red'}
                    fw={500}
                  >
                    {Math.abs(inventory.productsInStockValueDiff)}%{' '}
                    {inventory.productsInStockValueDiff > 0 ? t('increase') : t('decrease')}{' '}
                    {t('comparedToLastMonth')}
                  </Text>
                </Group>
              )}
            </Group>
            <Group gap="xs" align="center">
              <Text
                fw={700}
                fz="xl"
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={handleTotalValueClick}
              >
                {formatCurrency(inventory.productsInStockValue)}
              </Text>
              <Badge color="blue" variant="light" size="sm">
                {formatNumber(inventory.totalProductsInStock)} {t('items')}
              </Badge>
            </Group>
          </div>
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text c="dimmed" fz="sm" tt="uppercase" fw={500}>
                {t('inventoryAccuracy')}
              </Text>
              <Tooltip
                position="top"
                withArrow
                multiline
                w={320}
                label={
                  <div>
                    <Text size="sm" fw={500} mb={6}>
                      {t('inventoryAccuracy')}
                    </Text>{' '}
                    <Text size="xs" c="dimmed" mb={8}>
                      {t('inventoryAccuracyTooltip')}
                    </Text>
                    <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #e9ecef' }}>
                      <Text size="xs" fw={500} mb={4}>
                        {t('calculationDetails')}
                      </Text>
                      <Text size="xs" mb={2}>
                        • {t('totalProducts')} {inventory.totalItemsTracked} {t('items')}
                      </Text>
                      <Text size="xs" mb={2}>
                        • {t('accurateItems')} {inventory.accurateItems} {t('items')} (
                        {t('wherePhysicalEqualsAccounting')})
                      </Text>
                      <Text size="xs" mb={2}>
                        • {t('inaccurateItems')} {inventory.inaccurateItems} {t('items')} (
                        {t('whereTheresDifference')})
                      </Text>
                      <Text size="xs" fw={500}>
                        • {t('accuracyPercentage')} {inventory.accurateItems}/
                        {inventory.totalItemsTracked} = {inventory.accuracyPercentage}%
                      </Text>
                    </div>
                  </div>
                }
              >
                <ThemeIcon radius="xl" size="xs" variant="transparent" c="dimmed">
                  <IconInfoCircle style={{ width: 14, height: 14 }} />
                </ThemeIcon>
              </Tooltip>
            </Group>
            <Group gap="xs" align="center">
              <Text
                fw={700}
                fz="xl"
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={handleAccuracyClick}
              >
                {inventory.accuracyPercentage}%
              </Text>
              <Badge color={accuracyStatus.color} variant="light" size="sm">
                {inventory.accurateItems}/{inventory.totalItemsTracked}
              </Badge>
            </Group>
          </div>
        </Flex>
        <Flex justify="space-between" gap="xl">
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text c="dimmed" fz="sm" tt="uppercase" fw={500}>
                {t('reorderPointAlerts')}
              </Text>
              <Tooltip
                position="top"
                withArrow
                multiline
                w={280}
                label={
                  <div>
                    <Text size="sm" fw={500} mb={6}>
                      {t('reorderPointAlerts')}
                    </Text>
                    <Text size="xs" c="dimmed" mb={8}>
                      {t('reorderPointAlertsTooltip')}
                    </Text>
                  </div>
                }
              >
                <ThemeIcon radius="xl" size="xs" variant="transparent" c="dimmed">
                  <IconInfoCircle style={{ width: 14, height: 14 }} />
                </ThemeIcon>
              </Tooltip>
            </Group>
            <Group gap="xs" align="center">
              <Text
                fw={700}
                fz="xl"
                c={inventory.reorderPointAlerts > 0 ? 'orange' : 'dimmed'}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={handleReorderAlertsClick}
              >
                {inventory.reorderPointAlerts}
              </Text>
              <Badge
                color={inventory.reorderPointAlerts > 0 ? 'orange' : 'gray'}
                variant="light"
                size="sm"
              >
                {inventory.reorderPointAlerts > 0 ? t('actionRequired') : t('allGood')}
              </Badge>
            </Group>
          </div>
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text c="dimmed" fz="sm" tt="uppercase" fw={500}>
                {t('deadStockValue')}
              </Text>
              <Tooltip
                position="top"
                withArrow
                multiline
                w={300}
                label={
                  <div>
                    <Text size="sm" fw={500} mb={6}>
                      {t('deadStockValue')}
                    </Text>
                    <Text size="xs" c="dimmed" mb={8}>
                      {t('deadStockValueTooltip')}
                    </Text>
                    <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #e9ecef' }}>
                      <Text size="xs" fw={500} mb={4}>
                        {t('details')}
                      </Text>
                      <Text size="xs" mb={2}>
                        • {t('deadStockItems')} {inventory.deadStockItems} {t('products')}
                      </Text>
                      <Text size="xs">• {t('noSalesAdjustmentsLast90Days')}</Text>
                    </div>
                  </div>
                }
              >
                <ThemeIcon radius="xl" size="xs" variant="transparent" c="dimmed">
                  <IconInfoCircle style={{ width: 14, height: 14 }} />
                </ThemeIcon>
              </Tooltip>
            </Group>
            <Group gap="xs" align="center">
              <Text
                fw={700}
                fz="xl"
                c={inventory.deadStockValue > 0 ? 'red' : 'dimmed'}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={handleDeadStockClick}
              >
                {formatCurrency(inventory.deadStockValue)}
              </Text>
              <Badge
                color={inventory.deadStockValue > 0 ? 'red' : 'gray'}
                variant="light"
                size="sm"
              >
                {inventory.deadStockItems} {t('items')}
              </Badge>
            </Group>
          </div>
        </Flex>
      </Stack>
    </Paper>
  )
}
