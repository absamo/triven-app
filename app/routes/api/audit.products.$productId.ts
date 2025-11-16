import type { LoaderFunctionArgs } from 'react-router'
import { auditQueryService } from '~/app/services/audit-query.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Require authentication - only authenticated users can view audit history
  try {
    await requireBetterAuthUser(request, ['read:products'])
  } catch (error) {
    console.error('[audit.products.$productId] Authentication error:', error)
    return new Response(JSON.stringify({ error: 'Unauthorized', items: [], total: 0 }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { productId } = params

  if (!productId) {
    return new Response(JSON.stringify({ error: 'Product ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Parse query parameters
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor') || undefined
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const userId = url.searchParams.get('userId') || undefined
  const eventType = url.searchParams.get('eventType') as 'create' | 'update' | 'delete' | undefined
  const startDateParam = url.searchParams.get('startDate')
  const startDate = startDateParam ? new Date(startDateParam) : undefined
  const endDateParam = url.searchParams.get('endDate')
  // Set end date to end of day (23:59:59.999)
  const endDate = endDateParam
    ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
    : undefined

  try {
    // Fetch audit history for the product
    const result = await auditQueryService.getAuditHistory({
      entityType: 'product',
      entityId: productId,
      cursor,
      limit,
      userId,
      eventType,
      startDate,
      endDate,
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('[audit.products.$productId] Error fetching audit history:', error)
    console.error(
      '[audit.products.$productId] Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace'
    )
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch audit history',
        message: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        total: 0,
        hasMore: false,
        nextCursor: null,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
