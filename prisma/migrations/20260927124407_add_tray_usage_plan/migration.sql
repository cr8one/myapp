-- CreateTable
CREATE TABLE "t_tray_usage_plans" (
    "id" TEXT NOT NULL,
    "submission_month" TEXT NOT NULL,
    "usage_month" TEXT NOT NULL,
    "rendo_tray_cd" TEXT NOT NULL,
    "usage_dept" TEXT,
    "usage_person_id" TEXT,
    "usage_person_name" TEXT,
    "planned_qty" INTEGER NOT NULL,
    "item_name" TEXT,
    "lock_flg" BOOLEAN NOT NULL DEFAULT false,
    "approved_flg" BOOLEAN NOT NULL DEFAULT false,
    "irregular_order_flg" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tray_usage_plans_pkey" PRIMARY KEY ("id")
);
