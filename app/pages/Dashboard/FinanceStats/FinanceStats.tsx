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
    <Paper withBorder p="md" radius="md" mb={0} shadow="sm">
      <Group justify="space-between" align="flex-start" mb="md">
        <Title order={5}>{t('financialOverview')}</Title>
      </Group>

      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <ThemeIcon color="green" variant="light" size="lg" radius="md">
              <IconReceipt size="1.2rem" stroke={1.5} />
            </ThemeIcon>
            <Text fw={500}>{t('pendingInvoices')}</Text>
          </Group>
          <Text fw={700} size="lg">
            {finances.pendingInvoices}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <ThemeIcon color="orange" variant="light" size="lg" radius="md">
              <IconReceiptOff size="1.2rem" stroke={1.5} />
            </ThemeIcon>
            <Text fw={500}>{t('pendingBills')}</Text>
          </Group>
          <Text fw={700} size="lg">
            {finances.pendingBills}
          </Text>
        </Group>

        {/* Always show payment metrics */}
        <Group
          justify="space-between"
          wrap="nowrap"
          mt="xs"
          pt="xs"
          style={{ borderTop: '1px solid #e2e8f0' }}
        >
          <Text size="sm" c="dimmed">
            {t('paymentsReceived')}
          </Text>
          <Text fw={600} size="sm" c="green">
            ${finances.recentPaymentsReceived.toLocaleString()}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {t('paymentsMade')}
          </Text>
          <Text fw={600} size="sm" c="red">
            ${finances.recentPaymentsMade.toLocaleString()}
          </Text>
        </Group>

        <Group
          justify="space-between"
          wrap="nowrap"
          pt="xs"
          style={{ borderTop: '1px solid #e2e8f0' }}
        >
          <Group gap="xs">
            <ThemeIcon
              color={finances.cashflow >= 0 ? 'green' : 'red'}
              variant="light"
              size="sm"
              radius="md"
            >
              {finances.cashflow >= 0 ? (
                <IconArrowUpRight size="0.8rem" stroke={1.5} />
              ) : (
                <IconArrowDownRight size="0.8rem" stroke={1.5} />
              )}
            </ThemeIcon>
            <Text fw={500} size="sm">
              {t('netCashflow')}
            </Text>
            <Tooltip
              label={`${t('cashFlowRatio')}: ${incomingPercentage.toFixed(1)}% ${t('incoming')}`}
              position="top"
              withArrow
            >
              <IconInfoCircle size="1rem" style={{ color: '#6c757d', cursor: 'pointer' }} />
            </Tooltip>
          </Group>
          <Text fw={700} size="sm" c={finances.cashflow >= 0 ? 'green' : 'red'}>
            ${finances.cashflow.toLocaleString()}
          </Text>
        </Group>
      </Stack>
    </Paper>
  )
}
