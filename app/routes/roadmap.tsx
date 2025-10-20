import { Alert, Container, Loader, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { Suspense } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { data, isRouteErrorResponse, redirect, useLoaderData, useRouteError } from 'react-router'
import { isAdmin } from '~/app/lib/roadmap/permissions'
import { getBetterAuthUser } from '~/app/services/better-auth.server'
import { getFeatures } from '~/app/services/roadmap/feature.service'

/**
 * Loader for roadmap page - requires admin access
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Get authenticated user
  const user = await getBetterAuthUser(request)

  // Redirect to login if not authenticated
  if (!user) {
    const url = new URL(request.url)
    return redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`)
  }

  // Check if user is admin
  if (!isAdmin(user)) {
    // Redirect non-admin users to dashboard with error message
    throw new Response('Forbidden: Admin access required', {
      status: 403,
      statusText: 'Forbidden',
    })
  }

  // Load all features grouped by status
  const result = await getFeatures({
    userId: user.id,
    limit: 100, // Load more features for kanban board
  })

  return data({
    user: {
      id: user.id,
      email: user.email,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : user.email,
    },
    features: result.features,
  })
}

import { KanbanBoard } from '~/app/components/Roadmap/KanbanBoard'

/**
 * Loading component for roadmap page
 */
function RoadmapLoadingState() {
  return (
    <Container fluid p="md">
      <Stack align="center" justify="center" style={{ minHeight: '400px' }}>
        <Loader size="lg" />
        <Text c="dimmed">Loading roadmap...</Text>
      </Stack>
    </Container>
  )
}

/**
 * Error boundary component for roadmap page
 */
export function ErrorBoundary() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred while loading the roadmap.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 403) {
      title = 'Access Denied'
      message =
        'You do not have permission to access the product roadmap. Admin access is required.'
    } else if (error.status === 404) {
      title = 'Page Not Found'
      message = 'The roadmap page could not be found.'
    } else if (error.status === 500) {
      title = 'Server Error'
      message = 'A server error occurred. Please try again later.'
    }
  }

  return (
    <Container size="md" p="xl">
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={24} />} title={title} color="red" variant="light">
          {message}
        </Alert>
        <Text c="dimmed" size="sm">
          If this problem persists, please contact your system administrator.
        </Text>
      </Stack>
    </Container>
  )
}

/**
 * Roadmap page component with loading and error states
 */
export default function RoadmapPage() {
  const { user, features } = useLoaderData<typeof loader>()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)', // Subtract header/footer height
        overflow: 'hidden',
        margin: '-1rem', // Compensate for Container's padding
      }}
    >
      <Suspense fallback={<RoadmapLoadingState />}>
        <KanbanBoard features={features} isAdmin={true} currentUserId={user.id} />
      </Suspense>
    </div>
  )
}
