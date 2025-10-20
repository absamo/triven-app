import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { data } from 'react-router'
import { isAdmin } from '~/app/lib/roadmap/permissions'
import { updateFeatureSchema, updateFeatureStatusSchema } from '~/app/lib/roadmap/validators'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import {
  deleteFeature,
  getFeatureById,
  updateFeature,
  updateFeatureStatus,
} from '~/app/services/roadmap/feature.service'

/**
 * GET /api/roadmap/features/:id - Get a single feature
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  // Get authenticated user
  const user = await getBetterAuthUser(request)

  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const featureId = params.id
  if (!featureId) {
    return data({ error: 'Feature ID is required' }, { status: 400 })
  }

  const feature = await getFeatureById(featureId, user.id)

  if (!feature) {
    throw new Response('Feature not found', { status: 404 })
  }

  return data(feature)
}

/**
 * PATCH /api/roadmap/features/:id - Update feature (admin only)
 * DELETE /api/roadmap/features/:id - Delete feature (admin only)
 */
export async function action({ params, request }: ActionFunctionArgs) {
  // Get authenticated user
  const user = await getBetterAuthUser(request)

  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // Check admin permission
  if (!isAdmin(user)) {
    throw new Response('Forbidden: Admin access required', { status: 403 })
  }

  const featureId = params.id
  if (!featureId) {
    return data({ error: 'Feature ID is required' }, { status: 400 })
  }

  // Handle different HTTP methods
  if (request.method === 'PATCH') {
    const body = await request.json()

    // Check if this is a status update or full update
    if (body.status && Object.keys(body).length === 1) {
      // Status-only update (drag-and-drop)
      const parsedInput = updateFeatureStatusSchema.safeParse(body)
      if (!parsedInput.success) {
        return data({ error: 'Invalid input', details: parsedInput.error.issues }, { status: 400 })
      }

      const feature = await updateFeatureStatus(featureId, parsedInput.data.status, user.id)

      return data(feature)
    }

    // Full feature update
    const parsedInput = updateFeatureSchema.safeParse(body)
    if (!parsedInput.success) {
      return data({ errors: parsedInput.error.flatten().fieldErrors }, { status: 400 })
    }

    try {
      const feature = await updateFeature(featureId, parsedInput.data, user.id)
      return data(feature)
    } catch (error) {
      return data(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'DELETE') {
    await deleteFeature(featureId, user.id)
    return data({ success: true }, { status: 200 })
  }

  throw new Response('Method Not Allowed', { status: 405 })
}
