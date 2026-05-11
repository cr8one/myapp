-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "cad_edit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cad_view" BOOLEAN NOT NULL DEFAULT true;
