-- AlterTable
ALTER TABLE "t_devices" ADD COLUMN     "procurement_type" TEXT;

-- CreateTable
CREATE TABLE "t_device_leases" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "lease_company" TEXT,
    "lease_start" TIMESTAMP(3),
    "lease_end" TIMESTAMP(3),
    "contract_no" TEXT,
    "lease_item_no" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_device_leases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_device_leases_device_id_key" ON "t_device_leases"("device_id");

-- AddForeignKey
ALTER TABLE "t_device_leases" ADD CONSTRAINT "t_device_leases_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "t_devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
