/**
 * T075-T076: Error Boundary Component
 * Provides error handling and fallback UI for route errors
 */
import { Alert, Button, Container, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle, IconHome, IconRefresh } from '@tabler/icons-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function ErrorBoundary() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let message = 'An unexpected error occurred. Please try again.'
  let statusCode: number | undefined

  if (isRouteErrorResponse(error)) {
    statusCode = error.status

    switch (error.status) {
      case 401:
        title = 'Unauthorized'
        message = 'You need to be logged in to access this page.'
        break
      case 403:
        title = 'Access Denied'
        message = error.data || 'You do not have permission to access this resource.'
        break
      case 404:
        title = 'Not Found'
        message = 'The page or resource you are looking for does not exist.'
        break
      case 500:
        title = 'Server Error'
        message = 'An internal server error occurred. Please try again later.'
        break
      default:
        title = `Error ${error.status}`
        message = error.statusText || error.data || message
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="lg" align="center">
          <IconAlertTriangle size={64} stroke={1.5} color="var(--mantine-color-red-6)" />

          <div style={{ textAlign: 'center' }}>
            <Title order={2} mb="xs">
              {title}
            </Title>
            {statusCode && (
              <Text c="dimmed" size="sm" mb="md">
                Error Code: {statusCode}
              </Text>
            )}
          </div>

          <Alert color="red" variant="light" style={{ width: '100%' }}>
            {message}
          </Alert>

          <Stack gap="sm" style={{ width: '100%' }}>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}
              fullWidth
            >
              Reload Page
            </Button>
            <Button
              leftSection={<IconHome size={16} />}
              component={Link}
              to="/dashboard"
              variant="outline"
              fullWidth
            >
              Go to Dashboard
            </Button>
          </Stack>

          {import.meta.env.DEV && error instanceof Error && error.stack && (
            <Paper p="md" withBorder style={{ width: '100%', overflow: 'auto' }}>
              <Text size="xs" c="dimmed" mb="xs" fw={600}>
                Stack Trace (Development Only):
              </Text>
              <Text
                size="xs"
                component="pre"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {error.stack}
              </Text>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
