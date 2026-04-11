/*
  Warnings:

  - You are about to drop the column `created_at` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `dev_exhibitions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `dev_exhibitions` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `dev_exhibitions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "dev_exhibitions" DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "start_date",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "products_view" BOOLEAN NOT NULL DEFAULT true,
    "products_edit" BOOLEAN NOT NULL DEFAULT false,
    "parts_view" BOOLEAN NOT NULL DEFAULT true,
    "parts_edit" BOOLEAN NOT NULL DEFAULT false,
    "dev_view" BOOLEAN NOT NULL DEFAULT true,
    "dev_edit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_user_id_key" ON "user_permissions"("user_id");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
