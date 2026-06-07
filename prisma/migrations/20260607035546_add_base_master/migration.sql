-- AlterTable
ALTER TABLE "m_departments" ADD COLUMN     "base_id" TEXT;

-- AlterTable
ALTER TABLE "m_groups" ADD COLUMN     "base_id" TEXT;

-- CreateTable
CREATE TABLE "m_bases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_bases_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "m_departments" ADD CONSTRAINT "m_departments_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "m_bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_groups" ADD CONSTRAINT "m_groups_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "m_bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
