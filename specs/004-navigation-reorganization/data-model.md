# Data Model: Navigation Menu Structure

**Feature**: 004-navigation-reorganization  
**Date**: November 9, 2025  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data structures, entities, and relationships for the reorganized navigation menu system. The navigation is purely frontend state - no database entities are involved.

---

## Core Entities

### 1. Menu Item (`IMenu`)

**Purpose**: Represents a top-level navigation item that can either be a direct link or contain sublinks/submenus.

**Properties**:
```typescript
interface IMenu {
  icon: React.FC<any>              // Tabler icon component
  label: string                     // Display text (translated key)
  active?: boolean                  // Current expansion state
  link?: string                     // Optional direct navigation path
  sublinks?: ISublink[]             // Flat list of child navigation links
  submenus?: ISubmenu[]             // NEW: Nested submenu groups
}
```

**State Transitions**:
- `active: false` → User clicks menu → `active: true` → Submenu expands
- `active: true` → User clicks menu again → `active: false` → Submenu collapses
- Active state managed by parent component via `onClick` callback

**Validation Rules**:
- MUST have `icon` and `label` (required for all menu items)
- MUST have either `link` OR `sublinks` OR `submenus` (not multiple)
- If `link` provided: renders as direct navigation item
- If `sublinks` provided: renders as expandable menu with flat children
- If `submenus` provided: renders as nested menu structure (Administration use case)

**Examples**:
```typescript
// Direct link menu item (Dashboard)
const dashboardMenu: IMenu = {
  icon: IconGauge,
  label: 'Dashboard',
  link: '/dashboard',
  active: true
}

// Menu with flat sublinks (Inventory)
const inventoryMenu: IMenu = {
  icon: IconPackage,
  label: 'Inventory',
  active: false,
  sublinks: [
    { label: 'Products', link: '/products', active: false },
    { label: 'Categories', link: '/categories', active: false }
  ]
}

// Menu with nested submenus (Administration) - NEW PATTERN
const administrationMenu: IMenu = {
  icon: IconBuilding,
  label: 'Administration',
  active: false,
  submenus: [
    {
      icon: IconBuilding,
      label: 'Core Settings',
      active: false,
      sublinks: [
        { label: 'Plans', link: '/plans', active: false },
        { label: 'Settings', link: '/settings', active: false }
      ]
    },
    // ... more submenus
  ]
}
```

---

### 2. Sublink (`ISublink`)

**Purpose**: Represents a final navigation target within a menu or submenu.

**Properties**:
```typescript
interface ISublink {
  label: string                     // Display text (translated key)
  link: string                      // Navigation path (React Router route)
  active: boolean                   // Whether currently selected
  badge?: IBadge                    // Optional visual indicator
}
```

**State Transitions**:
- `active: false` → User navigates to route → `active: true`
- Determined by comparing `link` with `useLocation().pathname.split('/')[1]`

**Validation Rules**:
- `link` MUST start with `/` (absolute path)
- `link` MUST correspond to existing React Router route
- Only one sublink can have `active: true` at a time per menu

**Badge Property**:
```typescript
interface IBadge {
  text: string                      // Badge content (e.g., "NEW", "BETA")
  color?: string                    // Mantine color (e.g., "green", "blue")
  variant?: string                  // Mantine variant (e.g., "filled", "outline")
}
```

**Usage**:
- AI Agent sublink uses badge: `{ text: 'NEW', color: 'green', variant: 'outline' }`
- Only used for calling attention to new/experimental features

---

### 3. Submenu (`ISubmenu`)

**Purpose**: NEW entity type for nested menu grouping within Administration section.

**Definition**: 
```typescript
type ISubmenu = IMenu  // Reuses IMenu structure
```

**Constraints**:
- Submenu MUST have `sublinks` (cannot have nested `submenus` - only 2 levels deep)
- Submenu MUST have `icon` and `label` for mini navbar rendering
- Used exclusively for Administration section reorganization

