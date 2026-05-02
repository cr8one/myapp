-- CreateTable
CREATE TABLE "seal_serial_configs" (
    "id" SERIAL NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 3201,
    "increment" INTEGER NOT NULL DEFAULT 1,
    "prefix" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seal_serial_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seal_supply_companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seal_supply_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seal_supply_staffs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_issuer" BOOLEAN NOT NULL DEFAULT false,
    "is_supplier" BOOLEAN NOT NULL DEFAULT false,
    "is_receiver" BOOLEAN NOT NULL DEFAULT false,
    "is_outsource_receiver" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seal_supply_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seal_supplies" (
    "id" SERIAL NOT NULL,
    "serial_code" TEXT NOT NULL,
    "is_hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_deadline" TIMESTAMP(3),
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "product_code" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "part_name" TEXT NOT NULL,
    "qty_shizuoka_to_tokyo" INTEGER NOT NULL DEFAULT 0,
    "qty_tokyo_to_outsource" INTEGER NOT NULL DEFAULT 0,
    "qty_tokyo_stock" INTEGER NOT NULL DEFAULT 0,
    "company_id" INTEGER,
    "company_name" TEXT,
    "issuer_id" INTEGER,
    "issuer_name" TEXT,
    "supplier_id" INTEGER,
    "supplier_name" TEXT,
    "ship_date_from_js" TIMESTAMP(3),
    "receiver_id" INTEGER,
    "receiver_name" TEXT,
    "receipt_date_at_supplier" TIMESTAMP(3),
    "outsource_receiver_id" INTEGER,
    "outsource_receiver_name" TEXT,
    "mail_sent_flag" TEXT NOT NULL DEFAULT '未',
    "notes" TEXT,
    "department" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seal_supplies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seal_supply_companies_name_key" ON "seal_supply_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "seal_supply_staffs_name_key" ON "seal_supply_staffs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "seal_supplies_serial_code_key" ON "seal_supplies"("serial_code");

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "seal_supply_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "seal_supply_staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "seal_supply_staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "seal_supply_staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seal_supplies" ADD CONSTRAINT "seal_supplies_outsource_receiver_id_fkey" FOREIGN KEY ("outsource_receiver_id") REFERENCES "seal_supply_staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
