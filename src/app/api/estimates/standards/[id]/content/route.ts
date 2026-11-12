import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

type Source = { standard_id: string; name: string; inherited: boolean }
type SheetOut = {
  code: string
  name: string
  kind: string
  source: Source
  items?: { id: string; name: string; value: number | null; is_lump: boolean }[]
  columns?: { id: string; name: string }[]
  tiers?: {
    id: string
    lot_from: number
    lot_to: number | null
    cells: Record<string, { value: number | null; is_lump: boolean }>
  }[]
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

// 基準の中身（表ごと）。引き継ぎ設定の表は、親をたどって、実際の値を持つ基準から読む
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateView")
  if (denied) return denied
  const { id } = await params

  const std = await prisma.estStandard.findUnique({
    where: { id },
    include: { parent: { select: { id: true, name: true } } },
  })
  if (!std) return NextResponse.json({ error: "基準が見つかりません" }, { status: 404 })

  const defs = await prisma.estSheetDef.findMany({ orderBy: [{ sort_order: "asc" }, { name: "asc" }] })
  const sheets: SheetOut[] = []

  for (const def of defs) {
    // 引き継ぎをたどる
    let srcId = id
    let srcName = std.name
    const seen = new Set<string>()
    for (;;) {
      seen.add(srcId)
      const link = await prisma.estStandardSheet.findUnique({
        where: { standard_id_sheet_def_id: { standard_id: srcId, sheet_def_id: def.id } },
      })
      if (!link || link.mode !== "inherit") break
      const cur = await prisma.estStandard.findUnique({ where: { id: srcId }, select: { parent_id: true } })
      if (!cur?.parent_id || seen.has(cur.parent_id)) break
      const parent = await prisma.estStandard.findUnique({
        where: { id: cur.parent_id },
        select: { id: true, name: true },
      })
      if (!parent) break
      srcId = parent.id
      srcName = parent.name
    }
    const source: Source = { standard_id: srcId, name: srcName, inherited: srcId !== id }

    if (def.kind === "matrix") {
      const tiers = await prisma.estStandardTier.findMany({
        where: { standard_id: srcId, sheet_def_id: def.id },
        orderBy: { lot_from: "asc" },
        include: { cells: { include: { item: { select: { id: true, name: true, sort_order: true } } } } },
      })
      const colMap = new Map<string, { id: string; name: string; sort_order: number }>()
      for (const t of tiers) for (const c of t.cells) colMap.set(c.item.id, c.item)
      const columns = Array.from(colMap.values()).sort((a, b) => a.sort_order - b.sort_order)
      sheets.push({
        code: def.code,
        name: def.name,
        kind: def.kind,
        source,
        columns: columns.map(c => ({ id: c.id, name: c.name })),
        tiers: tiers.map(t => ({
          id: t.id,
          lot_from: t.lot_from,
          lot_to: t.lot_to,
          cells: Object.fromEntries(t.cells.map(c => [c.item_id, { value: num(c.value), is_lump: c.is_lump }])),
        })),
      })
    } else {
      const vals = await prisma.estStandardValue.findMany({
        where: { standard_id: srcId, item: { sheet_def_id: def.id } },
        include: { item: { select: { id: true, name: true, sort_order: true } } },
      })
      const byItem = new Map(vals.map(v => [v.item_id, v]))
      // values（固定の項目）は、値がない項目も出す。list（一覧）は、値がある項目だけ出す
      const allItems =
        def.kind === "values"
          ? await prisma.estSheetItem.findMany({
              where: { sheet_def_id: def.id },
              orderBy: { sort_order: "asc" },
              select: { id: true, name: true, sort_order: true },
            })
          : vals.map(v => v.item).sort((a, b) => a.sort_order - b.sort_order)
      sheets.push({
        code: def.code,
        name: def.name,
        kind: def.kind,
        source,
        items: allItems.map(it => {
          const v = byItem.get(it.id)
          return { id: it.id, name: it.name, value: num(v?.value), is_lump: v?.is_lump ?? false }
        }),
      })
    }
  }

  return NextResponse.json({
    standard: {
      id: std.id,
      name: std.name,
      remarks: std.remarks,
      is_archived: std.is_archived,
      parent: std.parent,
    },
    sheets,
  })
}