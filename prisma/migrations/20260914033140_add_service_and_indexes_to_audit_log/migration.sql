-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "service" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_service_idx" ON "audit_logs"("service");

-- CreateIndex
CREATE INDEX "audit_logs_targetModel_idx" ON "audit_logs"("targetModel");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
