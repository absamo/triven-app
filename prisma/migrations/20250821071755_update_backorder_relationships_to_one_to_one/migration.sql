/*
  Warnings:

  - A unique constraint covering the columns `[salesOrderId]` on the table `Backorder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[salesOrderItemId]` on the table `BackorderItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Backorder_salesOrderId_key" ON "public"."Backorder"("salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "BackorderItem_salesOrderItemId_key" ON "public"."BackorderItem"("salesOrderItemId");