**Example**:
```typescript
const teamManagementSubmenu: ISubmenu = {
  icon: IconUsers,
  label: 'Team Management',
  active: false,
  sublinks: [
    { label: 'Teams', link: '/teams', active: false },
    { label: 'Roles', link: '/roles', active: false }
  ]
}
```

---

### 4. Navigation Section

**Purpose**: Logical grouping of menu items in the UI (Main, Operations, Administration).

**Not a TypeScript Entity**: Sections are rendered structurally in JSX, not as data objects.

**Rendering Logic**:
```typescript
// Main Section (Dashboard only)
menuItems.slice(0, 1)

// Operations Section (Inventory, Workflows, Purchases, Sales, Analytics)
menuItems.slice(1, -1)  // All items except first (Dashboard) and last (Administration)

// Administration Section (Company submenus)
menuItems.slice(-1)      // Last item (now contains 4 submenus)
```

**Translation Keys**:
- `navigation:main`
- `navigation:operations`
- `navigation:administration`

---

## Data Structure Hierarchy

```
Navigation Menu
│
├── Section: Main
│   └── Menu Item: Dashboard (direct link)
│
├── Section: Operations
│   ├── Menu Item: Inventory
│   │   ├── Sublink: Products
│   │   ├── Sublink: Categories
│   │   ├── Sublink: Stock Adjustments
│   │   └── Sublink: Transfer Orders
│   ├── Menu Item: Workflows
│   │   ├── Sublink: Approvals
│   │   ├── Sublink: Workflow Templates
│   │   └── Sublink: Workflow History
│   ├── Menu Item: Purchases
│   │   ├── Sublink: Suppliers
│   │   ├── Sublink: Purchase Orders
│   │   ├── Sublink: Purchase Receives
│   │   ├── Sublink: Bills
│   │   └── Sublink: Payments Made
│   └── Menu Item: Sales
│       ├── Sublink: Customers
│       ├── Sublink: Sales Orders
│       ├── Sublink: Backorders
│       ├── Sublink: Invoices
│       └── Sublink: Payments Received
│
└── Section: Administration
    └── Menu Item: Company (contains submenus)
        ├── Submenu: Core Settings
        │   ├── Sublink: Plans
        │   └── Sublink: Settings
        ├── Submenu: Team Management
        │   ├── Sublink: Teams
        │   └── Sublink: Roles
        ├── Submenu: Structure
        │   ├── Sublink: Agencies
        │   └── Sublink: Sites
        └── Submenu: AI & Insights
            ├── Sublink: AI Agent [badge: NEW]
            ├── Sublink: Roadmap
            └── Sublink: Analytics
```

---

## Permission-Based Visibility

### Permission Mapping

**Individual Permissions** (unchanged from current implementation):
```typescript
const permissions = [
  'read:products',
  'read:categories', 
  'read:stockAdjustments',
  'read:transferOrders',
  'read:approvals',
  'read:workflows',
  'read:suppliers',
  'read:purchaseOrders',
  'read:purchaseReceives',
  'read:bills',
  'read:paymentsMade',
  'read:customers',
  'read:salesOrders',
  'read:backorders',
  'read:invoices',
  'read:paymentsReceived',
  'read:analytics',
  'read:plans',
  'read:settings',
  'read:users',        // Controls Teams access
  'read:roles',
  'read:agencies',
  'read:sites'
]
```

### Submenu Visibility Rules

```typescript
// Core Settings submenu - show if user has ANY of these permissions
const showCoreSettings = canViewPlans || canViewSettings

// Team Management submenu - show if user has ANY of these permissions  
const showTeamManagement = canViewTeams || canViewRoles

// Structure submenu - show if user has ANY of these permissions
const showStructure = canViewAgencies || canViewSites

// AI & Insights submenu - ALWAYS show (AI Agent is available to all users)
const showAIInsights = true  // Or check for canViewAnalytics for Analytics sublink

// Administration menu - show if ANY submenu is visible
const showAdministration = showCoreSettings || showTeamManagement || 
                           showStructure || showAIInsights
```

### Edge Cases

