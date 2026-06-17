import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export async function GET() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "t_address_book" ADD COLUMN IF NOT EXISTS "department_in_charge" TEXT`)
  return NextResponse.json({ ok: true })
}
