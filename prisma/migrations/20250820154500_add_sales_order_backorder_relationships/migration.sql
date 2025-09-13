-- Add sales order relationships to backorders
-- This migration links backorders to their originating sales orders

-- Add salesOrderId to Backorder table
ALTER TABLE "Backorder" ADD COLUMN "salesOrderId" TEXT;

-- Add salesOrderItemId to BackorderItem table  
ALTER TABLE "BackorderItem" ADD COLUMN "salesOrderItemId" TEXT;

-- Add foreign key constraints
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BackorderItem" ADD CONSTRAINT "BackorderItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
