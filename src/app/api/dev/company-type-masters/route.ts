import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logDevCreate, logDevDeleteAll } from "@/lib/dev-history"

export async function GET() {
  const masters = await prisma.devCompanyTypeMaster.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(masters)
}

export async function POST(req: Request) {
  const { name, description, sortOrder } = await req.json()
  if (!name) return NextResponse.json({ error: "種別名は必須です" }, { status: 400 })
  const master = await prisma.devCompanyTypeMaster.create({
    data: { name, description, sortOrder: sortOrder ?? 0 },
  })
  const session = await auth()
  await logDevCreate({ userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetId: master.id, targetLabel: master.name })
  return NextResponse.json(master)
}

export async function DELETE() {
  const session = await auth()
  const result = await prisma.devCompanyTypeMaster.deleteMany()
  await logDevDeleteAll({ userId: session?.user?.id, targetModel: "DevCompanyTypeMaster", targetLabel: "種別マスタ（全件）", count: result.count })
  return NextResponse.json({ ok: true })
}