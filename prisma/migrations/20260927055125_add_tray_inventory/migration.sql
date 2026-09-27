-- CreateTable
CREATE TABLE "t_tray_inventories" (
    "id" TEXT NOT NULL,
    "inventory_month" TEXT NOT NULL,
    "rendo_tray_cd" TEXT NOT NULL,
    "remaining_qty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tray_inventories_pkey" PRIMARY KEY ("id")
);
