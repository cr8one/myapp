-- CreateTable
CREATE TABLE "t_vouchers" (
    "id" TEXT NOT NULL,
    "file_no" INTEGER NOT NULL,
    "doc_type" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT '受領',
    "media_type" TEXT,
    "transaction_date" DATE NOT NULL,
    "partner_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "remarks" TEXT,
    "payment_method" TEXT,
    "transfer_method" TEXT,
    "base_name" TEXT,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "timestamp_flg" BOOLEAN NOT NULL DEFAULT false,
    "registrant_id" TEXT,
    "registrant_name" TEXT,
    "deleted_flg" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_voucher_approval_steps" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_name" TEXT,
    "approver_name" TEXT,
    "approver_email" TEXT,
    "status" TEXT NOT NULL DEFAULT '未承認',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_voucher_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_voucher_files" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_voucher_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_voucher_histories" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "field_name" TEXT,
    "before_value" TEXT,
    "after_value" TEXT,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_voucher_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_voucher_correction_requests" (
    "id" TEXT NOT NULL,
    "request_no" INTEGER NOT NULL,
    "requested_date" DATE NOT NULL,
    "requester_id" TEXT,
    "requester_name" TEXT,
    "voucher_id" TEXT,
    "voucher_file_no" INTEGER NOT NULL,
    "voucher_doc_type" TEXT,
    "voucher_partner_name" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '申請中',
    "approver_name" TEXT,
    "approved_at" TIMESTAMP(3),
    "processed_date" DATE,
    "processor_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_voucher_correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_voucher_options" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_voucher_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_voucher_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "furigana" TEXT,
    "staff_user_id" TEXT,
    "media_option_id" TEXT,
    "payment_option_id" TEXT,
    "transfer_option_id" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_voucher_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_voucher_serials" (
    "id" SERIAL NOT NULL,
    "next_value" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_voucher_serials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_vouchers_file_no_key" ON "t_vouchers"("file_no");

-- CreateIndex
CREATE INDEX "t_vouchers_transaction_date_idx" ON "t_vouchers"("transaction_date");

-- CreateIndex
CREATE INDEX "t_vouchers_partner_name_idx" ON "t_vouchers"("partner_name");

-- CreateIndex
CREATE INDEX "t_vouchers_amount_idx" ON "t_vouchers"("amount");

-- CreateIndex
CREATE INDEX "t_voucher_approval_steps_voucher_id_idx" ON "t_voucher_approval_steps"("voucher_id");

-- CreateIndex
CREATE INDEX "t_voucher_files_voucher_id_idx" ON "t_voucher_files"("voucher_id");

-- CreateIndex
CREATE INDEX "t_voucher_histories_voucher_id_idx" ON "t_voucher_histories"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_voucher_correction_requests_request_no_key" ON "t_voucher_correction_requests"("request_no");

-- CreateIndex
CREATE INDEX "m_voucher_options_category_idx" ON "m_voucher_options"("category");

-- CreateIndex
CREATE UNIQUE INDEX "m_voucher_partners_name_staff_user_id_key" ON "m_voucher_partners"("name", "staff_user_id");

-- AddForeignKey
ALTER TABLE "t_voucher_approval_steps" ADD CONSTRAINT "t_voucher_approval_steps_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "t_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_voucher_files" ADD CONSTRAINT "t_voucher_files_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "t_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_voucher_histories" ADD CONSTRAINT "t_voucher_histories_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "t_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_voucher_correction_requests" ADD CONSTRAINT "t_voucher_correction_requests_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "t_vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_voucher_partners" ADD CONSTRAINT "m_voucher_partners_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_voucher_partners" ADD CONSTRAINT "m_voucher_partners_media_option_id_fkey" FOREIGN KEY ("media_option_id") REFERENCES "m_voucher_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_voucher_partners" ADD CONSTRAINT "m_voucher_partners_payment_option_id_fkey" FOREIGN KEY ("payment_option_id") REFERENCES "m_voucher_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_voucher_partners" ADD CONSTRAINT "m_voucher_partners_transfer_option_id_fkey" FOREIGN KEY ("transfer_option_id") REFERENCES "m_voucher_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- InsertInitialData
INSERT INTO "m_voucher_serials" ("id", "next_value", "updated_at") VALUES (1, 1, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
