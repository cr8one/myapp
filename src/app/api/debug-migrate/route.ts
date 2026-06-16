import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "address_book_change_request_target" BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "address_book_edit" BOOLEAN NOT NULL DEFAULT false`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "user_permissions" ADD COLUMN IF NOT EXISTS "address_book_view" BOOLEAN NOT NULL DEFAULT true`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "t_address_book_change_requests" (
      "id" TEXT NOT NULL,
      "uid" TEXT NOT NULL,
      "address_book_id" TEXT NOT NULL,
      "requester_id" TEXT,
      "status" TEXT NOT NULL DEFAULT '依頼中',
      "remarks" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "t_address_book_change_requests_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "t_address_book_change_requests_uid_key" ON "t_address_book_change_requests"("uid")`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "t_address_book_change_request_items" (
      "id" TEXT NOT NULL,
      "change_request_id" TEXT NOT NULL,
      "field_name" TEXT NOT NULL,
      "field_label" TEXT NOT NULL,
      "before_value" TEXT,
      "after_value" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "t_address_book_change_request_items_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 't_address_book_change_requests_address_book_id_fkey') THEN
        ALTER TABLE "t_address_book_change_requests" ADD CONSTRAINT "t_address_book_change_requests_address_book_id_fkey" FOREIGN KEY ("address_book_id") REFERENCES "t_address_book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 't_address_book_change_requests_requester_id_fkey') THEN
        ALTER TABLE "t_address_book_change_requests" ADD CONSTRAINT "t_address_book_change_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 't_address_book_change_request_items_change_request_id_fkey') THEN
        ALTER TABLE "t_address_book_change_request_items" ADD CONSTRAINT "t_address_book_change_request_items_change_request_id_fkey" FOREIGN KEY ("change_request_id") REFERENCES "t_address_book_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  return NextResponse.json({ ok: true })
}
