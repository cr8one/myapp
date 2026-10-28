import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

const ROLES = ["管理責任者", "処理責任者"]
const include = { user: { select: { id: true, name: true, email: true } } }

export async function GET() {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const managers = await prisma.mVoucherManager.findMany({
    include,
    orderBy: [{ role: "asc" }, { created_at: "asc" }],
  })
  return NextResponse.json(managers)
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const { user_id, role } = await req.json()
  if (!user_id || !ROLES.includes(role)) {
    return NextResponse.json({ error: "ユーザーまたは役割が正しくありません" }, { status: 400 })
  }
  const exists = await prisma.mVoucherManager.findFirst({ where: { user_id, role } })
  if (exists) return NextResponse.json({ error: "すでに登録されています" }, { status: 409 })
  const created = await prisma.mVoucherManager.create({ data: { user_id, role }, include })
  return NextResponse.json(created)
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 })
  await prisma.mVoucherManager.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
