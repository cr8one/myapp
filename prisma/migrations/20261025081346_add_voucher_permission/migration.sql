-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "voucher_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voucher_view" BOOLEAN NOT NULL DEFAULT false;
