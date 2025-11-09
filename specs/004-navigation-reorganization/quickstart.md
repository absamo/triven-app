# Quickstart Guide: Navigation Menu Reorganization

**Feature**: 004-navigation-reorganization  
**Date**: November 9, 2025  
**For**: Developers implementing the navigation reorganization

---

## Overview

This guide walks you through implementing the navigation menu reorganization that splits the Administration section into 4 logical submenus: Core Settings, Team Management, Structure, and AI & Insights.

**What changes**: Navigation structure and grouping  
**What doesn't change**: Routes, permissions, functionality, styling

**Estimated implementation time**: 4-6 hours (including tests)

---

## Prerequisites

Before starting, ensure you have:

1. ✅ Branch `004-navigation-reorganization` checked out
2. ✅ Dependencies installed (`bun install`)
3. ✅ Development server running (`bun run dev`)
4. ✅ Familiarity with:
   - React Router v7
   - Mantine UI components
   - react-i18next
   - Vitest testing

---

## Implementation Checklist

Follow these steps in order. The project follows **Test-First Development (TDD)** per constitutional requirements.

### Phase 1: Prepare Type Definitions

- [ ] **1.1** Review `specs/004-navigation-reorganization/contracts/navigation-types.ts`
- [ ] **1.2** Copy `INavigationMenu` interface updates to `app/layouts/Navbar/Navbar.tsx`
- [ ] **1.3** Add `submenus?: INavigationSubmenu[]` property to existing `IMenu` type

**Location**: `app/layouts/Navbar/Navbar.tsx` (lines 18-29)

**Change**:
```typescript
// BEFORE
type IMenu = {
  icon: React.FC<any>
  label: string
  active?: boolean
  link?: string
  sublinks?: {
    label: string
    link: string
    active: boolean
    badge?: { text: string; color?: string; variant?: string }
  }[]
}

// AFTER
type IMenu = {
  icon: React.FC<any>
  label: string
  active?: boolean
  link?: string
  sublinks?: {
    label: string
    link: string
    active: boolean
    badge?: { text: string; color?: string; variant?: string }
  }[]
  submenus?: IMenu[]  // NEW: Support nested submenu structure
}
```

---

### Phase 2: Write Tests First (TDD)

- [ ] **2.1** Create `app/test/layouts/Navbar.test.tsx`
- [ ] **2.2** Write test: "renders 4 Administration submenus with correct labels"
- [ ] **2.3** Write test: "shows only authorized submenus based on permissions"
- [ ] **2.4** Write test: "Analytics appears in AI & Insights, not Operations"
- [ ] **2.5** Write test: "AI Agent has NEW badge in AI & Insights submenu"
- [ ] **2.6** Write test: "mini navbar renders 4 separate icons for Administration"
- [ ] **2.7** Write test: "full navbar renders Administration section with 4 groups"
- [ ] **2.8** Run tests - **all should fail** (red state)

**Test File Template**:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import Navbar from '~/layouts/Navbar'

