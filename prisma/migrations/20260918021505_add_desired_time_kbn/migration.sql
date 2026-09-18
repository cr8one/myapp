-- AlterTable
ALTER TABLE "t_cad_requests" ADD COLUMN     "desired_time_kbn" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "t_dxf_requests" ADD COLUMN     "desired_time_kbn" INTEGER NOT NULL DEFAULT 0;
