-- AlterTable
ALTER TABLE "t_dxf_requests" ADD COLUMN     "daishi_desired_date" TIMESTAMP(3),
ADD COLUMN     "daishi_desired_time" TEXT,
ADD COLUMN     "daishi_desired_time_kbn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daishi_remarks" TEXT;
