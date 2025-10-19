import { Sparkline } from '@mantine/charts'
import {
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  RingProgress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCoins,
  IconExclamationCircle,
  IconInfoCircle,
  IconMoneybag,
  IconRefresh,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import dayjs from 'dayjs'
import classes from './InventoryCommandCenter.module.css'

interface HealthScore {
  current: number
  change: number
  previousScore: number
  breakdown: {
    stockLevelAdequacy: number
    turnoverRate: number
    agingInventory: number
    backorderRate: number
    supplierReliability: number
  }
  trend: Array<{ date: string; score: number }>
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

interface Alert {
  id: string
  type: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  title: string
  description: string
  financialImpact: number
  affectedProducts: string[]
  suggestedAction: string
  quickAction?: {
    label: string
    endpoint: string
    method: string
    params: Record<string, unknown>
  }
  daysUntilCritical?: number
  aiConfidence?: number
  createdAt: Date
}

interface RevenueOpportunity {
  id: string
  type: string
  title: string
  estimatedRevenue: number
  confidence: number
  products: Array<{
    id: string
    name: string
    currentStock: number
    suggestedStock: number
    unitPrice: number
  }>
  action: {
    label: string
    endpoint: string
    method: string
  }
  reasoning: string
  expiresAt?: Date
  createdAt: Date
}

interface Metrics {
  capitalTiedUp: {
    value: number
    change: number
    previousValue: number
    sparkline: number[]
  }
  revenueAtRisk: {
    value: number
    change: number
    previousValue: number
    sparkline: number[]
  }
  turnoverRate: {
    value: number
    change: number
    previousValue: number
    sparkline: number[]
  }
  deadStock: {
    value: number
    items: number
    change: number
    previousValue: number
    sparkline: number[]
  }
}

interface InventoryCommandCenterProps {
  agencyId?: string
  siteId?: string
  dateRange?: { startDate: string; endDate: string }
  healthScore?: HealthScore
  criticalAlerts?: Alert[]
  opportunities?: RevenueOpportunity[]
  metrics?: Metrics
  lastUpdated?: string
  onExecuteAction?: (alert: Alert) => void
  onAcceptOpportunity?: (opportunity: RevenueOpportunity) => void
}

export default function InventoryCommandCenter({
  agencyId,
  siteId,
  dateRange,
  healthScore: propHealthScore,
  criticalAlerts: propCriticalAlerts,
  opportunities: propOpportunities,
  metrics: propMetrics,
  lastUpdated: propLastUpdated,
  onExecuteAction,
  onAcceptOpportunity,
}: InventoryCommandCenterProps) {
  const { t } = useTranslation('dashboard')
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const fetcher = useFetcher()

  // Fetch data on mount if not provided via props
  useEffect(() => {
    if (!propHealthScore || !propCriticalAlerts || !propMetrics) {
      const params = new URLSearchParams()
      if (agencyId) params.append('agencyId', agencyId)
      if (siteId) params.append('siteId', siteId)
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate)
      
      // Only fetch if not already loading
      if (fetcher.state === 'idle') {
        fetcher.load(`/api/inventory/command-center?${params.toString()}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId, siteId, dateRange?.startDate, dateRange?.endDate])

  // Use fetched data or prop data
  const fetchedData = fetcher.data as
    | { healthScore?: any; alerts?: any[]; opportunities?: any[]; metrics?: any }
    | undefined

  const rawHealthScore = propHealthScore || fetchedData?.healthScore
  const healthScore = {
    current: rawHealthScore?.overall || rawHealthScore?.current || 0,
    change: rawHealthScore?.change || 0,
    previousScore: rawHealthScore?.previousScore || 0,
    breakdown: rawHealthScore?.breakdown || {
      stockLevelAdequacy: 0,
      turnoverRate: 0,
      agingInventory: 0,
      backorderRate: 0,
      supplierReliability: 0,
    },
    trend: rawHealthScore?.trend || [],
    rating: getRating(rawHealthScore?.overall || rawHealthScore?.current || 0),
  }

  const criticalAlerts = (propCriticalAlerts || fetchedData?.alerts || []).slice(0, 5)
  const opportunities = (propOpportunities || fetchedData?.opportunities || [])

  // Map API metrics to component metrics structure
  const apiMetrics = fetchedData?.metrics
  const metrics = propMetrics ||
    apiMetrics || {
      capitalTiedUp: {
        value: 0,
        change: 0,
        previousValue: 0,
        sparkline: [],
      },
      revenueAtRisk: {
        value: 0,
        change: 0,
        previousValue: 0,
        sparkline: [],
      },
      turnoverRate: {
        value: 0,
        change: 0,
        previousValue: 0,
        sparkline: [],
      },
      deadStock: {
        value: 0,
        items: 0,
        change: 0,
        previousValue: 0,
        sparkline: [],
      },
    }

  const lastUpdated = propLastUpdated || new Date().toISOString()
  const loading = fetcher.state === 'loading'

  function getRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    if (score >= 40) return 'poor'
    return 'critical'
  }

  const handleExecuteAction = async (alert: Alert) => {
    if (!alert.quickAction) return

    setExecutingAction(alert.id)
    try {
      if (onExecuteAction) {
        await onExecuteAction(alert)
      }
    } finally {
      setExecutingAction(null)
    }
  }

  const handleAcceptOpportunity = async (opportunity: RevenueOpportunity) => {
    if (onAcceptOpportunity) {
      await onAcceptOpportunity(opportunity)
    }
  }

  const getHealthColor = (rating: string) => {
    const colors = {
      excellent: 'green',
      good: 'blue',
      fair: 'yellow',
      poor: 'orange',
      critical: 'red',
    }
    return colors[rating as keyof typeof colors] || 'gray'
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      Critical: 'red',
      High: 'orange',
      Medium: 'yellow',
      Low: 'blue',
    }
    return colors[severity as keyof typeof colors] || 'gray'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  return (
    <div className={classes.root}>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2} className={classes.title}>
            <IconBolt size={24} style={{ marginRight: 8 }} />
            {t('inventoryCommandCenter')}
          </Title>
        </div>
      </Group>

      {/* Top Row: Health Score & Key Metrics */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg" mb="lg">
        {/* Health Score Card */}
        <Card className={classes.healthCard} padding="md" radius="md" withBorder>
          <Group justify="space-between" align="flex-start" mb={4}>
            <Text size="xs" c="dimmed">
              {t('healthScore')}
            </Text>
            <Tooltip
              label={
                <div>
                  <div style={{ marginBottom: 4 }}>{t('healthScoreTooltip')}:</div>
                  <div>• {t('stockLevelAdequacy')} (30%)</div>
                  <div>• {t('turnoverRate')} (25%)</div>
                  <div>• {t('agingInventory')} (20%)</div>
                  <div>• {t('backorderRate')} (15%)</div>
                  <div>• {t('supplierReliability')} (10%)</div>
                </div>
              }
              multiline
              w={250}
              withArrow
              position="top-end"
              styles={{
                tooltip: {
                  backgroundColor: 'var(--mantine-color-dark-5)',
                  color: 'var(--mantine-color-gray-0)',
                },
              }}
            >
              <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-dimmed)', cursor: 'pointer' }} />
            </Tooltip>
          </Group>
          <Stack align="center" gap="md">
            <RingProgress
              size={140}
              thickness={14}
              roundCaps
              sections={[
                {
                  value: healthScore.current,
                  color: getHealthColor(healthScore.rating),
                },
              ]}
              label={
                <div style={{ textAlign: 'center' }}>
                  <Text size="xl" fw={700}>
                    {healthScore.current}
                  </Text>
                  <Text size="xs" c="dimmed" tt="uppercase">
                    {healthScore.rating}
                  </Text>
                </div>
              }
            />

            {healthScore.change !== 0 && (
              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  Change:
                </Text>
                <Badge
                  size="sm"
                  color={healthScore.change >= 0 ? 'green' : 'red'}
                  variant="light"
                  leftSection={
                    healthScore.change >= 0 ? (
                      <IconArrowUpRight size={12} />
                    ) : (
                      <IconArrowUpRight size={12} style={{ transform: 'rotate(90deg)' }} />
                    )
                  }
                >
                  {formatChange(healthScore.change)}
                </Badge>
              </Group>
            )}

            {/* Sparkline */}
            {healthScore.trend && healthScore.trend.length > 0 && (
              <div style={{ width: '100%', height: 30 }}>
                <Sparkline
                  data={healthScore.trend.map((t: { score: number }) => t.score)}
                  color={getHealthColor(healthScore.rating)}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  curveType="natural"
                />
              </div>
            )}
          </Stack>
        </Card>

        {/* Key Metrics */}
        <MetricCard
          label={t('capitalTiedUp')}
          value={formatCurrency(metrics.capitalTiedUp.value)}
          change={metrics.capitalTiedUp.change}
          sparkline={metrics.capitalTiedUp.sparkline}
          color="blue"
          icon={IconCoins}
          tooltip={t('capitalTiedUpTooltip')}
        />
        <MetricCard
          label={t('revenueAtRisk')}
          value={formatCurrency(metrics.revenueAtRisk.value)}
          change={metrics.revenueAtRisk.change}
          sparkline={metrics.revenueAtRisk.sparkline}
          color="red"
          icon={IconMoneybag}
          tooltip={t('revenueAtRiskTooltip')}
        />
        <MetricCard
          label={t('turnoverRate')}
          value={`${metrics.turnoverRate.value}x`}
          change={metrics.turnoverRate.change}
          sparkline={metrics.turnoverRate.sparkline}
          color="green"
          icon={IconRefresh}
          tooltip={t('turnoverRateTooltip')}
        />
      </SimpleGrid>

      {/* Score Breakdown Section */}
      <Card padding="lg" radius="md" withBorder mb="lg">
        <Group justify="space-between" align="flex-start" mb="md">
          <Text size="sm" fw={600}>
            {t('healthScoreBreakdown')}
          </Text>
          <Tooltip
            label={
              <div>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>{t('healthScoreBreakdownTooltip')}:</div>
                <div>• <strong>{t('stockLevelAdequacy')}:</strong> {t('stockLevelDescription')}</div>
                <div>• <strong>{t('turnoverRate')}:</strong> {t('turnoverRateDescription')}</div>
                <div>• <strong>{t('agingInventory')}:</strong> {t('freshnessDescription')}</div>
                <div>• <strong>{t('backorderRate')}:</strong> {t('fulfillmentDescription')}</div>
                <div>• <strong>{t('supplierReliability')}:</strong> {t('supplierReliabilityDescription')}</div>
              </div>
            }
            multiline
            w={320}
            withArrow
            position="top-end"
            styles={{
              tooltip: {
                backgroundColor: 'var(--mantine-color-dark-5)',
                color: 'var(--mantine-color-gray-0)',
              },
            }}
          >
            <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-dimmed)', cursor: 'pointer' }} />
          </Tooltip>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
          {Object.entries(healthScore.breakdown).map(([key, value]) => {
            const numValue = Number(value)
            const factorRating = getRating(numValue)
            return (
              <div key={key}>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">
                    {formatBreakdownLabel(key)}
                  </Text>
                  <Text size="xs" fw={600}>
                    {numValue}
                  </Text>
                </Group>
                <Progress value={numValue} size="sm" color={getHealthColor(factorRating)} />
              </div>
            )
          })}
        </SimpleGrid>
      </Card>

      {/* Bottom Row: Critical Actions & Revenue Opportunities */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {/* Critical Actions - Compact Design */}
        <Card
          padding="md"
          radius="md"
          withBorder
          style={{ maxHeight: '400px', display: 'flex', flexDirection: 'column' }}
        >
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <IconAlertTriangle size={18} color="var(--mantine-color-red-6)" />
              <Text size="sm" fw={600}>{t('criticalActions')}</Text>
            </Group>
            <Badge size="sm" color="red">{criticalAlerts.length}</Badge>
          </Group>

          <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
            <Stack gap="xs" pr="sm">
              {criticalAlerts.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" py="md">
                  <IconCheck size={20} style={{ marginBottom: 4 }} />
                  <br />
                  {t('noCriticalAlerts')}
                </Text>
              ) : (
                criticalAlerts.map((alert, index) => (
                  <Paper key={alert.id} p="sm" withBorder className={classes.alertCard}>
                    <Group justify="space-between" align="flex-start" mb={4} wrap="nowrap">
                      <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <Badge size="xs" color={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.aiConfidence && (
                          <Tooltip label={`AI: ${(alert.aiConfidence * 100).toFixed(0)}%`}>
                            <Badge size="xs" variant="light" color="violet">
                              AI
                            </Badge>
                          </Tooltip>
                        )}
                      </Group>
                      {alert.financialImpact !== 0 && (
                        <Text size="xs" fw={600} c={alert.financialImpact > 0 ? 'green' : 'red'} style={{ whiteSpace: 'nowrap' }}>
                          {formatCurrency(alert.financialImpact)}
                        </Text>
                      )}
                    </Group>

                    <Text size="xs" fw={500} mb={4} lineClamp={1}>
                      {index + 1}. {alert.title}
                    </Text>

                    <Text size="xs" c="dimmed" mb="xs" lineClamp={1}>
                      {alert.description}
                    </Text>

                    <Group justify="space-between" align="center" gap="xs">
                      {alert.daysUntilCritical && (
                        <Text size="xs" c="orange">
                          ⏰ {alert.daysUntilCritical}d
                        </Text>
                      )}
                      {alert.quickAction && (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleExecuteAction(alert)}
                          loading={executingAction === alert.id}
                          rightSection={<IconChevronRight size={12} />}
                          style={{ marginLeft: 'auto' }}
                        >
                          {alert.quickAction.label}
                        </Button>
                      )}
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Card>

        {/* Revenue Opportunities - Compact Design */}
        <Card
          padding="md"
          radius="md"
          withBorder
          className={classes.opportunityCard}
          style={{ maxHeight: '400px', display: 'flex', flexDirection: 'column' }}
        >
          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <IconTrendingUp size={18} color="var(--mantine-color-green-6)" />
              <Text size="sm" fw={600}>{t('revenueOpportunities')}</Text>
            </Group>
            <Badge size="sm" color="green">{opportunities.length}</Badge>
          </Group>

          <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
            <Stack gap="xs" pr="sm">
              {opportunities.length === 0 ? (
                <Text size="xs" c="dimmed" ta="center" py="md">
                  <IconExclamationCircle size={20} style={{ marginBottom: 4 }} />
                  <br />
                  {t('noOpportunitiesDetected')}
                </Text>
              ) : (
                opportunities.map((opp) => (
                  <Paper key={opp.id} p="sm" withBorder className={classes.oppCard}>
                    <Group justify="space-between" mb={4} align="flex-start" wrap="nowrap">
                      <Text size="xs" fw={500} style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
                        {opp.title}
                      </Text>
                      <Badge size="xs" color="green" variant="light" style={{ flexShrink: 0 }}>
                        +{formatCurrency(opp.estimatedRevenue)}
                      </Badge>
                    </Group>

                    <Text size="xs" c="dimmed" mb="xs" lineClamp={1}>
                      {opp.reasoning}
                    </Text>

                    <Group justify="space-between" align="center">
                      <Text size="xs" c="dimmed">
                        {(opp.confidence * 100).toFixed(0)}% {t('confidence')}
                      </Text>
                      <Button
                        size="xs"
                        variant="filled"
                        color="green"
                        onClick={() => handleAcceptOpportunity(opp)}
                        rightSection={<IconChevronRight size={12} />}
                      >
                        {opp.action.label}
                      </Button>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Card>
      </SimpleGrid>
    </div>
  )
}

// Helper component for metric cards
function MetricCard({
  label,
  value,
  change,
  sparkline,
  color,
  subtitle,
  tooltip,
  icon: Icon,
}: {
  label: string
  value: string
  change: number
  sparkline: number[]
  color: string
  subtitle?: string
  tooltip?: string
  icon?: React.ComponentType<{ size?: number; stroke?: number }>
}) {
  return (
    <Card padding="md" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" mb="xs">
        {Icon && (
          <ThemeIcon size="lg" radius="md" variant="light" color={color}>
            <Icon size={20} stroke={1.5} />
          </ThemeIcon>
        )}
        {tooltip && (
          <Tooltip
            label={tooltip}
            multiline
            w={230}
            withArrow
            position="top-end"
            styles={{
              tooltip: {
                backgroundColor: 'var(--mantine-color-dark-5)',
                color: 'var(--mantine-color-gray-0)',
              },
            }}
          >
            <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-dimmed)', cursor: 'pointer' }} />
          </Tooltip>
        )}
      </Group>
      <Text size="xs" c="dimmed" mb={4}>
        {label}
      </Text>
      <Text size="lg" fw={700} mb={4}>
        {value}
      </Text>
      {subtitle && (
        <Text size="xs" c="dimmed" mb={8}>
          {subtitle}
        </Text>
      )}
      <Group justify="space-between" align="flex-end">
        {change !== 0 && (
          <Badge size="sm" color={change >= 0 ? 'green' : 'red'} variant="light">
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </Badge>
        )}
        <div style={{ width: 60, height: 20 }}>
          <Sparkline
            data={sparkline}
            color={color}
            fillOpacity={0.2}
            strokeWidth={1.5}
            curveType="natural"
          />
        </div>
      </Group>
    </Card>
  )
}

// Helper function to format breakdown labels
function formatBreakdownLabel(key: string): string {
  const labels: Record<string, string> = {
    stockLevelAdequacy: 'Stock Level',
    turnoverRate: 'Turnover Rate',
    agingInventory: 'Freshness',
    backorderRate: 'Fulfillment',
    supplierReliability: 'Supplier Reliability',
  }
  return labels[key] || key
}
