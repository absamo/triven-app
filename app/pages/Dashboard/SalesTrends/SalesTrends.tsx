import { LineChart } from '@mantine/charts'
import { Group, Paper, Text, ThemeIcon, Title } from '@mantine/core'
import { IconChartLine } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '~/app/common/helpers/money'
import classes from './SalesTrends.module.css'

interface SalesTrendsProps {
  salesTrends: {
    month: string
    salesCount: number
    salesValue: number
  }[]
}

export default function SalesTrends({ salesTrends }: SalesTrendsProps) {
  const { t } = useTranslation(['dashboard'])

  // Check if there's any meaningful data
  const hasData =
    salesTrends &&
    salesTrends.length > 0 &&
    salesTrends.some((trend) => trend.salesCount > 0 || trend.salesValue > 0)

  return (
    <Paper withBorder p="lg" radius="md" shadow="xs">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={4} fw={600} mb={4}>
            {t('dashboard:salesTrends')}
          </Title>
          <Text c="dimmed" size="sm">
            {t('dashboard:monthlySalesData')}
          </Text>
        </div>
        <ThemeIcon color="blue" variant="light" size="xl" radius="md">
          <IconChartLine size="1.4rem" stroke={1.5} />
        </ThemeIcon>
      </Group>

      {hasData ? (
        <div className={classes.chartContainer}>
          <LineChart
            h={200}
            data={salesTrends}
            dataKey="month"
            withLegend
            withTooltip
            gridAxis="xy"
            tooltipProps={{
              content: ({ payload }) => {
                if (payload && payload.length) {
                  return (
                    <div className={classes.tooltip}>
                      <div className={classes.tooltipTitle}>{payload[0].payload.month}</div>
                      {payload.map((entry) => (
                        <div key={entry.dataKey} className={classes.tooltipItem}>
                          <div
                            className={classes.tooltipItemDot}
                            style={{ background: entry.color }}
                          />
                          <div className={classes.tooltipItemLabel}>
                            {entry.dataKey === 'salesValue'
                              ? t('dashboard:revenue')
                              : t('dashboard:orders')}
                          </div>
                          <div className={classes.tooltipItemValue}>
                            {entry.dataKey === 'salesValue'
                              ? formatCurrency(entry.value, '$')
                              : entry.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              },
            }}
            legendProps={{
              content: ({ payload }) => {
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '20px',
                    }}
                  >
                    {payload?.map((entry) => (
                      <div
                        key={entry.value}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: entry.color,
                            borderRadius: '50%',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--mantine-color-gray-7)',
                          }}
                        >
                          {entry.value === 'salesValue'
                            ? t('dashboard:revenue')
                            : t('dashboard:orders')}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              },
            }}
            series={[
              { name: 'salesCount', color: 'blue.6' },
              { name: 'salesValue', color: 'teal.6' },
            ]}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mantine-color-gray-5)' }}>
          <Text size="sm" c="dimmed">
            {t('dashboard:noSalesData', 'No sales data available for the selected period')}
          </Text>
        </div>
      )}
    </Paper>
  )
}
