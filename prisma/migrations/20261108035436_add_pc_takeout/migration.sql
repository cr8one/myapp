-- CreateTable
CREATE TABLE "t_pc_takeout_requests" (
    "id" TEXT NOT NULL,
    "request_no" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT '下書き',
    "request_date" DATE NOT NULL,
    "requester_id" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "department_name" TEXT,
    "reason" TEXT NOT NULL DEFAULT '',
    "period_start" DATE,
    "period_end" DATE,
    "device_id" INTEGER,
    "device_name" TEXT,
    "model_label" TEXT,
    "accessories" JSONB,
    "software" JSONB,
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_pc_takeout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_pc_takeout_approval_steps" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "position_name" TEXT,
    "approver_id" TEXT,
    "approver_name" TEXT,
    "approver_email" TEXT,
    "status" TEXT NOT NULL DEFAULT '未承認',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_pc_takeout_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_pc_takeout_histories" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_pc_takeout_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_user_takeout_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" INTEGER NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_user_takeout_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_pc_takeout_requests_request_no_key" ON "t_pc_takeout_requests"("request_no");

-- CreateIndex
CREATE INDEX "t_pc_takeout_requests_requester_id_idx" ON "t_pc_takeout_requests"("requester_id");

-- CreateIndex
CREATE INDEX "t_pc_takeout_requests_status_idx" ON "t_pc_takeout_requests"("status");

-- CreateIndex
CREATE INDEX "t_pc_takeout_requests_request_date_idx" ON "t_pc_takeout_requests"("request_date");

-- CreateIndex
CREATE INDEX "t_pc_takeout_approval_steps_request_id_idx" ON "t_pc_takeout_approval_steps"("request_id");

-- CreateIndex
CREATE INDEX "t_pc_takeout_approval_steps_approver_id_idx" ON "t_pc_takeout_approval_steps"("approver_id");

-- CreateIndex
CREATE INDEX "t_pc_takeout_histories_request_id_idx" ON "t_pc_takeout_histories"("request_id");

-- CreateIndex
CREATE INDEX "t_user_takeout_devices_user_id_idx" ON "t_user_takeout_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_user_takeout_devices_user_id_device_id_key" ON "t_user_takeout_devices"("user_id", "device_id");

-- AddForeignKey
ALTER TABLE "t_pc_takeout_approval_steps" ADD CONSTRAINT "t_pc_takeout_approval_steps_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_pc_takeout_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_pc_takeout_histories" ADD CONSTRAINT "t_pc_takeout_histories_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_pc_takeout_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_user_takeout_devices" ADD CONSTRAINT "t_user_takeout_devices_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "t_devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 1人のユーザーのメイン機は、1台まで（条件つきの一意インデックス。Prismaのスキーマには書けない）
CREATE UNIQUE INDEX "t_user_takeout_devices_one_main_per_user" ON "t_user_takeout_devices"("user_id") WHERE "is_main" = true;
