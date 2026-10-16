-- CreateTable
CREATE TABLE "t_tray_arrival_plans" (
    "id" TEXT NOT NULL,
    "tray_id" TEXT NOT NULL,
    "arrival_month" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tray_arrival_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_tray_inhouse_stocks" (
    "id" TEXT NOT NULL,
    "tray_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tray_inhouse_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_tray_arrival_plans_tray_id_arrival_month_key" ON "t_tray_arrival_plans"("tray_id", "arrival_month");

-- CreateIndex
CREATE UNIQUE INDEX "t_tray_inhouse_stocks_tray_id_key" ON "t_tray_inhouse_stocks"("tray_id");
