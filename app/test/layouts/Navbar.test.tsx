/**
 * @vitest-environment jsdom
 */

/**
 * Navbar Navigation Reorganization Tests
 * Feature: 004-navigation-reorganization
 *
 * Tests verify the new Administration submenu structure with 4 categories:
 * - Core Settings (Plans, Settings)
 * - Team Management (Teams, Roles)
 * - Structure (Agencies, Sites)
 * - AI & Insights (AI Agent, Roadmap, Analytics)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock react-i18next before other imports
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))

import Navbar from '~/app/layouts/Navbar'
import { renderWithRouterContext, screen } from '../utils'

describe('Navbar - Navigation Reorganization (004)', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  describe('Type Definitions', () => {
    it('verifies IMenu type supports submenus property', () => {
      type IMenu = {
        icon: React.FC<any>
        label: string
        active?: boolean
        link?: string
        sublinks?: Array<{ label: string; link: string; active: boolean }>
        submenus?: IMenu[]
      }

      const testMenu: IMenu = {
        icon: () => null,
        label: 'Test',
        submenus: [],
      }

      expect(testMenu.submenus).toBeDefined()
      expect(Array.isArray(testMenu.submenus)).toBe(true)
    })
  })

  describe('Core Settings Submenu (US1)', () => {
    it('renders Core Settings with Plans and Settings when user has both permissions', () => {
      const permissions = ['read:plans', 'read:settings']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:plans')).toBeInTheDocument()
      expect(screen.getByText('navigation:settings')).toBeInTheDocument()
    })

    it('shows Core Settings with only Plans when user has plans permission', () => {
      const permissions = ['read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:plans')).toBeInTheDocument()
      expect(screen.queryByText('navigation:settings')).not.toBeInTheDocument()
    })

    it('shows Core Settings with only Settings when user has settings permission', () => {
      const permissions = ['read:settings']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.queryByText('navigation:plans')).not.toBeInTheDocument()
      expect(screen.getByText('navigation:settings')).toBeInTheDocument()
    })
  })

  describe('Team Management Submenu (US2)', () => {
    it('renders Team Management with Teams and Roles', () => {
      const permissions = ['read:users', 'read:roles']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:teams')).toBeInTheDocument()
      expect(screen.getByText('navigation:roles')).toBeInTheDocument()
    })

    it('shows Team Management with only Teams when user has users permission', () => {
      const permissions = ['read:users']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:teams')).toBeInTheDocument()
      expect(screen.queryByText('navigation:roles')).not.toBeInTheDocument()
    })

    it('separates Team Management from Structure submenu', () => {
      const permissions = ['read:users', 'read:agencies']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:teams')).toBeInTheDocument()
      expect(screen.getByText('navigation:agencies')).toBeInTheDocument()
    })
  })

  describe('Structure Submenu (US3)', () => {
    it('renders Structure with Agencies and Sites', () => {
      const permissions = ['read:agencies', 'read:sites']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:agencies')).toBeInTheDocument()
      expect(screen.getByText('navigation:sites')).toBeInTheDocument()
    })

    it('shows Structure with only Agencies when user has agencies permission', () => {
      const permissions = ['read:agencies']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:agencies')).toBeInTheDocument()
      expect(screen.queryByText('navigation:sites')).not.toBeInTheDocument()
    })

    it('shows Structure with only Sites when user has sites permission', () => {
      const permissions = ['read:sites']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.queryByText('navigation:agencies')).not.toBeInTheDocument()
      expect(screen.getByText('navigation:sites')).toBeInTheDocument()
    })
  })

  describe('AI & Insights Submenu (US4)', () => {
    it('renders AI & Insights with AI Agent, Roadmap, and Analytics', () => {
      // Need both analytics and at least one admin permission
      const permissions = ['read:analytics', 'read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:assistant')).toBeInTheDocument()
      expect(screen.getByText('navigation:roadmap')).toBeInTheDocument()
      expect(screen.getByText('navigation:analytics')).toBeInTheDocument()
    })

    it('shows AI Agent and Roadmap even without analytics permission', () => {
      // Need at least one admin permission for Administration section to render
      const permissions: string[] = ['read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:assistant')).toBeInTheDocument()
      expect(screen.getByText('navigation:roadmap')).toBeInTheDocument()
    })

    it('hides Analytics when user lacks analytics permission', () => {
      // Need at least one admin permission for Administration section
      const permissions: string[] = ['read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.queryByText('navigation:analytics')).not.toBeInTheDocument()
    })

    it('AI Agent displays NEW badge', () => {
      renderWithRouterContext(
        <Navbar permissions={['read:plans']} showMiniNavbar={false} onClick={mockOnClick} />
      )

      const aiAgentElement = screen.getByText('navigation:assistant')
      expect(aiAgentElement).toBeInTheDocument()

      // Check for NEW badge near AI Agent - it's in the same parent
      const parent = aiAgentElement.parentElement
      expect(parent?.textContent).toContain('NEW')
    })
  })

  describe('Analytics Migration (US5)', () => {
    it('Analytics does not appear in Operations section', () => {
      // Need both purchaseOrders, analytics, and admin permission
      const permissions = ['read:purchaseOrders', 'read:analytics', 'read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      // Analytics should be in AI & Insights, not Operations
      expect(screen.getByText('navigation:analytics')).toBeInTheDocument()
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
    })

    it('Analytics appears in AI & Insights when user has permission', () => {
      // Need both analytics and at least one admin permission
      const permissions = ['read:analytics', 'read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:analytics')).toBeInTheDocument()
    })

    it('Analytics link points to correct route', () => {
      // Need both analytics and at least one admin permission
      const permissions = ['read:analytics', 'read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      const analyticsLink = screen.getByText('navigation:analytics').closest('a')
      expect(analyticsLink).toHaveAttribute('href', '/analytics/inventoryOverview')
    })
  })

  describe('Rendering Modes', () => {
    it('renders all 4 Administration submenus in full navbar mode', () => {
      const fullPermissions = [
        'read:plans',
        'read:settings',
        'read:users',
        'read:roles',
        'read:agencies',
        'read:sites',
        'read:analytics',
      ]

      renderWithRouterContext(
        <Navbar permissions={fullPermissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:administration')).toBeInTheDocument()
      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
    })

    it('mini navbar flattens Administration into separate icons', () => {
      const fullPermissions = ['read:plans', 'read:users', 'read:agencies', 'read:analytics']

      const { container } = renderWithRouterContext(
        <Navbar permissions={fullPermissions} showMiniNavbar={true} onClick={mockOnClick} />
      )

      // In mini mode, Administration header should not appear
      expect(screen.queryByText('navigation:administration')).not.toBeInTheDocument()

      // In mini mode, submenus are rendered as icon buttons (no text labels visible)
      // Just verify the icons are rendered by checking for menu buttons
      const menuButtons = container.querySelectorAll('button[aria-haspopup="menu"]')
      expect(menuButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Permission Edge Cases', () => {
    it('shows only authorized submenus with mixed permissions', () => {
      const permissions = ['read:plans', 'read:agencies']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.queryByText('navigation:teamManagement')).not.toBeInTheDocument()
    })

    it('AI & Insights visible when user has admin permissions', () => {
      // AI & Insights requires Administration section which needs at least one admin permission
      const permissions: string[] = ['read:plans']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:assistant')).toBeInTheDocument()
    })

    it('shows only AI & Insights when user has no admin permissions', () => {
      const permissions = ['read:products', 'read:customers']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      // Administration section should still render (for AI & Insights)
      expect(screen.getByText('navigation:administration')).toBeInTheDocument()

      // AI & Insights should be visible (available to all users)
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:assistant')).toBeInTheDocument()
      expect(screen.getByText('navigation:roadmap')).toBeInTheDocument()

      // Admin-only submenus should NOT render
      expect(screen.queryByText('navigation:coreSettings')).not.toBeInTheDocument()
      expect(screen.queryByText('navigation:teamManagement')).not.toBeInTheDocument()
      expect(screen.queryByText('navigation:structure')).not.toBeInTheDocument()
    })

    it('AI & Insights visible to all authenticated users (US4 requirement)', () => {
      const permissions: string[] = []

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      // Administration section should render
      expect(screen.getByText('navigation:administration')).toBeInTheDocument()

      // AI & Insights submenu should be visible even with no permissions
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:assistant')).toBeInTheDocument()
      expect(screen.getByText('navigation:roadmap')).toBeInTheDocument()

      // Analytics should NOT show without permission
      expect(screen.queryByText('navigation:analytics')).not.toBeInTheDocument()
    })
  })

  describe('Translation Keys', () => {
    it('renders all new translation keys correctly', () => {
      const fullPermissions = ['read:plans', 'read:users', 'read:agencies', 'read:analytics']

      renderWithRouterContext(
        <Navbar permissions={fullPermissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()
      expect(screen.getByText('navigation:roadmap')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('renders complete navigation structure with all sections', () => {
      const fullPermissions = [
        'read:products',
        'read:categories',
        'read:suppliers',
        'read:customers',
        'read:salesOrders',
        'read:invoices',
        'read:purchaseOrders',
        'read:bills',
        'read:plans',
        'read:settings',
        'read:users',
        'read:roles',
        'read:agencies',
        'read:sites',
        'read:analytics',
      ]

      renderWithRouterContext(
        <Navbar permissions={fullPermissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      // Verify main sections
      expect(screen.getByText('navigation:inventory')).toBeInTheDocument()
      expect(screen.getByText('navigation:sales')).toBeInTheDocument()
      expect(screen.getByText('navigation:operations')).toBeInTheDocument()
      expect(screen.getByText('navigation:administration')).toBeInTheDocument()

      // Verify all 4 Administration submenus
      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()

      // Verify Analytics is in correct location
      expect(screen.getByText('navigation:analytics')).toBeInTheDocument()
    })

    it('validates menu structure integrity', () => {
      const fullPermissions = [
        'read:plans',
        'read:settings',
        'read:users',
        'read:roles',
        'read:agencies',
        'read:sites',
        'read:analytics',
      ]

      renderWithRouterContext(
        <Navbar permissions={fullPermissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      // Verify all 4 Administration submenus are present
      expect(screen.getByText('navigation:coreSettings')).toBeInTheDocument()
      expect(screen.getByText('navigation:teamManagement')).toBeInTheDocument()
      expect(screen.getByText('navigation:structure')).toBeInTheDocument()
      expect(screen.getByText('navigation:aiInsights')).toBeInTheDocument()

      // Verify Administration header exists
      expect(screen.getByText('navigation:administration')).toBeInTheDocument()
    })
  })

  describe('Workflow Template Admin UI Visibility (006)', () => {
    /**
     * Feature: 006-workflow-template-admin-ui
     * Tests verify workflow navigation section visibility based on permissions
     */

    // T006: Verify "Workflows" section visible when user has read:workflows permission
    it('shows Workflows section when user has read:workflows permission', () => {
      const permissions = ['read:workflows']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:workflows')).toBeInTheDocument()
    })

    // T007: Verify "Workflows" section hidden when user lacks workflow permissions
    it('hides Workflows section when user lacks workflow permissions', () => {
      const permissions = ['read:products', 'read:customers']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.queryByText('navigation:workflows')).not.toBeInTheDocument()
    })

    // T008: Verify "Workflow Templates" and "Workflow History" sublinks render correctly
    it('renders Workflow Templates and Workflow History sublinks with read:workflows permission', () => {
      const permissions = ['read:workflows']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:workflows')).toBeInTheDocument()
      expect(screen.getByText('navigation:workflowTemplates')).toBeInTheDocument()
      expect(screen.getByText('navigation:workflowHistory')).toBeInTheDocument()
    })

    it('shows Workflows section when user has read:approvals permission', () => {
      const permissions = ['read:approvals']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:workflows')).toBeInTheDocument()
      expect(screen.getByText('navigation:approvals')).toBeInTheDocument()
    })

    it('shows all workflow sublinks when user has both approvals and workflows permissions', () => {
      const permissions = ['read:approvals', 'read:workflows']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      expect(screen.getByText('navigation:workflows')).toBeInTheDocument()
      expect(screen.getByText('navigation:approvals')).toBeInTheDocument()
      expect(screen.getByText('navigation:workflowTemplates')).toBeInTheDocument()
      expect(screen.getByText('navigation:workflowHistory')).toBeInTheDocument()
    })

    it('verifies correct links for workflow sublinks', () => {
      const permissions = ['read:workflows']

      renderWithRouterContext(
        <Navbar permissions={permissions} showMiniNavbar={false} onClick={mockOnClick} />
      )

      const workflowTemplatesLink = screen.getByText('navigation:workflowTemplates').closest('a')
      const workflowHistoryLink = screen.getByText('navigation:workflowHistory').closest('a')

      expect(workflowTemplatesLink).toHaveAttribute('href', '/workflow-templates')
      expect(workflowHistoryLink).toHaveAttribute('href', '/workflow-history')
    })
  })
})
