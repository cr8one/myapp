-- AlterTable
ALTER TABLE "m_trays" ADD COLUMN     "optimal_stock" INTEGER;

-- AlterTable
ALTER TABLE "t_tray_usage_plans" ADD COLUMN     "temp_lock_flg" BOOLEAN NOT NULL DEFAULT false;
