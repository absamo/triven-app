import { Badge, Flex, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core'
import { 
  IconArrowDownRight, 
  IconArrowUpRight, 
  IconInfoCircle,
  IconAlertTriangle,
  IconPackage,
  IconTrendingUp,
  IconCheckbox
} from '@tabler/icons-react'
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
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={4} fw={600}>{t('inventoryOverview')}</Title>
          <Text size="sm" c="dimmed" mt={4}>{t('inventoryOverviewTooltip')}</Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {/* Total Value Card */}
        <Paper 
          withBorder 
          p="lg" 
          radius="md" 
          shadow="xs"
          style={{ 
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ''
          }}
          onClick={handleTotalValueClick}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                <IconPackage size={24} stroke={1.5} />
              </ThemeIcon>
              {inventory.productsInStockValueDiff !== 0 && (
                <Badge 
                  color={inventory.productsInStockValueDiff > 0 ? 'teal' : 'red'} 
                  variant="light" 
                  size="sm"
                  leftSection={
                    inventory.productsInStockValueDiff > 0 ? (
                      <IconArrowUpRight size={12} />
                    ) : (
                      <IconArrowDownRight size={12} />
                    )
                  }
                >
                  {Math.abs(inventory.productsInStockValueDiff)}%
                </Badge>
              )}
            </Group>
            <div>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                {t('totalValue')}
              </Text>
              <Text size="xl" fw={700} mb={4}>
                {formatCurrency(inventory.productsInStockValue)}
              </Text>
              <Text size="xs" c="dimmed">
                {formatNumber(inventory.totalProductsInStock)} {t('items')}
              </Text>
            </div>
          </Stack>
        </Paper>

        {/* Inventory Accuracy Card */}
        <Paper 
          withBorder 
          p="lg" 
          radius="md" 
          shadow="xs"
          style={{ 
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ''
          }}
          onClick={handleAccuracyClick}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <ThemeIcon size="xl" radius="md" variant="light" color={accuracyStatus.color}>
                <IconCheckbox size={24} stroke={1.5} />
              </ThemeIcon>
              <Tooltip
                position="top"
                withArrow
                multiline
                w={320}
                label={
                  <div>
                    <Text size="sm" fw={500} mb={6}>
                      {t('inventoryAccuracy')}
                    </Text>
                    <Text size="xs" c="dimmed" mb={8}>
                      {t('inventoryAccuracyTooltip')}
                    </Text>
                    <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #e9ecef' }}>
                      <Text size="xs" fw={500} mb={4}>
                        {t('calculationDetails')}
                      </Text>
                      <Text size="xs" mb={2}>
                        • {t('accurateItems')} {inventory.accurateItems} / {inventory.totalItemsTracked}
                      </Text>
                      <Text size="xs">
                        • {t('inaccurateItems')} {inventory.inaccurateItems} {t('items')}
                      </Text>
                    </div>
                  </div>
                }
              >
                <ThemeIcon radius="xl" size="sm" variant="transparent" c="dimmed">
                  <IconInfoCircle size={16} />
                </ThemeIcon>
              </Tooltip>
            </Group>
            <div>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                {t('inventoryAccuracy')}
              </Text>
              <Text size="xl" fw={700} c={accuracyStatus.color} mb={4}>
                {inventory.accuracyPercentage}%
              </Text>
              <Text size="xs" c="dimmed">
                {inventory.accurateItems}/{inventory.totalItemsTracked} {t('accurate')}
              </Text>
            </div>
          </Stack>
        </Paper>

        {/* Reorder Alerts Card */}
        <Paper 
          withBorder 
          p="lg" 
          radius="md" 
          shadow="xs"
          style={{ 
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ''
          }}
          onClick={handleReorderAlertsClick}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <ThemeIcon 
                size="xl" 
                radius="md" 
                variant="light" 
                color={inventory.reorderPointAlerts > 0 ? 'orange' : 'gray'}
              >
                <IconAlertTriangle size={24} stroke={1.5} />
              </ThemeIcon>
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
                    <Text size="xs" c="dimmed">
                      {t('reorderPointAlertsTooltip')}
                    </Text>
                  </div>
                }
              >
                <ThemeIcon radius="xl" size="sm" variant="transparent" c="dimmed">
                  <IconInfoCircle size={16} />
                </ThemeIcon>
              </Tooltip>
            </Group>
            <div>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                {t('reorderPointAlerts')}
              </Text>
              <Text 
                size="xl" 
                fw={700} 
                c={inventory.reorderPointAlerts > 0 ? 'orange' : 'dimmed'}
                mb={4}
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
            </div>
          </Stack>
        </Paper>

        {/* Dead Stock Card */}
        <Paper 
          withBorder 
          p="lg" 
          radius="md" 
          shadow="xs"
          style={{ 
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ''
          }}
          onClick={handleDeadStockClick}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <ThemeIcon 
                size="xl" 
                radius="md" 
                variant="light" 
                color={inventory.deadStockValue > 0 ? 'red' : 'gray'}
              >
                <IconTrendingUp size={24} stroke={1.5} style={{ transform: 'rotate(180deg)' }} />
              </ThemeIcon>
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
                        • {inventory.deadStockItems} {t('products')}
                      </Text>
                      <Text size="xs">• {t('noSalesAdjustmentsLast90Days')}</Text>
                    </div>
                  </div>
                }
              >
                <ThemeIcon radius="xl" size="sm" variant="transparent" c="dimmed">
                  <IconInfoCircle size={16} />
                </ThemeIcon>
              </Tooltip>
            </Group>
            <div>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                {t('deadStockValue')}
              </Text>
              <Text 
                size="xl" 
                fw={700} 
                c={inventory.deadStockValue > 0 ? 'red' : 'dimmed'}
                mb={4}
              >
                {formatCurrency(inventory.deadStockValue)}
              </Text>
              <Text size="xs" c="dimmed">
                {inventory.deadStockItems} {t('items')}
              </Text>
            </div>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}
