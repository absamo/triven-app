import { Group, Paper, Table, Text, ThemeIcon, Title } from "@mantine/core"
import { IconChartBar } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import classes from "./TrendingProducts.module.css"

interface TrendingProductsProps {
  products: {
    id: string
    name: string
    soldQuantity: number
    revenue: number
    currentStock: number
    stockStatus: string
  }[]
}

export default function TrendingProducts({ products }: TrendingProductsProps) {
  const { t } = useTranslation(['dashboard'])

  // Sort products by revenue
  const sortedProducts = products && products.length > 0
    ? [...products].sort((a, b) => b.revenue - a.revenue)
    : []

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
      <Group justify="space-between" mb="md">
        <Title order={5}>{t('dashboard:trendingProducts')}</Title>
        <ThemeIcon size="md" variant="light" color="blue" radius="md">
          <IconChartBar size="1.1rem" />
        </ThemeIcon>
      </Group>

      <Table striped withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('dashboard:product')}</Table.Th>
            <Table.Th className={classes.rightAlign}>{t('dashboard:currentStock')}</Table.Th>
            <Table.Th className={classes.rightAlign}>{t('dashboard:unitsSold')}</Table.Th>
            <Table.Th className={classes.rightAlign}>{t('dashboard:revenue')} (USD)</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedProducts.length > 0 ? (
            sortedProducts.map((product) => (
              <Table.Tr key={product.id}>
                <Table.Td>
                  <Text size="sm" fw={500}>{product.name}</Text>
                </Table.Td>
                <Table.Td className={classes.rightAlign}>
                  <Text
                    size="sm"
                    fw={500}
                    c={product.currentStock === 0 ? 'red' : product.currentStock <= 10 ? 'orange' : 'green'}
                  >
                    {product.currentStock}
                  </Text>
                </Table.Td>
                <Table.Td className={classes.rightAlign}>
                  <Text size="sm" fw={500}>{product.soldQuantity}</Text>
                </Table.Td>
                <Table.Td className={classes.rightAlign}>
                  <Group justify="flex-end" gap="xs">
                    <Text size="sm" fw={700}>{product.revenue.toFixed(2)}</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                <Text size="sm" c="dimmed">
                  {t('dashboard:noTrendingProducts', 'No trending products available')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}
