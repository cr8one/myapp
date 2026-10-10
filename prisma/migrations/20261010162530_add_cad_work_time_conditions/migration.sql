-- AlterTable
ALTER TABLE "t_cad_work_times" ADD COLUMN     "extra_parts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "has_mishin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needs_prep" BOOLEAN NOT NULL DEFAULT false;
