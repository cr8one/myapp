-- CreateTable
CREATE TABLE "t_acct_slip_histories" (
    "id" TEXT NOT NULL,
    "slip_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_acct_slip_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_acct_slip_histories_slip_id_idx" ON "t_acct_slip_histories"("slip_id");

-- AddForeignKey
ALTER TABLE "t_acct_slip_histories" ADD CONSTRAINT "t_acct_slip_histories_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "t_acct_slips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
