import {
  ActionIcon,
  Grid,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { IconCalendar, IconFilterOff } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useSearchParams } from 'react-router'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import { AgencySites } from '~/app/partials/AgencySites'
import { useDashboardUpdates } from '~/app/utils/useDashboardUpdates'
import classes from './Dashboard.module.css'
import FinanceStats from './FinanceStats'
import InventoryCommandCenter from './InventoryCommandCenter'
import InventoryStats from './InventoryStats'
import OrderStats from './OrderStats'
import SalesTrends from './SalesTrends'

interface DashboardProps {
  firstName: string
  userAgencyId?: string
  inventory: {
    totalProductsInStock: number
    totalProductsInStockDiff: number
    productsInStockValue: number
    productsInStockValueDiff: number
    accuracyPercentage: number
    accurateItems: number
    inaccurateItems: number
    totalItemsTracked: number
    totalPhysicalStock: number
    totalAccountingStock: number
    reorderPointAlerts: number
    deadStockValue: number
    deadStockItems: number
  }
  stockStatus: {
    inStock: number
    lowStock: number
    outOfStock: number
    critical: number
  }
  orders?: {
    pendingSalesOrders: number
    pendingPurchaseOrders: number
    recentSalesTotal: number
    recentPurchasesTotal: number
    ordersComparisonPercentage: number
  }
  finances?: {
    pendingInvoices: number
    pendingBills: number
    recentPaymentsReceived: number
    recentPaymentsMade: number
    cashflow: number
  }
  trendingProducts?: {
    id: string
    name: string
    soldQuantity: number
    revenue: number
    currentStock: number
    stockStatus: string
  }[]
  salesTrends?: {
    month: string
    salesCount: number
    salesValue: number
  }[]
  customerMetrics?: {
    newCustomers: number
    activeCustomers: number
    customersByType: {
      name: string
      value: number
      color: string
    }[]
    customerActivity: {
      name: string
      value: number
      color: string
    }[]
  }
  agencies: IAgency[]
  sites: ISite[]
}

