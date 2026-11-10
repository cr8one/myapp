-- CreateTable
CREATE TABLE "m_est_standards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "remarks" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_est_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_est_sheet_defs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_est_sheet_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_est_sheet_items" (
    "id" TEXT NOT NULL,
    "sheet_def_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_est_sheet_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_est_standard_sheets" (
    "id" TEXT NOT NULL,
    "standard_id" TEXT NOT NULL,
    "sheet_def_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'own',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_est_standard_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_est_standard_values" (
    "id" TEXT NOT NULL,
    "standard_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "value" DECIMAL(14,4),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_est_standard_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_est_standard_tiers" (
    "id" TEXT NOT NULL,
    "standard_id" TEXT NOT NULL,
    "sheet_def_id" TEXT NOT NULL,
    "lot_from" INTEGER NOT NULL,
    "lot_to" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "m_est_standard_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_est_standard_cells" (
    "id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "value" DECIMAL(14,4),

    CONSTRAINT "m_est_standard_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_estimates" (
    "id" TEXT NOT NULL,
    "estimate_no" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "department" TEXT,
    "title" TEXT,
    "product_code" TEXT,
    "content" TEXT,
    "issue_date" DATE NOT NULL,
    "new_old_kind" TEXT NOT NULL DEFAULT '新',
    "standard_id" TEXT NOT NULL,
    "main_qty" INTEGER NOT NULL,
    "sample_qty" INTEGER NOT NULL DEFAULT 0,
    "related_product_codes" TEXT[],
    "memo" TEXT,
    "delivery_to" TEXT,
    "packing" TEXT,
    "remarks" TEXT,
    "options" JSONB,
    "sales_rate_override" DECIMAL(6,4),
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "sales_cost" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "drafter_id" TEXT,
    "drafter_name" TEXT,
    "checker_id" TEXT,
    "checker_name" TEXT,
    "deleted_flg" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_estimate_lines" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "unit" TEXT,
    "qty_calc" DECIMAL(14,4),
    "qty_manual" DECIMAL(14,4),
    "price_calc" DECIMAL(14,4),
    "price_manual" DECIMAL(14,4),
    "amount" INTEGER NOT NULL DEFAULT 0,
    "params" JSONB,
    "source_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_estimate_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_est_standards_name_key" ON "m_est_standards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_sheet_defs_code_key" ON "m_est_sheet_defs"("code");

-- CreateIndex
CREATE INDEX "m_est_sheet_items_sheet_def_id_sort_order_idx" ON "m_est_sheet_items"("sheet_def_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_sheet_items_sheet_def_id_name_key" ON "m_est_sheet_items"("sheet_def_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_standard_sheets_standard_id_sheet_def_id_key" ON "m_est_standard_sheets"("standard_id", "sheet_def_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_standard_values_standard_id_item_id_key" ON "m_est_standard_values"("standard_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_standard_tiers_standard_id_sheet_def_id_lot_from_key" ON "m_est_standard_tiers"("standard_id", "sheet_def_id", "lot_from");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_standard_cells_tier_id_item_id_key" ON "m_est_standard_cells"("tier_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_estimates_estimate_no_key" ON "t_estimates"("estimate_no");

-- CreateIndex
CREATE INDEX "t_estimates_customer_name_idx" ON "t_estimates"("customer_name");

-- CreateIndex
CREATE INDEX "t_estimates_product_code_idx" ON "t_estimates"("product_code");

-- CreateIndex
CREATE INDEX "t_estimates_issue_date_idx" ON "t_estimates"("issue_date");

-- CreateIndex
CREATE INDEX "t_estimate_lines_estimate_id_section_sort_order_idx" ON "t_estimate_lines"("estimate_id", "section", "sort_order");

-- AddForeignKey
ALTER TABLE "m_est_standards" ADD CONSTRAINT "m_est_standards_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "m_est_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_sheet_items" ADD CONSTRAINT "m_est_sheet_items_sheet_def_id_fkey" FOREIGN KEY ("sheet_def_id") REFERENCES "m_est_sheet_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_sheets" ADD CONSTRAINT "m_est_standard_sheets_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "m_est_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_sheets" ADD CONSTRAINT "m_est_standard_sheets_sheet_def_id_fkey" FOREIGN KEY ("sheet_def_id") REFERENCES "m_est_sheet_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_values" ADD CONSTRAINT "m_est_standard_values_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "m_est_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_values" ADD CONSTRAINT "m_est_standard_values_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "m_est_sheet_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_tiers" ADD CONSTRAINT "m_est_standard_tiers_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "m_est_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_tiers" ADD CONSTRAINT "m_est_standard_tiers_sheet_def_id_fkey" FOREIGN KEY ("sheet_def_id") REFERENCES "m_est_sheet_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_cells" ADD CONSTRAINT "m_est_standard_cells_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "m_est_standard_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_standard_cells" ADD CONSTRAINT "m_est_standard_cells_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "m_est_sheet_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_estimates" ADD CONSTRAINT "t_estimates_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "m_est_standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_estimate_lines" ADD CONSTRAINT "t_estimate_lines_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "t_estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
