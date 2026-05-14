/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `m_device_models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "m_device_models" DROP COLUMN "vendor_id",
ADD COLUMN     "vendor_name" TEXT;
