import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

const TEXT_FIELDS: Record<string, string> = {
  doc_type: "書類区分",
  direction: "受発区分",
  media_type: "媒体区分",
  partner_name: "取引先名",
  remarks: "備考",
  payment_method: "支払方法",
  transfer_method: "振込",
  base_name: "拠点",
}

function todayJst(): Date {
  const j = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const processor = await prisma.mVoucherManager.findFirst({ where: { user_id: user.id, role: "処理責任者" } })
  if (!processor) return NextResponse.json({ error: "処理責任者のみ実施できます" }, { status: 403 })

  const request = await prisma.voucherCorrectionRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (request.status !== "承認済み") return NextResponse.json({ error: "承認済みの依頼のみ実施できます" }, { status: 400 })
  if (!request.voucher_id) return NextResponse.json({ error: "対象の証憑が見つかりません" }, { status: 404 })
  const voucher = await prisma.voucher.findUnique({ where: { id: request.voucher_id } })
  if (!voucher || voucher.deleted_flg) return NextResponse.json({ error: "対象の証憑が見つかりません" }, { status: 404 })

  const actor = { actor_id: user.id, actor_name: user.name ?? null }
  const data: Record<string, unknown> = {}
  const histories: { field_name: string; before_value: string | null; after_value: string | null }[] = []

  if (request.action === "訂正") {
    const { changes } = await req.json()
    if (!changes || typeof changes !== "object") return NextResponse.json({ error: "変更内容を指定してください" }, { status: 400 })

    for (const [key, label] of Object.entries(TEXT_FIELDS)) {
      if (!(key in changes)) continue
      const next = String(changes[key] ?? "").trim()
      if ((key === "doc_type" || key === "partner_name") && !next) {
        return NextResponse.json({ error: `${label}は空にできません` }, { status: 400 })
      }
      const value = key === "direction" ? (next === "発信" ? "発信" : "受領") : (next || null)
      const before = (voucher as Record<string, unknown>)[key] as string | null
      if (value !== before) {
        data[key] = value
        histories.push({ field_name: label, before_value: before, after_value: value })
      }
    }
    if ("transaction_date" in changes) {
      const text = String(changes.transaction_date ?? "")
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || isNaN(new Date(`${text}T00:00:00.000Z`).getTime())) {
        return NextResponse.json({ error: "取引日が正しくありません" }, { status: 400 })
      }
      const before = voucher.transaction_date.toISOString().slice(0, 10)
      if (text !== before) {
        data.transaction_date = new Date(`${text}T00:00:00.000Z`)
        histories.push({ field_name: "取引日", before_value: before, after_value: text })
      }
    }
    if ("amount" in changes) {
      const amount = Number(changes.amount)
      if (!Number.isInteger(amount) || amount < 0 || amount > 2147483647) {
        return NextResponse.json({ error: "金額が正しくありません" }, { status: 400 })
      }
      if (amount !== voucher.amount) {
        data.amount = amount
        histories.push({ field_name: "金額", before_value: String(voucher.amount), after_value: String(amount) })
      }
    }
    if (histories.length === 0) return NextResponse.json({ error: "変更された項目がありません" }, { status: 400 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (request.action === "訂正") {
      await tx.voucher.update({ where: { id: voucher.id }, data })
      await tx.voucherHistory.createMany({
        data: histories.map(h => ({ voucher_id: voucher.id, kind: "訂正", ...h, ...actor })),
      })
    } else {
      await tx.voucher.update({ where: { id: voucher.id }, data: { deleted_flg: true, deleted_at: new Date() } })
      await tx.voucherHistory.create({
        data: { voucher_id: voucher.id, kind: "削除", field_name: "削除済み", after_value: `依頼No.${String(request.request_no).padStart(3, "0")}`, ...actor },
      })
    }
    return tx.voucherCorrectionRequest.update({
      where: { id },
      data: { status: "処理済", processed_date: todayJst(), processor_name: user.name ?? null },
    })
  })
  return NextResponse.json(updated)
}
