-- CreateTable
CREATE TABLE "t_acct_reception_approvals" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "client_name" TEXT,
    "contact_name" TEXT,
    "reception_date" DATE,
    "content" TEXT,
    "place" TEXT,
    "reason" TEXT,
    "budget_amount" INTEGER NOT NULL DEFAULT 0,
    "advance_needed" BOOLEAN NOT NULL DEFAULT false,
    "actual_amount" INTEGER,
    "actual_recorded_at" TIMESTAMP(3),
    "actual_recorded_by_id" TEXT,
    "actual_recorded_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_acct_reception_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_acct_reception_approvals_slip_id_key" ON "t_acct_reception_approvals"("slip_id");

-- AddForeignKey
ALTER TABLE "t_acct_reception_approvals" ADD CONSTRAINT "t_acct_reception_approvals_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
