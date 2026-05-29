/*
  Warnings:

  - You are about to drop the `dlms_condition_masters` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "dlms_condition_masters";

-- CreateTable
CREATE TABLE "m_dlms_type_conditions" (
    "id" SERIAL NOT NULL,
    "genre" TEXT,
    "spec" TEXT,
    "hinmoku" TEXT,
    "tag1" TEXT,
    "tag2" TEXT,
    "genre_sort" INTEGER NOT NULL DEFAULT 0,
    "spec_sort" INTEGER NOT NULL DEFAULT 0,
    "hinmoku_sort" INTEGER NOT NULL DEFAULT 0,
    "tag1_sort" INTEGER NOT NULL DEFAULT 0,
    "tag2_sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_dlms_type_conditions_pkey" PRIMARY KEY ("id")
);
