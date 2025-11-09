/**
 * Navigation Type Contracts
 * Feature: 004-navigation-reorganization
 * 
 * This file defines the TypeScript interfaces and types for the reorganized
 * navigation menu structure. These types extend the existing IMenu pattern
 * to support nested submenus for the Administration section.
 */

import type { FC } from 'react'

/**
 * Badge configuration for menu items
 * Used to display visual indicators like "NEW", "BETA", etc.
 */
export interface INavigationBadge {
  /** Badge text content */
  text: string
  /** Mantine color name (default: 'blue') */
  color?: string
  /** Mantine badge variant (default: 'filled') */
  variant?: 'filled' | 'outline' | 'light' | 'dot'
}

/**
 * Sublink represents a final navigation target within a menu or submenu
 * These are the clickable items that navigate to specific routes
 */
export interface INavigationSublink {
  /** Display label (should be translation key from navigation.ts) */
  label: string
  /** React Router route path (must start with /) */
  link: string
  /** Whether this sublink is currently active (matches current route) */
  active: boolean
  /** Optional badge for calling attention to new/beta features */
  badge?: INavigationBadge
}

/**
 * Submenu is a grouping of related sublinks under a common category
 * Used exclusively in the Administration section to organize items logically
 * 
 * Examples:
 * - Core Settings: Plans, Settings
 * - Team Management: Teams, Roles
 * - Structure: Agencies, Sites  
 * - AI & Insights: AI Agent, Roadmap, Analytics
 */
export interface INavigationSubmenu {
  /** Tabler icon component */
  icon: FC<any>
  /** Display label (should be translation key) */
  label: string
  /** Whether this submenu is currently expanded (full navbar only) */
  active?: boolean
  /** Child navigation links */
  sublinks: INavigationSublink[]
}

/**
 * Menu represents a top-level navigation item
 * Can be one of three types:
 * 1. Direct link (has link property)
 * 2. Menu with flat sublinks (has sublinks property)
 * 3. Menu with nested submenus (has submenus property)
 */
export interface INavigationMenu {
  /** Tabler icon component */
  icon: FC<any>
  /** Display label (should be translation key from navigation.ts) */
  label: string
  /** Whether this menu is currently expanded/active */
  active?: boolean
  /** Optional: Direct navigation path (for menus without sublinks/submenus) */
  link?: string
  /** Optional: Flat list of child navigation links (traditional pattern) */
  sublinks?: INavigationSublink[]
  /** Optional: Nested submenu groups (NEW - for Administration section) */
  submenus?: INavigationSubmenu[]
}

/**
 * Permission check helpers for menu visibility
 * These functions determine whether a user has access to view specific menu items
 */
export interface INavigationPermissions {
  // Core Settings
  canViewPlans: boolean
  canViewSettings: boolean
  
  // Team Management
  canViewTeams: boolean
  canViewRoles: boolean
  
  // Structure
  canViewAgencies: boolean
  canViewSites: boolean
  
  // Analytics (moved to AI & Insights)
  canViewAnalytics: boolean
  
  // Inventory
  canViewProducts: boolean
  canViewCategories: boolean
  canViewStockAdjustments: boolean
  canViewTransferOrders: boolean
  
  // Workflows
  canViewApprovals: boolean
  
  // Purchases
  canViewSuppliers: boolean
  canViewPurchaseOrders: boolean
  canViewPurchaseReceives: boolean
  canViewBills: boolean
  canViewPaymentsMade: boolean
  
  // Sales
  canViewCustomers: boolean
  canViewSalesOrders: boolean
  canViewBackorders: boolean
  canViewInvoices: boolean
  canViewPaymentsReceived: boolean
}

/**
 * Navbar component props
 * Defines the contract between parent component and Navbar
 */
export interface INavbarProps {
  /** User permission strings (e.g., ['read:products', 'read:settings']) */
  permissions: string[]
  /** Whether to show mini navbar (icon-only mode) or full navbar */
  showMiniNavbar: boolean
  /** Currently active menu item (controlled state from parent) */
  activeMenuItem?: INavigationMenu
  /** Callback when menu item is clicked */
  onClick: (menuItem: INavigationMenu) => void
  /** Optional: Callback when navbar is toggled (future use) */
  onToggle?: () => void
}

/**
 * NavbarLinksGroup component props
 * Renders a single menu group with expandable sublinks
 */
export interface INavbarLinksGroupProps {
  /** Menu item to render */
  menuItem: INavigationMenu
  /** Callback when menu or sublink is clicked */
  onClick?: (menuItem: INavigationMenu, selected: boolean) => void
}

/**
 * NavbarLink component props (mini navbar mode)
 * Renders a single icon with hover dropdown
 */
export interface INavbarLinkProps {
  /** Menu item to render as icon */
  menu: INavigationMenu
  /** Callback when menu item is clicked */
  onClick: (menu: INavigationMenu) => void
}

/**
 * Utility type for menu building
 * Helps construct menu items with proper typing
 */
export type MenuBuilder = (
  permissions: INavigationPermissions,
  t: (key: string) => string
) => INavigationMenu[]

/**
 * Translation keys for navigation
 * Ensures type safety for i18next translation lookups
 */
