-- AlterTable
ALTER TABLE "t_acct_meal_advances" ADD COLUMN     "advance_request_id" TEXT;

-- CreateIndex
CREATE INDEX "t_acct_meal_advances_advance_request_id_idx" ON "t_acct_meal_advances"("advance_request_id");

-- AddForeignKey
ALTER TABLE "t_acct_meal_advances" ADD CONSTRAINT "t_acct_meal_advances_advance_request_id_fkey" FOREIGN KEY ("advance_request_id") REFERENCES "t_acct_advance_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
