-- AlterTable
ALTER TABLE "t_voucher_correction_requests" ADD COLUMN     "decision_comment" TEXT,
ADD COLUMN     "detail" TEXT;

-- CreateTable
CREATE TABLE "m_voucher_managers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_voucher_managers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_voucher_managers_user_id_role_key" ON "m_voucher_managers"("user_id", "role");

-- AddForeignKey
ALTER TABLE "m_voucher_managers" ADD CONSTRAINT "m_voucher_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
