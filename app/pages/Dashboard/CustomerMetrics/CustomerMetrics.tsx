import { DonutChart } from '@mantine/charts';
import { Grid, Group, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import { IconUserCog, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface CustomerMetricsProps {
  customerMetrics: {
    newCustomers: number;
    activeCustomers: number;
    customersByType: {
      name: string;
      value: number;
      color: string;
    }[];
    customerActivity: {
      name: string;
      value: number;
      color: string;
    }[];
  };
}

export default function CustomerMetrics({ customerMetrics }: CustomerMetricsProps) {
  const { t } = useTranslation(['dashboard'])

  const hasCustomerData = customerMetrics && (
    customerMetrics.newCustomers > 0 ||
    customerMetrics.activeCustomers > 0 ||
    (customerMetrics.customersByType && customerMetrics.customersByType.some(type => type.value > 0)) ||
    (customerMetrics.customerActivity && customerMetrics.customerActivity.some(activity => activity.value > 0))
  )

  return (
    <Paper withBorder p="md" radius="md" mb={0}>
      <Group justify="space-between">
        <Title order={5} mb="md">{t('dashboard:customerInsights')}</Title>
        <ThemeIcon
          color="indigo"
          variant="light"
          size="lg"
          radius="md"
        >
          <IconUsers size="1.2rem" stroke={1.5} />
        </ThemeIcon>
      </Group>

      <Text c="dimmed" fz="sm" mb="lg">
        {t('dashboard:customerAcquisitionMetrics')}
      </Text>

      {hasCustomerData ? (
        <Grid>
          <Grid.Col span={12}>
            <Group mt="xs" mb="md" justify="space-between">
              <Group>
                <ThemeIcon color="teal" variant="light" size="lg" radius="xl">
                  <IconUserPlus size="1.2rem" stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fz="xs" c="dimmed">{t('dashboard:newCustomers30Days')}</Text>
                  <Text fw={700} size="lg">{customerMetrics.newCustomers}</Text>
                </div>
              </Group>

              <Group>
                <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
                  <IconUserCog size="1.2rem" stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fz="xs" c="dimmed">{t('dashboard:activeCustomers')}</Text>
                  <Text fw={700} size="lg">{customerMetrics.activeCustomers}</Text>
                </div>
              </Group>
            </Group>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={6} ta="center" mb="sm">{t('dashboard:customerTypes')}</Title>
            <DonutChart
              data={customerMetrics.customersByType}
              size={200}
              thickness={40}
              withLabels
              withTooltip
              tooltipDataSource="segment"
              chartLabel={t('dashboard:customers')}
              style={{ margin: '0 auto' }}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Title order={6} ta="center" mb="sm">{t('dashboard:engagementLevels')}</Title>
            <DonutChart
              data={customerMetrics.customerActivity}
              size={200}
              thickness={40}
              withLabels
              withTooltip
              tooltipDataSource="segment"
              chartLabel={t('dashboard:activity')}
              style={{ margin: '0 auto' }}
            />
          </Grid.Col>
        </Grid>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mantine-color-gray-5)' }}>
          <Text size="sm" c="dimmed">
            {t('dashboard:noCustomerData')}
          </Text>
        </div>
      )}
    </Paper>
  );
}
