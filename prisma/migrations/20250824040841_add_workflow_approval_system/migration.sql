-- CreateEnum
CREATE TYPE "public"."WorkflowTriggerType" AS ENUM ('manual', 'purchase_order_create', 'purchase_order_threshold', 'sales_order_create', 'sales_order_threshold', 'stock_adjustment_create', 'transfer_order_create', 'invoice_create', 'bill_create', 'customer_create', 'supplier_create', 'product_create', 'low_stock_alert', 'high_value_transaction', 'bulk_operation', 'scheduled', 'custom_condition');

-- CreateEnum
CREATE TYPE "public"."WorkflowStepType" AS ENUM ('approval', 'notification', 'data_validation', 'automatic_action', 'conditional_logic', 'parallel_approval', 'sequential_approval', 'escalation', 'integration', 'custom');

-- CreateEnum
CREATE TYPE "public"."WorkflowEntityType" AS ENUM ('purchase_order', 'sales_order', 'stock_adjustment', 'transfer_order', 'invoice', 'bill', 'customer', 'supplier', 'product', 'payment_made', 'payment_received', 'backorder', 'custom');

-- CreateEnum
CREATE TYPE "public"."WorkflowStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'failed', 'timeout', 'escalated');

-- CreateEnum
CREATE TYPE "public"."WorkflowStepStatus" AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'skipped', 'failed', 'timeout', 'escalated');

-- CreateEnum
CREATE TYPE "public"."WorkflowDecision" AS ENUM ('approved', 'rejected', 'escalated', 'delegated', 'more_info_required');

-- CreateEnum
CREATE TYPE "public"."ApprovalAssigneeType" AS ENUM ('user', 'role', 'creator', 'manager', 'department_head', 'custom_logic');

-- CreateEnum
CREATE TYPE "public"."ApprovalEntityType" AS ENUM ('purchase_order', 'sales_order', 'stock_adjustment', 'transfer_order', 'invoice', 'bill', 'customer', 'supplier', 'product', 'payment_made', 'payment_received', 'backorder', 'budget_change', 'price_change', 'discount_approval', 'refund_request', 'return_authorization', 'custom');

-- CreateEnum
CREATE TYPE "public"."ApprovalRequestType" AS ENUM ('create', 'update', 'delete', 'approve', 'reject', 'threshold_breach', 'exception_handling', 'custom');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'escalated', 'expired', 'cancelled', 'more_info_required');

-- CreateEnum
CREATE TYPE "public"."ApprovalPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical', 'Urgent');

-- CreateEnum
CREATE TYPE "public"."ApprovalDecision" AS ENUM ('approved', 'rejected', 'escalated', 'delegated', 'more_info_required', 'conditional_approval');

-- CreateTable
CREATE TABLE "public"."WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "public"."WorkflowTriggerType" NOT NULL,
    "triggerConditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowTemplateId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stepType" "public"."WorkflowStepType" NOT NULL,
    "assigneeType" "public"."ApprovalAssigneeType" NOT NULL,
    "assigneeRoleId" TEXT,
    "assigneeUserId" TEXT,
    "conditions" JSONB,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "timeoutHours" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowParallel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowInstance" (
    "id" TEXT NOT NULL,
    "workflowTemplateId" TEXT NOT NULL,
    "entityType" "public"."WorkflowEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "public"."WorkflowStatus" NOT NULL,
    "currentStepNumber" INTEGER,
    "triggeredBy" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowStepExecution" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "workflowStepId" TEXT NOT NULL,
    "status" "public"."WorkflowStepStatus" NOT NULL,
    "assignedTo" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeoutAt" TIMESTAMP(3),
    "notes" TEXT,
    "decision" "public"."WorkflowDecision",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStepExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalRequest" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT,
    "entityType" "public"."ApprovalEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "requestType" "public"."ApprovalRequestType" NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL,
    "priority" "public"."ApprovalPriority" NOT NULL DEFAULT 'Medium',
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "assignedRole" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "conditions" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "decision" "public"."ApprovalDecision",
    "decisionReason" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalComment" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowTemplate_companyId_isActive_idx" ON "public"."WorkflowTemplate"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowTemplateId_stepNumber_idx" ON "public"."WorkflowStep"("workflowTemplateId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_workflowTemplateId_stepNumber_key" ON "public"."WorkflowStep"("workflowTemplateId", "stepNumber");

-- CreateIndex
CREATE INDEX "WorkflowInstance_entityType_entityId_idx" ON "public"."WorkflowInstance"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_status_startedAt_idx" ON "public"."WorkflowInstance"("status", "startedAt");

-- CreateIndex
CREATE INDEX "WorkflowStepExecution_workflowInstanceId_startedAt_idx" ON "public"."WorkflowStepExecution"("workflowInstanceId", "startedAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_assignedTo_idx" ON "public"."ApprovalRequest"("status", "assignedTo");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityType_entityId_idx" ON "public"."ApprovalRequest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_companyId_requestedAt_idx" ON "public"."ApprovalRequest"("companyId", "requestedAt");

-- CreateIndex
CREATE INDEX "ApprovalComment_approvalRequestId_createdAt_idx" ON "public"."ApprovalComment"("approvalRequestId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "public"."WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStep" ADD CONSTRAINT "WorkflowStep_assigneeRoleId_fkey" FOREIGN KEY ("assigneeRoleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStep" ADD CONSTRAINT "WorkflowStep_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "public"."WorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStepExecution" ADD CONSTRAINT "WorkflowStepExecution_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "public"."WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStepExecution" ADD CONSTRAINT "WorkflowStepExecution_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "public"."WorkflowStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStepExecution" ADD CONSTRAINT "WorkflowStepExecution_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "public"."WorkflowInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_assignedRole_fkey" FOREIGN KEY ("assignedRole") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalComment" ADD CONSTRAINT "ApprovalComment_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "public"."ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalComment" ADD CONSTRAINT "ApprovalComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
