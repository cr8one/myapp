-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "manufacturing_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manufacturing_view" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tray_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tray_view" BOOLEAN NOT NULL DEFAULT true;
