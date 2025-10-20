import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import RoadmapIcon from '~/app/components/Roadmap/RoadmapIcon'

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </MantineProvider>
  )
}

describe('RoadmapIcon', () => {
  it('should render roadmap icon for admin users', () => {
    renderWithProviders(<RoadmapIcon isAdmin={true} />)

    const link = screen.getByRole('link')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/roadmap')

    // Verify the icon is rendered
    const svg = link.querySelector('svg')
    expect(svg).toBeDefined()
  })

  it('should not render link for non-admin users', () => {
    renderWithProviders(<RoadmapIcon isAdmin={false} />)

    const link = screen.queryByRole('link')
    expect(link).toBeNull()
  })

  it('should render with roadmap path', () => {
    renderWithProviders(<RoadmapIcon isAdmin={true} />)

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/roadmap')
  })

  it('should render IconRoadSign component', () => {
    const { container } = renderWithProviders(<RoadmapIcon isAdmin={true} />)

    // Check for the SVG icon
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.classList.contains('tabler-icon-road-sign')).toBe(true)
  })
})
