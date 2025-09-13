import { data, type LoaderFunction, type LoaderFunctionArgs } from "react-router"
import { BILL_STATUSES, INVOICE_STATUSES, PAYMENT_STATUSES, PURCHASE_ORDER_STATUSES, SALES_ORDERS_STATUSES, USER_ROLES } from "~/app/common/constants"
import type { IAgency } from "~/app/common/validations/agencySchema"
import type { ISite } from "~/app/common/validations/siteSchema"
import { prisma } from "~/app/db.server"
import Dashboard from "~/app/pages/Dashboard"
import { getAgencies } from "~/app/services/agencies.server"
import { requireBetterAuthUser } from "~/app/services/better-auth.server"
import { getProductsByAgencyId } from "../services/products.server"
import type { Route } from "./+types/dashboard"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Dashboard - Flow" },
    { name: "description", content: "Dashboard for Flow business management" },
  ]
}

type LoaderData = {
  firstName: string
  agencies: IAgency[]
  sites: ISite[]
  stats: {
    inventory: {
      totalProductsInStock: number
      productsInStockValue: number
      totalProductsInStockDiff: number
      productsInStockValueDiff: number
    }
    stockStatus: {
      inStock: number
      lowStock: number
      outOfStock: number
      critical: number
    }
    orders: {
      pendingSalesOrders: number
      pendingPurchaseOrders: number
      recentSalesTotal: number
      recentPurchasesTotal: number
      ordersComparisonPercentage: number
    }
    finances: {
      pendingInvoices: number
      pendingBills: number
      recentPaymentsReceived: number
      recentPaymentsMade: number
      cashflow: number
    }
    salesTrends: {
      month: string
      salesCount: number
      salesValue: number
    }[]
    customerMetrics: {
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
    trendingProducts: {
      id: string
      name: string
      soldQuantity: number
      revenue: number
      currentStock: number
      stockStatus: string
    }[]
  }
}




export const loader: LoaderFunction = async ({
  request
}: LoaderFunctionArgs) => {
  try {
    // Require user with dashboard read permissions
    const user = await requireBetterAuthUser(request, ["read:analytics"])

    // Check if this is a fetcher request (has refresh parameter or specific headers)
    const url = new URL(request.url)
    const isRefresh = url.searchParams.has("refresh")
    const isFetcher = request.headers.get("x-requested-with") === "fetch" || isRefresh

    // Get agency parameter from URL, default to "All"
    const selectedAgency = url.searchParams.get("agency") || "All"

    // Get date parameters from URL
    const startDateParam = url.searchParams.get("startDate")
    const endDateParam = url.searchParams.get("endDate")

    // Build date range filter
    const dateRange = startDateParam && endDateParam ? {
      gte: new Date(startDateParam),
      lte: new Date(endDateParam)
    } : null

    // Helper function to build agency filter condition
    const getAgencyFilter = (baseWhere: any) => {
      if (selectedAgency === "All") {
        return baseWhere
      }
      return {
        ...baseWhere,
        agencyId: selectedAgency
      }
    }

    // Helper function to build date filter condition
    const getDateFilter = (baseWhere: any, dateField: string = 'orderDate') => {
      if (!dateRange) {
        return baseWhere
      }
      return {
        ...baseWhere,
        [dateField]: dateRange
      }
    }

    // Helper function to combine agency and date filters
    const getFilters = (baseWhere: any, dateField: string = 'orderDate') => {
      return getDateFilter(getAgencyFilter(baseWhere), dateField)
    }

    const stats = await getProductsByAgencyId(request, selectedAgency, dateRange)
    const agencies =
      user?.role?.name === USER_ROLES.ADMIN ? await getAgencies(request) : []

    // Get sites from agencies (agencies include sites relation from Prisma)
    const sites = agencies ? agencies.flatMap((agency: any) => agency.sites || []) : []

    // For fetcher requests, recalculate inventory stats to get fresh data
    const inventoryStats = isFetcher ? await getProductsByAgencyId(request, selectedAgency, dateRange) : stats

    // Get pending sales orders (status: PENDING) - filtered by agency
    const pendingSalesOrders = await prisma.salesOrder.count({
      where: getAgencyFilter({
        companyId: user?.companyId,
        status: SALES_ORDERS_STATUSES.PENDING
      })
    })

    // Get pending purchase orders (status: PENDING) - filtered by agency
    const pendingPurchaseOrders = await prisma.purchaseOrder.count({
      where: getAgencyFilter({
        companyId: user?.companyId,
        status: PURCHASE_ORDER_STATUSES.PENDING
      })
    })

    // Calculate recent sales total with date filtering
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Use date filter if provided, otherwise don't filter by date (show all)
    const salesDateFilter = dateRange || undefined

    const recentSalesOrders = await prisma.salesOrder.findMany({
      where: getFilters({
        companyId: user?.companyId,
        status: { not: SALES_ORDERS_STATUSES.CANCELLED }
      }),
      include: {
        salesOrderItems: true
      }
    })

    const recentSalesTotal = recentSalesOrders.reduce((total: number, order: any) => {
      const orderTotal = order.salesOrderItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      return total + orderTotal
    }, 0)

    // Calculate recent purchases total with date filtering
    const recentPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: getFilters({
        companyId: user?.companyId,
        status: { not: PURCHASE_ORDER_STATUSES.CANCELLED }
      }),
      include: {
        purchaseOrderItems: true
      }
    })

    const recentPurchasesTotal = recentPurchaseOrders.reduce((total: number, order: any) => {
      const orderTotal = order.purchaseOrderItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      return total + orderTotal
    }, 0)

    // Calculate orders comparison percentage - filtered by agency and date
    const prevMonthStart = new Date(thirtyDaysAgo)
    prevMonthStart.setDate(prevMonthStart.getDate() - 30)

    // For comparison, use the previous period of the same length as the current date range
    let prevPeriodFilter
    let currentPeriodForComparison
    if (dateRange) {
      // When date filter is applied, compare with previous period of same length
      const currentRangeLength = dateRange.lte.getTime() - dateRange.gte.getTime()
      prevPeriodFilter = {
        gte: new Date(dateRange.gte.getTime() - currentRangeLength),
        lte: dateRange.gte
      }
      currentPeriodForComparison = dateRange
    } else {
      // When no date filter is applied, compare last 30 days with previous 30 days
      prevPeriodFilter = { gte: prevMonthStart, lte: thirtyDaysAgo }
      currentPeriodForComparison = { gte: thirtyDaysAgo }
    }

    // Get current period sales for comparison
    const currentPeriodSales = await prisma.salesOrder.findMany({
      where: getAgencyFilter({
        companyId: user?.companyId,
        orderDate: currentPeriodForComparison,
        status: { not: SALES_ORDERS_STATUSES.CANCELLED }
      }),
      include: {
        salesOrderItems: true
      }
    })

    const currentPeriodSalesTotal = currentPeriodSales.reduce((total: number, order: any) => {
      const orderTotal = order.salesOrderItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      return total + orderTotal
    }, 0)

    const prevMonthSales = await prisma.salesOrder.findMany({
      where: getAgencyFilter({
        companyId: user?.companyId,
        orderDate: prevPeriodFilter,
        status: { not: SALES_ORDERS_STATUSES.CANCELLED }
      }),
      include: {
        salesOrderItems: true
      }
    })

    const prevMonthSalesTotal = prevMonthSales.reduce((total: number, order: any) => {
      const orderTotal = order.salesOrderItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      return total + orderTotal
    }, 0)

    // Use the appropriate current period total for comparison
    const comparisonCurrentTotal = dateRange ? recentSalesTotal : currentPeriodSalesTotal

    const ordersComparisonPercentage = prevMonthSalesTotal > 0
      ? Math.round(((comparisonCurrentTotal - prevMonthSalesTotal) / prevMonthSalesTotal) * 100)
      : 0

    // Get pending invoices count - filtered by agency through salesOrder
    const pendingInvoices = await prisma.invoice.count({
      where: {
        companyId: user?.companyId,
        status: INVOICE_STATUSES.PENDING,
        ...(selectedAgency !== "All" && {
          salesOrder: {
            agencyId: selectedAgency
          }
        })
      }
    })

    // Get pending bills count - filtered by agency through purchaseOrder
    const pendingBills = await prisma.bill.count({
      where: {
        companyId: user?.companyId,
        status: BILL_STATUSES.UNBILLED,
        ...(selectedAgency !== "All" && {
          purchaseOrder: {
            agencyId: selectedAgency
          }
        })
      }
    })

    // Get recent payments received with date filtering
    const recentPaymentsReceived = await prisma.paymentReceived.aggregate({
      where: {
        companyId: user?.companyId,
        ...(salesDateFilter && { paymentDate: salesDateFilter }),
        status: { not: PAYMENT_STATUSES.CANCELLED },
        ...(selectedAgency !== "All" && {
          invoice: {
            salesOrder: {
              agencyId: selectedAgency
            }
          }
        })
      },
      _sum: {
        amountReceived: true
      }
    })

    // Get recent payments made with date filtering
    const recentPaymentsMade = await prisma.paymentMade.aggregate({
      where: {
        companyId: user?.companyId,
        ...(salesDateFilter && { paymentDate: salesDateFilter }),
        status: { not: PAYMENT_STATUSES.CANCELLED },
        ...(selectedAgency !== "All" && {
          bill: {
            purchaseOrder: {
              agencyId: selectedAgency
            }
          }
        })
      },
      _sum: {
        amountReceived: true
      }
    })

    // Calculate cashflow
    const cashflow = (recentPaymentsReceived._sum?.amountReceived || 0) - (recentPaymentsMade._sum?.amountReceived || 0)  // Get trending products (most sold in last 30 days)
    const salesOrderIds = recentSalesOrders.map((order: any) => order.id)

    const soldItems = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: {
        salesOrderId: {
          in: salesOrderIds
        }
      },
      _sum: {
        quantity: true,
        amount: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    const productIds = soldItems.map((item: any) => item.productId)
    const trendingProductsData = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        },
        companyId: user?.companyId
      },
      select: {
        id: true,
        name: true,
        physicalStockOnHand: true,
        accountingStockOnHand: true,
        status: true
      }
    })

    const trendingProducts = soldItems.map((item: any) => {
      const product = trendingProductsData.find((p: any) => p.id === item.productId)
      return {
        id: item.productId,
        name: product?.name || 'Unknown Product',
        soldQuantity: item._sum.quantity || 0,
        revenue: item._sum.amount || 0,
        currentStock: product?.physicalStockOnHand || 0,
        stockStatus: product?.status || 'Unknown'
      }
    })

    // Get sales trends for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    // Generate array of last 6 months
    const months = []
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = monthNames[date.getMonth()]
      const year = date.getFullYear()
      months.unshift(`${monthName} ${year}`)
    }

    // Get sales orders for the last 6 months - filtered by agency
    const salesLastSixMonths = await prisma.salesOrder.findMany({
      where: getAgencyFilter({
        companyId: user?.companyId,
        orderDate: {
          gte: sixMonthsAgo
        },
        status: { not: SALES_ORDERS_STATUSES.CANCELLED }
      }),
      include: {
        salesOrderItems: true
      }
    })

    // Group sales orders by month
    const salesByMonth: Record<string, { count: number; value: number }> = {}
    salesLastSixMonths.forEach((order) => {
      const date = new Date(order.orderDate)
      const monthName = monthNames[date.getMonth()]
      const year = date.getFullYear()
      const key = `${monthName} ${year}`

      if (!salesByMonth[key]) {
        salesByMonth[key] = {
          count: 0,
          value: 0
        }
      }

      salesByMonth[key].count++
      order.salesOrderItems.forEach((item: any) => {
        salesByMonth[key].value += item.amount || 0
      })
    })

    // Create sales trends array with data for all months (even if no sales)
    const salesTrends = months.map((month) => ({
      month,
      salesCount: salesByMonth[month]?.count || 0,
      salesValue: salesByMonth[month]?.value || 0
    }))

    // Get customer metrics - filtered by agency
    const customerMetrics = {
      newCustomers: await prisma.customer.count({
        where: {
          companyId: user?.companyId,
          createdAt: {
            gte: thirtyDaysAgo
          },
          ...(selectedAgency !== "All" && {
            salesOrders: {
              some: {
                agencyId: selectedAgency
              }
            }
          })
        }
      }),
      // Find active customers by their association with sales orders - filtered by agency
      activeCustomers: await prisma.customer.count({
        where: {
          companyId: user?.companyId,
          salesOrders: {
            some: {
              orderDate: {
                gte: thirtyDaysAgo
              },
              ...(selectedAgency !== "All" && {
                agencyId: selectedAgency
              })
            }
          }
        }
      }),
      customersByType: [
        { name: 'Business', value: 65, color: 'blue.6' },
        { name: 'Individual', value: 25, color: 'teal.6' },
        { name: 'Government', value: 10, color: 'violet.6' }
      ],
      customerActivity: [
        { name: 'Frequent', value: 45, color: 'green.6' },
        { name: 'Regular', value: 30, color: 'blue.6' },
        { name: 'Occasional', value: 25, color: 'orange.6' }
      ]
    }

    const dashboardData = {
      firstName: user?.profile?.firstName,
      stats: {
        ...(inventoryStats || stats || {}),
        orders: {
          pendingSalesOrders,
          pendingPurchaseOrders,
          recentSalesTotal,
          recentPurchasesTotal,
          ordersComparisonPercentage
        },
        finances: {
          pendingInvoices,
          pendingBills,
          recentPaymentsReceived: recentPaymentsReceived._sum?.amountReceived || 0,
          recentPaymentsMade: recentPaymentsMade._sum?.amountReceived || 0,
          cashflow
        },
        trendingProducts,
        salesTrends,
        customerMetrics
      },
      agencies,
      sites,
    }

    // Return JSON for fetcher requests, otherwise return normal data
    if (isFetcher) {
      return Response.json(dashboardData)
    }
    return data({ ...dashboardData })
  } catch (error) {
    throw error
  }
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const { firstName, agencies, sites, stats } = loaderData as unknown as LoaderData

  return (
    <Dashboard
      firstName={firstName}
      inventory={stats.inventory}
      stockStatus={stats.stockStatus}
      orders={stats.orders}
      finances={stats.finances}
      trendingProducts={stats.trendingProducts}
      salesTrends={stats.salesTrends}
      customerMetrics={stats.customerMetrics}
      agencies={agencies}
      sites={sites}
    />
  )
}
