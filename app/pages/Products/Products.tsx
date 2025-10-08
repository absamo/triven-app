import { Badge, Button, Group, Loader, Menu, rem, Table, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconSelector,
  IconUpload,
} from '@tabler/icons-react'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useNavigate } from 'react-router'
import { PRODUCT_STATUSES, USER_ROLES } from '~/app/common/constants'
import { type IAgency } from '~/app/common/validations/agencySchema'
import { type ICategory } from '~/app/common/validations/categorySchema'
import { type IProduct } from '~/app/common/validations/productSchema'
import { type ISite } from '~/app/common/validations/siteSchema'
import { Notification, TableActionsMenu } from '~/app/components'
import ProductImportModal from '~/app/components/ProductImportModal'
import ProductFilters from '~/app/partials/ProductFilters/ProductFilters'
import { Title } from '~/app/partials/Title'

interface ProductsProps {
  products: IProduct[]
  categories: ICategory[]
  agencies: IAgency[]
  sites: ISite[]
  permissions: string[]
  isFiltered?: boolean
  userRole?: string | null
}

type FetcherData = {
  products: IProduct[]
}

export default function Products({
  products: productsProp,
  categories,
  agencies,
  sites,
  permissions,
  isFiltered: isFilteredProp = false,
  userRole,
}: ProductsProps) {
  const { t } = useTranslation('inventory')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()

  const [hasMore, setHasMore] = useState(!isFilteredProp) // Disable infinite scroll when initial results are filtered
  const [page, setPage] = useState(2) // Start from page 2 since first page is already loaded
  const [products, setProducts] = useState<IProduct[]>(productsProp)
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>(
    isFilteredProp ? productsProp : []
  )
  const [isFiltered, setIsFiltered] = useState(isFilteredProp)
  const [isExporting, setIsExporting] = useState(false)
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetcher = useFetcher()

  const elementRef = useRef<HTMLTableRowElement>(null)
  const isPaginationRequestRef = useRef<boolean>(false)
  const currentPageRef = useRef<number>(2) // Track current page for pagination
  const sortByRef = useRef<string>('createdAt') // Track current sortBy for pagination
  const sortOrderRef = useRef<'asc' | 'desc'>('desc') // Track current sortOrder for pagination

  // Translated product statuses
  const productsStatuses = [
    {
      label: t('available'),
      color: 'green',
      type: PRODUCT_STATUSES.AVAILABLE,
    },
    {
      label: t('critical'),
      color: 'orange',
      type: PRODUCT_STATUSES.CRITICAL,
    },
    {
      label: t('lowStock'),
      color: 'yellow',
      type: PRODUCT_STATUSES.LOWSTOCK,
    },
    {
      label: t('outOfStock'),
      color: 'red',
      type: PRODUCT_STATUSES.OUTOFSTOCK,
    },
    {
      label: t('damaged'),
      color: 'red',
      type: PRODUCT_STATUSES.DAMAGED,
    },
    {
      label: t('discontinued'),
      color: 'red',
      type: PRODUCT_STATUSES.DISCONTINUED,
    },
    {
      label: t('inTransit'),
      color: 'blue',
      type: PRODUCT_STATUSES.INTRANSIT,
    },
    {
      label: t('reserved'),
      color: 'blue',
      type: PRODUCT_STATUSES.RESERVED,
    },
    {
      label: t('archived'),
      color: 'blue',
      type: PRODUCT_STATUSES.ARCHIVED,
    },
    {
      label: t('onOrder'),
      color: 'blue',
      type: PRODUCT_STATUSES.ONORDER,
    },
  ]

  // Convert specific product statuses to filter options - only show key inventory statuses
  const statusFilterOptions = productsStatuses
    .filter(
      (status) =>
        status.type === PRODUCT_STATUSES.AVAILABLE ||
        status.type === PRODUCT_STATUSES.LOWSTOCK ||
        status.type === PRODUCT_STATUSES.CRITICAL ||
        status.type === PRODUCT_STATUSES.OUTOFSTOCK
    )
    .map((status) => ({
      value: status.type,
      label: status.label,
    }))

  // Convert categories to filter options
  const categoryFilterOptions = categories
    .filter((category) => category.id) // Only include categories with valid IDs
    .map((category) => ({
      value: category.id!,
      label: category.name,
    }))

  // Convert agencies to filter options
  const agencyFilterOptions = agencies
    .filter((agency) => agency.id) // Only include agencies with valid IDs
    .map((agency) => ({
      value: agency.id!,
      label: agency.name,
    }))

  // Convert sites to filter options
  const siteFilterOptions = sites
    .filter((site) => site.id) // Only include sites with valid IDs
    .map((site) => ({
      value: site.id!,
      label: site.name,
    }))

  const handleFilter = useCallback(
    (data: {
      products: IProduct[]
      categories: ICategory[]
      isFiltered: boolean
      permissions: string[]
    }) => {
      // Prevent any state updates if data is null or undefined
      if (!data) return

      if (data.products && data.products.length > 0) {
        // This is a filtered result with actual products
        setFilteredProducts(data.products)
        setIsFiltered(true)
        setHasMore(false) // Disable infinite scroll when filtering
        setPage(2) // Reset page when filtering
        currentPageRef.current = 2
      } else if (data.isFiltered === false) {
        // This is a reset signal - clear filters and let route data show through
        setFilteredProducts([])
        setIsFiltered(false)
        setHasMore(true) // Re-enable infinite scroll
        setPage(2) // Reset to page 2 when clearing filters (page 1 is already loaded)
        currentPageRef.current = 2
      } else if (data.products && Array.isArray(data.products) && data.products.length === 0) {
        // This is a search with no results - show empty table
        setFilteredProducts([])
        setIsFiltered(true)
        setHasMore(false) // Disable infinite scroll when filtering
        setPage(2) // Reset page when filtering
        currentPageRef.current = 2
      }
    },
    []
  ) // No dependencies needed since we're only calling setters

  // Handle sorting with three-state cycle
  const handleSort = (column: string) => {
    let newSortBy: string = column
    let newSortOrder: 'asc' | 'desc' = 'asc'

    // If clicking the same column, cycle through three states
    if (sortBy === column) {
      if (sortOrder === 'asc') {
        // asc -> desc
        newSortOrder = 'desc'
      } else if (sortOrder === 'desc') {
        // desc -> return to initial state (unsorted, default createdAt desc)
        newSortBy = 'createdAt'
        newSortOrder = 'desc'
      }
    }
    // If clicking different column, start with asc (already set above)

    setSortBy(newSortBy)
    setSortOrder(newSortOrder)

    // Clear any filters when sorting to avoid conflicts
    setIsFiltered(false)
    setFilteredProducts([])

    // Reset pagination - start from page 2 since we're about to load page 1
    setPage(2)
    currentPageRef.current = 2
    setHasMore(true)

    // This is a refresh request, not pagination
    isPaginationRequestRef.current = false

    // Fetch new data with sorting (this loads page 1 with new sorting)
    fetcher.load(`?sortBy=${newSortBy}&sortOrder=${newSortOrder}&limit=30&offset=0`)
  }

  // Get sort icon for table headers
  const getSortIcon = (column: string) => {
    // If we're back to default sorting (createdAt desc), show selector for all columns
    if (sortBy === 'createdAt' && sortOrder === 'desc') {
      return <IconSelector size={16} style={{ opacity: 0.7, color: '#868e96' }} />
    }

    // If this is not the currently sorted column, show inactive selector
    if (sortBy !== column) {
      return <IconSelector size={16} style={{ opacity: 0.7, color: '#868e96' }} />
    }

    // Show the appropriate icon for the current sort direction
    return sortOrder === 'asc' ? (
      <IconChevronUp size={16} style={{ color: '#228be6' }} />
    ) : (
      <IconChevronDown size={16} style={{ color: '#228be6' }} />
    )
  }

  // Use filtered products if filtering is active, otherwise use regular products
  const displayProducts = isFiltered ? filteredProducts : products

  // Handle product import
  const handleImportProducts = (importedProducts: any[]) => {
    // Don't auto-close the modal anymore - let user close it manually after reviewing results
    // This allows users to see warnings and import results

    // Add the imported products to the current product list immediately
    if (importedProducts && importedProducts.length > 0) {
      setProducts((prevProducts) => [...importedProducts, ...prevProducts])
    }

    // Reset filters to show all products including new ones
    setIsFiltered(false)
    setFilteredProducts([])
    setPage(2)
    currentPageRef.current = 2
    setHasMore(true)
  }

  // Handle product deletion
  const handleDeleteProduct = async (id: string) => {
    setDeletingProductId(id) // Track which product is being deleted
    fetcher.submit(
      { id },
      {
        method: 'DELETE',
        action: '/products', // Explicitly specify the action URL
      }
    )
  }

  // Handle product duplication
  const handleDuplicateProduct = async (id: string) => {
    await fetcher.submit(
      { id },
      {
        method: 'POST',
      }
    )
    fetcher.load(`?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=30&offset=0`)
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)

      // Use server-side API to generate PDF with ALL products (not just paginated client data)
      const response = await fetch('/api/products-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`)
      }

      // Get the PDF blob from the response
      const blob = await response.blob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      // You could add a toast notification here
    } finally {
      setIsExporting(false)
    }
  }

  // Handle all fetcher data in a single useEffect to prevent infinite loops
  useEffect(() => {
    // Guard clause: only process when fetcher has data and is idle
    if (!fetcher.data || fetcher.state !== 'idle') return

    const data = fetcher.data as any

    // Check if this is a deletion response first
    if (
      data.notification?.status === 'Success' &&
      data.notification?.message?.includes('deleted') &&
      deletingProductId
    ) {
      // Remove the deleted product from the local state immediately
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== deletingProductId)
      )

      // Also remove from filtered products if filtering is active
      if (isFiltered) {
        setFilteredProducts((prevFiltered) =>
          prevFiltered.filter((product) => product.id !== deletingProductId)
        )
      }

      // Clear the deleting product ID
      setDeletingProductId(null)
      return // Early return to prevent further processing
    }
    // Handle product data responses - only process if data.products exists and is an array
    else if (data.products && Array.isArray(data.products)) {
      // Check if this is a pagination request using the ref
      const isPagination = isPaginationRequestRef.current

      if (data.products.length > 0) {
        if (isPagination) {
          // This is pagination - append to existing products
          setProducts((prevProducts) => {
            // Avoid duplicates by checking if products already exist
            const existingIds = new Set(prevProducts.map((p: IProduct) => p.id))
            const newProducts = data.products.filter((p: IProduct) => !existingIds.has(p.id))
            return [...prevProducts, ...newProducts]
          })
        } else {
          // This is a refresh - replace all products
          setProducts(data.products)
        }
      } else {
        // Handle empty data results - no more products available
        if (isPagination) {
          setHasMore(false)
        }
      }

      // Reset the pagination flag after processing
      isPaginationRequestRef.current = false
    }
  }, [fetcher.data, fetcher.state, deletingProductId]) // Initialize filtered state based on props
  useEffect(() => {
    if (isFilteredProp) {
      setFilteredProducts(productsProp)
      setIsFiltered(true)
      setHasMore(false)
    } else {
      // When filters are reset, update the main products state to show all products
      setProducts(productsProp)
      setIsFiltered(false)
      setFilteredProducts([])
      // Enable infinite scroll if we have a full page of products (30), indicating more may be available
      // If we have less than 30 products, there are definitely no more to load
      const hasMoreProducts = productsProp.length >= 30
      setHasMore(hasMoreProducts)
      // Reset pagination state to allow proper infinite scroll
      setPage(2) // Next page to load after the initial 30
      currentPageRef.current = 2
    }
  }, [isFilteredProp, productsProp])

  // Keep refs in sync with sort state
  useEffect(() => {
    sortByRef.current = sortBy
    sortOrderRef.current = sortOrder
  }, [sortBy, sortOrder])

  // Handle sorting of existing products when sort state changes
  useEffect(() => {
    // Don't sort if products are empty, filtered, or fetcher is not idle
    if (products.length === 0 || isFiltered || fetcher.state !== 'idle') return

    // Only sort text fields that need client-side sorting
    if (sortBy === 'name' || sortBy === 'status' || sortBy === 'site' || sortBy === 'agency') {
      setProducts((prevProducts) => {
        // Don't re-sort if already sorted correctly
        if (prevProducts.length <= 1) return prevProducts

        const sortedProducts = [...prevProducts].sort((a, b) => {
          let aValue = ''
          let bValue = ''

          if (sortBy === 'name') {
            aValue = a.name?.toLowerCase() || ''
            bValue = b.name?.toLowerCase() || ''
          } else if (sortBy === 'status') {
            aValue = a.status?.toLowerCase() || ''
            bValue = b.status?.toLowerCase() || ''
          } else if (sortBy === 'site') {
            aValue = a.site?.name?.toLowerCase() || ''
            bValue = b.site?.name?.toLowerCase() || ''
          } else if (sortBy === 'agency') {
            aValue = a.agency?.name?.toLowerCase() || ''
            bValue = b.agency?.name?.toLowerCase() || ''
          }

          const comparison = aValue.localeCompare(bValue, 'en', {
            numeric: true,
            sensitivity: 'base',
            ignorePunctuation: false,
          })
          return sortOrder === 'asc' ? comparison : -comparison
        })

        return sortedProducts
      })
    }
  }, [sortBy, sortOrder]) // Removed products.length, isFiltered, fetcher.state to prevent infinite loop

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    // Don't setup observer if conditions are not met
    if (isFiltered || fetcher.state !== 'idle' || !hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0]

        // Double-check hasMore and fetcher state before making request
        if (entry.isIntersecting && hasMore && fetcher.state === 'idle') {
          const currentPage = currentPageRef.current
          const offset = (currentPage - 1) * 30 // For page 2, offset = 30; for page 3, offset = 60

          // Mark this as a pagination request
          isPaginationRequestRef.current = true
          fetcher.load(
            `?limit=30&offset=${offset}&sortBy=${sortByRef.current}&sortOrder=${sortOrderRef.current}&pagination=true`
          )

          // Increment page for next time
          const nextPage = currentPage + 1
          setPage(nextPage)
          currentPageRef.current = nextPage
        }
      },
      {
        threshold: 0.1,
        rootMargin: '20px',
      }
    )

    if (observer && elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [hasMore, fetcher.state, isFiltered])

  const canEdit = permissions.includes('update:products')
  const isAdmin = userRole === USER_ROLES.ADMIN

  const rows = displayProducts.map(
    ({ id, name, sellingPrice, physicalStockOnHand, status, site, agency }) => {
      const currentStatus = productsStatuses.find((productStatus) => productStatus.type === status)
      return (
        <Table.Tr
          key={id}
          onClick={() => canEdit && navigate(`/products/${id}/edit`)}
          style={{ position: 'relative' }}
          onMouseEnter={() => setHoveredRowId(id ?? null)}
          onMouseLeave={() => setHoveredRowId(null)}
        >
          <Table.Td width={rem(400)}>
            <Text size="sm">{name}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{physicalStockOnHand}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{sellingPrice}</Text>
          </Table.Td>
          <Table.Td>
            {currentStatus && (
              <Badge color={currentStatus.color} variant="light">
                {currentStatus.label}
              </Badge>
            )}
          </Table.Td>
          <Table.Td>
            <Text size="sm">{site?.name}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{agency?.name}</Text>
          </Table.Td>
          <Table.Td style={{ textAlign: 'center', position: 'relative', padding: 0 }}>
            <TableActionsMenu itemId={id} hoveredRowId={hoveredRowId}>
              <Menu.Item
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/products/${id}/edit`)
                }}
              >
                {t('edit')}
              </Menu.Item>
              <Menu.Item
                onClick={(e) => {
                  e.stopPropagation()
                  handleDuplicateProduct(id!)
                }}
              >
                {t('duplicate')}
              </Menu.Item>
              <Menu.Item
                color="red"
                type="submit"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteProduct(id!)
                }}
              >
                {t('delete')}
              </Menu.Item>
            </TableActionsMenu>
          </Table.Td>
        </Table.Tr>
      )
    }
  )

  return (
    <>
      <Title
        to={'/products/create'}
        canCreate={permissions.includes('create:products')}
        additionalButtons={
          <Group>
            <Button
              variant="outline"
              leftSection={<IconUpload size={16} />}
              onClick={openImportModal}
              disabled={!permissions.includes('create:products')}
            >
              {tCommon('import')}
            </Button>
            <Button
              variant="outline"
              leftSection={<IconDownload size={16} />}
              onClick={handleExportPDF}
              loading={isExporting}
              disabled={displayProducts.length === 0}
            >
              {t('exportProducts')}
            </Button>
          </Group>
        }
      >
        {t('title')}
      </Title>

      <ProductFilters
        searchProps={{
          description: t('searchProducts'),
        }}
        statusProps={{
          description: t('filterByStatus'),
          data: statusFilterOptions,
        }}
        categoryProps={{
          description: t('filterByCategory'),
          data: categoryFilterOptions,
        }}
        agencyProps={
          isAdmin
            ? {
                description: 'Filter by Agency',
                data: agencyFilterOptions,
              }
            : undefined
        }
        siteProps={
          isAdmin
            ? {
                description: 'Filter by Site',
                data: siteFilterOptions,
              }
            : undefined
        }
        onFilter={handleFilter}
        route="/api/products-search"
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      <Table verticalSpacing="xs" highlightOnHover={canEdit} withTableBorder striped>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th
              onClick={() => handleSort('name')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group gap={6} align="center">
                <Text fw={600} size="xs">
                  {t('nameHeader')}
                </Text>
                {getSortIcon('name')}
              </Group>
            </Table.Th>
            <Table.Th
              onClick={() => handleSort('physicalStockOnHand')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group gap={6} align="center" w={rem(100)}>
                <Text fw={600} size="xs">
                  {t('inStockQtyHeader')}
                </Text>
                {getSortIcon('physicalStockOnHand')}
              </Group>
            </Table.Th>
            <Table.Th
              onClick={() => handleSort('sellingPrice')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group gap={6} align="center" w={rem(110)}>
                <Text fw={600} size="xs">
                  {t('sellingPriceHeader')}
                </Text>
                {getSortIcon('sellingPrice')}
              </Group>
            </Table.Th>
            <Table.Th
              onClick={() => handleSort('status')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group gap={6} align="center">
                <Text fw={600} size="xs">
                  {t('statusHeader')}
                </Text>
                {getSortIcon('status')}
              </Group>
            </Table.Th>
            <Table.Th
              onClick={() => handleSort('site')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group gap={6} align="center">
                <Text fw={600} size="xs">
                  {t('siteHeader')}
                </Text>
                {getSortIcon('site')}
              </Group>
            </Table.Th>
            <Table.Th
              onClick={() => handleSort('agency')}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <Group gap={6} align="center">
                <Text fw={600} size="xs">
                  {t('agencyHeader')}
                </Text>
                {getSortIcon('agency')}
              </Group>
            </Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">
                <Text size="sm" c="dimmed" py="md">
                  {t('noProductsFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      {hasMore && !isFiltered && displayProducts.length > 0 && (
        <Group justify="center" ref={elementRef}>
          <Loader size="sm" type="dots" />
        </Group>
      )}

      {/* Product count display */}
      <Group justify="center" mt="md">
        <Text size="sm" c="dimmed">
          {t('showingProducts', {
            count: displayProducts.length,
          })}
        </Text>
      </Group>

      <ProductImportModal
        opened={importModalOpened}
        onClose={closeImportModal}
        onImport={handleImportProducts}
      />

      {/* Handle notifications from fetcher data */}
      {fetcher.data?.notification && <Notification notification={fetcher.data.notification} />}
    </>
  )
}
