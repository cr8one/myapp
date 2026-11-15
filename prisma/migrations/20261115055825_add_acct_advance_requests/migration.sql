-- CreateTable
CREATE TABLE "t_acct_advance_requests" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "purpose" TEXT,
    "due_date" DATE,
    "advance_amount" INTEGER NOT NULL DEFAULT 0,
    "paid_date" DATE,
    "paid_method" TEXT,
    "paid_amount" INTEGER,
    "paid_by_id" TEXT,
    "paid_by_name" TEXT,
    "received_date" DATE,
    "received_by_id" TEXT,
    "received_by_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_acct_advance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_acct_advance_requests_slip_id_key" ON "t_acct_advance_requests"("slip_id");

-- AddForeignKey
ALTER TABLE "t_acct_advance_requests" ADD CONSTRAINT "t_acct_advance_requests_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
