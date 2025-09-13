-- AlterTable
ALTER TABLE "public"."ApprovalRequest" ADD COLUMN     "stepExecutionId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_stepExecutionId_fkey" FOREIGN KEY ("stepExecutionId") REFERENCES "public"."WorkflowStepExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
