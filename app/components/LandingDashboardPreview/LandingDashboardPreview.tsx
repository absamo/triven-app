// Landing Dashboard Preview Component
// User Story 1: Immediate Value Recognition
// Shows animated metrics to demonstrate platform value

import { Grid, Group, Paper, RingProgress, Stack, Text } from '@mantine/core'
import { IconChartLine, IconPackage, IconTarget, IconTrendingUp } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import classes from './LandingDashboardPreview.module.css'

interface DashboardMetric {
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon: React.ReactNode
  color: string
  trend?: number
}

interface LandingDashboardPreviewProps {
  totalInventoryValue?: number
  itemsTracked?: number
  accuracyRate?: number
  growthPercentage?: number
}

export function LandingDashboardPreview({
  totalInventoryValue = 487250,
  itemsTracked = 15234,
  accuracyRate = 98,
  growthPercentage = 23.5,
}: LandingDashboardPreviewProps) {
  const [animatedValues, setAnimatedValues] = useState({
    totalInventoryValue: 0,
    itemsTracked: 0,
    accuracyRate: 0,
    growthPercentage: 0,
  })

  const metrics: DashboardMetric[] = [
    {
      label: 'Total Inventory Value',
      value: animatedValues.totalInventoryValue,
      prefix: '$',
      icon: <IconChartLine size={24} />,
      color: 'blue',
      trend: 12.3,
    },
    {
      label: 'Items Tracked',
      value: animatedValues.itemsTracked,
      icon: <IconPackage size={24} />,
      color: 'cyan',
      trend: 8.7,
    },
    {
      label: 'Accuracy Rate',
      value: animatedValues.accuracyRate,
      suffix: '%',
      icon: <IconTarget size={24} />,
      color: 'green',
    },
    {
      label: 'Growth This Month',
      value: animatedValues.growthPercentage,
      suffix: '%',
      icon: <IconTrendingUp size={24} />,
      color: 'lime',
      trend: growthPercentage,
    },
  ]

  // Animate values on mount with ease-out timing
  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const interval = duration / steps

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      // Ease-out cubic function
      const easeOut = 1 - (1 - progress) ** 3

      setAnimatedValues({
        totalInventoryValue: Math.floor(totalInventoryValue * easeOut),
        itemsTracked: Math.floor(itemsTracked * easeOut),
        accuracyRate: Math.floor(accuracyRate * easeOut),
        growthPercentage: parseFloat((growthPercentage * easeOut).toFixed(1)),
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        // Set final exact values
        setAnimatedValues({
          totalInventoryValue,
          itemsTracked,
          accuracyRate,
          growthPercentage,
        })
      }
    }, interval)

    return () => clearInterval(timer)
  }, [totalInventoryValue, itemsTracked, accuracyRate, growthPercentage])

  return (
    <div
      className={classes.preview}
      role="img"
      aria-label="Dashboard preview showing inventory metrics"
    >
      <Grid gutter="md">
        {metrics.map((metric, index) => (
          <Grid.Col key={metric.label} span={{ base: 12, xs: 6, md: 3 }}>
            <Paper
              className={classes.metricCard}
              p="md"
              radius="md"
              withBorder
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <div
                    className={classes.iconWrapper}
                    style={{ color: `var(--mantine-color-${metric.color}-6)` }}
                  >
                    {metric.icon}
                  </div>
                  {metric.trend !== undefined && (
                    <Group gap={4} className={classes.trend}>
                      <IconTrendingUp size={14} />
                      <Text size="xs" c="green" fw={600}>
                        +{metric.trend}%
                      </Text>
                    </Group>
                  )}
                </Group>

                <div>
                  <Text className={classes.metricValue} fw={700}>
                    {metric.prefix}
                    {metric.value.toLocaleString()}
                    {metric.suffix}
                  </Text>
                  <Text className={classes.metricLabel} size="sm" c="dimmed">
                    {metric.label}
                  </Text>
                </div>

                {metric.label === 'Accuracy Rate' && (
                  <RingProgress
                    size={60}
                    thickness={6}
                    sections={[{ value: metric.value, color: metric.color }]}
                    label={
                      <Text size="xs" ta="center" fw={700}>
                        {metric.value}%
                      </Text>
                    }
                    className={classes.ringProgress}
                  />
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  )
}
