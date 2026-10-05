-- CreateTable
CREATE TABLE "t_tray_irregular_order_steps" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "label" TEXT,
    "approver_user_id" TEXT,
    "approver_name" TEXT,
    "approver_email" TEXT,
    "status" TEXT NOT NULL DEFAULT '未承認',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_tray_irregular_order_steps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_tray_irregular_order_steps" ADD CONSTRAINT "t_tray_irregular_order_steps_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "t_tray_irregular_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
