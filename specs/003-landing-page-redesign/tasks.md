# Tasks: Landing Page Redesign for Maximum Conversion

**Branch**: `003-landing-page-redesign`  
**Input**: Design documents from `/specs/003-landing-page-redesign/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are EXCLUDED from this implementation plan per template instructions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database initialization and basic project structure for landing page

- [X] T001 Add landing page models to prisma/schema.prisma (DemoRequest, Testimonial, SuccessMetric, LandingPageConfig)
- [X] T002 Create Prisma migration: bun run prisma migrate dev --name add_landing_page_models
- [X] T003 Create seed file prisma/seeds/landing-page-seed.ts with placeholder testimonials, success metrics, and landing config
- [X] T004 Run seed data: bun run prisma db seed
- [X] T005 [P] Create TypeScript types file app/lib/landing/types.ts with all landing page interfaces
- [X] T006 [P] Create Zod validators file app/lib/landing/validators.ts for demo request validation

**Checkpoint**: Database schema ready, types and validators available

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Create demo request service app/services/demo-request.server.ts with createDemoRequest and rate limiting
- [X] T008 [P] Create testimonials service app/services/testimonials.server.ts with getActiveTestimonials
- [X] T009 [P] Create success metrics service app/services/success-metrics.server.ts with getActiveSuccessMetrics
- [X] T010 [P] Create landing config service app/services/landing-config.server.ts with getLandingPageConfig
- [X] T011 Create demo request API route app/routes/api/demo-request.ts (POST endpoint with Zod validation and rate limiting)
- [X] T012 [P] Create testimonials API route app/routes/api/landing.testimonials.ts (GET endpoint)
- [X] T013 [P] Create success metrics API route app/routes/api/landing.success-metrics.ts (GET endpoint)
- [X] T014 [P] Create landing config API route app/routes/api/landing.config.ts (GET endpoint)
- [X] T015 Create email template app/emails/demo-request-notification.tsx for Resend notifications
- [X] T016 Add demo request notification function to app/services/email.server.ts

**Checkpoint**: Foundation ready - service layer and API endpoints functional, user story implementation can now begin

---

## Phase 3: User Story 1 - Immediate Value Recognition (Priority: P1) 🎯 MVP

**Goal**: Business owner visits landing page and immediately understands what Triven does and how it solves inventory management problems within 3 seconds

**Independent Test**: Show the hero section for 3 seconds, then ask users to describe what the product does. Success means 90%+ can accurately describe it as an AI-powered inventory management platform.

### Implementation for User Story 1

- [X] T017 [P] [US1] Create LandingHero component directory app/components/LandingHero/ with index.ts
- [X] T018 [P] [US1] Implement app/components/LandingHero/LandingHero.tsx with headline, subheadline, and dashboard preview placeholder
- [X] T019 [P] [US1] Create app/components/LandingHero/LandingHero.module.css with dark gradient background, responsive typography
- [X] T020 [P] [US1] Create LandingDashboardPreview component directory app/components/LandingDashboardPreview/ with index.ts
- [X] T021 [P] [US1] Implement app/components/LandingDashboardPreview/LandingDashboardPreview.tsx with animated metrics (inventory value, items tracked, accuracy, growth)
- [X] T022 [P] [US1] Create app/components/LandingDashboardPreview/LandingDashboardPreview.module.css with responsive design and prefers-reduced-motion support
- [X] T023 [US1] Integrate dashboard preview into LandingHero component with data from admin demo seed account
- [ ] T024 [US1] Verify hero section loads within 2 seconds on 3G connection (performance optimization)
- [ ] T025 [US1] Verify WCAG 2.1 AA color contrast compliance for hero section
- [ ] T026 [US1] Test hero section on mobile (375px), tablet (768px), desktop (1200px) breakpoints

**Checkpoint**: Hero section complete with clear value proposition, dashboard preview, and performance optimized

---

## Phase 4: User Story 2 - Frictionless Trial Signup (Priority: P1) 🎯 MVP

**Goal**: Visitor can start a free trial with minimal friction via prominent, compelling CTAs throughout their page journey

**Independent Test**: Track click-through rate on "Start Free Trial" CTAs. Success means 15%+ of landing page visitors click a trial CTA, with 70%+ completing signup.

### Implementation for User Story 2

- [X] T027 [P] [US2] Create LandingCTA component directory app/components/LandingCTA/ with index.ts
- [X] T028 [P] [US2] Implement app/components/LandingCTA/LandingCTA.tsx with primary (Start Free Trial) and secondary (Request Demo) buttons
- [X] T029 [P] [US2] Create app/components/LandingCTA/LandingCTA.module.css with bright green (#20FE6B) primary button, outlined secondary button
- [X] T030 [P] [US2] Create DemoRequestModal component directory app/components/DemoRequestModal/ with index.ts
- [X] T031 [P] [US2] Implement app/components/DemoRequestModal/DemoRequestModal.tsx with form fields (name, email, company, team size, preferred time, message)
- [X] T032 [P] [US2] Create app/components/DemoRequestModal/DemoRequestModal.module.css with modal overlay, keyboard navigation, mobile-friendly inputs
- [X] T033 [US2] Add CTAs to LandingHero component (primary and secondary buttons)
- [X] T034 [US2] Integrate DemoRequestModal with demo-request API endpoint for form submission
- [X] T035 [US2] Add form validation with Zod schema and error display
- [X] T036 [US2] Add loading state and success confirmation to DemoRequestModal
- [X] T037 [US2] Verify all CTA buttons are minimum 48px height for touch-friendly interaction
- [X] T038 [US2] Verify modal keyboard navigation (Tab, Escape to close) and screen reader compatibility

**Checkpoint**: CTAs present in hero section, demo request modal functional with API integration, mobile-friendly

---

## Phase 5: User Story 3 - Social Proof and Trust Building (Priority: P2)

**Goal**: Skeptical visitor evaluates whether Triven is credible by seeing clear indicators of trust, success metrics, and real customer outcomes

**Independent Test**: A/B test landing page with and without social proof elements. Success means the version with social proof achieves 25%+ higher trial signup rate.

### Implementation for User Story 3

- [X] T039 [P] [US3] Create LandingSocialProof component directory app/components/LandingSocialProof/ with index.ts
- [X] T040 [P] [US3] Implement app/components/LandingSocialProof/LandingSocialProof.tsx with success metrics display (15,000+ Products Managed, 98% Accuracy, 2,400+ Hours Saved)
- [X] T041 [P] [US3] Create app/components/LandingSocialProof/LandingSocialProof.module.css with grid layout, icon styling
- [X] T042 [P] [US3] Create LandingTestimonials component directory app/components/LandingTestimonials/ with index.ts
- [X] T043 [P] [US3] Implement app/components/LandingTestimonials/LandingTestimonials.tsx with testimonial cards (customer name, role, company, photo, text, star rating)
- [X] T044 [P] [US3] Create app/components/LandingTestimonials/LandingTestimonials.module.css with responsive grid, hover effects
- [X] T045 [US3] Integrate LandingSocialProof with success-metrics API endpoint to fetch metrics
- [X] T046 [US3] Integrate LandingTestimonials with testimonials API endpoint to fetch active testimonials
- [X] T047 [US3] Add CountUp animation to success metrics values (2s ease-out)
- [X] T048 [US3] Handle placeholder testimonials display (show "Early Adopter" if isPlaceholder = true)
- [X] T049 [US3] Verify star rating visualization (5-star display)
- [ ] T050 [US3] Test social proof section responsiveness on all breakpoints

**Checkpoint**: Social proof section complete with success metrics, testimonials, and animated values

---

## Phase 6: User Story 4 - Feature Discovery and Differentiation (Priority: P2)

**Goal**: Visitor exploring Triven's capabilities can quickly understand the key features, how they work together, and what makes Triven different from basic inventory tools

**Independent Test**: Survey visitors after viewing features section. Success means 85%+ can name at least 3 key features and explain the AI differentiation.

### Implementation for User Story 4

- [ ] T051 [P] [US4] Create LandingFeatures component directory app/components/LandingFeatures/ with index.ts
- [ ] T052 [P] [US4] Implement app/components/LandingFeatures/LandingFeatures.tsx with 3 hero features (AI-Powered Insights, Real-Time Visibility, Growth Optimization)
- [ ] T053 [P] [US4] Create app/components/LandingFeatures/LandingFeatures.module.css with feature grid, icon styling, hover animations
- [ ] T054 [US4] Add 6-9 secondary features to LandingFeatures component below hero features
- [ ] T055 [US4] Create "Accurate Inventory" showcase section within LandingFeatures with dashboard preview and progress indicators (98% auto-categorization, 90% stock movement)
- [ ] T056 [US4] Add icons for all features using Mantine Icons or custom SVG icons
- [ ] T057 [US4] Implement hover animations (translateY(-4px to -8px), 0.3s duration)
- [ ] T058 [US4] Verify hover animations respect prefers-reduced-motion (disable if requested)
- [ ] T059 [US4] Test features section on mobile with single-column layout

**Checkpoint**: Features section complete with hero and secondary features, dashboard showcase, hover animations

---

## Phase 7: User Story 5 - Pricing Clarity and Plan Selection (Priority: P2)

**Goal**: Visitor researching pricing can easily compare plans, understand what's included at each tier, and select the right plan for their business size and needs

**Independent Test**: Track visitors who view pricing and then start trial. Success means 40%+ of pricing viewers initiate signup, indicating clear plan understanding.

### Implementation for User Story 5

- [ ] T060 [P] [US5] Create LandingPricing component directory app/components/LandingPricing/ with index.ts
- [ ] T061 [P] [US5] Implement app/components/LandingPricing/LandingPricing.tsx with 3 pricing tiers (Standard $29/mo, Professional $39/mo, Premium $99/mo)
- [ ] T062 [P] [US5] Create app/components/LandingPricing/LandingPricing.module.css with pricing card styling, "Most Popular" badge, monthly/yearly toggle
- [ ] T063 [US5] Add pricing tier details (sales orders, purchase orders, users, agencies, sites, reporting level, features)
- [ ] T064 [US5] Implement monthly/yearly toggle with "Save up to 33%" badge display
- [ ] T065 [US5] Add visual highlight for Professional plan (border color, scale, or "Most Popular" badge)
- [ ] T066 [US5] Add "Start 14-Day Free Trial" CTA button to each plan card
- [ ] T067 [US5] Add Enterprise contact card below standard plans with "Contact Sales" CTA
- [ ] T068 [US5] Implement plan pre-selection in trial signup URL (query param: ?plan=professional)
- [ ] T069 [US5] Test pricing cards vertical stacking on mobile with easy plan comparison

**Checkpoint**: Pricing section complete with 3 tiers, toggle, highlights, and Enterprise contact card

---

## Phase 8: User Story 6 - Demo Request Path (Priority: P3)

**Goal**: Visitor who prefers a guided demo over self-service trial can easily request a demo without hunting for contact information

**Independent Test**: Track demo request form submissions. Success means 5-8% of landing page visitors request a demo (healthy balance with trial signups).

### Implementation for User Story 6

- [ ] T070 [US6] Add secondary "Request Demo" CTA to LandingCTA component (already created in Phase 4)
- [ ] T071 [US6] Ensure DemoRequestModal (created in Phase 4) captures all required fields: name, email, company, team size, preferred demo time, message
- [ ] T072 [US6] Add immediate confirmation message to DemoRequestModal after successful submission: "We'll contact you within 24 hours"
- [ ] T073 [US6] Verify demo request email notification is sent to sales team via Resend (configured in Phase 2)
- [ ] T074 [US6] Test demo request form opens as overlay without page navigation
- [ ] T075 [US6] Test demo request form on mobile with vertical field stacking and touch-friendly inputs

**Checkpoint**: Demo request path complete with modal form, email notifications, and mobile optimization

---

## Phase 9: Landing Page Composition & Integration

**Purpose**: Compose all sections into a complete landing page with proper routing and data loading

- [ ] T076 Create Landing page directory app/pages/Landing/ with index.ts
- [ ] T077 Implement app/pages/Landing/Landing.tsx composing all sections (LandingHero, LandingFeatures, LandingSocialProof, LandingTestimonials, LandingPricing, LandingCTA)
- [ ] T078 Create app/pages/Landing/Landing.module.css with section spacing, max-width container
- [ ] T079 Update app/routes/index.tsx to render Landing page component
- [ ] T080 Add loader function to app/routes/index.tsx to fetch testimonials, success metrics, and landing config via API
- [ ] T081 Add meta tags to app/routes/index.tsx for SEO (metaTitle, metaDescription, metaKeywords from landing config)
- [ ] T082 Implement scroll-triggered animations for sections using Intersection Observer
- [ ] T083 Add final CTA section at page bottom before footer (reuse LandingCTA component)
- [ ] T084 Verify dark mode gradient background throughout entire landing page
- [ ] T085 Test landing page composition on all breakpoints (375px, 768px, 1200px, 1920px)

**Checkpoint**: Complete landing page composed with all sections, proper routing, and data loading

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T086 [P] Optimize images via ImageKit: dashboard preview, customer photos, icons
- [ ] T087 [P] Implement progressive image loading with blur-up placeholders (LQIP)
- [ ] T088 Add analytics tracking for conversion events: page view, CTA clicks, demo requests, trial signups
- [ ] T089 Run Lighthouse audit and optimize for 90+ performance score
- [ ] T090 Run axe accessibility audit and fix any WCAG 2.1 AA violations
- [ ] T091 Test keyboard navigation throughout entire landing page
- [ ] T092 Test screen reader compatibility (NVDA/JAWS) for all sections
- [ ] T093 Verify all animations respect prefers-reduced-motion setting
- [ ] T094 Add structured data (JSON-LD) for SEO: Organization, Product, FAQPage
- [ ] T095 Test landing page on slow 3G connection (hero loads <2s)
- [ ] T096 Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] T097 Update docs/AI_ASSISTANT_PROMPTS.md with landing page component context
- [ ] T098 Run quickstart.md validation (database setup, service layer, API routes, components)
- [ ] T099 Create deployment checklist based on specs/003-landing-page-redesign/quickstart.md
- [ ] T100 Final review: verify all 6 user stories are independently functional

**Checkpoint**: Landing page fully optimized, accessible, and ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Landing Page Composition (Phase 9)**: Depends on all desired user stories (minimally US1-US2 for MVP)
- **Polish (Phase 10)**: Depends on Landing Page Composition completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (integrates with US1 in hero section but independently testable)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P3)**: Depends on User Story 2 (Phase 4) for DemoRequestModal component, but can be completed by adding CTAs and testing

### Within Each User Story

- Component creation (index.ts, Component.tsx, .module.css) can proceed in parallel
- Integration tasks depend on component creation completion
- Verification/testing tasks depend on integration completion

### Parallel Opportunities

- **Phase 1 Setup**: Tasks T005 and T006 can run in parallel (different files)
- **Phase 2 Foundational**: Tasks T007-T010 (services) can run in parallel, Tasks T012-T014 (API routes) can run in parallel
- **User Story 1**: Tasks T017-T019 (LandingHero), T020-T022 (LandingDashboardPreview) can run in parallel
- **User Story 2**: Tasks T027-T029 (LandingCTA), T030-T032 (DemoRequestModal) can run in parallel
- **User Story 3**: Tasks T039-T041 (LandingSocialProof), T042-T044 (LandingTestimonials) can run in parallel
- **User Story 4**: Tasks T051-T053 (LandingFeatures component structure) can run in parallel
- **User Story 5**: Tasks T060-T062 (LandingPricing component structure) can run in parallel
- **Phase 10 Polish**: Tasks T086-T087 (image optimization), T091-T092 (accessibility testing) can run in parallel
- **All user stories (Phase 3-8)** can be worked on in parallel by different team members after Foundational phase completes

---

## Parallel Example: User Story 1

```bash
# Launch all component structure tasks for User Story 1 together:
Task T017: "Create LandingHero component directory app/components/LandingHero/ with index.ts"
Task T018: "Implement app/components/LandingHero/LandingHero.tsx"
Task T019: "Create app/components/LandingHero/LandingHero.module.css"
Task T020: "Create LandingDashboardPreview component directory"
Task T021: "Implement app/components/LandingDashboardPreview/LandingDashboardPreview.tsx"
Task T022: "Create app/components/LandingDashboardPreview/LandingDashboardPreview.module.css"

