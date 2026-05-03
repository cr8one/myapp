-- AlterTable
ALTER TABLE "seal_supplies" ADD COLUMN     "pdf_exported_at" TIMESTAMP(3),
ADD COLUMN     "sales_department" TEXT,
ADD COLUMN     "sales_person_id" TEXT,
ADD COLUMN     "sales_person_name" TEXT;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
