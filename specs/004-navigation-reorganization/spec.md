# Feature Specification: Navigation Menu Reorganization with Smart Categorization

**Feature Branch**: `004-navigation-reorganization`  
**Created**: November 9, 2025  
**Status**: Draft  
**Input**: User description: "Reorganize navigation menus using smart categorization to reduce Company submenu items and improve information architecture"

## Clarifications

### Session 2025-11-09

- Q: Should Analytics remain in its current location (Operations section), move entirely to "AI & Insights", or appear in both locations (dual access)? → A: Move Analytics entirely to "AI & Insights" submenu - removes from Operations, adds to Administration
- Q: How should the 4 new Administration submenus appear in the mini navbar view? → A: Four separate icons - one for each submenu (Company, Team Management, Structure, AI & Insights) with individual hover dropdowns

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Settings Access (Priority: P1)

As a company administrator, I need quick access to Plans and Settings without navigating through a crowded submenu, so I can efficiently manage billing and company configuration.

**Why this priority**: Plans and Settings are the most frequently accessed administrative items. They contain business-critical configurations (billing, company profile, integrations) that admins need to access regularly.

**Independent Test**: Can be fully tested by navigating to the new "Company (Core Settings)" submenu, clicking Plans and Settings, and verifying immediate access to these pages. Delivers value by reducing clicks from 2 (hover → click submenu → click item) to the same 2 but with better mental grouping.

**Acceptance Scenarios**:

1. **Given** I am logged in as an administrator, **When** I hover over the Company menu in the Administration section, **Then** I see "Plans" and "Settings" as the first two items
2. **Given** I click on "Plans" from the Company submenu, **When** the page loads, **Then** I see the subscription management interface
3. **Given** I click on "Settings" from the Company submenu, **When** the page loads, **Then** I see company configuration options

---

### User Story 2 - Team Management Organization (Priority: P1)

As a company administrator, I need to manage my team structure (Teams and Roles) separately from organizational structure (Agencies and Sites), so I can quickly perform people-related administrative tasks.

**Why this priority**: Team and role management are distinct from physical structure management. This separation creates clear mental models for different administrative workflows - people management vs. organizational structure.

**Independent Test**: Can be fully tested by accessing the new "Team Management" submenu under Administration, selecting Teams or Roles, and performing user/role management tasks. Delivers value through improved information architecture.

**Acceptance Scenarios**:

1. **Given** I am logged in as an administrator, **When** I hover over the Administration section, **Then** I see a "Team Management" submenu with "Teams" and "Roles" options
2. **Given** I click on "Teams" from Team Management, **When** the page loads, **Then** I see the user management interface
3. **Given** I click on "Roles" from Team Management, **When** the page loads, **Then** I see role configuration and permission management
4. **Given** I am viewing the Team Management submenu, **When** I scan the menu items, **Then** I immediately understand these are people-related administrative functions

---

### User Story 3 - Organizational Structure Access (Priority: P2)

As a company administrator managing multi-location operations, I need to access Agencies and Sites in a dedicated Structure submenu, so I can manage my organizational hierarchy efficiently.

**Why this priority**: While important for multi-location businesses, this is used less frequently than team and core settings management. Physical structure changes (adding sites, creating agencies) are typically one-time or infrequent setup tasks.

**Independent Test**: Can be fully tested by accessing the new "Structure" submenu, selecting Agencies or Sites, and managing organizational locations. Delivers value by grouping related organizational hierarchy functions.

**Acceptance Scenarios**:

1. **Given** I am logged in as an administrator, **When** I hover over the Administration section, **Then** I see a "Structure" submenu with "Agencies" and "Sites" options
2. **Given** I click on "Agencies" from Structure, **When** the page loads, **Then** I see agency management interface
3. **Given** I click on "Sites" from Structure, **When** the page loads, **Then** I see site/location management interface
4. **Given** I am a single-location business, **When** I view the Administration section, **Then** the Structure submenu is only visible if I have permissions for agencies or sites
5. **Given** I am using the mini navbar (collapsed view), **When** I view the Administration area, **Then** I see 4 separate icons for Company, Team Management, Structure, and AI & Insights
6. **Given** I hover over the Structure icon in mini navbar, **When** the dropdown appears, **Then** I see only Agencies and Sites (not other submenu items)

---

### User Story 4 - AI & Analytics Quick Access (Priority: P1)

