import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import type { EstimateResult } from "@/lib/estimate/estimate"
import { freezeFormData } from "@/lib/estimate/form-types"
import { columnsToHeader, computeResult, parseBody, toJson, totalColumns } from "@/lib/estimate/save"

// 確定する／確定を取り消す。確定すると、その時点の結果で固定される（基準を直しても変わらない）。
// 取り消したときは、確定していたときの金額を、手入力として固定したまま、編集に戻す（勝手に再計算しない）。
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const b = await req.json().catch(() => null)
  const confirm = b?.confirmed === true
  const e = await prisma.estimate.findFirst({ where: { id, deleted_flg: false } })
  if (!e) return NextResponse.json({ error: "見積書が見つかりません" }, { status: 404 })
  const user = await getSessionUser()

  if (confirm) {
    if (e.is_confirmed) return NextResponse.json({ error: "すでに確定しています" }, { status: 409 })
    const body = parseBody(e.options)
    if (typeof body === "string") return NextResponse.json({ error: "保存されている入力を読み取れません" }, { status: 400 })
    const result = await computeResult(e.standard_id, columnsToHeader(e), body)
    await prisma.estimate.update({
      where: { id },
      data: { is_confirmed: true, confirmed_at: new Date(), result: toJson(result), ...totalColumns(result) },
    })
    await createAuditLog({ userId: user?.id, service: "estimate", action: "UPDATE", targetModel: "Estimate", targetId: id, targetLabel: e.estimate_no, diff: { before: { is_confirmed: false, total: e.total }, after: { is_confirmed: true, total: result.total, unit_price: result.unitPrice ?? 0, amount: result.amount } } })
    return NextResponse.json({ ok: true })
  }

  if (!e.is_confirmed) return NextResponse.json({ error: "確定されていません" }, { status: 409 })
  const body = parseBody(e.options)
  if (typeof body === "string") return NextResponse.json({ error: "保存されている入力を読み取れません" }, { status: 400 })
  const stored = e.result as EstimateResult | null
  const frozen = stored ? freezeFormData(columnsToHeader(e), body, stored, "amount").body : body
  await prisma.estimate.update({ where: { id }, data: { is_confirmed: false, confirmed_at: null, options: toJson(frozen) } })
  await createAuditLog({ userId: user?.id, service: "estimate", action: "UPDATE", targetModel: "Estimate", targetId: id, targetLabel: e.estimate_no, diff: { before: { is_confirmed: true }, after: { is_confirmed: false, note: "確定時の金額を固定して、編集に戻した" } } })
  return NextResponse.json({ ok: true })
}