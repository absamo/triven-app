# Implementation Plan: Landing Page Redesign for Maximum Conversion

**Branch**: `003-landing-page-redesign` | **Date**: October 21, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-landing-page-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Redesign Triven's landing page to maximize conversion rates (12%+ trial signups and demo requests) by creating a compelling, performance-optimized experience that immediately communicates value and builds trust. The new design maintains the current dark gradient aesthetic (black to green) while implementing strategic CTAs, social proof elements, animated dashboard previews, and a frictionless conversion path. Key technical requirements include sub-2-second load times, WCAG 2.1 AA accessibility, mobile-first responsive design, and integration with existing authentication and demo request infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x, Node.js 20.x  
**Primary Dependencies**: React Router v7, Mantine UI v8, Prisma ORM, Better Auth, Resend (email), ImageKit (images)  
**Storage**: PostgreSQL (demo requests, testimonials, success metrics, landing page configuration)  
**Testing**: Vitest (unit), React Testing Library (integration), Playwright (E2E conversion flows)  
**Target Platform**: Web (responsive across mobile 375px+, tablet 768px+, desktop 1200px+, wide 1920px+)  
**Project Type**: Web application (frontend React components + backend API routes)  
**Performance Goals**: Hero section loads <2s on 3G, Lighthouse performance 90+, Time to Interactive <3s  
**Constraints**: Mobile conversion within 20% of desktop, all animations respect prefers-reduced-motion, WCAG 2.1 AA compliance  
**Scale/Scope**: Single landing page with 8-10 component sections, 3-5 API endpoints, 15-20 unique UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Mandatory Principles Checklist

- [x] **Service-Oriented Architecture**: Demo request processing, testimonial fetching, and analytics tracking implemented as standalone service functions
- [x] **Dark/Light Mode Support**: All landing page components use Mantine UI with theme-aware styling; dark gradient is default, light mode toggle available
- [x] **Test-First Development**: Unit tests for components (React Testing Library), integration tests for conversion flows, E2E tests for trial signup and demo request paths
- [ ] **Real-Time Capabilities**: N/A - Landing page is static content; no collaborative features requiring WebSocket updates
- [ ] **Data Integrity**: Partial - Demo requests require timestamp/status tracking but not full audit trails (not business-critical inventory operations)
- [x] **API-First Development**: REST endpoint for demo request submission with Zod validation, proper HTTP status codes, rate limiting
- [x] **Accessibility & Responsive**: WCAG 2.1 AA compliance mandatory per FR-028/FR-031; responsive breakpoints (375px/768px/1200px/1920px), keyboard navigation, prefers-reduced-motion support
- [x] **CSS Modules & Styling**: All landing page components use CSS Modules (.module.css); animations via CSS classes, no inline styles except dynamic runtime values
- [x] **Component File Structure**: All components follow 4-file structure (index.ts, Component.tsx, .module.css, .test.tsx) per Principle IX
- [x] **TypeScript Type Safety**: Strict types for all components, Zod schemas for demo request validation, type inference from validators
- [x] **Database Operations**: Prisma for demo requests, testimonials, success metrics storage; migrations for schema changes; indexes on email/timestamp for queries
- [x] **Security**: Demo request endpoint validates input with Zod, implements rate limiting, sanitizes user submissions, sends notification emails via Resend
- [ ] **AI Integration**: N/A - No AI features in landing page redesign

### Violations Requiring Justification

*Complete table below ONLY if any constitutional requirements cannot be met:*

| Principle Violated | Why Required | Simpler Alternative Rejected Because |
|-------------------|--------------|-------------------------------------|
| None | N/A | All applicable constitutional principles are satisfied |