As any user with appropriate permissions, I need quick access to AI Agent and Roadmap features through a dedicated "AI & Insights" submenu, so I can leverage intelligent assistance and track product development.

**Why this priority**: The AI Agent is a NEW feature that needs visibility to drive adoption. Roadmap provides transparency and user engagement. Both are user-facing features that deserve prominence rather than being buried in administration settings.

**Independent Test**: Can be fully tested by accessing the new "AI & Insights" submenu, clicking AI Agent or Roadmap, and verifying the features load correctly. Delivers immediate value by making these high-value features easily discoverable.

**Acceptance Scenarios**:

1. **Given** I am any authenticated user, **When** I hover over the Administration section, **Then** I see "AI & Insights" submenu with "AI Agent" (with NEW badge) and "Roadmap" options
2. **Given** I click on "AI Agent" from AI & Insights, **When** the page loads, **Then** I see the AI chat interface
3. **Given** I am an administrator, **When** I click on "Roadmap" from AI & Insights, **Then** I see the product roadmap with feature voting
4. **Given** I am a non-admin user, **When** I view the AI & Insights submenu, **Then** I see "AI Agent" but Roadmap visibility follows existing admin-only permission rules
5. **Given** the AI Agent icon exists in the header, **When** I reorganize the menu, **Then** the header icon remains for quick access while the submenu provides clear categorization

---

### User Story 5 - Analytics Integration (Priority: P3)

As a business analyst or manager, I need to see Analytics in the AI & Insights submenu, so I can access all data-driven decision tools from a unified location.

**Why this priority**: While important for information architecture consistency, this is lower priority than core reorganization. Moving Analytics consolidates all intelligence tools but doesn't change core functionality.

**Independent Test**: Can be fully tested by verifying Analytics appears in the AI & Insights submenu (no longer in Operations section) and clicking through to analytics dashboards. Delivers value by grouping all intelligence/insights tools together.

**Acceptance Scenarios**:

1. **Given** I have analytics permissions, **When** I hover over "AI & Insights" submenu, **Then** I see "Analytics" as an option alongside AI Agent and Roadmap
2. **Given** I click on "Analytics" from AI & Insights, **When** the page loads, **Then** I see the inventory overview and analytics dashboards
3. **Given** I view the Operations section, **When** I scan available menus, **Then** Analytics is no longer present (moved to Administration)
4. **Given** I view the Administration section, **When** I compare the new structure, **Then** I understand that "AI & Insights" groups all intelligence and analytical tools

---

### Edge Cases

- **What happens when a user has no permissions for any items in a submenu?** The entire submenu should be hidden from the navigation
- **What happens when a user has mixed permissions (e.g., can view Teams but not Roles)?** Show only the submenu items they have permission to access
- **What happens to the AI Agent header icon?** It remains in the header for quick access; the submenu placement provides additional discoverability and proper categorization
- **What happens to Roadmap header icon for admins?** It remains in the header for quick access; the submenu provides an alternative, more discoverable access point
- **How does this work with mobile/collapsed navigation?** The smart categorization structure should be preserved in the mini navbar view (icons with hover menus)
- **What happens to Analytics in the Operations section?** Analytics will be removed from Operations and moved entirely to the "AI & Insights" submenu in Administration
- **What happens when hovering over submenus in the mini navbar?** Each of the 4 Administration submenus gets its own icon in the mini navbar. Hovering over each icon shows that submenu's items (Company icon → Plans/Settings, Team Management icon → Teams/Roles, Structure icon → Agencies/Sites, AI & Insights icon → AI Agent/Roadmap/Analytics)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reorganize the Administration section (currently "Company") into four distinct submenus: "Company (Core Settings)", "Team Management", "Structure", and "AI & Insights"
- **FR-002**: System MUST place "Plans" and "Settings" under "Company (Core Settings)" submenu
- **FR-003**: System MUST place "Teams" and "Roles" under "Team Management" submenu
- **FR-004**: System MUST place "Agencies" and "Sites" under "Structure" submenu
- **FR-005**: System MUST place "AI Agent" (with NEW badge), "Roadmap", and "Analytics" under "AI & Insights" submenu
- **FR-005a**: System MUST remove "Analytics" from its current location in the Operations section
- **FR-006**: System MUST maintain existing permission checks for all menu items (no changes to authorization logic)
- **FR-007**: System MUST preserve the header icons for AI Agent and Roadmap (dual access pattern)
- **FR-008**: System MUST hide entire submenus when user has no permissions for any items within that submenu
- **FR-009**: System MUST show only authorized items within each submenu when user has partial permissions
- **FR-010**: System MUST preserve the NEW badge on AI Agent in the submenu
- **FR-011**: System MUST maintain Roadmap visibility rules (admin-only in submenu, but admin-only header icon remains)
- **FR-012**: System MUST update navigation translation keys to reflect new submenu labels
- **FR-013**: System MUST preserve all existing navigation functionality (hover states, active states, routing, click behavior)
- **FR-014**: System MUST display 4 separate icons in the mini navbar (icon-only view) for each Administration submenu: Company (Core Settings), Team Management, Structure, and AI & Insights
- **FR-014a**: System MUST show individual hover dropdowns for each mini navbar icon, displaying only that submenu's items
- **FR-015**: System MUST preserve Analytics permission checks (read:analytics) when moving to AI & Insights submenu

