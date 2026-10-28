import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

const PAGE_SIZE = 50

function todayJst(): Date {
  const j = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return new Date(Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate()))
}

export async function GET(req: NextRequest) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1)
  const where: Prisma.VoucherCorrectionRequestWhereInput = {}
  if (sp.get("voucher_id")) where.voucher_id = sp.get("voucher_id")!
  if (sp.get("status")) where.status = sp.get("status")!
  const [total, records] = await Promise.all([
    prisma.voucherCorrectionRequest.count({ where }),
    prisma.voucherCorrectionRequest.findMany({
      where,
      orderBy: { request_no: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  return NextResponse.json({ records, total, page_size: PAGE_SIZE })
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const b = await req.json()
  const action = String(b.action ?? "")
  const detail = String(b.detail ?? "").trim()
  const reason = String(b.reason ?? "").trim()
  if (action !== "訂正" && action !== "削除") return NextResponse.json({ error: "内容（訂正・削除）を選択してください" }, { status: 400 })
  if (action === "訂正" && !detail) return NextResponse.json({ error: "訂正する内容を入力してください" }, { status: 400 })
  if (!reason) return NextResponse.json({ error: "理由を入力してください" }, { status: 400 })

  const voucher = await prisma.voucher.findUnique({ where: { id: String(b.voucher_id ?? "") } })
  if (!voucher || voucher.deleted_flg) return NextResponse.json({ error: "対象の証憑が見つかりません" }, { status: 404 })
  const open = await prisma.voucherCorrectionRequest.findFirst({
    where: { voucher_id: voucher.id, status: { in: ["申請中", "承認済み"] } },
  })
  if (open) return NextResponse.json({ error: "この証憑には、処理中の依頼があります" }, { status: 409 })

  const record = await prisma.$transaction(async (tx) => {
    const last = await tx.voucherCorrectionRequest.findFirst({ orderBy: { request_no: "desc" } })
    const requestNo = (last?.request_no ?? 0) + 1
    const created = await tx.voucherCorrectionRequest.create({
      data: {
        request_no: requestNo,
        requested_date: todayJst(),
        requester_id: user.id,
        requester_name: user.name ?? null,
        voucher_id: voucher.id,
        voucher_file_no: voucher.file_no,
        voucher_doc_type: voucher.doc_type,
        voucher_partner_name: voucher.partner_name,
        action,
        detail: detail || null,
        reason,
      },
    })
    await tx.voucherHistory.create({
      data: {
        voucher_id: voucher.id,
        kind: "依頼",
        field_name: `${action}依頼`,
        after_value: `依頼No.${String(requestNo).padStart(3, "0")}`,
        actor_id: user.id,
        actor_name: user.name ?? null,
      },
    })
    return created
  })
  return NextResponse.json(record)
}
