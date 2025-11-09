# Research: Navigation Menu Reorganization

**Feature**: 004-navigation-reorganization  
**Date**: November 9, 2025  
**Phase**: 0 - Research & Discovery

## Research Questions Resolved

### 1. Nested Submenu Implementation Pattern

**Question**: How should nested submenus be implemented within the existing `NavbarLinksGroup` component?

**Decision**: Extend existing `IMenu` type to support nested `submenus` array at the top level

**Rationale**: 
- Current implementation uses flat `sublinks` array for menu items under a parent
- To support 4 Administration submenus, we need to introduce a new concept: parent menu items that contain grouped submenus
- The mini navbar already supports hover menus via Mantine's `Menu` component
- Full navbar uses `NavbarLinksGroup` with `Collapse` for expandable sections

**Technical Approach**:
```typescript
type IMenu = {
  icon: React.FC<any>
  label: string
  active?: boolean
  link?: string
  sublinks?: ISublink[]
  submenus?: IMenu[]  // NEW: For nested submenu structure
}
```

**Implementation Strategy**:
- For mini navbar: Render 4 separate `NavbarLink` components with their own hover menus
- For full navbar: Render parent "Administration" section with 4 child `NavbarLinksGroup` components
- Each child group has its own collapse/expand behavior

**Alternatives Considered**:
1. **Flat restructuring with icons** - Rejected because it would still show 7+ items, defeating the purpose
2. **Single nested level in sublinks** - Rejected because current `sublinks` are final navigation targets, not grouping containers
3. **Completely new component** - Rejected to maintain consistency and reduce complexity

---

### 2. Mini Navbar Icon Selection

**Question**: Which Tabler icons should be used for the 4 new Administration submenus in mini navbar view?

**Decision**: 
- **Company (Core Settings)**: `IconBuilding` (existing)
- **Team Management**: `IconUsers` 
- **Structure**: `IconSitemap`
- **AI & Insights**: `IconSparkles`

**Rationale**:
- `IconBuilding` - Already used for Company, maintains continuity
- `IconUsers` - Universal symbol for team/people management
- `IconSitemap` - Clearly represents organizational hierarchy/structure
- `IconSparkles` - Modern, aligns with AI/innovation themes, distinct from analytics

**Alternatives Considered**:
- `IconBrain` for AI & Insights - Too medical/cognitive, less appealing
- `IconHierarchy` for Structure - Similar to sitemap but less clear
- `IconUserCog` for Team Management - Too technical, focuses on configuration over people

---

### 3. Translation Key Structure

**Question**: How should translation keys be structured for the new submenu labels?

**Decision**: Add new top-level keys in `navigation.ts` for each submenu category

**Keys to Add**:
```typescript
{
  // New submenu labels
  coreSettings: 'Core Settings',
  teamManagement: 'Team Management', 
  structure: 'Structure',
  aiInsights: 'AI & Insights',
  roadmap: 'Roadmap',
}
```

**Rationale**:
- Follows existing flat structure in `navigation.ts`
- Clear, semantic key names
- Avoids nested objects that could complicate i18n
- "Roadmap" needs to be added as it's currently accessed only via header icon

**French Translations**:
```typescript
{
  coreSettings: 'Paramètres de base',
  teamManagement: 'Gestion d\'équipe',
  structure: 'Structure',
  aiInsights: 'IA et analyses',
  roadmap: 'Feuille de route',
}
```

---

### 4. Permission Visibility Logic

**Question**: How should permission checks work for nested submenus?

**Decision**: Maintain existing granular permission checks at the individual item level; show submenu only if user has permission for at least one child item

**Rationale**:
- No changes to backend authorization
- Existing permission checks: `canViewPlans`, `canViewSettings`, `canViewTeams`, etc.
- Submenu visibility rule: `if (any child permission === true) show submenu`
- Prevents empty submenus from appearing

**Implementation Logic**:
```typescript
// Example for Company (Core Settings) submenu
const showCoreSettings = canViewPlans || canViewSettings
if (showCoreSettings) {
  const coreSettingsSublinks = []
  if (canViewPlans) coreSettingsSublinks.push(...)
  if (canViewSettings) coreSettingsSublinks.push(...)
  // Add to submenus array
}
```

**Edge Cases Handled**:
- User with zero admin permissions → No Administration section appears
- User with partial permissions (e.g., only Teams) → Only "Team Management" submenu shows
- AI Agent should always be visible → AI & Insights submenu always shows if user is authenticated

---

### 5. Mini Navbar vs Full Navbar Rendering

**Question**: How should the 4 Administration submenus render differently in mini (icon-only) vs full navbar modes?

**Decision**: 
- **Mini navbar**: Render 4 separate top-level icons, each with its own Mantine hover `Menu`
- **Full navbar**: Render "Administration" section header with 4 `NavbarLinksGroup` components

**Rationale**:
- Mini navbar space is limited; icons provide clear visual separation
- Full navbar has vertical space for proper categorization with section header
- Maintains consistency with existing pattern (Dashboard, Inventory, Purchases, etc.)

**Implementation Differences**:

**Mini Navbar (showMiniNavbar === true)**:
```typescript
// Split the single "Company" menu into 4 separate menus
menuItems.push(coreSettingsMenu)    // IconBuilding
menuItems.push(teamManagementMenu)  // IconUsers  
menuItems.push(structureMenu)       // IconSitemap
menuItems.push(aiInsightsMenu)      // IconSparkles

// Each rendered as separate NavbarLink with hover menu
```

