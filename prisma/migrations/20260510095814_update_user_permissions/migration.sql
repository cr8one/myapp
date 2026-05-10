/*
  Warnings:

  - You are about to drop the column `dev_edit` on the `user_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `dev_view` on the `user_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `parts_edit` on the `user_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `parts_view` on the `user_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `products_edit` on the `user_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `products_view` on the `user_permissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_permissions" DROP COLUMN "dev_edit",
DROP COLUMN "dev_view",
DROP COLUMN "parts_edit",
DROP COLUMN "parts_view",
DROP COLUMN "products_edit",
DROP COLUMN "products_view",
ADD COLUMN     "bpms_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bpms_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dlms_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dlms_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dpp_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dpp_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "eapp_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eapp_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estimate_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estimate_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "masters_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "masters_view" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "report_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "report_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sop_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sop_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "spec_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spec_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "travel_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "travel_view" BOOLEAN NOT NULL DEFAULT true;
