-- CreateEnum
CREATE TYPE "public"."RecommendationUrgency" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "public"."AnomalyType" AS ENUM ('stock_discrepancy', 'demand_spike', 'supplier_delay', 'quality_issue', 'unusual_sales_pattern', 'inventory_shrinkage', 'price_anomaly', 'seasonal_variance');

-- CreateEnum
CREATE TYPE "public"."AnomalySeverity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "public"."InsightType" AS ENUM ('daily_summary', 'weekly_report', 'monthly_analysis', 'inventory_optimization', 'sales_trend', 'supplier_performance', 'customer_behavior', 'cost_analysis', 'profitability_insight', 'demand_prediction');

-- CreateTable
CREATE TABLE "public"."DemandForecast" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedDemand" INTEGER NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "actualDemand" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutoReorderRule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minStockLevel" INTEGER NOT NULL,
    "maxStockLevel" INTEGER NOT NULL,
    "supplierLeadTime" INTEGER NOT NULL,
    "safetyStockDays" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoReorderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseOrderRecommendation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "recommendedQty" INTEGER NOT NULL,
    "urgencyLevel" "public"."RecommendationUrgency" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryAnomaly" (
    "id" TEXT NOT NULL,
    "type" "public"."AnomalyType" NOT NULL,
    "severity" "public"."AnomalySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "affectedProducts" TEXT[],
    "recommendedActions" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessInsight" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."InsightType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandForecast_productId_forecastDate_idx" ON "public"."DemandForecast"("productId", "forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "AutoReorderRule_productId_key" ON "public"."AutoReorderRule"("productId");

-- CreateIndex
CREATE INDEX "InventoryAnomaly_companyId_createdAt_idx" ON "public"."InventoryAnomaly"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessInsight_companyId_date_idx" ON "public"."BusinessInsight"("companyId", "date");

-- AddForeignKey
ALTER TABLE "public"."DemandForecast" ADD CONSTRAINT "DemandForecast_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutoReorderRule" ADD CONSTRAINT "AutoReorderRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderRecommendation" ADD CONSTRAINT "PurchaseOrderRecommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrderRecommendation" ADD CONSTRAINT "PurchaseOrderRecommendation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryAnomaly" ADD CONSTRAINT "InventoryAnomaly_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessInsight" ADD CONSTRAINT "BusinessInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
