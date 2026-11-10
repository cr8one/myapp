-- AlterTable
ALTER TABLE "m_est_standard_cells" ADD COLUMN     "is_lump" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "m_est_standard_values" ADD COLUMN     "is_lump" BOOLEAN NOT NULL DEFAULT false;