1. **User with zero permissions**: No navigation items appear except Dashboard
2. **User with only AI Agent access**: Only AI & Insights submenu shows in Administration
3. **User with all permissions**: All 4 submenus show
4. **User with partial permissions**: Only authorized sublinks appear within each submenu

---

## State Management

### Component State (Local)

**Location**: `Navbar.tsx` component

**State Variables**:
```typescript
const [selected, setSelected] = useState<boolean>(false)
```

**Purpose**: Tracks whether a submenu is currently expanded in full navbar mode

### Prop-Based State (Controlled)

**Parent Component**: Provides via props to `Navbar`

```typescript
interface NavbarProps {
  permissions: string[]           // User permissions array
  showMiniNavbar: boolean         // Toggle between mini/full navbar modes
  activeMenuItem?: IMenu          // Currently active menu item
  onClick: (menuItem: IMenu) => void  // Callback when menu item clicked
}
```

**State Flow**:
1. User clicks menu item
2. `NavbarLinksGroup` calls `onClick(menuItem, selected)`
3. `Navbar` calls parent's `onClick(menuItem)` 
4. Parent updates `activeMenuItem` state
5. `Navbar` re-renders with new active state

### Derived State

**Active Route Detection**:
```typescript
const locationPath = useLocation().pathname.split('/')[1]
const isActive = menuItem.link?.split('/')[1] === locationPath
```

**Purpose**: Automatically highlight active menu item based on current route

---

## Translation Data Model

### Translation Keys Structure

**File**: `app/locales/{lang}/navigation.ts`

**New Keys Required**:
```typescript
export default {
  // ... existing keys ...
  
  // New submenu labels
  coreSettings: 'Core Settings',
  teamManagement: 'Team Management',
  structure: 'Structure', 
  aiInsights: 'AI & Insights',
  roadmap: 'Roadmap',  // Previously only in header, now needs translation
}
```

**French Translation**:
```typescript
export default {
  // ... existing keys ...
  
  coreSettings: 'Paramètres de base',
  teamManagement: 'Gestion d\'équipe',
  structure: 'Structure',
  aiInsights: 'IA et analyses',
  roadmap: 'Feuille de route',
}
```

**Usage in Component**:
```typescript
const { t } = useTranslation(['navigation'])

const label = t('navigation:coreSettings')  // "Core Settings"
```

---

## Rendering Mode Differences

### Mini Navbar Mode (`showMiniNavbar === true`)

**Structure**:
- Flat array of menu items
- Each Administration submenu becomes a top-level menu item
- No section headers

**Data Transformation**:
```typescript
// Instead of 1 Administration menu with 4 submenus:
const administrationMenu = {
  label: 'Administration',
  submenus: [submenu1, submenu2, submenu3, submenu4]
}

// Build 4 separate menu items:
menuItems.push(submenu1)  // Core Settings with IconBuilding
menuItems.push(submenu2)  // Team Management with IconUsers
menuItems.push(submenu3)  // Structure with IconSitemap  
menuItems.push(submenu4)  // AI & Insights with IconSparkles
```

**Rendering**:
- Each menu item rendered as `NavbarLink` with Mantine `Menu` hover dropdown
- Shows icon only, no labels
- Tooltip displays submenu label on hover
- Dropdown shows sublinks on click-hover

### Full Navbar Mode (`showMiniNavbar === false`)

**Structure**:
- Hierarchical sections with headers
- Administration section contains 4 `NavbarLinksGroup` components

**Data Transformation**:
```typescript
// Single Administration menu with nested submenus:
const administrationMenu = {
  label: 'Administration',
  submenus: [
    { icon, label: 'Core Settings', sublinks: [...] },
    { icon, label: 'Team Management', sublinks: [...] },
    { icon, label: 'Structure', sublinks: [...] },
    { icon, label: 'AI & Insights', sublinks: [...] }
  ]
}

menuItems.push(administrationMenu)
```

**Rendering**:
- Section header: "Administration"
- Each submenu: Clickable group header with icon + chevron
- Sublinks: Indented list items that expand/collapse

