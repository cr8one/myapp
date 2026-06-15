import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "t_address_book" (
      "id" TEXT NOT NULL,
      "uid" TEXT NOT NULL,
      "company_name" TEXT,
      "company_name_kana" TEXT,
      "department" TEXT,
      "position" TEXT,
      "name" TEXT,
      "honorific" TEXT,
      "postal_code" TEXT,
      "address1" TEXT,
      "address2" TEXT,
      "remarks" TEXT,
      "flg_del" INTEGER NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "t_address_book_pkey" PRIMARY KEY ("id")
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "t_address_book_uid_key" ON "t_address_book"("uid");
  `)
  return NextResponse.json({ ok: true })
}