describe('Navbar - Navigation Reorganization', () => {
  it('renders 4 Administration submenus with correct labels', () => {
    const mockOnClick = vi.fn()
    const fullAdminPermissions = [
      'read:plans', 'read:settings', 'read:users', 'read:roles',
      'read:agencies', 'read:sites', 'read:analytics'
    ]

    render(
      <MemoryRouter>
        <Navbar
          permissions={fullAdminPermissions}
          showMiniNavbar={false}
          onClick={mockOnClick}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('Core Settings')).toBeInTheDocument()
    expect(screen.getByText('Team Management')).toBeInTheDocument()
    expect(screen.getByText('Structure')).toBeInTheDocument()
    expect(screen.getByText('AI & Insights')).toBeInTheDocument()
  })

  // Add more tests following TDD pattern...
})
```

---

### Phase 3: Add Translation Keys

- [ ] **3.1** Open `app/locales/en/navigation.ts`
- [ ] **3.2** Add new submenu label keys
- [ ] **3.3** Open `app/locales/fr/navigation.ts`
- [ ] **3.4** Add French translations

**English** (`app/locales/en/navigation.ts`):
```typescript
export default {
  // ... existing keys ...
  
  // NEW: Administration submenu labels
  coreSettings: 'Core Settings',
  teamManagement: 'Team Management',
  structure: 'Structure',
  aiInsights: 'AI & Insights',
  roadmap: 'Roadmap',  // Previously only in header
}
```

**French** (`app/locales/fr/navigation.ts`):
```typescript
export default {
  // ... existing keys ...
  
  // NOUVEAU: Libellés des sous-menus d'administration
  coreSettings: 'Paramètres de base',
  teamManagement: 'Gestion d\'équipe',
  structure: 'Structure',
  aiInsights: 'IA et analyses',
  roadmap: 'Feuille de route',
}
```

---

### Phase 4: Import New Icons

- [ ] **4.1** Open `app/layouts/Navbar/Navbar.tsx`
- [ ] **4.2** Add icon imports at top of file

**Location**: Line ~1-9

**Add**:
```typescript
import {
  IconBuilding,
  IconChartPie3,
  IconChecklist,
  IconGauge,
  IconPackage,
  IconReceipt,
  IconTruckDelivery,
  IconUsers,      // NEW: Team Management
  IconSitemap,    // NEW: Structure
  IconSparkles,   // NEW: AI & Insights
} from '@tabler/icons-react'
```

---

### Phase 5: Remove Analytics from Operations

- [ ] **5.1** Find the Analytics menu creation block (lines ~340-355)
- [ ] **5.2** Delete or comment out the entire Analytics menu creation

**Location**: `app/layouts/Navbar/Navbar.tsx` lines ~340-355

**REMOVE**:
```typescript
if (canViewAnalytics) {
  const analyticsSublinks = [
    {
      label: t('navigation:inventoryOverview'),
      link: '/analytics/inventoryOverview',
      active: false,
    },
  ]

  menuItems.push({
    label: t('navigation:analytics'),
    icon: IconChartPie3,
    active: false,
    sublinks: analyticsSublinks,
  })
}
```

---

### Phase 6: Rebuild Administration Menu Structure

- [ ] **6.1** Locate the Company menu creation block (lines ~360-425)
- [ ] **6.2** Replace with new nested submenu structure
- [ ] **6.3** Create 4 separate submenu objects
- [ ] **6.4** Add Roadmap to AI & Insights submenu

**Location**: `app/layouts/Navbar/Navbar.tsx` lines ~360-425

**REPLACE** existing Company menu block **WITH**:

```typescript
// Administration Section - Reorganized into 4 Submenus
if (canViewSettings || canViewTeams || canViewRoles || canViewAgencies || canViewSites || canViewPlans) {
  const administrationSubmenus: IMenu[] = []

  // Submenu 1: Core Settings (Plans, Settings)
  if (canViewPlans || canViewSettings) {
    const coreSettingsSublinks = []
    
    if (canViewPlans) {
      coreSettingsSublinks.push({
        label: t('navigation:plans'),
        link: '/plans',
        active: false,
      })
    }
    
    if (canViewSettings) {
      coreSettingsSublinks.push({
        label: t('navigation:settings'),
        link: '/settings',
        active: false,
      })
    }

    administrationSubmenus.push({
      label: t('navigation:coreSettings'),
      icon: IconBuilding,
      active: false,
      sublinks: coreSettingsSublinks,
    })
  }

  // Submenu 2: Team Management (Teams, Roles)
  if (canViewTeams || canViewRoles) {
    const teamManagementSublinks = []
    
    if (canViewTeams) {
      teamManagementSublinks.push({
        label: t('navigation:teams'),
        link: '/teams',
        active: false,
      })
    }
    
    if (canViewRoles) {
      teamManagementSublinks.push({
        label: t('navigation:roles'),
        link: '/roles',
        active: false,
      })
    }

    administrationSubmenus.push({
      label: t('navigation:teamManagement'),
      icon: IconUsers,
      active: false,
      sublinks: teamManagementSublinks,
    })
  }

  // Submenu 3: Structure (Agencies, Sites)
  if (canViewAgencies || canViewSites) {
    const structureSublinks = []
    
    if (canViewAgencies) {
      structureSublinks.push({
        label: t('navigation:agencies'),
        link: '/agencies',
        active: false,
      })
    }
    
    if (canViewSites) {
      structureSublinks.push({
        label: t('navigation:sites'),
        link: '/sites',
        active: false,
      })
    }

    administrationSubmenus.push({
      label: t('navigation:structure'),
      icon: IconSitemap,
      active: false,
      sublinks: structureSublinks,
    })
  }

  // Submenu 4: AI & Insights (AI Agent, Roadmap, Analytics)
  const aiInsightsSublinks = []
  
  // AI Agent - always available
  aiInsightsSublinks.push({
    label: t('navigation:assistant'),
    link: '/ai-agent',
    active: false,
    badge: {
      text: 'NEW',
      color: 'green',
      variant: 'outline',
    },
  })

  // Roadmap - add if admin (note: adjust permission check as needed)
  aiInsightsSublinks.push({
    label: t('navigation:roadmap'),
    link: '/roadmap',
    active: false,
  })

  // Analytics - moved from Operations section
  if (canViewAnalytics) {
    aiInsightsSublinks.push({
      label: t('navigation:analytics'),
      link: '/analytics/inventoryOverview',
      active: false,
    })
  }

  administrationSubmenus.push({
    label: t('navigation:aiInsights'),
    icon: IconSparkles,
    active: false,
    sublinks: aiInsightsSublinks,
  })

  // Add Administration menu with nested submenus
  menuItems.push({
    label: t('navigation:administration'),
    icon: IconBuilding,
    active: false,
    submenus: administrationSubmenus,
  })
}
```

---

### Phase 7: Update Mini Navbar Rendering

- [ ] **7.1** Locate mini navbar rendering logic (lines ~436-448)
- [ ] **7.2** Add logic to flatten submenus for mini navbar mode

**Location**: `app/layouts/Navbar/Navbar.tsx` lines ~436-448

**BEFORE** the mini navbar return block, **ADD**:

```typescript
// Flatten Administration submenus for mini navbar mode
let menuItemsForDisplay = menuItems
if (showMiniNavbar) {
  menuItemsForDisplay = menuItems.flatMap((item) => {
    // If menu has submenus, replace it with individual submenu items
    if (item.submenus && item.submenus.length > 0) {
      return item.submenus
    }
    return item
  })
}
```

**Then UPDATE** mini navbar rendering:

```typescript
{showMiniNavbar ? (
  <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box mt={25} style={{ flex: 1 }}>
      <Stack justify="center" gap={0}>
        {menuItemsForDisplay.map((menuItem: IMenu) => (
          <NavbarLink menu={menuItem} key={menuItem.label} onClick={onClick} />
        ))}
      </Stack>
    </Box>
  </Box>
) : (
  // ... full navbar rendering remains unchanged for now
)}
```

---

### Phase 8: Update Full Navbar Rendering for Nested Submenus

- [ ] **8.1** Locate Administration section rendering (lines ~560-610)
- [ ] **8.2** Add support for rendering submenus

**Location**: `app/layouts/Navbar/Navbar.tsx` Administration Section

**UPDATE** Administration section rendering:

```typescript
{/* Administration Section */}
{menuItems.length > 1 && (
  <Box mb={12}>
    <Text
      size="xs"
      fw={600}
      mb={12}
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        paddingLeft: 16,
      }}
    >
      {t('navigation:administration')}
    </Text>
    {menuItems.slice(-1).map((menuItem: IMenu) => {
      // Check if this menu has submenus (nested structure)
      if (menuItem.submenus) {
        return menuItem.submenus.map((submenu: IMenu) => {
          let active = submenu.active

          // Check if any sublink is active
          if (!submenu.link) {
            active =
              !selected &&
              (submenu.sublinks?.some(
                (sublink) => sublink.link.split('/')[1] === locationPath
              ) as boolean)
          }

          return (
            <Box key={submenu.label} mb={8}>
              <NavbarLinksGroup
                menuItem={{
                  ...submenu,
                  active,
                  sublinks: submenu.sublinks?.map((sublink) => ({
                    ...sublink,
                    active: sublink.link.split('/')[1] === locationPath,
                  })),
                }}
                onClick={(currentMenu, selected) =>
                  handleNavbarLinkClick(currentMenu, selected)
                }
              />
            </Box>
          )
        })
      }

      // Fallback: render as regular menu (for backward compatibility)
      let active = menuItem.active
      if (!menuItem.link) {
        active =
          !selected &&
          (menuItem.sublinks?.some(
            (sublink) => sublink.link.split('/')[1] === locationPath
          ) as boolean)
      }
      if (menuItem.link?.split('/')[1] === locationPath) {
        active = true
      }

      return (
        <NavbarLinksGroup
          menuItem={
            menuItem.label === activeMenuItem?.label
              ? activeMenuItem
              : {
                  ...menuItem,
                  active,
                  sublinks: menuItem.sublinks?.map((sublink) => ({
                    ...sublink,
                    active: sublink.link.split('/')[1] === locationPath,
                  })),
                }
          }
          key={menuItem.label}
          onClick={(currentMenu, selected) =>
            handleNavbarLinkClick(currentMenu, selected)
          }
        />
      )
    })}
  </Box>
)}
```

---

### Phase 9: Run Tests and Iterate

- [ ] **9.1** Run test suite: `bun test Navbar.test.tsx`
- [ ] **9.2** Fix failing tests (should now pass - green state)
- [ ] **9.3** Verify all tests pass
- [ ] **9.4** Check test coverage: `bun run test:coverage`

**Expected Results**:
- ✅ All navigation tests pass
- ✅ No console errors or warnings
- ✅ Test coverage > 80% for modified files

---

### Phase 10: Manual Testing

- [ ] **10.1** Start dev server: `bun run dev`
- [ ] **10.2** Test full navbar mode (expanded sidebar)
- [ ] **10.3** Test mini navbar mode (icon-only sidebar)
- [ ] **10.4** Test different permission combinations
- [ ] **10.5** Test language switching (English ↔ French)
- [ ] **10.6** Test active route highlighting
- [ ] **10.7** Verify Analytics is in AI & Insights, not Operations

**Test Scenarios**:

| Permission Set | Expected Submenus | Expected Links |
|---------------|-------------------|----------------|
| Full admin | All 4 submenus | All 9 links |
| Only Plans + Settings | Core Settings, AI & Insights | 4 links |
| Only Teams + Roles | Team Management, AI & Insights | 4 links |
| Only Agencies + Sites | Structure, AI & Insights | 4 links |
| No admin permissions | AI & Insights only | 2 links (AI Agent, Roadmap) |

---

## Verification Checklist

Before marking the feature complete, verify:

### Functionality
- [ ] All 4 submenus appear when user has full admin permissions
- [ ] Submenus hide when user has no permissions for any child item
- [ ] Partial permissions show only authorized sublinks
- [ ] AI Agent always appears (with NEW badge)
- [ ] Roadmap appears in AI & Insights submenu
- [ ] Analytics moved from Operations to AI & Insights
- [ ] Clicking sublinks navigates to correct routes
- [ ] Active state highlights current route
- [ ] Mini navbar shows 4 separate icons for Administration
- [ ] Full navbar shows "Administration" section header with 4 groups

### Translations
- [ ] English labels display correctly
- [ ] French labels display correctly
- [ ] Language switching works without errors

### Visual Consistency
- [ ] Icons display correctly (no missing icons)
- [ ] Badges render properly (NEW on AI Agent)
- [ ] Hover states work in mini navbar
- [ ] Expand/collapse animations work in full navbar
- [ ] No visual regressions in other sections (Main, Operations)

### Performance
- [ ] No console errors or warnings
- [ ] Navigation renders quickly (<50ms)
- [ ] No memory leaks or unnecessary re-renders

---

## Troubleshooting

### Issue: "Translation key not found"

**Solution**: Ensure all new keys are added to both `en/navigation.ts` and `fr/navigation.ts`

---

### Issue: "Analytics still appears in Operations"

**Solution**: Verify you removed/commented out the Analytics menu creation block (lines ~340-355)

---

### Issue: "Mini navbar shows empty icons"

**Solution**: Check that `menuItemsForDisplay` flattening logic is correct and all submenu icons are defined

---

### Issue: "Tests fail with 'Cannot find module'"

**Solution**: Ensure test file imports match actual file structure. Check:
```typescript
import Navbar from '~/layouts/Navbar'  // or '../../layouts/Navbar'
```

---

### Issue: "Submenus don't expand in full navbar"

**Solution**: Verify `NavbarLinksGroup` component receives correct `active` and `sublinks` props

---

## Performance Optimization (Optional)

The current implementation rebuilds the menu on every render. This is acceptable as noted in the code comments. However, if performance becomes an issue:

```typescript
// Optional: Memoize menu items
const menuItems = useMemo(() => {
  // Build menu items logic here
  return items
}, [permissions, t, canViewX, canViewY, ...])  // Add all dependencies
```

**Note**: This optimization is NOT required for initial implementation.

---

## Next Steps

After completing this implementation:

1. **Create Pull Request** with comprehensive description
2. **Request code review** from team lead
3. **Update documentation** if needed (README, changelog)
4. **Monitor in staging** for any edge cases
5. **Deploy to production** after approval

---

## Additional Resources

- [Mantine Menu Component Docs](https://mantine.dev/core/menu/)
- [React Router v7 Documentation](https://reactrouter.com/en/main)
- [react-i18next Guide](https://react.i18next.com/)
- [Vitest Testing Guide](https://vitest.dev/guide/)
- [Project Constitution](.github/copilot-instructions.md)

---

## Support

If you encounter issues not covered in this guide:

1. Check `specs/004-navigation-reorganization/research.md` for design decisions
2. Review `specs/004-navigation-reorganization/data-model.md` for data structure details
3. Check `specs/004-navigation-reorganization/contracts/navigation-types.ts` for TypeScript contracts
4. Ask in team chat or open a GitHub discussion

---

**Remember**: Follow TDD principles - write tests first, make them pass, then refactor if needed. Good luck! 🚀
