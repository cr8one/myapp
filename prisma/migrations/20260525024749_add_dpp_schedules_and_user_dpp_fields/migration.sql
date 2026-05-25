-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dpp_member" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "short_name" TEXT;

-- CreateTable
CREATE TABLE "t_dpp_schedules" (
    "id" TEXT NOT NULL,
    "schedule_no" TEXT NOT NULL,
    "hinban" TEXT,
    "hinmei" TEXT,
    "artist_name" TEXT,
    "kosei_stage" TEXT,
    "nouki_date" TIMESTAMP(3),
    "nouki_time" TEXT,
    "progress" TEXT,
    "eigyo_tanto" TEXT,
    "seihan_tanto" TEXT,
    "biko" TEXT,
    "shuukei_daisuu" DECIMAL(10,2),
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_dpp_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_dpp_schedules_schedule_no_key" ON "t_dpp_schedules"("schedule_no");

-- AddForeignKey
ALTER TABLE "t_devices" ADD CONSTRAINT "t_devices_parent_device_id_fkey" FOREIGN KEY ("parent_device_id") REFERENCES "t_devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
