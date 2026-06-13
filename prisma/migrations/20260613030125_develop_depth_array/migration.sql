/*
  Warnings:

  - You are about to drop the column `develop_depth` on the `dlms_dieline_parts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dlms_dieline_parts" DROP COLUMN "develop_depth",
ADD COLUMN     "develop_depths" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
