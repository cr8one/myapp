/*
  Warnings:

  - You are about to drop the column `travel_edit` on the `user_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `travel_view` on the `user_permissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_permissions" DROP COLUMN "travel_edit",
DROP COLUMN "travel_view";
