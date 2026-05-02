/*
  Warnings:

  - You are about to drop the `seal_supply_staffs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "seal_supplies" DROP CONSTRAINT "seal_supplies_issuer_id_fkey";

-- DropForeignKey
ALTER TABLE "seal_supplies" DROP CONSTRAINT "seal_supplies_outsource_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "seal_supplies" DROP CONSTRAINT "seal_supplies_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "seal_supplies" DROP CONSTRAINT "seal_supplies_supplier_id_fkey";

-- AlterTable
ALTER TABLE "seal_supplies" ALTER COLUMN "issuer_id" SET DATA TYPE TEXT,
ALTER COLUMN "supplier_id" SET DATA TYPE TEXT,
ALTER COLUMN "receiver_id" SET DATA TYPE TEXT,
ALTER COLUMN "outsource_receiver_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "ssss_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssss_is_issuer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssss_is_outsource_receiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssss_is_receiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssss_is_supplier" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssss_view" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "seal_supply_staffs";

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_outsource_receiver_id_fkey" FOREIGN KEY ("outsource_receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
