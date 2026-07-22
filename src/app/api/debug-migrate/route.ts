import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_name" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "first_name" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "furigana_last_name" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "furigana_first_name" TEXT`)
  return NextResponse.json({ ok: true })
}
