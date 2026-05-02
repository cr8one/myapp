-- AlterTable
ALTER TABLE "seal_supply_companies" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "ssss_issuer_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ssss_outsource_receiver_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ssss_receiver_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ssss_supplier_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "seal_supply_part_masters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seal_supply_part_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seal_supply_part_masters_name_key" ON "seal_supply_part_masters"("name");