# Then proceed with integration (depends on above):
Task T023: "Integrate dashboard preview into LandingHero component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

Both User Story 1 (Immediate Value Recognition) and User Story 2 (Frictionless Trial Signup) are marked P1 priority and are essential for a functional landing page:

1. Complete Phase 1: Setup (database, types, validators)
2. Complete Phase 2: Foundational (services, API routes) - CRITICAL
3. Complete Phase 3: User Story 1 (hero section with value proposition)
4. Complete Phase 4: User Story 2 (CTAs and demo request modal)
5. Complete Phase 9: Landing Page Composition (minimal - just hero + CTAs)
6. Complete Phase 10: Polish (performance, accessibility)
7. **STOP and VALIDATE**: Test conversion flow end-to-end
8. Deploy MVP

**MVP Scope**: Landing page with hero section (value prop + dashboard preview) + CTAs (trial signup + demo request modal). This satisfies the core requirement: "when leads land on triven they should try or request demo immediately."

### Incremental Delivery

1. **MVP** (US1 + US2): Hero + CTAs → Test independently → Deploy
2. **V2** (+ US3): Add social proof (metrics + testimonials) → Test independently → Deploy
3. **V3** (+ US4): Add features section → Test independently → Deploy
4. **V4** (+ US5): Add pricing section → Test independently → Deploy
5. **V5** (+ US6): Enhance demo request path → Test independently → Deploy

