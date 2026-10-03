-- CreateTable
CREATE TABLE "t_tray_usage_settings" (
    "id" TEXT NOT NULL,
    "submission_month" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "lock_a_flg" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tray_usage_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_tray_usage_settings_submission_month_key" ON "t_tray_usage_settings"("submission_month");
