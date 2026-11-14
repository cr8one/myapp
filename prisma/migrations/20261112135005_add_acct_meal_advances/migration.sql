-- CreateTable
CREATE TABLE "t_acct_meal_advances" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "purpose" TEXT,
    "remarks" TEXT,
    "meal_a" JSONB,
    "meal_b" JSONB,
    "other_items" JSONB,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "advance_amount" INTEGER NOT NULL DEFAULT 0,
    "shortage_amount" INTEGER NOT NULL DEFAULT 0,
    "balance_amount" INTEGER NOT NULL DEFAULT 0,
    "shortage_account_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_acct_meal_advances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_acct_meal_advances_slip_id_key" ON "t_acct_meal_advances"("slip_id");

-- AddForeignKey
ALTER TABLE "t_acct_meal_advances" ADD CONSTRAINT "t_acct_meal_advances_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
