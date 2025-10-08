import { type LoaderFunction, type LoaderFunctionArgs } from 'react-router'
import { getFilteredProducts } from '~/app/services/products.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url)

    // Safe JSON parsing with null checks
    const searchParam = url.searchParams.get('search')
    const search = searchParam ? (JSON.parse(searchParam) as string | null) : null

    const statusesParam = url.searchParams.get('statuses')
    const statuses = statusesParam ? (JSON.parse(statusesParam) as string[] | null) : null

    const categoriesParam = url.searchParams.get('categories')
    const categories = categoriesParam ? (JSON.parse(categoriesParam) as string[] | null) : null

    const agenciesParam = url.searchParams.get('agencies')
    const agencies = agenciesParam ? (JSON.parse(agenciesParam) as string[] | null) : null

    const sitesParam = url.searchParams.get('sites')
    const sites = sitesParam ? (JSON.parse(sitesParam) as string[] | null) : null

    const reorderAlert = url.searchParams.get('reorderAlert') === 'true'

    const deadStock = url.searchParams.get('deadStock') === 'true'

    const accuracyFilter = url.searchParams.get('accuracyFilter') === 'true'

    const sortBy = url.searchParams.get('sortBy') || undefined
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

    const filteredProducts = await getFilteredProducts(request, {
      search,
      statuses,
      categories,
      agencies,
      sites,
      reorderAlert,
      deadStock,
      accuracyFilter,
      sortBy,
      sortOrder,
    })

    return { products: filteredProducts || [], isFiltered: true }
  } catch (error) {
    console.error('Product search error:', error)
    // Return empty results instead of throwing an error
    return { products: [], isFiltered: true }
  }
}
