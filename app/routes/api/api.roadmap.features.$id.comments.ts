import { data, type LoaderFunctionArgs } from 'react-router'
import { getFeatureComments } from '~/app/services/roadmap/feature.service'

export async function loader({ params }: LoaderFunctionArgs) {
  const featureId = params.id

  if (!featureId) {
    return data({ error: 'Feature ID is required' }, { status: 400 })
  }

  try {
    const comments = await getFeatureComments(featureId)
    return data({ comments })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return data({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
