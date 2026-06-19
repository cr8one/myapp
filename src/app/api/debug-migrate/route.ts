import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "t_output_lists" (
      "id" TEXT NOT NULL,
      "uid" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "remarks" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "t_output_lists_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "t_output_lists_uid_key" ON "t_output_lists"("uid")`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "t_output_list_items" (
      "id" TEXT NOT NULL,
      "list_id" TEXT NOT NULL,
      "sort_order" INTEGER NOT NULL DEFAULT 0,
      "company_name" TEXT,
      "company_name_kana" TEXT,
      "postal_code" TEXT,
      "address1" TEXT,
      "address2" TEXT,
      "department_in_charge" TEXT,
      "department" TEXT,
      "position" TEXT,
      "name" TEXT,
      "honorific" TEXT,
      "remarks" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "t_output_list_items_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 't_output_list_items_list_id_fkey') THEN
        ALTER TABLE "t_output_list_items" ADD CONSTRAINT "t_output_list_items_list_id_fkey"
        FOREIGN KEY ("list_id") REFERENCES "t_output_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  return NextResponse.json({ ok: true })
}
