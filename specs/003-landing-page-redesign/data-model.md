# Data Model: Landing Page Redesign

**Feature**: Landing Page Redesign for Maximum Conversion  
**Date**: October 21, 2025  
**Phase**: 1 - Design & Contracts

## Overview

This document defines the database schema for landing page entities using Prisma ORM. The schema supports dynamic content management (testimonials, success metrics), demo request tracking with email notifications, and landing page configuration.

---

## Entity Relationships

```
┌─────────────────────┐
│  LandingPageConfig  │
│  (singleton)        │
└─────────────────────┘
         │
         │ (1:N)
         ▼
┌─────────────────────┐       ┌──────────────────┐
│  SuccessMetric      │       │   Testimonial    │
│  (multiple)         │       │   (multiple)     │
└─────────────────────┘       └──────────────────┘

                ┌──────────────────┐
                │   DemoRequest    │
                │   (many)         │
                └──────────────────┘
```

---

## Entities

### 1. DemoRequest

Stores demo request submissions from landing page visitors. Tracks status and notification delivery for sales follow-up.

**Fields:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | String | Yes | Primary key, CUID | Unique identifier |
| `name` | String | Yes | Max 100 chars | Visitor full name |
| `email` | String | Yes | Valid email format | Contact email |
| `company` | String | Yes | Max 100 chars | Company name |
| `teamSize` | String | Yes | Enum: `1-10`, `11-50`, `51-200`, `200+` | Team size category |
| `preferredDemoTime` | DateTime | No | Future date | Preferred demo time |
| `message` | String | No | Max 1000 chars | Optional message/notes |
| `status` | String | Yes | Enum: `new`, `contacted`, `scheduled`, `completed` | Request status |
| `notificationSent` | Boolean | Yes | Default: false | Email notification delivery tracking |
| `ipAddress` | String | No | Max 45 chars | IP address for rate limiting |
| `userAgent` | String | No | Max 255 chars | Browser user agent |
| `createdAt` | DateTime | Yes | Auto-generated | Submission timestamp |
| `updatedAt` | DateTime | Yes | Auto-updated | Last modification timestamp |

**Indexes:**
- `email` (for lookup by email)
- `status` (for filtering by status)
- `createdAt` (for sorting by date)
- Composite: `(ipAddress, createdAt)` (for rate limiting queries)

**Validation Rules:**
- Email must be valid format (checked via Zod schema)
- `preferredDemoTime` must be in the future if provided
- `message` sanitized to prevent XSS
- Rate limit: 5 requests per IP address per hour

**Business Logic:**
- New requests default to `status: "new"`
- Email notification sent immediately after creation
- `notificationSent` set to `true` after successful email delivery
- Sales team updates status to `contacted` → `scheduled` → `completed`

---

### 2. Testimonial

Stores customer testimonials with photos for social proof section. Supports both real testimonials and placeholder "Early Adopter" fallbacks.

**Fields:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | String | Yes | Primary key, CUID | Unique identifier |
| `customerName` | String | Yes | Max 100 chars | Customer full name |
| `role` | String | Yes | Max 100 chars | Job title (e.g., "Operations Manager") |
| `company` | String | Yes | Max 100 chars | Company name |
| `photoUrl` | String | No | Valid URL | ImageKit URL for customer photo |
| `testimonialText` | String | Yes | Max 500 chars | Testimonial content |
| `starRating` | Int | Yes | Min: 1, Max: 5 | Star rating (1-5) |
| `isPlaceholder` | Boolean | Yes | Default: false | True for "Early Adopter" placeholders |
| `displayOrder` | Int | Yes | Min: 0 | Sort order on landing page |
| `isActive` | Boolean | Yes | Default: true | Show/hide testimonial |
| `createdAt` | DateTime | Yes | Auto-generated | Record creation timestamp |
| `updatedAt` | DateTime | Yes | Auto-updated | Last modification timestamp |

**Indexes:**
- `displayOrder` (for sorting)
- `isActive` (for filtering active testimonials)
- Composite: `(isActive, displayOrder)` (for efficient active testimonial queries)

**Validation Rules:**
- `starRating` must be between 1 and 5
- `testimonialText` length: 50-500 characters
- `photoUrl` validated as proper URL format
- If `isPlaceholder = true`, photo shows generic avatar

**Business Logic:**
- Fetch active testimonials sorted by `displayOrder`
- If no real testimonials (`isPlaceholder = false`), show placeholder testimonials
- Placeholder testimonials display "(Early Adopter)" instead of company name
- Admin UI (future) allows CRUD operations on testimonials

---

### 3. SuccessMetric

Stores quantitative success metrics displayed in social proof section (e.g., "15,000+ Products Managed").

