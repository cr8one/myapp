import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const types = [
      { name: "OEM生産",      sortOrder: 1 },
      { name: "ODM生産",      sortOrder: 2 },
      { name: "試作・サンプル", sortOrder: 3 },
      { name: "量産",         sortOrder: 4 },
      { name: "デザイン提案",  sortOrder: 5 },
      { name: "資材調達",     sortOrder: 6 },
      { name: "輸出入",       sortOrder: 7 },
    ]
    for (const t of types) {
      await prisma.devCompanyTypeMaster.upsert({
        where: { name: t.name },
        update: {},
        create: { id: crypto.randomUUID(), ...t },
      })
    }
    return NextResponse.json({ ok: true, message: "シード完了" })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
