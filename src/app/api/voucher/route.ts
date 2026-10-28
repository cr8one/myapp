import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { isVoucherKey, fileExtension, ALLOWED_EXTENSIONS } from "@/lib/voucher-storage"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const PAGE_SIZE = 50
const STEP_NAMES: Record<number, string> = { 1: "精査", 2: "検印" }

export async function GET(req: NextRequest) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1)
  const where: Prisma.VoucherWhereInput = {}
  if (sp.get("include_deleted") !== "1") where.deleted_flg = false
  if (sp.get("doc_type")) where.doc_type = sp.get("doc_type")!
  if (sp.get("payment_method")) where.payment_method = sp.get("payment_method")!
  if (sp.get("registrant")) where.registrant_name = { contains: sp.get("registrant")! }
  if (sp.get("partner")) where.partner_name = { contains: sp.get("partner")! }
  const fileNo = parseInt(sp.get("file_no") ?? "")
  if (Number.isInteger(fileNo)) where.file_no = fileNo
  const dateFrom = sp.get("date_from")
  const dateTo = sp.get("date_to")
  if (dateFrom || dateTo) {
    where.transaction_date = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T00:00:00.000Z`) } : {}),
    }
  }
  const amountFrom = parseInt(sp.get("amount_from") ?? "")
  const amountTo = parseInt(sp.get("amount_to") ?? "")
  if (Number.isInteger(amountFrom) || Number.isInteger(amountTo)) {
    where.amount = {
      ...(Number.isInteger(amountFrom) ? { gte: amountFrom } : {}),
      ...(Number.isInteger(amountTo) ? { lte: amountTo } : {}),
    }
  }
  const [total, records] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      orderBy: { file_no: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { approval_steps: { orderBy: { step_order: "asc" } } },
    }),
  ])
  return NextResponse.json({ records, total, page_size: PAGE_SIZE })
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { send_mail, ...b } = await req.json()
  const sendMailOnCreate = send_mail !== false

  const docType = String(b.doc_type ?? "").trim()
  const partnerName = String(b.partner_name ?? "").trim()
  const amount = Number(b.amount)
  const dateText = String(b.transaction_date ?? "")
  if (!docType) return NextResponse.json({ error: "書類区分を選択してください" }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || isNaN(new Date(`${dateText}T00:00:00.000Z`).getTime())) {
    return NextResponse.json({ error: "取引日が正しくありません" }, { status: 400 })
  }
  if (!partnerName) return NextResponse.json({ error: "取引先名を入力してください" }, { status: 400 })
  if (!Number.isInteger(amount) || amount < 0 || amount > 2147483647) {
    return NextResponse.json({ error: "金額が正しくありません" }, { status: 400 })
  }
  if (!isVoucherKey(b.file_key) || !ALLOWED_EXTENSIONS.includes(fileExtension(String(b.file_name ?? "")))) {
    return NextResponse.json({ error: "ファイルが正しくありません" }, { status: 400 })
  }

  const settings = await prisma.userApproverSetting.findMany({
    where: { user_id: user.id, service_type: "voucher" },
    orderBy: { step_order: "asc" },
    include: { approver: { select: { name: true, email: true } } },
  })
  const steps = settings
    .filter(s => s.step_order === 1 || s.step_order === 2)
    .map(s => ({
      step_order: s.step_order,
      step_name: STEP_NAMES[s.step_order] ?? null,
      approver_name: s.approver?.name ?? null,
      approver_email: s.approver?.email ?? null,
    }))

  const record = await prisma.$transaction(async (tx) => {
    const serial = await tx.mVoucherSerial.findFirst()
    if (!serial) throw new Error("採番の設定が見つかりません")
    const claimed = await tx.mVoucherSerial.update({
      where: { id: serial.id },
      data: { next_value: { increment: 1 } },
    })
    const fileNo = claimed.next_value - 1
    const created = await tx.voucher.create({
      data: {
        file_no: fileNo,
        doc_type: docType,
        direction: b.direction === "発信" ? "発信" : "受領",
        media_type: b.media_type || null,
        transaction_date: new Date(`${dateText}T00:00:00.000Z`),
        partner_name: partnerName,
        amount,
        remarks: b.remarks || null,
        payment_method: b.payment_method || null,
        transfer_method: b.transfer_method || null,
        base_name: b.base_name || null,
        file_key: b.file_key,
        file_name: String(b.file_name),
        timestamp_flg: b.timestamp_flg === true,
        registrant_id: user.id,
        registrant_name: user.name ?? null,
      },
    })
    if (steps.length > 0) {
      await tx.voucherApprovalStep.createMany({ data: steps.map(s => ({ ...s, voucher_id: created.id })) })
    }
    await tx.voucherHistory.create({
      data: { voucher_id: created.id, kind: "登録", actor_id: user.id, actor_name: user.name ?? null },
    })
    return created
  })

  const first = steps[0]
  if (sendMailOnCreate && first?.approver_email) {
    try {
      await transporter.sendMail({
        from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
        to: first.approver_email,
        subject: `【証憑管理】${first.step_name ?? "確認"}依頼: ${record.partner_name}（${String(record.file_no).padStart(6, "0")}）`,
        text: `${first.approver_name ?? ""} 様\n\n証憑（${String(record.file_no).padStart(6, "0")}）の${first.step_name ?? "確認"}をお願いします。\n\n書類区分: ${record.doc_type}\n取引先名: ${record.partner_name}\n金額: ${record.amount.toLocaleString("ja-JP")}円\n登録者: ${record.registrant_name ?? ""}\n\n以下のURLから確認してください。\nhttps://japansleevesystem.com/dashboard/voucher/${record.id}`,
      })
    } catch (e) {
      console.error("証憑の確認依頼メール送信エラー:", e)
    }
  }

  return NextResponse.json(record)
}
