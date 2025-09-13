-- CreateEnum
CREATE TYPE "BackorderStatus" AS ENUM ('Pending', 'Partial', 'Fulfilled', 'Cancelled');

-- CreateEnum
CREATE TYPE "BackorderItemStatus" AS ENUM ('Pending', 'PartiallyFulfilled', 'Fulfilled', 'Cancelled');

-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "primary" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Backorder" (
    "id" TEXT NOT NULL,
    "backorderReference" TEXT NOT NULL,
    "backorderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "BackorderStatus" NOT NULL,
    "originalOrderDate" TIMESTAMP(3) NOT NULL,
    "expectedFulfillDate" TIMESTAMP(3),
    "agencyId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "paymentTerms" "PaymentTerms" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Backorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackorderItem" (
    "id" TEXT NOT NULL,
    "backorderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderedQuantity" INTEGER NOT NULL,
    "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0,
    "remainingQuantity" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BackorderItemStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "BackorderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackorderItem" ADD CONSTRAINT "BackorderItem_backorderId_fkey" FOREIGN KEY ("backorderId") REFERENCES "Backorder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackorderItem" ADD CONSTRAINT "BackorderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
