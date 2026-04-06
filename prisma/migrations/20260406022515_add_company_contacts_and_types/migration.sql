/*
  Warnings:

  - You are about to drop the column `contactEmail` on the `dev_companies` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `dev_companies` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `dev_companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dev_companies" DROP COLUMN "contactEmail",
DROP COLUMN "contactName",
DROP COLUMN "contactPhone",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT '登録のみ',
ADD COLUMN     "url" TEXT;

-- CreateTable
CREATE TABLE "dev_company_contacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "position" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_company_type_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_company_type_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_company_types" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "typeMasterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_company_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dev_company_type_masters_name_key" ON "dev_company_type_masters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dev_company_types_companyId_typeMasterId_key" ON "dev_company_types"("companyId", "typeMasterId");

-- AddForeignKey
ALTER TABLE "dev_company_contacts" ADD CONSTRAINT "dev_company_contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "dev_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_company_types" ADD CONSTRAINT "dev_company_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "dev_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_company_types" ADD CONSTRAINT "dev_company_types_typeMasterId_fkey" FOREIGN KEY ("typeMasterId") REFERENCES "dev_company_type_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
