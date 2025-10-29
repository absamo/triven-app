# Quickstart Guide: Landing Page Redesign Implementation

**Feature**: Landing Page Redesign for Maximum Conversion  
**Date**: October 21, 2025  
**Phase**: 1 - Design & Contracts

This guide walks developers through implementing the landing page redesign, from database setup to component development to testing conversion flows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Service Layer](#service-layer)
4. [API Routes](#api-routes)
5. [Component Development](#component-development)
6. [Testing](#testing)
7. [Performance Optimization](#performance-optimization)
8. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

**Required Knowledge:**
- React Router v7 (SSR, loaders, actions)
- Mantine UI v8 (theme system, components)
- Prisma ORM (schema, migrations, queries)
- TypeScript (strict mode, type inference)
- CSS Modules (styling pattern)
- Vitest + React Testing Library (testing)

**Environment Setup:**
```bash
# Install dependencies
bun install

# Verify environment variables
cp .env.example .env
# Required: DATABASE_URL, RESEND_API_KEY, IMAGEKIT_*

# Start development server
bun run dev
```

---

## Database Setup

### Step 1: Add Prisma Models

Add the following models to `prisma/schema.prisma`:

```prisma
model DemoRequest {
  id                 String   @id @default(cuid())
  name               String   @db.VarChar(100)
  email              String   @db.VarChar(255)
  company            String   @db.VarChar(100)
  teamSize           String
  preferredDemoTime  DateTime?
  message            String?  @db.VarChar(1000)
  status             String   @default("new")
  notificationSent   Boolean  @default(false)
  ipAddress          String?  @db.VarChar(45)
  userAgent          String?  @db.VarChar(255)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@index([ipAddress, createdAt])
  @@map("demo_requests")
}

model Testimonial {
  id               String   @id @default(cuid())
  customerName     String   @db.VarChar(100)
  role             String   @db.VarChar(100)
  company          String   @db.VarChar(100)
  photoUrl         String?  @db.VarChar(500)
  testimonialText  String   @db.VarChar(500)
  starRating       Int      @default(5)
  isPlaceholder    Boolean  @default(false)
  displayOrder     Int      @default(0)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([displayOrder])
  @@index([isActive])
  @@index([isActive, displayOrder])
  @@map("testimonials")
}

model SuccessMetric {
  id            String   @id @default(cuid())
  label         String   @db.VarChar(100)
  value         String   @db.VarChar(50)
  icon          String   @db.VarChar(50)
  displayOrder  Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([displayOrder])
  @@index([isActive])
  @@index([isActive, displayOrder])
  @@map("success_metrics")
}

model LandingPageConfig {
  id                    String   @id @default(cuid())
  metaTitle             String   @db.VarChar(60)
  metaDescription       String   @db.VarChar(160)
  metaKeywords          String?  @db.VarChar(255)
  defaultTheme          String   @default("dark")
  showCompanyLogos      Boolean  @default(false)
  enableDemoRequests    Boolean  @default(true)
  enableTrialSignup     Boolean  @default(true)
  demoRequestRateLimit  Int      @default(5)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("landing_page_config")
}
```

### Step 2: Create Migration

```bash
bun run prisma migrate dev --name add_landing_page_models
```

### Step 3: Add Seed Data

Create `prisma/seeds/landing-page-seed.ts` (see data-model.md for full seed code), then run:

```bash
bun run prisma db seed
```

### Step 4: Verify in Prisma Studio

```bash
bun run prisma studio
```

Verify that `demo_requests`, `testimonials`, `success_metrics`, and `landing_page_config` tables exist with seed data.

---

## Service Layer

Create standalone service functions following Constitutional Principle I (Service-Oriented Architecture).

### File: `app/services/demo-request.server.ts`

```typescript
import { db } from '~/db.server';
import type { DemoRequestInput } from '~/lib/landing/types';
import { sendDemoRequestNotification } from '~/services/email.server';

export async function createDemoRequest(
  data: DemoRequestInput,
  ipAddress?: string,
  userAgent?: string
): Promise<{ id: string; status: string }> {
  // Check rate limit
  if (ipAddress) {
    const recentRequests = await db.demoRequest.count({
      where: {
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    const config = await getLandingPageConfig();
    if (recentRequests >= config.demoRequestRateLimit) {
      throw new Error('Rate limit exceeded');
    }
  }

  // Create demo request
  const demoRequest = await db.demoRequest.create({
    data: {
      ...data,
      ipAddress,
      userAgent,
      status: 'new',
      notificationSent: false,
    },
  });

  // Send email notification
  try {
    await sendDemoRequestNotification(demoRequest);
    await db.demoRequest.update({
      where: { id: demoRequest.id },
      data: { notificationSent: true },
    });
  } catch (error) {
    console.error('Failed to send demo request notification:', error);
    // Don't fail request if email fails
  }

  return {
    id: demoRequest.id,
    status: demoRequest.status,
  };
}

export async function getDemoRequestsByStatus(status: string) {
  return db.demoRequest.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
  });
}
```

### File: `app/services/testimonials.server.ts`

```typescript
import { db } from '~/db.server';
import type { TestimonialDisplay } from '~/lib/landing/types';

export async function getActiveTestimonials(
  limit: number = 5
): Promise<TestimonialDisplay[]> {
  const testimonials = await db.testimonial.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    take: limit,
    select: {
      customerName: true,
      role: true,
      company: true,
      photoUrl: true,
      testimonialText: true,
      starRating: true,
    },
  });

  return testimonials;
}
```

### File: `app/services/landing-analytics.server.ts`

```typescript
// Placeholder for analytics tracking
export async function trackConversionEvent(
  event: string,
  properties: Record<string, any>
) {
  // TODO: Integrate with analytics platform (Google Analytics, Mixpanel, etc.)
  console.log('Conversion event:', event, properties);
}
```

---

## API Routes

Create REST API endpoints following Constitutional Principle VI (API-First Development).

### File: `app/routes/api/demo-request.ts`

```typescript
import { type ActionFunctionArgs, json } from 'react-router';
import { z } from 'zod';
import { createDemoRequest } from '~/services/demo-request.server';
import { demoRequestSchema } from '~/lib/landing/validators';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ data: null, error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = demoRequestSchema.parse(body);

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create demo request
    const result = await createDemoRequest(
      validatedData,
      ipAddress,
      userAgent
    );

    return json({
      data: {
        ...result,
        message: "Demo request received. We'll contact you within 24 hours.",
      },
      error: null,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({
        data: null,
        error: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      return json({
        data: null,
        error: 'Rate limit exceeded. Maximum 5 demo requests per hour.',
        errors: [],
      }, { status: 429 });
    }

    console.error('Demo request error:', error);
    return json({
      data: null,
      error: 'Failed to process demo request. Please try again.',
      errors: [],
    }, { status: 500 });
  }
}
```

### File: `app/routes/api/landing.testimonials.ts`

```typescript
import { type LoaderFunctionArgs, json } from 'react-router';
import { getActiveTestimonials } from '~/services/testimonials.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit')) || 5;

  try {
    const testimonials = await getActiveTestimonials(limit);
    return json({ data: testimonials, error: null });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return json(
      { data: null, error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}
```

---

## Component Development

Follow Constitutional Principle IX (Component File Structure) - all components use 4-file structure.

### Example: LandingHero Component

**File: `app/components/LandingHero/index.ts`**
```typescript
export { LandingHero } from './LandingHero';
```

**File: `app/components/LandingHero/LandingHero.tsx`**
```typescript
import { Button, Container, Stack, Text, Title } from '@mantine/core';
import classes from './LandingHero.module.css';

interface LandingHeroProps {
  onTrialClick: () => void;
  onDemoClick: () => void;
}

export function LandingHero({ onTrialClick, onDemoClick }: LandingHeroProps) {
  return (
    <section className={classes.hero}>
      <Container size="xl">
        <Stack gap={30} align="center">
          <Title className={classes.title}>
            Transform Inventory Chaos into Intelligent Business Growth
          </Title>
          
          <Text className={classes.subtitle} size="xl">
            AI-powered inventory management that scales with your business.
            Real-time visibility, predictive insights, and automated workflows.
          </Text>

          <div className={classes.ctaGroup}>
            <Button
              size="xl"
              className={classes.primaryCta}
              onClick={onTrialClick}
            >
              Start 14-Day Free Trial
            </Button>
            
            <Button
              size="xl"
              variant="outline"
              className={classes.secondaryCta}
              onClick={onDemoClick}
            >
              Request Demo
            </Button>
          </div>

          {/* Dashboard preview component */}
          <div className={classes.dashboardPreview}>
            {/* TODO: Add animated dashboard preview */}
          </div>
        </Stack>
      </Container>
    </section>
  );
}
```

**File: `app/components/LandingHero/LandingHero.module.css`**
```css
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #040308 0%, #1a1a1a 50%, #20FE6B 100%);
  padding: 80px 20px;
}

.title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  text-align: center;
  color: var(--mantine-color-white);
  line-height: 1.2;
  max-width: 1000px;
}

.subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  text-align: center;
  color: var(--mantine-color-gray-3);
  max-width: 800px;
  line-height: 1.6;
}

.ctaGroup {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
}

.primaryCta {
  background-color: #20FE6B;
  color: #040308;
  min-height: 56px;
  padding: 0 40px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.primaryCta:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(32, 254, 107, 0.3);
}

.secondaryCta {
  border: 2px solid #20FE6B;
  color: #20FE6B;
  background: transparent;
  min-height: 56px;
  padding: 0 40px;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.secondaryCta:hover {
  background-color: rgba(32, 254, 107, 0.1);
}

.dashboardPreview {
  margin-top: 60px;
  width: 100%;
  max-width: 1200px;
  /* Placeholder for dashboard preview */
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    min-height: auto;
    padding: 60px 20px;
  }

  .ctaGroup {
    flex-direction: column;
    width: 100%;
  }

  .primaryCta,
  .secondaryCta {
    width: 100%;
  }
}

/* Accessibility: Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .primaryCta,
  .secondaryCta {
    transition: none;
  }

  .primaryCta:hover {
    transform: none;
  }
}
```

**File: `app/components/LandingHero/LandingHero.test.tsx`**
```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { LandingHero } from './LandingHero';

const renderWithMantine = (component: React.ReactNode) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('LandingHero', () => {
  it('renders hero section with title and subtitle', () => {
    renderWithMantine(
      <LandingHero onTrialClick={vi.fn()} onDemoClick={vi.fn()} />
    );

    expect(screen.getByText(/Transform Inventory Chaos/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-powered inventory management/i)).toBeInTheDocument();
  });

  it('renders primary and secondary CTAs', () => {
    renderWithMantine(
      <LandingHero onTrialClick={vi.fn()} onDemoClick={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /Start 14-Day Free Trial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request Demo/i })).toBeInTheDocument();
  });

  it('calls onTrialClick when primary CTA is clicked', async () => {
    const user = userEvent.setup();
    const onTrialClick = vi.fn();

    renderWithMantine(
      <LandingHero onTrialClick={onTrialClick} onDemoClick={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /Start 14-Day Free Trial/i }));
    expect(onTrialClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDemoClick when secondary CTA is clicked', async () => {
    const user = userEvent.setup();
    const onDemoClick = vi.fn();

    renderWithMantine(
      <LandingHero onTrialClick={vi.fn()} onDemoClick={onDemoClick} />
    );

    await user.click(screen.getByRole('button', { name: /Request Demo/i }));
    expect(onDemoClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Testing

### Unit Tests (Components)

```bash
# Run all component tests
bun run test

# Run specific component test
bun run test app/components/LandingHero/LandingHero.test.tsx

# Watch mode
bun run test --watch
```

### Integration Tests (API Endpoints)

Create `app/test/landing/demo-request.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '~/db.server';
import { createDemoRequest } from '~/services/demo-request.server';

describe('Demo Request Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.demoRequest.deleteMany({
      where: { email: 'test@example.com' },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.demoRequest.deleteMany({
      where: { email: 'test@example.com' },
    });
  });

  it('creates demo request successfully', async () => {
    const result = await createDemoRequest({
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Corp',
      teamSize: '11-50',
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe('new');

    const demoRequest = await db.demoRequest.findUnique({
      where: { id: result.id },
    });

    expect(demoRequest).toBeDefined();
    expect(demoRequest?.email).toBe('test@example.com');
  });

  it('enforces rate limiting', async () => {
    const ipAddress = '192.168.1.1';

    // Create 5 requests (rate limit)
    for (let i = 0; i < 5; i++) {
      await createDemoRequest(
        {
          name: 'Test User',
          email: `test${i}@example.com`,
          company: 'Test Corp',
          teamSize: '11-50',
        },
        ipAddress
      );
    }

    // 6th request should fail
    await expect(
      createDemoRequest(
        {
          name: 'Test User',
          email: 'test6@example.com',
          company: 'Test Corp',
          teamSize: '11-50',
        },
        ipAddress
      )
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

### E2E Tests (Conversion Flows)

Create `app/test/e2e/landing-demo-request.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Page Demo Request', () => {
  test('visitor can submit demo request successfully', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Click "Request Demo" button
    await page.click('text=Request Demo');

    // Verify modal opens
    await expect(page.locator('text=Schedule a Demo')).toBeVisible();

    // Fill form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="company"]', 'Example Corp');
    await page.selectOption('select[name="teamSize"]', '11-50');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(
      page.locator('text=Demo request received')
    ).toBeVisible({ timeout: 5000 });
  });

  test('form validation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Request Demo');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });
});
```

Run E2E tests:
```bash
bun run test:e2e
```

---

## Performance Optimization

### Image Optimization

Use ImageKit for all landing page images:

```typescript
// app/components/OptimizedImage/OptimizedImage.tsx
import { useEffect, useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className 
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    // Generate ImageKit URL with transformations
    const imageKitUrl = `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${src}?tr=w-${width},h-${height},f-auto,q-80`;
    setImageSrc(imageKitUrl);
  }, [src, width, height]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
    />
  );
}
```

### Code Splitting

Split animation code to reduce initial bundle:

```typescript
// app/components/LandingDashboardPreview/LandingDashboardPreview.tsx
import { lazy, Suspense } from 'react';

const DashboardAnimation = lazy(() => import('./DashboardAnimation'));

export function LandingDashboardPreview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardAnimation />
    </Suspense>
  );
}
```

### Performance Monitoring

```bash
# Run Lighthouse audit
bun run lighthouse

# Check bundle size
bun run build --analyze
```

---

## Deployment Checklist

### Pre-Launch

- [ ] Database migration applied to production
- [ ] Seed data loaded (placeholder testimonials, success metrics)
- [ ] Environment variables configured (RESEND_API_KEY, IMAGEKIT_*)
- [ ] Rate limiting tested (5 requests per hour per IP)
- [ ] Email notifications working (Resend configured)
- [ ] Analytics tracking configured
- [ ] Lighthouse performance score 90+ achieved
- [ ] WCAG 2.1 AA accessibility verified (axe, WAVE)
- [ ] Mobile responsiveness tested (375px, 768px, 1200px)
- [ ] Dark/light mode toggle working
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)

### Launch

- [ ] Deploy to production
- [ ] Verify landing page loads correctly
- [ ] Submit test demo request and verify email notification
- [ ] Monitor error logs for first 24 hours
- [ ] Track conversion metrics (trial signups, demo requests)

### Post-Launch

- [ ] Collect 30 days of conversion data for baseline comparison
- [ ] Replace placeholder testimonials with real customer testimonials
- [ ] Add company logos to social proof section (if available)
- [ ] Iterate based on analytics insights
- [ ] A/B test variations (CTA copy, layout, etc.)

---

## Additional Resources

- **Feature Spec**: `/specs/003-landing-page-redesign/spec.md`
- **Research**: `/specs/003-landing-page-redesign/research.md`
- **Data Model**: `/specs/003-landing-page-redesign/data-model.md`
- **API Contracts**: `/specs/003-landing-page-redesign/contracts/openapi.yaml`
- **Constitution**: `/.specify/memory/constitution.md`
- **Design System**: `/docs/DESIGN_SYSTEM.md`

---

**Ready to Implement!** Follow this guide sequentially from database setup through component development and testing. All constitutional principles are satisfied, and design artifacts are complete.