**Fields:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | String | Yes | Primary key, CUID | Unique identifier |
| `label` | String | Yes | Max 100 chars | Metric label (e.g., "Products Managed") |
| `value` | String | Yes | Max 50 chars | Metric value (e.g., "15,000+") |
| `icon` | String | Yes | Max 50 chars | Icon identifier (e.g., "box", "clock", "chart") |
| `displayOrder` | Int | Yes | Min: 0 | Sort order on landing page |
| `isActive` | Boolean | Yes | Default: true | Show/hide metric |
| `createdAt` | DateTime | Yes | Auto-generated | Record creation timestamp |
| `updatedAt` | DateTime | Yes | Auto-updated | Last modification timestamp |

**Indexes:**
- `displayOrder` (for sorting)
- `isActive` (for filtering active metrics)
- Composite: `(isActive, displayOrder)` (for efficient active metric queries)

**Validation Rules:**
- `label` and `value` required, non-empty strings
- `icon` must match available icon set (validated in service layer)

**Business Logic:**
- Fetch active metrics sorted by `displayOrder`
- Typically display 3-5 metrics on landing page
- Admin UI (future) allows CRUD operations on metrics

---

### 4. LandingPageConfig

Singleton configuration for landing page settings. Controls theme, metadata, and feature flags.

**Fields:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | String | Yes | Primary key, CUID | Unique identifier (singleton) |
| `metaTitle` | String | Yes | Max 60 chars | SEO page title |
| `metaDescription` | String | Yes | Max 160 chars | SEO meta description |
| `metaKeywords` | String | No | Max 255 chars | SEO keywords (comma-separated) |
| `defaultTheme` | String | Yes | Enum: `dark`, `light` | Default theme |
| `showCompanyLogos` | Boolean | Yes | Default: false | Show/hide company logos section |
| `enableDemoRequests` | Boolean | Yes | Default: true | Enable demo request modal |
| `enableTrialSignup` | Boolean | Yes | Default: true | Enable trial signup CTAs |
| `demoRequestRateLimit` | Int | Yes | Min: 1, Default: 5 | Demo requests per IP per hour |
| `createdAt` | DateTime | Yes | Auto-generated | Record creation timestamp |
| `updatedAt` | DateTime | Yes | Auto-updated | Last modification timestamp |

**Indexes:**
- None (singleton, single record)

**Validation Rules:**
- Only one LandingPageConfig record allowed (enforced in service layer)
- `metaTitle` optimized for SEO (50-60 chars)
- `metaDescription` optimized for SEO (150-160 chars)

**Business Logic:**
- Singleton pattern: upsert on update, fetch single record
- `showCompanyLogos = false` hides company logos section entirely (per spec)
- `enableDemoRequests = false` disables demo request modal (emergency off-switch)
- Rate limit configurable via admin UI (future)

---

## Prisma Schema

```prisma
// app/prisma/schema.prisma (additions)

model DemoRequest {
  id                 String   @id @default(cuid())
  name               String   @db.VarChar(100)
  email              String   @db.VarChar(255)
  company            String   @db.VarChar(100)
  teamSize           String   // "1-10" | "11-50" | "51-200" | "200+"
  preferredDemoTime  DateTime?
  message            String?  @db.VarChar(1000)
  status             String   @default("new") // "new" | "contacted" | "scheduled" | "completed"
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
  starRating       Int      @default(5) // 1-5
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
  defaultTheme          String   @default("dark") // "dark" | "light"
  showCompanyLogos      Boolean  @default(false)
  enableDemoRequests    Boolean  @default(true)
  enableTrialSignup     Boolean  @default(true)
  demoRequestRateLimit  Int      @default(5)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("landing_page_config")
}
```

---

## TypeScript Types

```typescript
// app/lib/landing/types.ts

export type TeamSize = '1-10' | '11-50' | '51-200' | '200+';

export type DemoRequestStatus = 'new' | 'contacted' | 'scheduled' | 'completed';

export type LandingTheme = 'dark' | 'light';

export interface DemoRequestInput {
  name: string;
  email: string;
  company: string;
  teamSize: TeamSize;
  preferredDemoTime?: Date;
  message?: string;
}

export interface DemoRequest extends DemoRequestInput {
  id: string;
  status: DemoRequestStatus;
  notificationSent: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial {
  id: string;
  customerName: string;
  role: string;
  company: string;
  photoUrl?: string;
  testimonialText: string;
  starRating: number;
  isPlaceholder: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuccessMetric {
  id: string;
  label: string;
  value: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPageConfig {
  id: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string;
  defaultTheme: LandingTheme;
  showCompanyLogos: boolean;
  enableDemoRequests: boolean;
  enableTrialSignup: boolean;
  demoRequestRateLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Client-side display types (optimized for rendering)
export interface TestimonialDisplay {
  customerName: string;
  role: string;
  company: string;
  photoUrl?: string;
  testimonialText: string;
  starRating: number;
}

export interface SuccessMetricDisplay {
  label: string;
  value: string;
  icon: string;
}
```