export type NavigationTranslationKey =
  // Sections
  | 'main'
  | 'operations'
  | 'administration'
  | 'company'
  // Main items
  | 'dashboard'
  | 'analytics'
  | 'inventory'
  | 'workflows'
  | 'purchases'
  | 'sales'
  // Inventory
  | 'products'
  | 'categories'
  | 'stockAdjustments'
  | 'transferOrders'
  // Workflows
  | 'approvals'
  | 'workflowTemplates'
  | 'workflowHistory'
  // Purchases
  | 'suppliers'
  | 'purchaseOrders'
  | 'purchaseReceives'
  | 'bills'
  | 'paymentsMade'
  // Sales
  | 'customers'
  | 'salesOrders'
  | 'backorders'
  | 'invoices'
  | 'paymentsReceived'
  // Administration (NEW)
  | 'coreSettings'
  | 'teamManagement'
  | 'structure'
  | 'aiInsights'
  // Administration items
  | 'plans'
  | 'settings'
  | 'teams'
  | 'roles'
  | 'agencies'
  | 'sites'
  | 'assistant'
  | 'roadmap'
  | 'inventoryOverview'

/**
 * Navbar rendering mode
 * Determines how menu structure is displayed
 */
export type NavbarMode = 'mini' | 'full'

/**
 * Menu section identifiers
 * Used for organizing menu items into logical groups
 */
export type MenuSection = 'main' | 'operations' | 'administration'

/**
 * Helper function type for determining menu visibility
 * Returns true if user has permission to view at least one item in the menu
 */
export type MenuVisibilityCheck = (
  permissions: INavigationPermissions
) => boolean

/**
 * Submenu visibility checks for Administration section
 */
export interface IAdministrationVisibility {
  /** User can view Plans or Settings */
  showCoreSettings: boolean
  /** User can view Teams or Roles */
  showTeamManagement: boolean
  /** User can view Agencies or Sites */
  showStructure: boolean
  /** Always true (AI Agent available to all users) */
  showAIInsights: boolean
  /** User can view at least one Administration submenu */
  showAdministration: boolean
}

/**
 * Route helper utilities
 * Functions for working with React Router paths
 */
export interface INavigationRouteUtils {
  /** Extract first path segment from pathname (e.g., '/products/123' -> 'products') */
  getFirstPathSegment: (pathname: string) => string
  /** Check if current route matches menu item link */
  isRouteActive: (currentPath: string, menuLink: string) => boolean
  /** Check if any sublink in menu matches current route */
  hasActiveSublink: (currentPath: string, sublinks: INavigationSublink[]) => boolean
}

/**
 * Constants for navigation configuration
 */
export const NAVIGATION_CONSTANTS = {
  /** Maximum nesting depth (Menu -> Submenu -> Sublink) */
  MAX_NESTING_DEPTH: 2,
  /** Default badge color for new features */
  DEFAULT_NEW_BADGE_COLOR: 'green',
  /** Default badge variant */
  DEFAULT_BADGE_VARIANT: 'outline' as const,
  /** Section names */
  SECTIONS: {
    MAIN: 'main' as const,
    OPERATIONS: 'operations' as const,
    ADMINISTRATION: 'administration' as const,
  },
  /** Administration submenu icons */
  ADMIN_ICONS: {
    CORE_SETTINGS: 'IconBuilding',
    TEAM_MANAGEMENT: 'IconUsers',
    STRUCTURE: 'IconSitemap',
    AI_INSIGHTS: 'IconSparkles',
  },
} as const

/**
 * Type guard to check if menu has submenus (nested structure)
 */
export function hasSubmenus(menu: INavigationMenu): menu is Required<Pick<INavigationMenu, 'submenus'>> & INavigationMenu {
  return Array.isArray(menu.submenus) && menu.submenus.length > 0
}

/**
 * Type guard to check if menu has sublinks (flat structure)
 */
export function hasSublinks(menu: INavigationMenu): menu is Required<Pick<INavigationMenu, 'sublinks'>> & INavigationMenu {
  return Array.isArray(menu.sublinks) && menu.sublinks.length > 0
}

/**
 * Type guard to check if menu has direct link (no children)
 */
export function hasDirectLink(menu: INavigationMenu): menu is Required<Pick<INavigationMenu, 'link'>> & INavigationMenu {
  return typeof menu.link === 'string' && menu.link.length > 0
}

/**
 * Example usage of the navigation types:
 * 
 * ```typescript
 * // Building a menu with nested submenus
 * const administrationMenu: INavigationMenu = {
 *   icon: IconBuilding,
 *   label: t('navigation:administration'),
 *   active: false,
 *   submenus: [
 *     {
 *       icon: IconBuilding,
 *       label: t('navigation:coreSettings'),
 *       active: false,
 *       sublinks: [
 *         { label: t('navigation:plans'), link: '/plans', active: false },
 *         { label: t('navigation:settings'), link: '/settings', active: false }
 *       ]
 *     },
 *     {
 *       icon: IconUsers,
 *       label: t('navigation:teamManagement'),
 *       active: false,
 *       sublinks: [
 *         { label: t('navigation:teams'), link: '/teams', active: false },
 *         { label: t('navigation:roles'), link: '/roles', active: false }
 *       ]
 *     }
 *   ]
 * }
 * 
 * // Type guards for safe property access
 * if (hasSubmenus(menu)) {
 *   menu.submenus.forEach(submenu => { ... })
 * } else if (hasSublinks(menu)) {
 *   menu.sublinks.forEach(sublink => { ... })
 * } else if (hasDirectLink(menu)) {
 *   navigate(menu.link)
 * }
 * ```
 */