---

## Validation & Constraints

### Data Integrity Rules

1. **No Empty Menus**: If a menu has no visible sublinks/submenus (due to permissions), the entire menu is hidden
2. **No Deep Nesting**: Maximum 2 levels - Menu → Sublinks OR Menu → Submenus → Sublinks
3. **Unique Labels**: Each menu item and sublink must have a unique label for React keys
4. **Valid Routes**: All `link` values must correspond to existing React Router routes
5. **Icon Availability**: All icons must be imported from `@tabler/icons-react`

### Performance Constraints

1. **No Memoization**: Menu items array rebuilds on every render (acceptable - fast operation)
2. **No Lazy Loading**: All navigation structure loaded upfront
3. **Translation Loading**: i18next handles lazy loading of translation files

---

## Migration Impact

### Before (Current Structure)

```typescript
// Single flat Company menu
const companyMenu = {
  label: 'Company',
  icon: IconBuilding,
  sublinks: [
    'Plans', 'Settings', 'Teams', 'Roles', 
    'Agencies', 'Sites', 'AI Agent'
  ]
}

// Analytics in Operations section
const analyticsMenu = {
  label: 'Analytics',
  icon: IconChartPie3,
  sublinks: ['Inventory Overview']
}
```

### After (New Structure)

```typescript
// Administration with 4 submenus
const administrationMenu = {
  label: 'Administration',
  icon: IconBuilding,
  submenus: [
    {
      label: 'Core Settings',
      icon: IconBuilding,
      sublinks: ['Plans', 'Settings']
    },
    {
      label: 'Team Management',
      icon: IconUsers,
      sublinks: ['Teams', 'Roles']
    },
    {
      label: 'Structure',
      icon: IconSitemap,
      sublinks: ['Agencies', 'Sites']
    },
    {
      label: 'AI & Insights',
      icon: IconSparkles,
      sublinks: ['AI Agent', 'Roadmap', 'Analytics']
    }
  ]
}

// Analytics removed from Operations, now in AI & Insights
```

### Breaking Changes

**NONE** - This is a non-breaking change:
- All routes remain identical
- All permissions remain unchanged
- All links still work
- Only navigation structure changes

---

## Testing Data Scenarios

### Test Scenario 1: Full Admin Access
```typescript
const permissions = [
  'read:plans', 'read:settings', 'read:users', 'read:roles',
  'read:agencies', 'read:sites', 'read:analytics'
]

// Expected: All 4 submenus visible
// All 7 sublinks visible (Plans, Settings, Teams, Roles, Agencies, Sites, AI Agent, Roadmap, Analytics)
```

### Test Scenario 2: Core Settings Only
```typescript
const permissions = ['read:plans', 'read:settings']

// Expected: Only "Core Settings" submenu visible
// Only 2 sublinks visible (Plans, Settings)
// AI & Insights submenu visible (AI Agent always available)
```

### Test Scenario 3: No Admin Access
```typescript
const permissions = ['read:products', 'read:customers']

// Expected: Administration section not visible
// Only Inventory and Sales menus visible
// AI & Insights may still be visible if AI Agent is public
```

### Test Scenario 4: Mixed Permissions
```typescript
const permissions = ['read:users', 'read:sites', 'read:analytics']

// Expected: 3 submenus visible (Team Management, Structure, AI & Insights)
// Core Settings hidden (no Plans or Settings permission)
```

---

## Summary

The navigation data model introduces a new `submenus` property to `IMenu` entities, enabling nested menu structures while maintaining backward compatibility. The model supports:

1. **2-level hierarchy**: Menu → Submenus → Sublinks
2. **Permission-based visibility**: Granular control at sublink level
3. **Dual rendering modes**: Mini navbar (icons) vs Full navbar (sections)
4. **Translation support**: i18next integration
5. **State management**: Controlled components with prop-based state

This model enables the reorganization of 7 flat Administration items into 4 logical submenus while preserving all existing functionality and routes.