### Key Entities

- **Navigation Menu Structure**: Hierarchical organization of menu items with sections (Main, Operations, Administration) and submenus (Company, Team Management, Structure, AI & Insights)
- **Menu Item**: Individual navigation link with properties (label, link, icon, badge, permission requirements, active state)
- **Submenu**: Collection of related menu items grouped under a parent category with a label and icon
- **Permission**: User authorization level that determines visibility of menu items and submenus
- **Section**: Top-level grouping of navigation areas (Main, Operations, Administration)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access Plans and Settings within 2 clicks (hover Company submenu → click item) with clearer mental categorization
- **SC-002**: Company/Administration submenu contains maximum 4 logical submenus instead of 7+ individual items
- **SC-003**: AI Agent discoverability improves through dual access (header icon + categorized submenu placement)
- **SC-004**: 100% of existing menu functionality preserved (no broken links, no permission bypasses, no visual regressions)
- **SC-005**: Navigation structure creates clear mental models where users understand the purpose of each submenu by its label
- **SC-006**: Zero additional clicks required for most common administrative tasks (Plans, Settings, Teams remain 2-click access)
- **SC-007**: Information architecture follows logical grouping: Core Settings (billing/config) → Team Management (people) → Structure (locations) → AI & Insights (intelligence tools)
- **SC-008**: All permission-based visibility rules function identically to current implementation (no security regressions)

## Assumptions

1. **Translation Infrastructure**: The project has existing i18n infrastructure (`useTranslation` from 'react-i18next') and can accommodate new navigation keys
2. **Icon Availability**: Appropriate Tabler icons are available for new submenu categories (or existing IconBuilding can be reused for some submenus)
3. **No Backend Changes**: All changes are frontend-only; permission checking logic remains unchanged
4. **Menu Component Flexibility**: The existing `NavbarLinksGroup` component supports nested submenus or can be extended to support the new categorization
5. **User Familiarity**: Users understand that administrative functions are under the Administration section; the reorganization improves but doesn't fundamentally change this pattern
6. **Analytics Move**: Analytics will be removed from the Operations section and moved entirely to the "AI & Insights" submenu, consolidating all intelligence and data visualization tools in one location
7. **Mini Navbar Icons**: The mini navbar will display 4 separate icons for Administration submenus, each with its own hover dropdown. This requires selecting appropriate Tabler icons for Team Management, Structure, and AI & Insights (Company can retain IconBuilding)
8. **No Breaking Changes**: The reorganization maintains backward compatibility with existing routes, permissions, and navigation behavior

## Technical Constraints

- Must work within existing React Router v7 and Mantine UI framework
- Must preserve existing permission checking logic and user role system
- Must maintain translation key structure in `app/locales/` directory
- Must work with existing `Navbar.tsx` component architecture
- Must maintain compatibility with both full navbar and mini navbar views
- Cannot introduce new dependencies or frameworks
- Must work across all supported browsers and devices

## Out of Scope

- Creating new features or functionality beyond navigation reorganization
- Changing permission logic or role-based access control
- Modifying the actual content or behavior of pages (AI Agent, Roadmap, Settings, etc.)
- Redesigning visual appearance beyond necessary adjustments for new structure
- Adding keyboard shortcuts or other navigation enhancements
- Implementing navigation search functionality
- Creating mobile-specific navigation patterns (responsive behavior should follow existing patterns)
- Telemetry or analytics tracking for navigation usage
- A/B testing infrastructure for navigation variations
