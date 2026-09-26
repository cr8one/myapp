-- AlterTable
ALTER TABLE "m_cad_mail_recipients" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'cad_request';

-- AlterTable
ALTER TABLE "m_cad_mail_templates" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'cad_request';
