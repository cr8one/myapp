-- AlterTable
ALTER TABLE "t_tray_usage_plans" ADD COLUMN     "irregular_order_id" TEXT;

-- CreateTable
CREATE TABLE "t_tray_irregular_orders" (
    "id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '作成中',
    "request_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "requester_id" TEXT,
    "requester_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tray_irregular_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_tray_irregular_orders_order_no_key" ON "t_tray_irregular_orders"("order_no");

-- AddForeignKey
ALTER TABLE "t_tray_usage_plans" ADD CONSTRAINT "t_tray_usage_plans_irregular_order_id_fkey" FOREIGN KEY ("irregular_order_id") REFERENCES "t_tray_irregular_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
