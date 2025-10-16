import { Group, Paper, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconInfoCircle,
  IconReceipt,
  IconReceiptOff,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface FinanceStatsProps {
  finances: {
    pendingInvoices: number
    pendingBills: number
    recentPaymentsReceived: number
    recentPaymentsMade: number
    cashflow: number
  }
}

export default function FinanceStats({ finances }: FinanceStatsProps) {
  const { t } = useTranslation('dashboard')

  const positiveFlow = finances.cashflow >= 0
  const DiffIcon = positiveFlow ? IconArrowUpRight : IconArrowDownRight

  // Calculate percentages for progress bar
  const totalCashMovement =
    Math.abs(finances.recentPaymentsReceived) + Math.abs(finances.recentPaymentsMade)
  const incomingPercentage =
    totalCashMovement > 0 ? (finances.recentPaymentsReceived / totalCashMovement) * 100 : 50

  return (
    <Paper withBorder p="lg" radius="md" shadow="xs">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={4} fw={600}>{t('financialOverview')}</Title>
      </Group>

      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap" gap="md">
          <Group gap="sm">
            <ThemeIcon color="green" variant="light" size="xl" radius="md">
              <IconReceipt size="1.4rem" stroke={1.5} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed" mb={2}>
                {t('pendingInvoices')}
              </Text>
              <Text fw={700} size="xl">
                {finances.pendingInvoices}
              </Text>
            </div>
          </Group>
        </Group>

        <Group justify="space-between" wrap="nowrap" gap="md">
          <Group gap="sm">
            <ThemeIcon color="orange" variant="light" size="xl" radius="md">
              <IconReceiptOff size="1.4rem" stroke={1.5} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed" mb={2}>
                {t('pendingBills')}
              </Text>
              <Text fw={700} size="xl">
                {finances.pendingBills}
              </Text>
            </div>
          </Group>
        </Group>

        {/* Always show payment metrics */}
        <Stack gap="sm" mt="md" pt="md" style={{ borderTop: '1px solid light-dark(#e2e8f0, var(--mantine-color-dark-4))' }}>
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>
              {t('paymentsReceived')}
            </Text>
            <Text fw={600} size="md" c="green">
              ${finances.recentPaymentsReceived.toLocaleString()}
            </Text>
          </Group>

          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed" fw={500}>
              {t('paymentsMade')}
            </Text>
            <Text fw={600} size="md" c="red">
              ${finances.recentPaymentsMade.toLocaleString()}
            </Text>
          </Group>

          <Group
            justify="space-between"
            wrap="nowrap"
            pt="sm"
            mt="sm"
            style={{ borderTop: '1px solid light-dark(#e2e8f0, var(--mantine-color-dark-4))' }}
          >
            <Group gap="xs">
              <ThemeIcon
                color={finances.cashflow >= 0 ? 'teal' : 'red'}
                variant="light"
                size="md"
                radius="md"
              >
                {finances.cashflow >= 0 ? (
                  <IconArrowUpRight size="1rem" stroke={2} />
                ) : (
                  <IconArrowDownRight size="1rem" stroke={2} />
                )}
              </ThemeIcon>
              <Text fw={600} size="sm">
                {t('netCashflow')}
              </Text>
              <Tooltip
                label={`${t('cashFlowRatio')}: ${incomingPercentage.toFixed(1)}% ${t('incoming')}`}
                position="top"
                withArrow
              >
                <IconInfoCircle size="1rem" style={{ color: 'var(--mantine-color-gray-6)', cursor: 'pointer' }} />
              </Tooltip>
            </Group>
            <Text fw={700} size="lg" c={finances.cashflow >= 0 ? 'teal' : 'red'}>
              ${Math.abs(finances.cashflow).toLocaleString()}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Paper>
  )
}
