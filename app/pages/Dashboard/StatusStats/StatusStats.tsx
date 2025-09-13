import { BarChart } from "@mantine/charts"
import { Badge, Group, Paper, Text } from "@mantine/core"
import { IconDeviceAnalytics } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import classes from "./StatusStats.module.css"

interface StatusStatsProps {
  stockStatus: {
    inStock: number
    lowStock: number
    outOfStock: number
    critical: number
  }
}

export default function StatusStats({ stockStatus }: StatusStatsProps) {
  const { t } = useTranslation('dashboard')
  const [searchParams] = useSearchParams()

  // Check if date filters are applied
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const isDateFiltered = startDate && endDate

  // Format date range for display
  const getDateRangeText = () => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${start} - ${end}`
  }

  const totalCount = stockStatus.inStock + stockStatus.lowStock + stockStatus.critical + stockStatus.outOfStock

  // Transform data for bar chart
  const chartData = [
    { status: t('inStock'), items: stockStatus.inStock },
    { status: t('lowStock'), items: stockStatus.lowStock },
    { status: t('critical'), items: stockStatus.critical },
    { status: t('outOfStock'), items: stockStatus.outOfStock },
  ]

  const hasData = totalCount > 0



  return (
    <Paper
      withBorder
      p="xl"
      radius="xl"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Group align="flex-end" gap="xs">
          <Text fw={700} fz="md">{t('stockStatusOverview')}</Text>
          {isDateFiltered && (
            <Badge variant="light" color="violet" size="sm">
              {getDateRangeText()}
            </Badge>
          )}
        </Group>
        <IconDeviceAnalytics
          size="1.4rem"
          className={classes.icon}
          stroke={1.5}
        />
      </Group>

      <Text c="dimmed" fz="sm" mb="md">
        {isDateFiltered
          ? `Product status for items created/updated in ${getDateRangeText()}`
          : t('currentInventoryStatus')
        }
      </Text>


      {/* Centered bar chart */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {hasData ? (
          <BarChart
            h={180}
            data={chartData}
            dataKey="status"
            series={[
              { name: "items", color: "var(--mantine-color-blue-6)" }
            ]}
            withTooltip
            withYAxis
            tickLine="x"
            barProps={{ maxBarSize: 30 }}
          />
        ) : (
          <Text ta="center" c="dimmed" py="xl">
            {t('noStockDataAvailable')}
          </Text>
        )}
      </div>
    </Paper>
  )
}
