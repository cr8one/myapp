-- AlterTable
ALTER TABLE "User" ADD COLUMN     "main_base_id" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_main_base_id_fkey" FOREIGN KEY ("main_base_id") REFERENCES "m_bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
