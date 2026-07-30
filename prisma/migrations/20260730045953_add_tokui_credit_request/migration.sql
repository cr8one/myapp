-- CreateTable
CREATE TABLE "t_tokui_credit_requests" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '下書き',
    "company_name" TEXT,
    "industry" TEXT,
    "representative_name" TEXT,
    "capital" TEXT,
    "established_year_month" TEXT,
    "annual_revenue" TEXT,
    "employee_count" TEXT,
    "main_bank_name" TEXT,
    "main_bank_branch" TEXT,
    "postal_code" TEXT,
    "address" TEXT,
    "tel" TEXT,
    "fax" TEXT,
    "payment_terms" TEXT,
    "order_contact_dept" TEXT,
    "order_contact_name" TEXT,
    "sales_rep_name" TEXT,
    "order_items" TEXT,
    "order_amount" TEXT,
    "future_prospects" TEXT,
    "requested_credit_limit" TEXT,
    "requested_date" TIMESTAMP(3),
    "manager_comment" TEXT,
    "division_head_comment" TEXT,
    "accounting_comment" TEXT,
    "approved_credit_limit" TEXT,
    "approved_date" TIMESTAMP(3),
    "remarks" TEXT,
    "tokui_ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_tokui_credit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_tokui_credit_request_files" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_tokui_credit_request_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_tokui_credit_requests_uid_key" ON "t_tokui_credit_requests"("uid");

-- AddForeignKey
ALTER TABLE "t_tokui_credit_request_files" ADD CONSTRAINT "t_tokui_credit_request_files_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_tokui_credit_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
