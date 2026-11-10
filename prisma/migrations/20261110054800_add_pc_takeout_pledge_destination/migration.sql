-- AlterTable
ALTER TABLE "t_pc_takeout_requests" ADD COLUMN     "destination" TEXT,
ADD COLUMN     "pledge_version" INTEGER,
ADD COLUMN     "pledged_at" TIMESTAMP(3);
