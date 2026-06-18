import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "t_address_book" DROP COLUMN IF EXISTS "department"`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "t_address_book" DROP COLUMN IF EXISTS "honorific"`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "t_address_book" DROP COLUMN IF EXISTS "name"`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "t_address_book" DROP COLUMN IF EXISTS "position"`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "t_address_book_contacts" (
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
    )
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 't_address_book_contacts_address_book_id_fkey') THEN
        ALTER TABLE "t_address_book_contacts" ADD CONSTRAINT "t_address_book_contacts_address_book_id_fkey"
        FOREIGN KEY ("address_book_id") REFERENCES "t_address_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  return NextResponse.json({ ok: true })
}
