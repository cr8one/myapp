import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { readXlsxWorkbook } from "@/lib/xlsx-io"
import { parseStandardRow, applyImport, type ParsedStandard } from "@/lib/estimate-standard-import"

export const maxDuration = 120

// FileMakerの基準（Excel）の取り込み。dry_run=1 なら、書き込まずに結果だけ返す
export async function POST(req: NextRequest) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 })
    const dryRun = formData.get("dry_run") === "1"
    const overwrite = formData.get("overwrite") === "1"

    const sheets = readXlsxWorkbook(Buffer.from(await file.arrayBuffer()))
    const rows = sheets[Object.keys(sheets)[0]] ?? []
    if (rows.length === 0) return NextResponse.json({ error: "データがありません" }, { status: 400 })

    const errors: string[] = []
    const parsed: ParsedStandard[] = []
    const seen = new Set<string>()
    rows.forEach((row, i) => {
      const p = parseStandardRow(row)
      if (!p) {
        errors.push(`${i + 2}行目：基準名がありません`)
        return
      }
      if (seen.has(p.name)) {
        errors.push(`${i + 2}行目：基準名「${p.name}」がファイル内で重複しています`)
        return
      }
      seen.add(p.name)
      parsed.push(p)
    })

    const existing = await prisma.estStandard.findMany({
      where: { name: { in: parsed.map(p => p.name) } },
      select: { name: true },
    })
    const existingNames = new Set(existing.map(e => e.name))

    const standards = parsed.map(p => ({
      name: p.name,
      exists: existingNames.has(p.name),
      values: p.values.filter(v => v.value !== null).length,
      tiers: p.tiers.length,
      cells: p.tiers.reduce((n, t) => n + t.cells.filter(c => c.value !== null).length, 0),
      warningCount: p.warnings.length,
      warnings: p.warnings.slice(0, 20),
    }))

    // まだ取り込み対象にしていないフィールド（値が入っているもの）
    const unmappedMap = new Map<string, { count: number; example: string }>()
    for (const p of parsed) {
      for (const h of p.unmapped) {
        const key = h.replace(/\d+/g, "#")
        const cur = unmappedMap.get(key)
        if (cur) cur.count++
        else unmappedMap.set(key, { count: 1, example: h })
      }
    }
    const unmapped = Array.from(unmappedMap.entries())
      .map(([pattern, v]) => ({ pattern, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60)

    if (dryRun) return NextResponse.json({ ok: true, dry_run: true, standards, unmapped, errors })

    const user = await getSessionUser()
    const results = await applyImport(parsed, overwrite, user?.id ?? null)
    return NextResponse.json({ ok: true, dry_run: false, results, unmapped, errors })
  } catch (e) {
    console.error("estimate standard import error:", e)
    return NextResponse.json({ error: `取り込みに失敗しました：${e instanceof Error ? e.message : ""}` }, { status: 500 })
  }
}