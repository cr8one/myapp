-- AlterTable
ALTER TABLE "t_cad_requests" ADD COLUMN     "source_request_id" TEXT,
ADD COLUMN     "source_type" TEXT;

-- CreateIndex
CREATE INDEX "t_cad_requests_source_request_id_idx" ON "t_cad_requests"("source_request_id");

-- AddForeignKey
ALTER TABLE "t_cad_requests" ADD CONSTRAINT "t_cad_requests_source_request_id_fkey" FOREIGN KEY ("source_request_id") REFERENCES "t_cad_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