Each version adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (hero section)
   - **Developer B**: User Story 2 (CTAs + demo modal)
   - **Developer C**: User Story 3 (social proof)
   - **Developer D**: User Story 4 (features section)
3. Stories complete and integrate independently
4. Developer E composes Landing page (Phase 9) once US1-US2 complete for MVP

---

## Total Task Count: 100 Tasks

- **Phase 1 (Setup)**: 6 tasks
- **Phase 2 (Foundational)**: 10 tasks
- **Phase 3 (US1)**: 10 tasks
- **Phase 4 (US2)**: 12 tasks
- **Phase 5 (US3)**: 12 tasks
- **Phase 6 (US4)**: 9 tasks
- **Phase 7 (US5)**: 10 tasks
- **Phase 8 (US6)**: 6 tasks
- **Phase 9 (Composition)**: 10 tasks
- **Phase 10 (Polish)**: 15 tasks

---

## Task Count by User Story

- **User Story 1 (Immediate Value Recognition)**: 10 tasks
- **User Story 2 (Frictionless Trial Signup)**: 12 tasks
- **User Story 3 (Social Proof and Trust)**: 12 tasks
- **User Story 4 (Feature Discovery)**: 9 tasks
- **User Story 5 (Pricing Clarity)**: 10 tasks
- **User Story 6 (Demo Request Path)**: 6 tasks