**Full Navbar (showMiniNavbar === false)**:
```typescript
// Single "Administration" section with 4 NavbarLinksGroup children
<Box mb={12}>
  <Text>Administration</Text>
  <NavbarLinksGroup menuItem={coreSettingsMenu} />
  <NavbarLinksGroup menuItem={teamManagementMenu} />
  <NavbarLinksGroup menuItem={structureMenu} />
  <NavbarLinksGroup menuItem={aiInsightsMenu} />
</Box>
```

---

### 6. Analytics Migration from Operations to Administration

**Question**: What's the impact of moving Analytics from Operations section to AI & Insights submenu?

**Decision**: Remove Analytics from `menuItems` in Operations, add to AI & Insights `sublinks`

**Rationale**:
- Analytics is intelligence/insights tool, aligns better with AI Agent and Roadmap
- Operations section should focus on transactional workflows (Inventory, Purchases, Sales)
- Consolidates all data-driven decision tools in one location

**Migration Steps**:
1. Remove the entire Analytics menu item creation block (lines ~340-355 in current Navbar.tsx)
2. Add Analytics as a sublink within AI & Insights submenu
3. Maintain existing `canViewAnalytics` permission check
4. Update Analytics link from `/analytics/inventoryOverview` to match new structure

**Backward Compatibility**:
- Route remains unchanged: `/analytics/inventoryOverview` 
- Permission check remains unchanged: `read:analytics`
- Only navigation structure changes

---

## Best Practices Applied

### React Router v7 Integration
- Use existing `Link` component from `react-router` for navigation
- Maintain active state tracking via `useLocation().pathname.split('/')[1]`
- No route changes required; only navigation structure reorganization

### Mantine UI Component Patterns
- Continue using `Menu`, `Menu.Target`, `Menu.Dropdown` for mini navbar hover menus
- Continue using `Collapse` component for expandable full navbar sections
- Maintain existing CSS modules for styling consistency
- Use `UnstyledButton` for clickable navigation items

### React i18next Integration
- Use existing `useTranslation(['navigation'])` hook
- Access translations via `t('navigation:keyName')`
- Support both English and French from start
- No changes to i18n infrastructure or language detection

### Component State Management
- Maintain existing `useState` patterns for `active` state
- Continue using `activeMenuItem` prop for controlled state
- Preserve `onClick` callback pattern for parent state updates
- No need for global state management (Redux, Context) for navigation

### Testing Strategy (TDD Requirement)
- Write tests first using Vitest + Testing Library
- Test scenarios:
  1. Menu items render based on permissions
  2. Submenus show/hide based on child permissions
  3. Active states update on route changes
  4. Translation keys resolve correctly
  5. Mini navbar renders 4 icons, full navbar renders sections
  6. Analytics appears in AI & Insights, not Operations
  7. Badges (NEW on AI Agent) render correctly
  8. Click handlers trigger navigation

---

## Technical Dependencies Summary

### No New Dependencies Required
All implementation uses existing project dependencies:
- React 19.1.1
- React Router 7.8.2  
- Mantine UI 8.2.7
- react-i18next 15.5.3
- @tabler/icons-react 3.31.0

### TypeScript Types to Define
- Extended `IMenu` interface with optional `submenus` property
- Enhanced `ISublink` type documentation
- Permission aggregation type helpers

### Performance Considerations
- Navigation menu builds on each render (acceptable - fast operation)
- Current code has comment: "no useMemo needed as this needs to update when language changes"
- No optimization needed for this feature

---

## Risks & Mitigations

### Risk 1: Mini Navbar Icon Confusion
**Risk**: Users may not understand what 4 Administration icons represent  
**Mitigation**: 
- Use semantic, recognizable icons
- Mantine Tooltip shows submenu label on hover
- Icons have distinct visual appearance

### Risk 2: Breaking Existing Navigation Behavior  
**Risk**: Changes to shared components could affect other parts of app  
**Mitigation**:
- Write comprehensive tests before implementation (TDD)
- Test both mini and full navbar modes
- Test all permission combinations
- Manual QA in all supported browsers

### Risk 3: Translation Inconsistencies
**Risk**: French translations may not align semantically with English  
**Mitigation**:
- Follow existing translation patterns in `navigation.ts`
- Use professional French terms for business concepts
- "Structure" is same word in English and French

### Risk 4: Analytics Link Change Confusion
**Risk**: Users accustomed to Analytics in Operations may not find it  
**Mitigation**:
- Analytics moves to more logical location (insights/intelligence)
- Direct route access still works (`/analytics/inventoryOverview`)
- AI & Insights is high-visibility section
- Consider brief in-app notification or release note

---

## Implementation Phases

Based on research findings, implementation will proceed as:

**Phase 1: Design & Contracts**
- Define extended `IMenu` TypeScript interface
- Create `data-model.md` with navigation structure entities
- Define component API contracts
- Generate `quickstart.md` for developers

**Phase 2: Implementation** (handled by `/speckit.tasks` command)
- Create test file with comprehensive test cases (TDD)
- Update TypeScript interfaces
- Add translation keys (en, fr)
- Modify `Navbar.tsx` to build 4 submenus
- Test mini navbar mode rendering
- Test full navbar mode rendering
- Update agent context with new patterns

---

## Conclusion

All technical unknowns have been resolved. The navigation reorganization is well-defined and can proceed to Phase 1 (Design & Contracts). No blocking issues or missing information remain.

**Key Takeaways**:
1. Extend existing patterns rather than create new components
2. Mini navbar: 4 icons | Full navbar: 1 section with 4 groups  
3. No new dependencies required
4. TDD approach required per constitution
5. Analytics moves from Operations to Administration
6. Zero backend/API changes

**Next Step**: Proceed to Phase 1 - Generate `data-model.md`, `contracts/`, and `quickstart.md`
