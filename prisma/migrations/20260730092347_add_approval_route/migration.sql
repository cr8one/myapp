-- CreateTable
CREATE TABLE "t_m_approval_routes" (
    "id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "position_id" TEXT,
    "approver_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_m_approval_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_user_approver_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "position_id" TEXT,
    "approver_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_user_approver_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_m_approval_routes" ADD CONSTRAINT "t_m_approval_routes_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "m_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_m_approval_routes" ADD CONSTRAINT "t_m_approval_routes_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_user_approver_settings" ADD CONSTRAINT "t_user_approver_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_user_approver_settings" ADD CONSTRAINT "t_user_approver_settings_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "m_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_user_approver_settings" ADD CONSTRAINT "t_user_approver_settings_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
