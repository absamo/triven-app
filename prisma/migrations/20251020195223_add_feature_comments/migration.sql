-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('StockoutPredicted', 'LowStockWarning', 'DeadStockAlert', 'PriceAnomalyDetected', 'SupplierDelayRisk', 'DemandSpikeExpected', 'StockImbalance', 'HighValueBackorder', 'TurnoverRateDrop', 'ExcessInventory');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('Active', 'Acknowledged', 'InProgress', 'Resolved', 'Dismissed', 'Expired');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('StockoutPrevention', 'PriceOptimization', 'CrossSell', 'SeasonalDemand', 'LocationTransfer', 'BulkPurchaseDiscount');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('Active', 'Accepted', 'Declined', 'Expired', 'Completed');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('TODO', 'PLANNED', 'IN_PROGRESS', 'SHIPPED');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "scheduledCancelAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InventoryHealthScore" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agencyId" TEXT,
    "siteId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "stockLevelAdequacy" DOUBLE PRECISION NOT NULL,
    "turnoverRate" DOUBLE PRECISION NOT NULL,
    "agingInventory" DOUBLE PRECISION NOT NULL,
    "backorderRate" DOUBLE PRECISION NOT NULL,
    "supplierReliability" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartAlert" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agencyId" TEXT,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "financialImpact" DOUBLE PRECISION NOT NULL,
    "affectedProducts" TEXT[],
    "suggestedAction" TEXT NOT NULL,
    "quickAction" JSONB,
    "daysUntilCritical" INTEGER,
    "aiConfidence" DOUBLE PRECISION,
    "status" "AlertStatus" NOT NULL DEFAULT 'Active',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "dismissedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "SmartAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueOpportunity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agencyId" TEXT,
    "type" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedRevenue" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "products" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'Active',
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "RevenueOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeatureStatus" NOT NULL DEFAULT 'TODO',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_votes" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_audit_logs" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_comments" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryHealthScore_companyId_date_idx" ON "InventoryHealthScore"("companyId", "date");

-- CreateIndex
CREATE INDEX "InventoryHealthScore_agencyId_date_idx" ON "InventoryHealthScore"("agencyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryHealthScore_companyId_agencyId_siteId_date_key" ON "InventoryHealthScore"("companyId", "agencyId", "siteId", "date");

-- CreateIndex
CREATE INDEX "SmartAlert_companyId_status_createdAt_idx" ON "SmartAlert"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SmartAlert_severity_status_idx" ON "SmartAlert"("severity", "status");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_companyId_status_estimatedRevenue_idx" ON "RevenueOpportunity"("companyId", "status", "estimatedRevenue");

-- CreateIndex
CREATE INDEX "RevenueOpportunity_status_createdAt_idx" ON "RevenueOpportunity"("status", "createdAt");

-- CreateIndex
CREATE INDEX "feature_requests_status_voteCount_createdAt_idx" ON "feature_requests"("status", "voteCount" DESC, "createdAt");

-- CreateIndex
CREATE INDEX "feature_requests_createdById_idx" ON "feature_requests"("createdById");

-- CreateIndex
CREATE INDEX "feature_votes_userId_idx" ON "feature_votes"("userId");

-- CreateIndex
CREATE INDEX "feature_votes_featureId_idx" ON "feature_votes"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_votes_featureId_userId_key" ON "feature_votes"("featureId", "userId");

-- CreateIndex
CREATE INDEX "feature_audit_logs_featureId_timestamp_idx" ON "feature_audit_logs"("featureId", "timestamp");

-- CreateIndex
CREATE INDEX "feature_audit_logs_userId_idx" ON "feature_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "feature_comments_featureId_createdAt_idx" ON "feature_comments"("featureId", "createdAt");

-- CreateIndex
CREATE INDEX "feature_comments_userId_idx" ON "feature_comments"("userId");

-- AddForeignKey
ALTER TABLE "InventoryHealthScore" ADD CONSTRAINT "InventoryHealthScore_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartAlert" ADD CONSTRAINT "SmartAlert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueOpportunity" ADD CONSTRAINT "RevenueOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_audit_logs" ADD CONSTRAINT "feature_audit_logs_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_audit_logs" ADD CONSTRAINT "feature_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_comments" ADD CONSTRAINT "feature_comments_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_comments" ADD CONSTRAINT "feature_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
