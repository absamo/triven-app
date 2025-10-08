import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'
import { USER_ROLES } from '~/app/common/constants'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ICategory } from '~/app/common/validations/categorySchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import Products from '~/app/pages/Products'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategories } from '~/app/services/categories.server'
import {
  deleteProduct,
  duplicateProduct,
  getFilteredProducts,
  getProducts,
  getProductsForAgency,
} from '~/app/services/products.server'
import type { Route } from './+types/products'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await requireBetterAuthUser(request, ['read:products'])

    const url = new URL(request.url)

    const limit = Number(url.searchParams.get('limit') || 30)
    const offset = Number(url.searchParams.get('offset') || 0)
    const searchParam = url.searchParams.get('search')
    const search = searchParam
      ? searchParam.startsWith('"')
        ? JSON.parse(searchParam)
        : searchParam
      : undefined
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    // Get agency parameter for filtering
    const agencyParam = url.searchParams.get('agency')

    // Parse statuses from query parameters
    const statusesParam = url.searchParams.get('statuses')
    const statuses = statusesParam ? JSON.parse(statusesParam) : null

    // Parse categories from query parameters
    const categoriesParam = url.searchParams.get('categories')
    const categoryFilters = categoriesParam ? JSON.parse(categoriesParam) : null

    // Parse agencies from query parameters
    const agenciesParam = url.searchParams.get('agencies')
    const agencyFilters = agenciesParam ? JSON.parse(agenciesParam) : null

    // Parse sites from query parameters
    const sitesParam = url.searchParams.get('sites')
    const siteFilters = sitesParam ? JSON.parse(sitesParam) : null

    // Parse reorder alert filter
    const reorderAlert = url.searchParams.get('reorderAlert') === 'true'

    // Parse dead stock filter
    const deadStock = url.searchParams.get('deadStock') === 'true'

    // Parse accuracy filter
    const accuracyFilter = url.searchParams.get('accuracyFilter') === 'true'

    // Only admin users can see products from all sites
    const isAdmin = user?.role?.name === USER_ROLES.ADMIN

    // Use filtered products if any filter parameters are provided, otherwise use regular products
    const hasFilters =
      (statuses && statuses.length > 0) ||
      (categoryFilters && categoryFilters.length > 0) ||
      (agencyFilters && agencyFilters.length > 0) ||
      (siteFilters && siteFilters.length > 0) ||
      search ||
      reorderAlert ||
      deadStock ||
      accuracyFilter

    let products: IProduct[] = []

    // If a specific agency is provided, get products for that agency
    if (agencyParam && agencyParam !== 'All') {
      // For complex filters like dead stock that require database queries,
      // we need to use the regular filtering functions and filter the results
      if (deadStock || hasFilters) {
        // Use existing filtering logic and then filter by agency client-side
        const allFilteredProducts = hasFilters
          ? await getFilteredProducts(request, {
              search: search || null,
              statuses: statuses || null,
              categories: categoryFilters || null,
              agencies: agencyFilters || null,
              sites: siteFilters || null,
              reorderAlert: reorderAlert || false,
              deadStock: deadStock || false,
              accuracyFilter: accuracyFilter || false,
              sortBy,
              sortOrder,
            })
          : await getProducts(request, {
              search,
              limit: 1000, // Get more products to filter by agency
              offset: 0,
              allSites: isAdmin,
              sortBy,
              sortOrder,
            })

        // Filter by agency on the results
        products = (allFilteredProducts as any[]).filter(
          (product) => product.agencyId === agencyParam
        ) as any as IProduct[]
      } else {
        // For simple cases with no complex filters, use getProductsForAgency
        products = (await getProductsForAgency(request, agencyParam)) as any as IProduct[]
      }
    } else {
      // Use existing logic for normal products filtering (no specific agency)
      const resultProducts = hasFilters
        ? await getFilteredProducts(request, {
            search: search || null,
            statuses: statuses || null,
            categories: categoryFilters || null,
            agencies: agencyFilters || null,
            sites: siteFilters || null,
            reorderAlert: reorderAlert || false,
            deadStock: deadStock || false,
            accuracyFilter: accuracyFilter || false,
            sortBy,
            sortOrder,
          })
        : await getProducts(request, {
            search,
            limit,
            offset,
            allSites: isAdmin, // Only admins can view products from all sites
            sortBy,
            sortOrder,
          })
      products = resultProducts as any as IProduct[]
    }

    const categories = await getCategories(request)
    const agencies = await getAgencies(request)

    // Get sites from agencies (agencies include sites relation from Prisma)
    const sites = agencies ? agencies.flatMap((agency: any) => agency.sites || []) : []

    return {
      products,
      categories,
      agencies: agencies || [],
      sites,
      isFiltered: hasFilters, // Indicate whether results are filtered
      permissions:
        user?.role?.permissions?.filter(
          (permission) =>
            permission === 'create:products' ||
            permission === 'update:products' ||
            permission === 'delete:products'
        ) || [],
      userRole: user?.role?.name || null,
    }
  } catch (error) {
    console.error('Error in products loader:', error)
    throw new Response('Internal Server Error', { status: 500 })
  }
}

export async function action({ request }: LoaderFunctionArgs) {
  if (request.method === 'DELETE') {
    const formData = await request.formData()
    const id = formData.get('id') as string

    return await deleteProduct(request, id)
  }

  if (request.method === 'POST') {
    const formData = await request.formData()
    const id = formData.get('id') as string

    return await duplicateProduct(request, id)
  }
}

export default function ProductsRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { products, categories, agencies, sites, permissions, isFiltered, userRole } =
    loaderData as unknown as {
      products: IProduct[]
      categories: ICategory[]
      agencies: IAgency[]
      sites: ISite[]
      permissions: string[]
      isFiltered: boolean
      userRole: string | null
    }

  return (
    <Products
      products={products}
      categories={categories}
      agencies={agencies}
      sites={sites}
      permissions={permissions}
      isFiltered={isFiltered}
      userRole={userRole}
    />
  )
}