---

## Parallel Opportunities Identified

- **Setup**: 2 parallel opportunities (types and validators)
- **Foundational**: 7 parallel opportunities (services and API routes)
- **User Story 1**: 6 parallel opportunities (component structure)
- **User Story 2**: 6 parallel opportunities (component structure)
- **User Story 3**: 6 parallel opportunities (component structure)
- **User Story 4**: 3 parallel opportunities (component structure)
- **User Story 5**: 3 parallel opportunities (component structure)
- **Polish**: 4 parallel opportunities (optimization and testing)
- **Cross-story parallelization**: All user stories can run in parallel after Foundational phase

---

## Independent Test Criteria for Each Story

- **US1**: Show hero for 3 seconds, 90%+ can describe Triven as AI-powered inventory management
- **US2**: 15%+ CTR on trial CTAs, 70%+ complete signup
- **US3**: Social proof version achieves 25%+ higher trial signup rate
- **US4**: 85%+ can name 3+ key features and explain AI differentiation
- **US5**: 40%+ of pricing viewers initiate signup
- **US6**: 5-8% of landing page visitors request demo

---

## Suggested MVP Scope

**MVP = User Story 1 + User Story 2**

This provides:
- Clear value proposition (hero section with dashboard preview)
- Immediate conversion path (trial signup + demo request CTAs)
- Functional demo request modal with API integration
- Performance optimized (<2s hero load)
- Mobile responsive (375px+)
- WCAG 2.1 AA compliant

