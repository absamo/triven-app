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
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconExclamationCircle,
  IconInfoCircle,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
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
  const opportunities = (propOpportunities || fetchedData?.opportunities || []).slice(0, 3)

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
            Inventory Command Center
          </Title>
          <Text size="xs" c="dimmed">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        </div>
      </Group>

      {/* Top Row: Health Score & Key Metrics */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg" mb="lg">
        {/* Health Score Card */}
        <Card className={classes.healthCard} padding="md" radius="md" withBorder>
          <Group justify="space-between" align="flex-start" mb={4}>
            <Text size="xs" c="dimmed">
              Health Score
            </Text>
            <Tooltip
              label={
                <div>
                  <div style={{ marginBottom: 4 }}>0-100 rating measuring inventory health:</div>
                  <div>• Stock Level (30%)</div>
                  <div>• Turnover Rate (25%)</div>
                  <div>• Freshness (20%)</div>
                  <div>• Fulfillment (15%)</div>
                  <div>• Supplier Reliability (10%)</div>
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
          label="Capital Tied Up"
          value={formatCurrency(metrics.capitalTiedUp.value)}
          change={metrics.capitalTiedUp.change}
          sparkline={metrics.capitalTiedUp.sparkline}
          color="blue"
          tooltip="Total inventory value sitting on your shelves. Lower is better - means you're not over-investing in stock."
        />
        <MetricCard
          label="Revenue at Risk"
          value={formatCurrency(metrics.revenueAtRisk.value)}
          change={metrics.revenueAtRisk.change}
          sparkline={metrics.revenueAtRisk.sparkline}
          color="red"
          tooltip="Potential lost sales from out-of-stock items. Shows revenue you could earn if you had these products available."
        />
        <MetricCard
          label="Turnover Rate"
          value={`${metrics.turnoverRate.value}x`}
          change={metrics.turnoverRate.change}
          sparkline={metrics.turnoverRate.sparkline}
          color="green"
          tooltip="How many times per year you sell through your inventory. Higher is better - means inventory moves quickly and generates cash."
        />
      </SimpleGrid>

      {/* Score Breakdown Section */}
      <Card padding="lg" radius="md" withBorder mb="lg">
        <Group justify="space-between" align="flex-start" mb="md">
          <Text size="sm" fw={600}>
            Health Score Breakdown
          </Text>
          <Tooltip
            label={
              <div>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>Five factors contributing to your Health Score:</div>
                <div>• <strong>Stock Level:</strong> How well stocked you are vs. demand</div>
                <div>• <strong>Turnover Rate:</strong> How quickly inventory sells</div>
                <div>• <strong>Freshness:</strong> Age of inventory (newer is better)</div>
                <div>• <strong>Fulfillment:</strong> Ability to fulfill orders without delays</div>
                <div>• <strong>Supplier Reliability:</strong> On-time delivery performance</div>
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
        {/* Critical Actions with ScrollArea */}
        <Card
          padding="lg"
          radius="md"
          withBorder
          style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
        >
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
              <Text fw={600}>Critical Actions</Text>
            </Group>
            <Badge color="red">{criticalAlerts.length}</Badge>
          </Group>

          <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
            <Stack gap="md" pr="md">
              {criticalAlerts.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  <IconCheck size={24} style={{ marginBottom: 8 }} />
                  <br />
                  No critical alerts
                </Text>
              ) : (
                criticalAlerts.map((alert, index) => (
                  <Paper key={alert.id} p="md" withBorder className={classes.alertCard}>
                    <Group gap="xs" mb="xs" wrap="nowrap">
                      <Badge size="xs" color={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.aiConfidence && (
                        <Tooltip label={`AI Confidence: ${(alert.aiConfidence * 100).toFixed(0)}%`}>
                          <Badge size="xs" variant="light" color="violet">
                            AI
                          </Badge>
                        </Tooltip>
                      )}
                    </Group>

                    <Text size="sm" fw={600} mb="xs">
                      {index + 1}. {alert.title}
                    </Text>

                    <Text size="xs" c="dimmed" mb="xs" lineClamp={2}>
                      {alert.description}
                    </Text>

                    <Stack gap="xs">
                      {alert.financialImpact !== 0 && (
                        <Text size="sm" fw={600} c={alert.financialImpact > 0 ? 'green' : 'red'}>
                          {alert.financialImpact > 0 ? 'Revenue: ' : 'Cost: '}
                          {formatCurrency(alert.financialImpact)}
                        </Text>
                      )}
                      {alert.daysUntilCritical && (
                        <Text size="xs" c="orange">
                          ⏰ {alert.daysUntilCritical} days until critical
                        </Text>
                      )}

                      {alert.quickAction && (
                        <Button
                          size="xs"
                          variant="light"
                          fullWidth
                          onClick={() => handleExecuteAction(alert)}
                          loading={executingAction === alert.id}
                          rightSection={<IconChevronRight size={14} />}
                        >
                          {alert.quickAction.label}
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Card>

        {/* Revenue Opportunities with ScrollArea */}
        <Card
          padding="lg"
          radius="md"
          withBorder
          className={classes.opportunityCard}
          style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
        >
          <Group gap="xs" mb="md">
            <IconTrendingUp size={20} color="var(--mantine-color-green-6)" />
            <Text fw={600}>Revenue Opportunities</Text>
          </Group>

          <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
            <Stack gap="md" pr="md">
              {opportunities.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  <IconExclamationCircle size={24} style={{ marginBottom: 8 }} />
                  <br />
                  No opportunities detected
                </Text>
              ) : (
                opportunities.map((opp) => (
                  <Paper key={opp.id} p="md" withBorder className={classes.oppCard}>
                    <Group justify="space-between" mb="xs" align="flex-start">
                      <Text size="sm" fw={600} style={{ flex: 1 }}>
                        {opp.title}
                      </Text>
                      <Tooltip label={`AI Confidence: ${(opp.confidence * 100).toFixed(0)}%`}>
                        <Badge size="sm" color="green" variant="light">
                          +{formatCurrency(opp.estimatedRevenue)}
                        </Badge>
                      </Tooltip>
                    </Group>

                    <Text size="xs" c="dimmed" mb="md" lineClamp={2}>
                      {opp.reasoning}
                    </Text>

                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">
                        📦 {opp.products.length} products • {(opp.confidence * 100).toFixed(0)}%
                        confidence
                      </Text>
                      <Button
                        size="xs"
                        variant="filled"
                        color="green"
                        fullWidth
                        onClick={() => handleAcceptOpportunity(opp)}
                        rightSection={<IconChevronRight size={14} />}
                      >
                        {opp.action.label}
                      </Button>
                    </Stack>
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
}: {
  label: string
  value: string
  change: number
  sparkline: number[]
  color: string
  subtitle?: string
  tooltip?: string
}) {
  return (
    <Card padding="md" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" mb={4}>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
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
            <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
          </Tooltip>
        )}
      </Group>
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
