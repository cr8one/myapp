import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import type { EstimateResult } from "@/lib/estimate/estimate"
import { freezeFormData } from "@/lib/estimate/form-types"
import { columnsToHeader, computeResult, headerColumns, parseBody, toJson, totalColumns } from "@/lib/estimate/save"

// 複製：新しい番号の、確定前の見積書を作る（作成日は今日、基準は同じ）。引き継ぎ方を、mode で選ぶ
//  price ：各行の単価と営業費率を固定して写す（既定。本番数を変えると、金額は再計算されるが、単価は元のまま）
//  amount：各行の金額と営業費を固定して写す（元の見積と、同じ金額になる）
//  recalc：入力だけを写して、最新の基準で、自動計算し直す
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const b = await req.json().catch(() => null)
  const mode: "price" | "amount" | "recalc" = b?.mode === "recalc" || b?.mode === "amount" ? b.mode : "price"

  const src = await prisma.estimate.findFirst({ where: { id, deleted_flg: false } })
  if (!src) return NextResponse.json({ error: "見積書が見つかりません" }, { status: 404 })
  if (!src.category_id) return NextResponse.json({ error: "見積区分がない見積書は、複製できません" }, { status: 400 })
  const category = await prisma.estCategory.findUnique({ where: { id: src.category_id } })
  if (!category || !category.is_active) return NextResponse.json({ error: "見積区分が無効です" }, { status: 409 })
  const parsed = parseBody(src.options)
  if (typeof parsed === "string") return NextResponse.json({ error: "保存されている入力を読み取れません" }, { status: 400 })

  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let header = { ...columnsToHeader(src), issue_date: today }
  let body = parsed
  if (mode !== "recalc") {
    // 元の見積の、保存してある結果（確定済みなら、お客様に出した金額）を、そのまま固定する
    const stored = (src.result as EstimateResult | null) ?? (await computeResult(src.standard_id, columnsToHeader(src), parsed))
    const f = freezeFormData(header, parsed, stored, mode)
    header = f.header
    body = f.body
  }
  const result = await computeResult(src.standard_id, header, body)
  const user = await getSessionUser()
  try {
    const created = await prisma.$transaction(async tx => {
      const cat = await tx.estCategory.update({ where: { id: category.id }, data: { next_serial: { increment: 1 } } })
      const no = `${cat.code}-${String(cat.next_serial - 1).padStart(5, "0")}`
      return tx.estimate.create({
        data: {
          estimate_no: no,
          category_id: category.id,
          standard_id: src.standard_id,
          ...headerColumns(header),
          related_product_codes: [],
          options: toJson(body),
          result: toJson(result),
          ...totalColumns(result),
          drafter_id: user?.id ?? null,
          drafter_name: user?.name ?? null,
        },
      })
    })
    await createAuditLog({ userId: user?.id, service: "estimate", action: "CREATE", targetModel: "Estimate", targetId: created.id, targetLabel: created.estimate_no, diff: { copied_from: src.estimate_no, mode, total: result.total } })
    return NextResponse.json({ id: created.id, estimate_no: created.estimate_no })
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "見積番号が重複しました。見積区分の「次の番号」を確認してください" }, { status: 409 })
    }
    throw e
  }
}