export default function Dashboard({
  firstName,
  userAgencyId,
  inventory,
  stockStatus,
  orders,
  finances,
  trendingProducts,
  salesTrends,
  customerMetrics,
  agencies,
  sites,
}: DashboardProps) {
  const { t } = useTranslation('dashboard')
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize state from URL parameters
  const [agency, setAgency] = useState<string>(searchParams.get('agency') || userAgencyId || '')
  const [site, setSite] = useState<string>(searchParams.get('site') || '')
  const [dateRange, setDateRange] = useState<DatesRangeValue>(() => {
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      return [new Date(startDate), new Date(endDate)]
    }
    // Default to last 7 days
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    return [sevenDaysAgo, today]
  })

  // Real-time dashboard updates via SSE
  const { isConnected, lastUpdate, refreshDashboard, isRefreshing, fetcher } = useDashboardUpdates()

  // Separate fetcher for command center data
  const commandCenterFetcher = useFetcher()

  // Function to build query parameters for dashboard API
  const buildDashboardQuery = (agencyId?: string, siteId?: string, dateRange?: DatesRangeValue) => {
    const params = new URLSearchParams()

    if (agencyId && agencyId !== '') {
      params.append('agency', agencyId)
    }

    if (siteId && siteId !== '') {
      params.append('site', siteId)
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0] instanceof Date ? dateRange[0] : new Date(dateRange[0])
      const endDate = dateRange[1] instanceof Date ? dateRange[1] : new Date(dateRange[1])
      params.append('startDate', startDate.toISOString().split('T')[0])
      params.append('endDate', endDate.toISOString().split('T')[0])
    }

    return params.toString() ? `?${params.toString()}` : ''
  }

  // Function to update URL with current filters
  const updateUrlWithFilters = (
    agencyId?: string,
    siteId?: string,
    dateRange?: DatesRangeValue
  ) => {
    const newSearchParams = new URLSearchParams()

    if (agencyId && agencyId !== '') {
      newSearchParams.set('agency', agencyId)
    }

    if (siteId && siteId !== '') {
      newSearchParams.set('site', siteId)
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0] instanceof Date ? dateRange[0] : new Date(dateRange[0])
      const endDate = dateRange[1] instanceof Date ? dateRange[1] : new Date(dateRange[1])
      newSearchParams.set('startDate', startDate.toISOString().split('T')[0])
      newSearchParams.set('endDate', endDate.toISOString().split('T')[0])
    }

    setSearchParams(newSearchParams, { replace: true })
  }

  // Function to refresh dashboard with current filters
  const refreshDashboardWithFilters = useCallback(() => {
    if (fetcher.state === 'idle') {
      const queryString = buildDashboardQuery(agency || undefined, site || undefined, dateRange)
      fetcher.load(`/dashboard${queryString}`)
    }
  }, [agency, site, dateRange, fetcher])

  // Function to clear date filter
  const clearDateFilter = () => {
    setDateRange([null, null])
    const newDateRange: DatesRangeValue = [null, null]
    updateUrlWithFilters(agency || undefined, site || undefined, newDateRange)
    // Don't fetch again if already loading
    if (fetcher.state === 'idle') {
      const queryString = buildDashboardQuery(agency || undefined, site || undefined, newDateRange)
      fetcher.load(`/dashboard${queryString}`)
    }
  }

  // Function to clear all filters
  const clearAllFilters = () => {
    // Clear all filters completely (don't reset to userAgencyId)
    setAgency('')
    setSite('')
    setDateRange([null, null])
    setSearchParams(new URLSearchParams(), { replace: true })

    // Don't fetch again if already loading
    if (fetcher.state === 'idle') {
      // Fetch with no filters
      fetcher.load('/dashboard')
    }
  }

  // Check if any filters are active (beyond defaults)
  const hasActiveFilters = () => {
    // Agency is only considered active if it's different from the default userAgencyId
    const hasExplicitAgency = agency !== '' && agency !== userAgencyId
    return hasExplicitAgency || (site && site !== '') || (dateRange && dateRange[0] && dateRange[1])
  }

  // Function to get formatted date range for display
  const getFormattedDateRange = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return null

    const startDate = dateRange[0] instanceof Date ? dateRange[0] : new Date(dateRange[0])
    const endDate = dateRange[1] instanceof Date ? dateRange[1] : new Date(dateRange[1])

    return {
      start: startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
  }

  // Date presets
  const getPresetDates = () => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(today.getDate() - 90)

    return [
      {
        label: t('last7Days'),
        value: [sevenDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]] as [
          string,
          string,
        ],
      },
      {
        label: t('last30Days'),
        value: [thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]] as [
          string,
          string,
        ],
      },
      {
        label: t('last90Days'),
        value: [ninetyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]] as [
          string,
          string,
        ],
      },
    ]
  }

  type FetcherData = {
    stats: {
      inventory: {
        totalProductsInStock: number
        productsInStockValue: number
        totalProductsInStockDiff: number
        productsInStockValueDiff: number
        accuracyPercentage: number
        accurateItems: number
        inaccurateItems: number
        totalItemsTracked: number
        totalPhysicalStock: number
        totalAccountingStock: number
        reorderPointAlerts: number
        deadStockValue: number
        deadStockItems: number
      }
      stockStatus: {
        inStock: number
        lowStock: number
        outOfStock: number
        critical: number
      }
      orders?: {
        pendingSalesOrders: number
        pendingPurchaseOrders: number
        recentSalesTotal: number
        recentPurchasesTotal: number
        ordersComparisonPercentage: number
      }
      finances?: {
        pendingInvoices: number
        pendingBills: number
        recentPaymentsReceived: number
        recentPaymentsMade: number
        cashflow: number
      }
      trendingProducts?: {
        id: string
        name: string
        soldQuantity: number
        revenue: number
        currentStock: number
        stockStatus: string
      }[]
      salesTrends?: {
        month: string
        salesCount: number
        salesValue: number
      }[]
      customerMetrics?: {
        newCustomers: number
        activeCustomers: number
        customersByType: {
          name: string
          value: number
          color: string
        }[]
        customerActivity: {
          name: string
          value: number
          color: string
        }[]
      }
    }
  }

  const data = fetcher.data as FetcherData

  // Track inventory data changes specifically
  useEffect(() => {
    // Inventory data effect triggered
  }, [data?.stats.inventory, inventory, fetcher.state])

  // Log when dashboard receives SSE updates
  useEffect(() => {
    if (lastUpdate) {
      // Dashboard received SSE update
    }
  }, [lastUpdate])

  // Effect to set default date range in URL on initial load
  useEffect(() => {
    const currentStartDate = searchParams.get('startDate')
    const currentEndDate = searchParams.get('endDate')

    // If no date range in URL, set the default (last 7 days)
    if (!currentStartDate && !currentEndDate && dateRange[0] && dateRange[1]) {
      updateUrlWithFilters(agency || undefined, site || undefined, dateRange)
      const queryString = buildDashboardQuery(agency || undefined, site || undefined, dateRange)
      if (fetcher.state === 'idle') {
        fetcher.load(`/dashboard${queryString}`)
      }
    }
  }, []) // Only run on mount

  // Effect to handle initial dashboard load with current filters
  useEffect(() => {
    if (
      (agency !== '' || site !== '' || dateRange[0] !== null || dateRange[1] !== null) &&
      fetcher.state === 'idle'
    ) {
      const queryString = buildDashboardQuery(agency || undefined, site || undefined, dateRange)
      if (queryString) {
        fetcher.load(`/dashboard${queryString}`)
      }
    }
  }, []) // Only run on mount

  // Effect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Clear filters with Ctrl+K (or Cmd+K on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        clearAllFilters()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Effect to sync URL with initial load
  useEffect(() => {
    const currentAgency = searchParams.get('agency')
    const currentSite = searchParams.get('site')
    const currentStartDate = searchParams.get('startDate')
    const currentEndDate = searchParams.get('endDate')

    // Only load if we have filters in URL and fetcher is idle
    if (
      (currentAgency || currentSite || (currentStartDate && currentEndDate)) &&
      fetcher.state === 'idle'
    ) {
      const queryString = buildDashboardQuery(
        currentAgency || undefined,
        currentSite || undefined,
        currentStartDate && currentEndDate
          ? [new Date(currentStartDate), new Date(currentEndDate)]
          : undefined
      )
      if (queryString) {
        fetcher.load(`/dashboard${queryString}`)
      }
    }
  }, [searchParams.toString()]) // Only depend on searchParams string to avoid infinite loops

  const status = data?.stats.stockStatus || stockStatus
  const orderData = data?.stats.orders || orders
  const financeData = data?.stats.finances || finances
  const productsData = data?.stats.trendingProducts || trendingProducts
  const salesTrendsData = data?.stats.salesTrends || salesTrends
  const customerData = data?.stats.customerMetrics || customerMetrics

  // Log inventory data to track updates
  const currentInventoryData = data?.stats.inventory || inventory

  const showAgencies = agencies.length > 0

  const loading = isRefreshing || fetcher.state === 'loading'

  return (
    <div className={classes.root}>
      {/* Header with Controls */}
      <div className={classes.headerSection}>
        <Stack gap="xs" mb="xl">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} className={classes.headerTitle}>
                {t('analyticsOverview')}
              </Title>
              <Group gap="xs" align="center" mt={4}>
                <Text size="sm" c="dimmed" className={classes.headerSubtitle}>
                  {t('realtimeInsights')}
                </Text>
                {loading && <Loader size={14} color="blue" />}
              </Group>
            </div>
          </Group>
        </Stack>
      </div>

      <Stack gap="xl">
        {/* Filters Section */}
        <Paper withBorder p="md" radius="md" shadow="xs">
          <Grid justify="space-between" align="center" grow>
            <Grid.Col span={2}>
              <Text size="sm" fw={500} c="dimmed">
                Filter Dashboard
              </Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <DatePickerInput
                type="range"
                placeholder={
                  dateRange && dateRange[0] && dateRange[1]
                    ? `${getFormattedDateRange()?.start} - ${getFormattedDateRange()?.end}`
                    : t('selectDateRange')
                }
                value={dateRange}
                onChange={(newDateRange) => {
                  setDateRange(newDateRange)
                  updateUrlWithFilters(agency || undefined, site || undefined, newDateRange)
                  // If the range is cleared (both values are null), use the clear function
                  if (!newDateRange || (!newDateRange[0] && !newDateRange[1])) {
                    clearDateFilter()
                  } else if (fetcher.state === 'idle') {
                    const queryString = buildDashboardQuery(
                      agency || undefined,
                      site || undefined,
                      newDateRange
                    )
                    fetcher.load(`/dashboard${queryString}`)
                  }
                }}
                leftSection={<IconCalendar size={20} />}
                radius="md"
                valueFormat="MMM D, YYYY"
                getDayProps={(date) => ({
                  style: {
                    fontSize: '14px',
                  },
                })}
                classNames={{
                  input: `${classes.inputField} ${classes.datePickerInput}`,
                }}
                presets={getPresetDates()}
                clearable
              />
            </Grid.Col>

            {showAgencies && (
              <AgencySites
                key={`agency-site-${agency}-${site}`}
                agencyId={agency}
                siteId={site}
                agencies={agencies}
                sites={sites}
                onChange={({ agencyId, siteId }: { agencyId: string; siteId: string }) => {
                  setAgency(agencyId)
                  setSite(siteId)
                  updateUrlWithFilters(agencyId, siteId, dateRange)
                  if (fetcher.state === 'idle') {
                    const queryString = buildDashboardQuery(agencyId, siteId, dateRange)
                    fetcher.load(`/dashboard${queryString}`)
                  }
                }}
                error={{ agencyId: '', siteId: '' }}
                extraProps={{ colSpan: 3, hideLabels: true }}
              />
            )}
            <Grid.Col span={'auto'} style={{ marginLeft: 'auto' }}>
              {hasActiveFilters() && (
                <Tooltip label={t('clearAllFilters')} position="bottom">
                  <ActionIcon
                    variant="light"
                    color="gray"
                    size="md"
                    onClick={clearAllFilters}
                    disabled={loading}
                  >
                    <IconFilterOff size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Inventory Command Center - Killer Widget */}
        <InventoryCommandCenter
          agencyId={agency}
          siteId={site}
          dateRange={
            dateRange[0] && dateRange[1]
              ? {
                  startDate: (dateRange[0] instanceof Date ? dateRange[0] : new Date(dateRange[0]))
                    .toISOString()
                    .split('T')[0],
                  endDate: (dateRange[1] instanceof Date ? dateRange[1] : new Date(dateRange[1]))
                    .toISOString()
                    .split('T')[0],
                }
              : undefined
          }
        />

        {/* Key Metrics */}
        <Stack gap="lg">
          <InventoryStats inventory={currentInventoryData} />
        </Stack>

        {/* Orders and Finance Stats - Side by Side */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <OrderStats
            orders={
              orderData || {
                pendingSalesOrders: 0,
                pendingPurchaseOrders: 0,
                recentSalesTotal: 0,
                recentPurchasesTotal: 0,
                ordersComparisonPercentage: 0,
              }
            }
          />

          <FinanceStats
            finances={
              financeData || {
                pendingInvoices: 0,
                pendingBills: 0,
                recentPaymentsReceived: 0,
                recentPaymentsMade: 0,
                cashflow: 0,
              }
            }
          />
        </SimpleGrid>
        {/* Trending Products */}
        {/* <TrendingProducts products={productsData || []} /> */}

        {/* Stock Status Chart */}
        {/* <StatusStats stockStatus={status} /> */}

        {/* Sales Trends and Customer Metrics */}
        <SimpleGrid cols={{ base: 1, lg: 1 }} spacing="xl">
          {/* Sales Trends */}
          <SalesTrends salesTrends={salesTrendsData || []} />

          {/* Customer Metrics */}
          {/* <CustomerMetrics customerMetrics={customerData || { newCustomers: 0, activeCustomers: 0, customersByType: [], customerActivity: [] }} /> */}
        </SimpleGrid>
      </Stack>
    </div>
  )
}
