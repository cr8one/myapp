/*
  Warnings:

  - You are about to drop the column `device_type_id` on the `m_device_models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "m_device_models" DROP COLUMN "device_type_id",
ADD COLUMN     "device_type" TEXT;
