-- CreateTable
CREATE TABLE "demo_requests" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "company" VARCHAR(100) NOT NULL,
    "teamSize" TEXT NOT NULL,
    "preferredDemoTime" TIMESTAMP(3),
    "message" VARCHAR(1000),
    "status" TEXT NOT NULL DEFAULT 'new',
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "customerName" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "company" VARCHAR(100) NOT NULL,
    "photoUrl" VARCHAR(500),
    "testimonialText" VARCHAR(500) NOT NULL,
    "starRating" INTEGER NOT NULL DEFAULT 5,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_metrics" (
    "id" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "value" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "success_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_config" (
    "id" TEXT NOT NULL,
    "metaTitle" VARCHAR(60) NOT NULL,
    "metaDescription" VARCHAR(160) NOT NULL,
    "metaKeywords" VARCHAR(255),
    "defaultTheme" TEXT NOT NULL DEFAULT 'dark',
    "showCompanyLogos" BOOLEAN NOT NULL DEFAULT false,
    "enableDemoRequests" BOOLEAN NOT NULL DEFAULT true,
    "enableTrialSignup" BOOLEAN NOT NULL DEFAULT true,
    "demoRequestRateLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_requests_email_idx" ON "demo_requests"("email");

-- CreateIndex
CREATE INDEX "demo_requests_status_idx" ON "demo_requests"("status");

-- CreateIndex
CREATE INDEX "demo_requests_createdAt_idx" ON "demo_requests"("createdAt");

-- CreateIndex
CREATE INDEX "demo_requests_ipAddress_createdAt_idx" ON "demo_requests"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "testimonials_displayOrder_idx" ON "testimonials"("displayOrder");

-- CreateIndex
CREATE INDEX "testimonials_isActive_idx" ON "testimonials"("isActive");

-- CreateIndex
CREATE INDEX "testimonials_isActive_displayOrder_idx" ON "testimonials"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "success_metrics_displayOrder_idx" ON "success_metrics"("displayOrder");

-- CreateIndex
CREATE INDEX "success_metrics_isActive_idx" ON "success_metrics"("isActive");

-- CreateIndex
CREATE INDEX "success_metrics_isActive_displayOrder_idx" ON "success_metrics"("isActive", "displayOrder");
