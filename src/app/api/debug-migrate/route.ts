import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "m_vendors" (
      "id" SERIAL NOT NULL,
      "name" TEXT NOT NULL,
      "flg_del" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "m_vendors_pkey" PRIMARY KEY ("id")
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "m_device_models" (
      "model_id" SERIAL NOT NULL,
      "vendor_id" INTEGER,
      "device_type_id" INTEGER,
      "model_name" TEXT NOT NULL,
      "model_number" TEXT,
      "os_name" TEXT,
      "cpu_info" TEXT,
      "memory_default" TEXT,
      "storage_default" TEXT,
      "eol_date" TIMESTAMP(3),
      "image_path" TEXT,
      "note" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "m_device_models_pkey" PRIMARY KEY ("model_id")
    )
  `)
  return NextResponse.json({ ok: true })
}
