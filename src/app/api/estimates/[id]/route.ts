import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import { loadEstimateStd } from "@/lib/estimate/std-loader"
import { columnsToHeader, computeResult, headerColumns, parseBody, parseHeader, toJson, totalColumns } from "@/lib/estimate/save"
import { emptyBody } from "@/lib/estimate/form-types"

const include = {
  category: { select: { id: true, name: true, code: true } },
  standard: { select: { id: true, name: true, is_archived: true } },
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateView")
  if (denied) return denied
  const { id } = await params
  const e = await prisma.estimate.findFirst({ where: { id, deleted_flg: false }, include })
  if (!e) return NextResponse.json({ error: "見積書が見つかりません" }, { status: 404 })
  const parsed = parseBody(e.options)
  const body = typeof parsed === "string" ? emptyBody() : parsed
  return NextResponse.json({
    estimate: {
      id: e.id,
      estimate_no: e.estimate_no,
      is_confirmed: e.is_confirmed,
      confirmed_at: e.confirmed_at,
      category: e.category,
      standard: e.standard,
      drafter_name: e.drafter_name,
      created_at: e.created_at,
      updated_at: e.updated_at,
    },
    header: columnsToHeader(e),
    body,
    result: e.result,
    // 確定済みの見積書は、保存した結果を使うので、基準の値は返さない
    std: e.is_confirmed ? null : await loadEstimateStd(e.standard_id),
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const before = await prisma.estimate.findFirst({ where: { id, deleted_flg: false } })
  if (!before) return NextResponse.json({ error: "見積書が見つかりません" }, { status: 404 })
  if (before.is_confirmed) return NextResponse.json({ error: "確定済みの見積書は、変更できません。先に確定を取り消してください" }, { status: 409 })

  const b = await req.json().catch(() => null)
  const header = parseHeader(b?.header)
  if (typeof header === "string") return NextResponse.json({ error: header }, { status: 400 })
  const body = parseBody(b?.body)
  if (typeof body === "string") return NextResponse.json({ error: body }, { status: 400 })
  const standardId = b?.standard_id ? String(b.standard_id) : before.standard_id
  if (standardId !== before.standard_id) {
    const std = await prisma.estStandard.findUnique({ where: { id: standardId } })
    if (!std) return NextResponse.json({ error: "基準が見つかりません" }, { status: 400 })
    if (std.is_archived) return NextResponse.json({ error: "アーカイブ済みの基準は、選べません" }, { status: 400 })
  }

  const result = await computeResult(standardId, header, body)
  await prisma.estimate.update({
    where: { id },
    data: { standard_id: standardId, ...headerColumns(header), options: toJson(body), result: toJson(result), ...totalColumns(result) },
  })
  const user = await getSessionUser()
  await createAuditLog({
    userId: user?.id,
    service: "estimate",
    action: "UPDATE",
    targetModel: "Estimate",
    targetId: id,
    targetLabel: before.estimate_no,
    diff: {
      before: { title: before.title, total: before.total, unit_price: Number(before.unit_price), amount: before.amount, standard_id: before.standard_id },
      after: { title: header.title || null, total: result.total, unit_price: result.unitPrice ?? 0, amount: result.amount, standard_id: standardId },
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const { id } = await params
  const before = await prisma.estimate.findFirst({ where: { id, deleted_flg: false } })
  if (!before) return NextResponse.json({ error: "見積書が見つかりません" }, { status: 404 })
  if (before.is_confirmed) return NextResponse.json({ error: "確定済みの見積書は、削除できません。先に確定を取り消してください" }, { status: 409 })
  await prisma.estimate.update({ where: { id }, data: { deleted_flg: true, deleted_at: new Date() } })
  const user = await getSessionUser()
  await createAuditLog({ userId: user?.id, service: "estimate", action: "DELETE", targetModel: "Estimate", targetId: id, targetLabel: before.estimate_no, diff: { title: before.title, total: before.total } })
  return NextResponse.json({ ok: true })
}