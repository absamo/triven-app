import { type ActionFunctionArgs, data, type LoaderFunctionArgs } from 'react-router'
import { isAdmin } from '~/app/lib/roadmap/permissions'
import { createFeatureSchema, getFeaturesQuerySchema } from '~/app/lib/roadmap/validators'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import { createFeature, getFeatures } from '~/app/services/roadmap/feature.service'

/**
 * GET /api/roadmap/features - Get all features with optional filtering
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Get authenticated user
  const user = await getBetterAuthUser(request)

  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // Parse query parameters
  const url = new URL(request.url)
  const queryParams = Object.fromEntries(url.searchParams)

  const parsedQuery = getFeaturesQuerySchema.safeParse(queryParams)

  if (!parsedQuery.success) {
    return data(
      { error: 'Invalid query parameters', details: parsedQuery.error.issues },
      { status: 400 }
    )
  }

  const { status, limit, cursor } = parsedQuery.data

  // Get features
  const result = await getFeatures({
    status,
    limit,
    cursor,
    userId: user.id, // Include user's vote status
  })

  return data(result)
}

/**
 * POST /api/roadmap/features - Create a new feature (admin only)
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    throw new Response('Method Not Allowed', { status: 405 })
  }

  // Get authenticated user
  const user = await getBetterAuthUser(request)

  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // Check admin permission
  if (!isAdmin(user)) {
    throw new Response('Forbidden: Admin access required', { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const parsedInput = createFeatureSchema.safeParse(body)

  if (!parsedInput.success) {
    return data({ error: 'Invalid input', details: parsedInput.error.issues }, { status: 400 })
  }

  // Create feature
  const feature = await createFeature(parsedInput.data, user.id)

  return data(feature, { status: 201 })
}
