/*
  Warnings:

  - You are about to drop the column `department` on the `t_address_book` table. All the data in the column will be lost.
  - You are about to drop the column `honorific` on the `t_address_book` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `t_address_book` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `t_address_book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_address_book" DROP COLUMN "department",
DROP COLUMN "honorific",
DROP COLUMN "name",
DROP COLUMN "position";

-- CreateTable
CREATE TABLE "t_address_book_contacts" (
    "id" TEXT NOT NULL,
    "address_book_id" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "name" TEXT,
    "honorific" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_address_book_contacts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_address_book_contacts" ADD CONSTRAINT "t_address_book_contacts_address_book_id_fkey" FOREIGN KEY ("address_book_id") REFERENCES "t_address_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
