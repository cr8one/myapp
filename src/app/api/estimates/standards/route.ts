import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"

// 見積基準の一覧
export async function GET(_req: NextRequest) {
  const denied = await requirePermission("estimateView")
  if (denied) return denied
  const rows = await prisma.estStandard.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true, estimates: true } },
    },
    orderBy: [{ is_archived: "asc" }, { sort_order: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(rows)
}

// 新規作成。copy_from_id を付けると、その基準の内容を丸ごとコピーする（複製）
export async function POST(req: Request) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const b = await req.json()
  const name = String(b.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "基準名を入力してください" }, { status: 400 })
  const parentId: string | null = b.parent_id || null
  const copyFromId: string | null = b.copy_from_id || null

  const dup = await prisma.estStandard.findUnique({ where: { name } })
  if (dup) return NextResponse.json({ error: "同じ名前の基準がすでにあります" }, { status: 409 })
  if (parentId) {
    const parent = await prisma.estStandard.findUnique({ where: { id: parentId } })
    if (!parent) return NextResponse.json({ error: "親の基準が見つかりません" }, { status: 400 })
  }
  if (copyFromId) {
    const src = await prisma.estStandard.findUnique({ where: { id: copyFromId } })
    if (!src) return NextResponse.json({ error: "複製元の基準が見つかりません" }, { status: 400 })
  }

  const user = await getSessionUser()
  const created = await prisma.$transaction(async (tx) => {
    const std = await tx.estStandard.create({
      data: { name, parent_id: parentId, remarks: b.remarks || null },
    })
    if (copyFromId) {
      const sheets = await tx.estStandardSheet.findMany({ where: { standard_id: copyFromId } })
      if (sheets.length > 0) {
        await tx.estStandardSheet.createMany({
          data: sheets.map(s => ({ standard_id: std.id, sheet_def_id: s.sheet_def_id, mode: s.mode })),
        })
      }
      const values = await tx.estStandardValue.findMany({ where: { standard_id: copyFromId } })
      if (values.length > 0) {
        await tx.estStandardValue.createMany({
          data: values.map(v => ({ standard_id: std.id, item_id: v.item_id, value: v.value })),
        })
      }
      const tiers = await tx.estStandardTier.findMany({ where: { standard_id: copyFromId } })
      if (tiers.length > 0) {
        const idMap = new Map<string, string>()
        const newTiers = tiers.map(t => {
          const id = randomUUID()
          idMap.set(t.id, id)
          return { id, standard_id: std.id, sheet_def_id: t.sheet_def_id, lot_from: t.lot_from, lot_to: t.lot_to, sort_order: t.sort_order }
        })
        await tx.estStandardTier.createMany({ data: newTiers })
        const cells = await tx.estStandardCell.findMany({ where: { tier_id: { in: tiers.map(t => t.id) } } })
        if (cells.length > 0) {
          await tx.estStandardCell.createMany({
            data: cells.map(c => ({ tier_id: idMap.get(c.tier_id)!, item_id: c.item_id, value: c.value })),
          })
        }
      }
    }
    return std
  })

  await createAuditLog({
    userId: user?.id,
    service: "estimate",
    action: "CREATE",
    targetModel: "EstStandard",
    targetId: created.id,
    targetLabel: created.name,
    diff: { name, parent_id: parentId, copy_from_id: copyFromId },
  })
  return NextResponse.json(created)
}