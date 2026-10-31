-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "is_accounting_staff" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "t_acct_slips" (
    "id" TEXT NOT NULL,
    "slip_no" SERIAL NOT NULL,
    "slip_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '下書き',
    "slip_date" DATE NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "requester_id" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "department_name" TEXT,
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_acct_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_acct_slip_approval_steps" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "position_name" TEXT,
    "approver_id" TEXT,
    "approver_name" TEXT,
    "approver_email" TEXT,
    "status" TEXT NOT NULL DEFAULT '未承認',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_acct_slip_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_acct_slip_files" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_acct_slip_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_acct_trip_expenses" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL DEFAULT '旅費交通費',
    "account_code" TEXT NOT NULL DEFAULT '714',
    "tax_category" TEXT NOT NULL DEFAULT '4.課税',
    "area_purpose" TEXT,
    "trip_dates" JSONB,
    "transport_items" JSONB,
    "lodging_items" JSONB,
    "allowance_items" JSONB,
    "transport_subtotal" INTEGER NOT NULL DEFAULT 0,
    "lodging_subtotal" INTEGER NOT NULL DEFAULT 0,
    "allowance_subtotal" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_acct_trip_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_acct_slips_slip_no_key" ON "t_acct_slips"("slip_no");

-- CreateIndex
CREATE INDEX "t_acct_slips_requester_id_idx" ON "t_acct_slips"("requester_id");

-- CreateIndex
CREATE INDEX "t_acct_slips_slip_type_idx" ON "t_acct_slips"("slip_type");

-- CreateIndex
CREATE INDEX "t_acct_slips_status_idx" ON "t_acct_slips"("status");

-- CreateIndex
CREATE INDEX "t_acct_slips_slip_date_idx" ON "t_acct_slips"("slip_date");

-- CreateIndex
CREATE INDEX "t_acct_slip_approval_steps_slip_id_idx" ON "t_acct_slip_approval_steps"("slip_id");

-- CreateIndex
CREATE INDEX "t_acct_slip_approval_steps_approver_id_idx" ON "t_acct_slip_approval_steps"("approver_id");

-- CreateIndex
CREATE INDEX "t_acct_slip_files_slip_id_idx" ON "t_acct_slip_files"("slip_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_acct_trip_expenses_slip_id_key" ON "t_acct_trip_expenses"("slip_id");

-- AddForeignKey
ALTER TABLE "t_acct_slip_approval_steps" ADD CONSTRAINT "t_acct_slip_approval_steps_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_acct_slip_files" ADD CONSTRAINT "t_acct_slip_files_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_acct_trip_expenses" ADD CONSTRAINT "t_acct_trip_expenses_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