---

## Seed Data

```typescript
// prisma/seeds/landing-page-seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLandingPage() {
  console.log('Seeding landing page data...');

  // Landing Page Config (singleton)
  await prisma.landingPageConfig.upsert({
    where: { id: 'landing-config-singleton' },
    update: {},
    create: {
      id: 'landing-config-singleton',
      metaTitle: 'Triven - AI-Powered Inventory Management Platform',
      metaDescription: 'Transform inventory chaos into intelligent business growth with Triven\'s AI-powered platform. 14-day free trial, no credit card required.',
      metaKeywords: 'inventory management, AI inventory, stock tracking, warehouse management, business growth',
      defaultTheme: 'dark',
      showCompanyLogos: false, // Hide until real customer logos available
      enableDemoRequests: true,
      enableTrialSignup: true,
      demoRequestRateLimit: 5,
    },
  });

  // Success Metrics
  const successMetrics = [
    { label: 'Products Managed', value: '15,000+', icon: 'box', displayOrder: 1 },
    { label: 'Auto-Categorization Accuracy', value: '98%', icon: 'chart', displayOrder: 2 },
    { label: 'Hours Saved Monthly', value: '2,400+', icon: 'clock', displayOrder: 3 },
    { label: 'Business Growth Average', value: '34%', icon: 'trending-up', displayOrder: 4 },
  ];

  for (const metric of successMetrics) {
    await prisma.successMetric.upsert({
      where: { id: `metric-${metric.displayOrder}` },
      update: {},
      create: {
        id: `metric-${metric.displayOrder}`,
        ...metric,
        isActive: true,
      },
    });
  }

  // Placeholder Testimonials (until real customer testimonials available)
  const placeholderTestimonials = [
    {
      customerName: 'Sarah Johnson',
      role: 'Operations Manager',
      company: 'Early Adopter',
      testimonialText: 'Triven transformed our inventory management. We reduced stock-outs by 40% and saved 15 hours per week on manual tracking.',
      starRating: 5,
      isPlaceholder: true,
      displayOrder: 1,
    },
    {
      customerName: 'Michael Chen',
      role: 'Warehouse Director',
      company: 'Early Adopter',
      testimonialText: 'The AI-powered categorization is incredible. What used to take days now happens automatically with 98% accuracy.',
      starRating: 5,
      isPlaceholder: true,
      displayOrder: 2,
    },
    {
      customerName: 'Emily Rodriguez',
      role: 'Business Owner',
      company: 'Early Adopter',
      testimonialText: 'Real-time visibility across all our locations has been a game-changer. We make better decisions faster.',
      starRating: 5,
      isPlaceholder: true,
      displayOrder: 3,
    },
  ];

  for (const testimonial of placeholderTestimonials) {
    await prisma.testimonial.upsert({
      where: { id: `testimonial-${testimonial.displayOrder}` },
      update: {},
      create: {
        id: `testimonial-${testimonial.displayOrder}`,
        ...testimonial,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.customerName)}&background=20FE6B&color=040308&size=200`,
        isActive: true,
      },
    });
  }

  console.log('Landing page seed data created successfully');
}

export default seedLandingPage;
```

---

## Migration Strategy

1. **Create migration**:
   ```bash
   bun run prisma migrate dev --name add_landing_page_models
   ```

2. **Run seed data**:
   ```bash
   bun run prisma db seed
   ```

3. **Verify schema**:
   ```bash
   bun run prisma studio
   ```

---

## Query Examples

### Fetch Active Testimonials
```typescript
const testimonials = await prisma.testimonial.findMany({
  where: { isActive: true },
  orderBy: { displayOrder: 'asc' },
  select: {
    customerName: true,
    role: true,
    company: true,
    photoUrl: true,
    testimonialText: true,
    starRating: true,
    isPlaceholder: true,
  },
});
```

### Create Demo Request
```typescript
const demoRequest = await prisma.demoRequest.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Example Corp',
    teamSize: '11-50',
    preferredDemoTime: new Date('2025-10-25T14:00:00Z'),
    message: 'Interested in learning more about AI features',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
});
```

### Rate Limiting Check
```typescript
const recentRequests = await prisma.demoRequest.count({
  where: {
    ipAddress: req.ip,
    createdAt: {
      gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    },
  },
});

if (recentRequests >= config.demoRequestRateLimit) {
  throw new Error('Rate limit exceeded');
}
```

---

## Next Steps

1. ✅ **Data model defined** with Prisma schema
2. → **Generate API contracts** - OpenAPI spec for demo request endpoint
3. → **Generate quickstart.md** - Developer implementation guide
4. → **Run migration** - Create database tables
5. → **Run seed** - Populate initial data

---

**Phase 1 Design - Data Model Complete**
