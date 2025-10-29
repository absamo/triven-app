// Landing Social Proof Component
// User Story 3: Social Proof and Trust Building
// Displays success metrics with icons and countup animations

import { Container, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconClock, IconPackage, IconTarget, IconUsers } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import type { SuccessMetric } from '~/app/lib/landing/types'
import classes from './LandingSocialProof.module.css'

interface LandingSocialProofProps {
  metrics?: SuccessMetric[]
}

const iconMap: Record<string, React.ReactNode> = {
  package: <IconPackage size={32} />,
  target: <IconTarget size={32} />,
  clock: <IconClock size={32} />,
  users: <IconUsers size={32} />,
}

export function LandingSocialProof({ metrics = [] }: LandingSocialProofProps) {
  const [animatedMetrics, setAnimatedMetrics] = useState<Map<string, string>>(new Map())

  // Animate metric values on mount
  useEffect(() => {
    if (metrics.length === 0) return

    const duration = 2000 // 2 seconds
    const steps = 60
    const interval = duration / steps

    const timers: NodeJS.Timeout[] = []

    metrics.forEach((metric) => {
      let currentStep = 0

      // Extract number from value (e.g., "15,000+" -> 15000)
      const numericValue = parseInt(metric.value.replace(/[^0-9]/g, ''), 10)
      const suffix = metric.value.replace(/[0-9,]/g, '') // Get "+", "%", etc.

      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps

        // Ease-out cubic function
        const easeOut = 1 - (1 - progress) ** 3
        const currentValue = Math.floor(numericValue * easeOut)

        setAnimatedMetrics((prev) => {
          const newMap = new Map(prev)
          newMap.set(metric.id, currentValue.toLocaleString() + suffix)
          return newMap
        })

        if (currentStep >= steps) {
          clearInterval(timer)
          // Set final exact value
          setAnimatedMetrics((prev) => {
            const newMap = new Map(prev)
            newMap.set(metric.id, metric.value)
            return newMap
          })
        }
      }, interval)

      timers.push(timer)
    })

    return () => {
      for (const timer of timers) {
        clearInterval(timer)
      }
    }
  }, [metrics])

  if (metrics.length === 0) return null

  return (
    <section className={classes.section} aria-label="Success metrics">
      <Container size="lg">
        <Stack gap="xl">
          <Title className={classes.title} order={2} ta="center">
            Trusted by Businesses Worldwide
          </Title>

          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="lg" className={classes.grid}>
            {metrics.map((metric, index) => (
              <Paper
                key={metric.id}
                className={classes.metricCard}
                p="xl"
                radius="md"
                withBorder
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Stack gap="md" align="center">
                  <div className={classes.iconWrapper}>
                    {iconMap[metric.icon] || <IconPackage size={32} />}
                  </div>

                  <div className={classes.metricContent}>
                    <Text className={classes.metricValue} fw={700} ta="center">
                      {animatedMetrics.get(metric.id) || '0'}
                    </Text>
                    <Text className={classes.metricLabel} size="sm" c="dimmed" ta="center">
                      {metric.label}
                    </Text>
                  </div>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </section>
  )
}
