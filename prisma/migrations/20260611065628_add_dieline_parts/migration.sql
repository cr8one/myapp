/*
  Warnings:

  - You are about to drop the column `develop_depth` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `developx` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `developy` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `inner_depth` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `inner_height` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `inner_width` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `sizex` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `sizey` on the `dlms_dieline_parents` table. All the data in the column will be lost.
  - You are about to drop the column `widthy` on the `dlms_dieline_parents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dlms_dieline_parents" DROP COLUMN "develop_depth",
DROP COLUMN "developx",
DROP COLUMN "developy",
DROP COLUMN "inner_depth",
DROP COLUMN "inner_height",
DROP COLUMN "inner_width",
DROP COLUMN "sizex",
DROP COLUMN "sizey",
DROP COLUMN "widthy";

-- CreateTable
CREATE TABLE "dlms_dieline_parts" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "part_name" TEXT,
    "developy" DOUBLE PRECISION,
    "developx" DOUBLE PRECISION,
    "develop_depth" DOUBLE PRECISION,
    "sizey" DOUBLE PRECISION,
    "sizex" DOUBLE PRECISION,
    "widthy" DOUBLE PRECISION,
    "inner_height" DOUBLE PRECISION,
    "inner_width" DOUBLE PRECISION,
    "inner_depth" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "dtindt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtupdt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_dieline_parts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dlms_dieline_parts" ADD CONSTRAINT "dlms_dieline_parts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "dlms_dieline_parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
