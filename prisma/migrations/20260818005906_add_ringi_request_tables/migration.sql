-- CreateTable
CREATE TABLE "t_ringi_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "destination" TEXT,
    "cost" TEXT,
    "requester_names" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "requester_department" TEXT,
    "status" TEXT NOT NULL DEFAULT '起案部承認中',
    "reception_number" TEXT,
    "reception_date" TIMESTAMP(3),
    "decision_date" TIMESTAMP(3),
    "decision_result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_ringi_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ringi_approval_steps" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "position_name" TEXT,
    "approver_name" TEXT,
    "approver_email" TEXT,
    "status" TEXT NOT NULL DEFAULT '未承認',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_ringi_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_ringi_request_files" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_ringi_request_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_ringi_requests" ADD CONSTRAINT "t_ringi_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ringi_approval_steps" ADD CONSTRAINT "t_ringi_approval_steps_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_ringi_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_ringi_request_files" ADD CONSTRAINT "t_ringi_request_files_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_ringi_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
