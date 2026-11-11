/*
  Warnings:

  - You are about to drop the column `accessories` on the `t_pc_takeout_requests` table. All the data in the column will be lost.
  - You are about to drop the column `software` on the `t_pc_takeout_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_pc_takeout_requests" DROP COLUMN "accessories",
DROP COLUMN "software";
