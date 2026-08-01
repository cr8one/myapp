-- AlterTable
ALTER TABLE "t_tokui_credit_requests" ADD COLUMN     "requester_user_id" TEXT;

-- CreateTable
CREATE TABLE "t_tokui_credit_request_approval_steps" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "position_name" TEXT,
    "approver_name" TEXT,
    "approver_email" TEXT,
    "status" TEXT NOT NULL DEFAULT '未承認',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_tokui_credit_request_approval_steps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_tokui_credit_requests" ADD CONSTRAINT "t_tokui_credit_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_tokui_credit_request_approval_steps" ADD CONSTRAINT "t_tokui_credit_request_approval_steps_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_tokui_credit_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
