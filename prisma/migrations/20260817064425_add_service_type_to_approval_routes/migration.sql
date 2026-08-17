-- AlterTable
ALTER TABLE "t_m_approval_routes" ADD COLUMN     "service_type" TEXT NOT NULL DEFAULT 'tokui_credit';

-- AlterTable
ALTER TABLE "t_user_approver_settings" ADD COLUMN     "service_type" TEXT NOT NULL DEFAULT 'tokui_credit';
