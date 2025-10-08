import { createTheme, MantineProvider } from '@mantine/core'
import type { RenderResult } from '@testing-library/react'
import { render as testingLibraryRender } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import userEvent from '@testing-library/user-event'
import { createRoutesStub as reactRouterCreateRoutesStub } from 'react-router'
import { vi } from 'vitest'

// Mock React Router hooks at the module level to avoid "Cannot redefine property" errors
// This makes the mocks available to all test files that import from this utils file
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: vi.fn(),
    useSubmit: vi.fn(),
  }
})

// Mock Mantine notifications for testing
vi.mock('@mantine/notifications', async () => {
  const actual = await vi.importActual('@mantine/notifications')
  return {
    ...actual,
    notifications: {
      show: vi.fn(),
    },
  }
})

// Re-export createRoutesStub for convenience
export const createRoutesStub = reactRouterCreateRoutesStub

// Create a test theme that disables transitions for more predictable tests
const testTheme = createTheme({})

interface CustomRenderResult extends RenderResult {
  user: UserEvent
}

interface RenderWithRouterOptions {
  initialEntries?: string[]
  path?: string
  loader?: () => any
  action?: () => any
}

export function render(ui: React.ReactNode): CustomRenderResult {
  const result = testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme}>{children}</MantineProvider>
    ),
  })

  return {
    ...result,
    user: userEvent.setup(),
  }
}

// Helper function to render components that need router context
export function renderWithRouterContext(ui: React.ReactNode): CustomRenderResult {
  // Create a simple router context for components that use router hooks
  const RoutesStub = reactRouterCreateRoutesStub([
    {
      path: '*',
      Component: () => <>{ui}</>,
    },
  ])

  const result = testingLibraryRender(
    <MantineProvider theme={testTheme}>
      <RoutesStub initialEntries={['/']} />
    </MantineProvider>
  )

  return {
    ...result,
    user: userEvent.setup(),
  }
}

export function renderWithRouter(
  Component: React.ComponentType<any>,
  options: RenderWithRouterOptions = {}
): CustomRenderResult {
  const { initialEntries = ['/'], path = '/', loader, action } = options

  // Create a routes stub for testing
  const RoutesStub = reactRouterCreateRoutesStub([
    {
      path,
      Component,
      loader,
      action,
    },
  ])

  const result = testingLibraryRender(
    <MantineProvider theme={testTheme}>
      <RoutesStub initialEntries={initialEntries} />
    </MantineProvider>
  )

  return {
    ...result,
    user: userEvent.setup(),
  }
}

// Export the screen, waitFor, and userEvent from @testing-library/react
// to allow easier access in tests
import * as RTL from '@testing-library/react'
const { screen, waitFor } = RTL as any
export { screen, userEvent, waitFor }

// Re-export vi for test utilities
export { vi }
