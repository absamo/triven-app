import type { LoaderFunction } from 'react-router'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategories } from '~/app/services/categories.server'

export const loader: LoaderFunction = async ({ request }) => {
  // Ensure user has permission to read categories
  await requireBetterAuthUser(request, ['read:categories'])

  const categories = await getCategories(request)

  return new Response(JSON.stringify(categories || []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
