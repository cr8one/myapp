-- CreateTable
CREATE TABLE "t_shelf_stocks" (
    "id" TEXT NOT NULL,
    "shelf_no" TEXT NOT NULL,
    "shelf_rack" TEXT,
    "shelf_row" TEXT,
    "shelf_col" TEXT,
    "shelf_status" TEXT,
    "item_code" TEXT,
    "item_name" TEXT,
    "lot_no" TEXT,
    "remarks" TEXT,
    "category" TEXT,
    "stocked_at" TIMESTAMP(3),
    "stock_count" INTEGER,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_shelf_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_shelf_stocks_shelf_no_idx" ON "t_shelf_stocks"("shelf_no");

-- CreateIndex
CREATE INDEX "t_shelf_stocks_item_code_idx" ON "t_shelf_stocks"("item_code");