**Why this MVP?**
- Satisfies core requirement: "when leads land on triven they should try or request demo immediately"
- Minimal viable feature set for conversion testing
- Both user stories are P1 priority (critical)
- Can collect baseline conversion data to measure success of subsequent enhancements

**Post-MVP Enhancements**:
- Add US3 (social proof) to increase trust and conversion by 25%+
- Add US4 (features) to help visitors self-qualify
- Add US5 (pricing) to reduce sales cycle friction
- Add US6 (enhanced demo path) to capture enterprise leads

---

## Format Validation

✅ **ALL tasks follow the checklist format**:
- Checkbox: `- [ ]` (markdown checkbox) ✓
- Task ID: Sequential (T001, T002, T003...) ✓
- [P] marker: Included ONLY if task is parallelizable ✓
- [Story] label: Included for user story phase tasks (US1-US6) ✓
- Description: Clear action with exact file path ✓

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included (not requested in spec)
- All components follow 4-file structure per Constitutional Principle IX
- All styling uses CSS Modules per Constitutional Principle VIII
- All API routes follow REST conventions with Zod validation per Constitutional Principle VI
- All services are standalone functions per Constitutional Principle I

---

**Tasks Generated**: October 21, 2025  
**Ready for Implementation**: Yes ✅  
**Next Step**: Execute Phase 1 (Setup) to initialize database and project structure
