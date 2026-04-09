/*
  Warnings:

  - You are about to drop the column `postalCode` on the `dev_companies` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `dev_company_contacts` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `dev_company_contacts` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `dev_company_contacts` table. All the data in the column will be lost.
  - You are about to drop the column `nameKana` on the `dev_company_contacts` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dev_company_contacts` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `dev_company_type_masters` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `dev_company_type_masters` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dev_company_type_masters` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `dev_company_types` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `dev_company_types` table. All the data in the column will be lost.
  - You are about to drop the column `typeMasterId` on the `dev_company_types` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the `dev_exhibition_companies` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[company_id,type_master_id]` on the table `dev_company_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `dev_company_contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `dev_company_contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `dev_company_type_masters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `dev_company_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_master_id` to the `dev_company_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `dev_exhibitions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "dev_company_contacts" DROP CONSTRAINT "dev_company_contacts_companyId_fkey";

-- DropForeignKey
ALTER TABLE "dev_company_types" DROP CONSTRAINT "dev_company_types_companyId_fkey";

-- DropForeignKey
ALTER TABLE "dev_company_types" DROP CONSTRAINT "dev_company_types_typeMasterId_fkey";

-- DropForeignKey
ALTER TABLE "dev_exhibition_companies" DROP CONSTRAINT "dev_exhibition_companies_companyId_fkey";

-- DropForeignKey
ALTER TABLE "dev_exhibition_companies" DROP CONSTRAINT "dev_exhibition_companies_exhibitionId_fkey";

-- DropIndex
DROP INDEX "dev_company_types_companyId_typeMasterId_key";

-- AlterTable
ALTER TABLE "dev_companies" DROP COLUMN "postalCode",
ADD COLUMN     "postal_code" TEXT;

-- AlterTable
ALTER TABLE "dev_company_contacts" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "isPrimary",
DROP COLUMN "nameKana",
DROP COLUMN "updatedAt",
ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name_kana" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "dev_company_type_masters" DROP COLUMN "createdAt",
DROP COLUMN "sortOrder",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "dev_company_types" DROP COLUMN "companyId",
DROP COLUMN "createdAt",
DROP COLUMN "typeMasterId",
ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type_master_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "dev_exhibitions" DROP COLUMN "createdAt",
DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "dev_exhibition_companies";

-- CreateTable
CREATE TABLE "dev_exhibition_visitors" (
    "id" TEXT NOT NULL,
    "exhibition_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "impression" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_exhibition_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_exhibition_contacts" (
    "id" TEXT NOT NULL,
    "exhibition_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_exhibition_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dev_exhibition_visitors_exhibition_id_user_id_key" ON "dev_exhibition_visitors"("exhibition_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dev_company_types_company_id_type_master_id_key" ON "dev_company_types"("company_id", "type_master_id");

-- AddForeignKey
ALTER TABLE "dev_exhibition_visitors" ADD CONSTRAINT "dev_exhibition_visitors_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "dev_exhibitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_exhibition_visitors" ADD CONSTRAINT "dev_exhibition_visitors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_exhibition_contacts" ADD CONSTRAINT "dev_exhibition_contacts_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "dev_exhibitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_exhibition_contacts" ADD CONSTRAINT "dev_exhibition_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dev_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_exhibition_contacts" ADD CONSTRAINT "dev_exhibition_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "dev_company_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_company_contacts" ADD CONSTRAINT "dev_company_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dev_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_company_types" ADD CONSTRAINT "dev_company_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dev_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_company_types" ADD CONSTRAINT "dev_company_types_type_master_id_fkey" FOREIGN KEY ("type_master_id") REFERENCES "dev_company_type_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
