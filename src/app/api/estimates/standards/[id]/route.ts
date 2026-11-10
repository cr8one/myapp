import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// parentId を親にしたとき、id の基準が自分の子孫を親にしてしまう（循環）かどうか
async function wouldCycle(id: string, parentId: string): Promise<boolean> {
  let cur: string | null = parentId
  const seen = new Set<string>()
  while (cur) {
    if (cur === id || seen.has(cur)) return true
    seen.add(cur)
    const p: { parent_id: string | null } | null = await prisma.estStandard.findUnique({
      where: { id: cur },
      select: { parent_id: true },
    })
    cur = p?.parent_id ?? null
  }
  return false
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const b = await req.json()

  const before = await prisma.estStandard.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "基準が見つかりません" }, { status: 404 })

  const data: { name?: string; parent_id?: string | null; remarks?: string | null; is_archived?: boolean } = {}

  if ("name" in b) {
    const name = String(b.name ?? "").trim()
    if (!name) return NextResponse.json({ error: "基準名を入力してください" }, { status: 400 })
    const dup = await prisma.estStandard.findFirst({ where: { name, NOT: { id } } })
    if (dup) return NextResponse.json({ error: "同じ名前の基準がすでにあります" }, { status: 409 })
    data.name = name
  }
  if ("parent_id" in b) {
    const parentId: string | null = b.parent_id || null
    if (parentId) {
      if (parentId === id) return NextResponse.json({ error: "自分自身を親にはできません" }, { status: 400 })
      const parent = await prisma.estStandard.findUnique({ where: { id: parentId } })
      if (!parent) return NextResponse.json({ error: "親の基準が見つかりません" }, { status: 400 })
      if (await wouldCycle(id, parentId)) return NextResponse.json({ error: "この基準の子孫を親にはできません" }, { status: 400 })
    }
    data.parent_id = parentId
  }
  if ("remarks" in b) data.remarks = b.remarks ? String(b.remarks) : null
  if (typeof b.is_archived === "boolean") data.is_archived = b.is_archived

  const user = await getSessionUser()
  const after = await prisma.estStandard.update({ where: { id }, data })

  const pick = (s: { name: string; parent_id: string | null; remarks: string | null; is_archived: boolean }) =>
    ({ name: s.name, parent_id: s.parent_id, remarks: s.remarks, is_archived: s.is_archived })
  await createAuditLog({
    userId: user?.id,
    service: "estimate",
    action: "UPDATE",
    targetModel: "EstStandard",
    targetId: id,
    targetLabel: after.name,
    diff: { before: pick(before), after: pick(after) },
  })
  return NextResponse.json(after)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params

  const before = await prisma.estStandard.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: "基準が見つかりません" }, { status: 404 })

  const childCount = await prisma.estStandard.count({ where: { parent_id: id } })
  if (childCount > 0) {
    return NextResponse.json({ error: "この基準を親にしている基準があるため、削除できません" }, { status: 409 })
  }
  const estimateCount = await prisma.estimate.count({ where: { standard_id: id } })
  if (estimateCount > 0) {
    return NextResponse.json({ error: "この基準を参照している見積があるため、削除できません。アーカイブしてください" }, { status: 409 })
  }

  const user = await getSessionUser()
  await prisma.estStandard.delete({ where: { id } })
  await createAuditLog({
    userId: user?.id,
    service: "estimate",
    action: "DELETE",
    targetModel: "EstStandard",
    targetId: id,
    targetLabel: before.name,
    diff: { name: before.name, parent_id: before.parent_id, remarks: before.remarks, is_archived: before.is_archived },
  })
  return NextResponse.json({ ok: true })
}