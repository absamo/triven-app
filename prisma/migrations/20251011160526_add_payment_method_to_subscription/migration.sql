-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "expMonth" INTEGER,
ADD COLUMN     "expYear" INTEGER,
ADD COLUMN     "last4" TEXT,
ADD COLUMN     "paymentMethodId" TEXT;