**Notes on N/A Principles**:
- **Real-Time Capabilities**: Landing page content is static/pre-rendered; no collaborative features that would benefit from WebSocket updates
- **Data Integrity (Full Audit Trails)**: Demo requests track status and timestamps but don't require full audit logging (old/new values) since they're not business-critical inventory operations; sufficient to log submission and status changes
- **AI Integration**: Landing page redesign doesn't involve AI features; existing product AI capabilities are showcased via static content and demo dashboard preview

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/
├── components/
│   ├── LandingHero/                # Hero section with dashboard preview
│   │   ├── index.ts
│   │   ├── LandingHero.tsx
│   │   ├── LandingHero.module.css
│   │   └── LandingHero.test.tsx
│   ├── LandingFeatures/            # Primary + secondary features grid
│   │   ├── index.ts
│   │   ├── LandingFeatures.tsx
│   │   ├── LandingFeatures.module.css
│   │   └── LandingFeatures.test.tsx
│   ├── LandingDashboardPreview/    # Animated inventory dashboard showcase
│   │   ├── index.ts
│   │   ├── LandingDashboardPreview.tsx
│   │   ├── LandingDashboardPreview.module.css
│   │   └── LandingDashboardPreview.test.tsx
│   ├── LandingPricing/             # Pricing tiers with toggle
│   │   ├── index.ts
│   │   ├── LandingPricing.tsx
│   │   ├── LandingPricing.module.css
│   │   └── LandingPricing.test.tsx
│   ├── LandingTestimonials/        # Customer testimonials section
│   │   ├── index.ts
│   │   ├── LandingTestimonials.tsx
│   │   ├── LandingTestimonials.module.css
│   │   └── LandingTestimonials.test.tsx
│   ├── LandingSocialProof/         # Stats, logos, trust indicators
│   │   ├── index.ts
│   │   ├── LandingSocialProof.tsx
│   │   ├── LandingSocialProof.module.css
│   │   └── LandingSocialProof.test.tsx
│   ├── LandingCTA/                 # Strategic CTA sections
│   │   ├── index.ts
│   │   ├── LandingCTA.tsx
│   │   ├── LandingCTA.module.css
│   │   └── LandingCTA.test.tsx
│   └── DemoRequestModal/           # Demo request form modal
│       ├── index.ts
│       ├── DemoRequestModal.tsx
│       ├── DemoRequestModal.module.css
│       └── DemoRequestModal.test.tsx
├── pages/
│   └── Landing/                    # Landing page composition
│       ├── index.ts
│       ├── Landing.tsx
│       ├── Landing.module.css
│       └── Landing.test.tsx         # Integration tests for full page
├── routes/
│   ├── index.tsx                   # Landing page route (public)
│   └── api/
│       └── demo-request.ts         # POST /api/demo-request
├── services/
│   ├── demo-request.server.ts      # Demo request creation, notification
│   ├── testimonials.server.ts      # Fetch testimonials for landing
│   └── landing-analytics.server.ts # Track conversion events
├── lib/
│   └── landing/
│       ├── types.ts                # LandingPageConfig, Testimonial, DemoRequest types
│       └── validators.ts           # Zod schemas for demo request
└── test/
    └── e2e/
        ├── landing-trial-signup.spec.ts    # E2E trial signup flow
        └── landing-demo-request.spec.ts    # E2E demo request flow

prisma/
├── schema.prisma                   # DemoRequest, Testimonial, SuccessMetric models
└── migrations/
    └── [timestamp]_add_landing_page_models/

public/
└── assets/
    └── landing/                    # Landing page images, icons
```

**Structure Decision**: Web application structure. Frontend components in `app/components/Landing*` with corresponding CSS Modules and tests. Backend API routes in `app/routes/api/` with service functions in `app/services/`. Database models in Prisma schema. This follows the existing Triven App structure and constitutional principles (Principle IX: Component File Structure).

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations requiring justification.** All constitutional principles are satisfied:
- Service-oriented architecture with standalone functions
- Dark/light mode support via Mantine UI
- Test-first development with comprehensive test suite
- No real-time capabilities needed (static landing page)
- Data integrity via Prisma with status tracking
- API-first with Zod validation and REST conventions
- WCAG 2.1 AA accessibility compliance
- CSS Modules for all component styling
- 4-file component structure throughout
- TypeScript strict mode with Zod schemas
- Prisma ORM with migrations and indexes
- Authentication and rate limiting for security
- No AI integration required

The landing page redesign follows all constitutional standards without requiring any complexity trade-offs or principle violations.

---

## Plan Completion Summary

**Status**: ✅ **Phase 1 Complete** - Ready for `/speckit.tasks` command

### Artifacts Generated

1. ✅ **research.md** - Comprehensive research on landing page optimization, conversion tactics, performance, accessibility, mobile design, animations, social proof, demo workflows, analytics, and technology stack integration
2. ✅ **data-model.md** - Complete Prisma schema with 4 entities (DemoRequest, Testimonial, SuccessMetric, LandingPageConfig), TypeScript types, seed data, and query examples
3. ✅ **contracts/openapi.yaml** - OpenAPI 3.1 specification with 4 endpoints (demo request creation, testimonials, success metrics, landing page config) including request/response schemas and error handling
4. ✅ **quickstart.md** - Developer implementation guide covering database setup, service layer, API routes, component development (4-file structure), testing (unit/integration/E2E), performance optimization, and deployment checklist

### Constitutional Compliance

**Gate Status**: ✅ **PASSED**

All applicable constitutional principles satisfied:
- Service-oriented architecture ✓
- Dark/light mode support ✓
- Test-first development ✓
- Real-time capabilities (N/A)
- Data integrity (appropriate level) ✓
- API-first development ✓
- Accessibility & responsive ✓
- CSS Modules & styling ✓
- Component file structure ✓
- TypeScript type safety ✓
- Database operations ✓
- Security requirements ✓
- AI integration (N/A)

### Next Steps

1. **Run `/speckit.tasks`** to break down implementation into ordered development tasks
2. **Execute Phase 2** - Database migration, service implementation, component development, testing
3. **Verify conversion goals** - 12%+ conversion rate, sub-2s load time, WCAG 2.1 AA compliance

### Key Decisions Documented

- **Mobile-first responsive design** with progressive enhancement
- **Progressive image loading** via ImageKit with WebP/AVIF support
- **Server-side rendering (SSR)** via React Router v7 for fast FCP
- **Rate limiting** enforced at 5 demo requests per IP per hour
- **Placeholder testimonials** with "Early Adopter" attribution until real customers available
- **Company logos section hidden** until real customer logos secured
- **Dashboard preview data** pulled from admin demo seed user account
- **Historical baseline comparison** (no A/B test variants, launch to 100%)

**Branch**: `003-landing-page-redesign`  
**Plan Generated**: October 21, 2025  
**Ready for Implementation**: Yes ✅

