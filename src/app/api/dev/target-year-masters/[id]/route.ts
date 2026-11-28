import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DEV_TARGET_YEAR_MASTER_LABELS, logDevUpdate, logDevDelete } from "@/lib/dev-history"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "年度名は必須です" }, { status: 400 })
  const dup = await prisma.devTargetYearMaster.findFirst({ where: { name, NOT: { id } } })
  if (dup) return NextResponse.json({ error: "同じ名前の年度がすでに登録されています" }, { status: 400 })
  const session = await auth()
  const before = await prisma.devTargetYearMaster.findUnique({ where: { id } })
  const year = await prisma.devTargetYearMaster.update({ where: { id }, data: { name } })
  if (before) {
    await logDevUpdate({
      userId: session?.user?.id, targetModel: "DevTargetYearMaster", targetId: id, targetLabel: year.name,
      before, after: year, labels: DEV_TARGET_YEAR_MASTER_LABELS,
    })
  }
  return NextResponse.json(year)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const before = await prisma.devTargetYearMaster.findUnique({ where: { id }, select: { name: true } })
  await prisma.devTargetYearMaster.delete({ where: { id } })
  if (before) {
    await logDevDelete({ userId: session?.user?.id, targetModel: "DevTargetYearMaster", targetId: id, targetLabel: before.name })
  }
  return NextResponse.json({ ok: true })
}
